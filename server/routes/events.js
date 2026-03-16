import { Router } from "express";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

// Load CleverTap events data
let eventsData = null;
function loadEventsData() {
  if (!eventsData) {
    const raw = readFileSync(join(__dirname, "..", "data", "clevertap-events.json"), "utf-8");
    eventsData = JSON.parse(raw);
  }
  return eventsData;
}

// Segment-to-CleverTap event mapping
// Maps NotifyGen segment types to CleverTap targeting queries
// Based on real user journey analysis (e.g. kumarapandian's timeline):
//   Min 0: App Installed → new_user_login → payment_success (7-day trial) → order_created
//   Day 1: ob_completed → lesson_started → lesson_completed → badges → rank_increased
//   Day 6: pre_renewal_message (trial ending)
//   Day 7: first_repeat_payment_success → payment_success_monthly_renewal → any_payment_success (auto-renewal)
//   Day 38: payment_error (renewal failure)
//   Day 60+: App Launched but no lessons (dormant)
//
// Payment flow:
//   payment_success = Trial payment (7-day trial purchase, fired once at signup)
//   any_payment_success = Fires on EVERY successful payment (trial + renewals)
//   first_repeat_payment_success = First auto-renewal after trial
//   payment_success_monthly_renewal = Monthly auto-renewal events
//   pre_renewal_message = Sent ~1 day before renewal
//   payment_error = Renewal charge failed
//
// All notifications use "SpeakX" channel
const SEGMENT_EVENT_MAP = {
  // New / Onboarding users — just installed + paid trial
  // Real flow: App Installed → new_user_login → payment_success (trial) → ob_intro → ob_completed
  "New users": {
    primary_event: "new_user_login",
    supporting_events: ["App Installed", "payment_success", "order_created", "ob_intro_submitted", "ob_practice_period_submitted", "ob_practice_time_submitted", "ob_completed"],
    targeting: {
      event_name: "new_user_login",
      from: 7,  // last N days
      to: 0,
    },
    channel: "Speakx",
    description: "Users who just signed up, paid for trial, and are onboarding",
  },

  // Trial Payment — users who just made the 7-day trial payment
  // Real flow: payment_success fires at minute 0 along with order_created and subscription_stat
  "Trial Payment": {
    primary_event: "payment_success",
    supporting_events: ["order_created", "subscription_stat", "any_payment_success", "new_user_login"],
    targeting: {
      event_name: "payment_success",
      from: 7,
      to: 0,
    },
    channel: "Speakx",
    description: "Users who just paid for the 7-day trial — welcome & onboard them",
  },

  // Auto-Renewal — trial ended, monthly subscription renewed
  // Real flow: Day 7+ → first_repeat_payment_success → payment_success_monthly_renewal → any_payment_success
  "Auto-Renewal": {
    primary_event: "any_payment_success",
    supporting_events: ["first_repeat_payment_success", "payment_success_monthly_renewal", "pre_renewal_message", "invoice_generated"],
    targeting: {
      event_name: "any_payment_success",
      from: 3,
      to: 0,
    },
    channel: "Speakx",
    description: "Users whose monthly subscription just auto-renewed after trial",
  },

  // Active / In-progress users — doing lessons and earning badges
  // Real flow: lesson_started → lesson_completed → lesson_granted_badges → rank_increased
  "In Progress": {
    primary_event: "lesson_started",
    supporting_events: ["lesson_completed", "lesson_granted_badges", "rank_increased_city", "rank_increased_state", "exe_feedback"],
    targeting: {
      event_name: "lesson_started",
      from: 3,
      to: 0,
    },
    channel: "Speakx",
    description: "Users actively doing lessons and progressing",
  },

  // Dormant users (7+ days inactive)
  // Real: kumarapandian stopped lessons after Day 1, only App Launched sporadically
  "Dormant": {
    primary_event: "App Launched",
    supporting_events: ["app_open", "page_load", "lesson_started"],
    targeting: {
      event_name: "App Launched",
      from: 30,
      to: 7,
      inaction: true,  // users who did NOT do this event recently
    },
    channel: "Speakx",
    description: "Users who haven't opened the app in 7+ days",
  },

  // Low practice users — paying but barely using
  // Real: kumarapandian had only 2 practice days despite 3 months subscription
  "Low Practice": {
    primary_event: "lesson_completed",
    supporting_events: ["lesson_started", "lesson_aborted", "lesson_granted_badges"],
    targeting: {
      event_name: "lesson_completed",
      from: 7,
      to: 0,
      count_threshold: 2,  // completed fewer than 2 lessons
    },
    channel: "Speakx",
    description: "Users completing very few lessons (low engagement despite paying)",
  },

  // 3-Day Inactive
  "3-Day Inactive": {
    primary_event: "App Launched",
    supporting_events: ["app_open", "lesson_started", "click"],
    targeting: {
      event_name: "App Launched",
      from: 14,
      to: 3,
      inaction: true,
    },
    channel: "Speakx",
    description: "Users who haven't opened the app in 3+ days",
  },

  // 7-Day Inactive
  "7-Day Inactive": {
    primary_event: "App Launched",
    supporting_events: ["app_open", "lesson_started", "click"],
    targeting: {
      event_name: "App Launched",
      from: 30,
      to: 7,
      inaction: true,
    },
    channel: "Speakx",
    description: "Users who haven't opened the app in 7+ days",
  },

  // Streak / Engaged users — high lesson completion
  // Real: Users with 5+ lessons in a week, earning badges and climbing ranks
  "Streak": {
    primary_event: "lesson_completed",
    supporting_events: ["lesson_granted_badges", "rank_increased_state", "rank_increased_city", "leaderboard_visited"],
    targeting: {
      event_name: "lesson_completed",
      from: 7,
      to: 0,
      count_threshold: 5,
      count_operator: "gte",
    },
    channel: "Speakx",
    description: "Users with high lesson completion streaks",
  },

  // At Risk — payment error during renewal
  // Real: kumarapandian had payment_error on Day 38 (renewal failure)
  "At Risk": {
    primary_event: "payment_error",
    supporting_events: ["pre_renewal_message", "subscription_stat", "any_payment_success"],
    targeting: {
      event_name: "payment_error",
      from: 7,
      to: 0,
    },
    channel: "Speakx",
    description: "Users whose renewal payment failed — at risk of churning",
  },

  // Pre-Renewal — trial or subscription about to expire
  // Real: pre_renewal_message fires ~1 day before renewal date
  "Pre-Renewal": {
    primary_event: "pre_renewal_message",
    supporting_events: ["subscription_stat", "payment_success_monthly_renewal"],
    targeting: {
      event_name: "pre_renewal_message",
      from: 2,
      to: 0,
    },
    channel: "Speakx",
    description: "Users whose trial or subscription is about to renew — set expectations",
  },

  // Rank climbers — leaderboard rank improving
  "Rank Climbers": {
    primary_event: "rank_increased_state",
    supporting_events: ["rank_increased_city", "leaderboard_visited", "lesson_granted_badges"],
    targeting: {
      event_name: "rank_increased_state",
      from: 7,
      to: 0,
    },
    channel: "Speakx",
    description: "Users whose leaderboard rank has been improving",
  },

  // Level-up users
  "Level Up": {
    primary_event: "user_change_level",
    supporting_events: ["lesson_completed", "lesson_granted_badges", "rank_increased_state"],
    targeting: {
      event_name: "user_change_level",
      from: 3,
      to: 0,
    },
    channel: "Speakx",
    description: "Users who recently leveled up",
  },
};

