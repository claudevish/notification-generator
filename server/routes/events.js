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
const SEGMENT_EVENT_MAP = {
  // New / Onboarding users
  "New users": {
    primary_event: "new_user_login",
    supporting_events: ["ob_completed", "ob_intro_submitted", "ob_language_submitted", "App Installed"],
    targeting: {
      event_name: "new_user_login",
      from: 7,  // last N days
      to: 0,
    },
    channel: "general_updates",
    description: "Users who recently signed up or installed the app",
  },

  // Active / In-progress users
  "In Progress": {
    primary_event: "lesson_started",
    supporting_events: ["lesson_completed", "user_change_level", "lesson_granted_badges", "practice_page_visited"],
    targeting: {
      event_name: "lesson_started",
      from: 3,
      to: 0,
    },
    channel: "activity_progress",
    description: "Users actively doing lessons and progressing",
  },

  // Dormant users (7+ days inactive)
  "Dormant": {
    primary_event: "App Launched",
    supporting_events: ["app_open", "page_load"],
    targeting: {
      event_name: "App Launched",
      from: 30,
      to: 7,
      inaction: true,  // users who did NOT do this event recently
    },
    channel: "general_updates",
    description: "Users who haven't opened the app in 7+ days",
  },

  // Low practice users
  "Low Practice": {
    primary_event: "lesson_completed",
    supporting_events: ["lesson_started", "lesson_aborted", "practice_page_visited"],
    targeting: {
      event_name: "lesson_completed",
      from: 7,
      to: 0,
      count_threshold: 2,  // completed fewer than 2 lessons
    },
    channel: "activity_progress",
    description: "Users completing very few lessons (low engagement)",
  },

  // 3-Day Inactive
  "3-Day Inactive": {
    primary_event: "App Launched",
    supporting_events: ["app_open", "lesson_started"],
    targeting: {
      event_name: "App Launched",
      from: 14,
      to: 3,
      inaction: true,
    },
    channel: "reminders_appointments",
    description: "Users who haven't opened the app in 3+ days",
  },

  // 7-Day Inactive
  "7-Day Inactive": {
    primary_event: "App Launched",
    supporting_events: ["app_open", "lesson_started"],
    targeting: {
      event_name: "App Launched",
      from: 30,
      to: 7,
      inaction: true,
    },
    channel: "reminders_appointments",
    description: "Users who haven't opened the app in 7+ days",
  },

  // Streak / Engaged users
  "Streak": {
    primary_event: "lesson_completed",
    supporting_events: ["lesson_granted_badges", "goal_achieved", "rank_increased_state", "rank_increased_city"],
    targeting: {
      event_name: "lesson_completed",
      from: 7,
      to: 0,
      count_threshold: 5,
      count_operator: "gte",
    },
    channel: "activity_progress",
    description: "Users with high lesson completion streaks",
  },

  // Payment / Subscription users
  "Payment": {
    primary_event: "payment_success",
    supporting_events: ["any_payment_success", "order_created", "subscription_stat", "pre_renewal_message"],
    targeting: {
      event_name: "payment_success",
      from: 30,
      to: 0,
    },
    channel: "transactional_alerts",
    description: "Users who recently made a payment",
  },

  // Churning / At-risk users (payment error)
  "At Risk": {
    primary_event: "payment_error",
    supporting_events: ["pre_renewal_message", "subscription_stat"],
    targeting: {
      event_name: "payment_error",
      from: 7,
      to: 0,
    },
    channel: "transactional_alerts",
    description: "Users experiencing payment failures — at risk of churning",
  },

  // Rank climbers
  "Rank Climbers": {
    primary_event: "rank_increased_state",
    supporting_events: ["rank_increased_city", "leaderboard_visited", "lesson_granted_badges"],
    targeting: {
      event_name: "rank_increased_state",
      from: 7,
      to: 0,
    },
    channel: "activity_progress",
    description: "Users whose leaderboard rank has been improving",
  },

  // Level-up users
  "Level Up": {
    primary_event: "user_change_level",
    supporting_events: ["lesson_completed", "lesson_granted_badges", "goal_achieved"],
    targeting: {
      event_name: "user_change_level",
      from: 3,
      to: 0,
    },
    channel: "activity_progress",
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