// Build CleverTap targeting payload from segment mapping
function buildTargetingPayload(segmentMapping, dateRange = {}) {
  const fromDays = dateRange.from || segmentMapping.targeting.from;
  const toDays = dateRange.to || segmentMapping.targeting.to;

  const fromDate = new Date(Date.now() - fromDays * 86400000);
  const toDate = new Date(Date.now() - toDays * 86400000);

  const payload = {
    event_name: segmentMapping.targeting.event_name,
    from: parseInt(fromDate.toISOString().slice(0, 10).replace(/-/g, "")),
    to: parseInt(toDate.toISOString().slice(0, 10).replace(/-/g, "")),
  };

  return payload;
}

// GET /api/events — All CleverTap events categorized
router.get("/", (req, res) => {
  const data = loadEventsData();
  res.json(data);
});

// GET /api/events/custom — Only custom events (for targeting dropdown)
router.get("/custom", (req, res) => {
  const data = loadEventsData();
  res.json(data.custom_events);
});

// GET /api/events/system — Only system events
router.get("/system", (req, res) => {
  const data = loadEventsData();
  res.json(data.system_events);
});

// GET /api/events/channels — Notification channels
router.get("/channels", (req, res) => {
  const data = loadEventsData();
  res.json(data.notification_channels);
});

// GET /api/events/high-volume — High volume events for targeting
router.get("/high-volume", (req, res) => {
  const data = loadEventsData();
  res.json(data.high_volume_events_for_targeting);
});

// GET /api/events/user-properties — User properties for segmentation
router.get("/user-properties", (req, res) => {
  const data = loadEventsData();
  res.json(data.user_properties);
});

// GET /api/events/segment-map — Segment-to-event mapping
router.get("/segment-map", (req, res) => {
  res.json(SEGMENT_EVENT_MAP);
});

// POST /api/events/build-targeting — Build CleverTap targeting payload
router.post("/build-targeting", (req, res) => {
  const { segment_type, event_name, date_range } = req.body;

  if (segment_type && SEGMENT_EVENT_MAP[segment_type]) {
    const mapping = SEGMENT_EVENT_MAP[segment_type];
    const payload = buildTargetingPayload(mapping, date_range || {});
    return res.json({
      targeting: payload,
      channel: mapping.channel,
      primary_event: mapping.primary_event,
      supporting_events: mapping.supporting_events,
      description: mapping.description,
    });
  }

  if (event_name) {
    const fromDays = date_range?.from || 7;
    const toDays = date_range?.to || 0;
    const fromDate = new Date(Date.now() - fromDays * 86400000);
    const toDate = new Date(Date.now() - toDays * 86400000);

    return res.json({
      targeting: {
        event_name,
        from: parseInt(fromDate.toISOString().slice(0, 10).replace(/-/g, "")),
        to: parseInt(toDate.toISOString().slice(0, 10).replace(/-/g, "")),
      },
      channel: "general_updates",
      primary_event: event_name,
      supporting_events: [],
      description: `Users who performed "${event_name}" in the last ${fromDays} days`,
    });
  }

  res.status(400).json({ error: "Provide segment_type or event_name" });
});

export { SEGMENT_EVENT_MAP, buildTargetingPayload };
export default router;
