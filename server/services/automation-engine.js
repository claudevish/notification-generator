/**
 * AUTOMATION ENGINE — The Brain of NotifyGen
 *
 * Handles:
 * 1. Webhook reception (CleverTap events)
 * 2. User journey tracking (which day, which state)
 * 3. Segment resolution (which segment does user fall into)
 * 4. Notification selection (which copy + theme)
 * 5. Schedule calculation (timing, DND, drop logic)
 * 6. Push delivery via CleverTap API
 */

import { getDb } from "../database.js";
import { SEGMENT_EVENT_MAP } from "../routes/events.js";
import { WORD_OF_THE_DAY } from "../data/word-of-the-day.js";
import { CLIFFHANGERS } from "../data/cliffhangers.js";

// ─── CONSTANTS ───────────────────────────────────────────────
const DND_START_HOUR = 23; // 11 PM
const DND_END_HOUR = 7;   // 7 AM
const MIN_GAP_MINUTES = 20;
const SPEAKX_CHANNEL = "general_updates";

// Journey image URLs hosted on GitHub
const JOURNEY_IMAGES = {
  trial_payment: "https://raw.githubusercontent.com/claudevish/notification-generator/notification-images/public-images/journey/trial_payment.png",
  onboarding_story: "https://raw.githubusercontent.com/claudevish/notification-generator/notification-images/public-images/journey/onboarding_story.png",
  streak: "https://raw.githubusercontent.com/claudevish/notification-generator/notification-images/public-images/journey/streak.png",
  rank_climber: "https://raw.githubusercontent.com/claudevish/notification-generator/notification-images/public-images/journey/rank_climber.png",
  at_risk: "https://raw.githubusercontent.com/claudevish/notification-generator/notification-images/public-images/journey/at_risk.png",
  badge_earned: "https://raw.githubusercontent.com/claudevish/notification-generator/notification-images/public-images/journey/badge_earned.png",
  pre_renewal: "https://raw.githubusercontent.com/claudevish/notification-generator/notification-images/public-images/journey/pre_renewal.png",
  renewal_success: "https://raw.githubusercontent.com/claudevish/notification-generator/notification-images/public-images/journey/renewal_success.png",
};

// ─── DAY 0 NOTIFICATION TEMPLATES ───────────────────────────
// 6 notifications for Day 0, ordered by priority
// FIX: Each notification has unique image, no repeated cliffhanger text,
//      practical Word of the Day, distinct emoji per title
const DAY0_TEMPLATES = [
  {
    slot: 1,
    name: "Trial Payment",
    segment: "Trial Payment",
    delay_minutes: 0, // immediate
    image: "trial_payment",
    title: "Welcome to SpeakX Premium! 🎉",
    body: "Congrats {{username}}! Your 7-day premium journey starts now. Let's make every day count!",
    drop_priority: 1, // never drop
  },
  {
    slot: 2,
    name: "Onboarding Nudge",
    segment: "New Users",
    delay_minutes: 30,
    image: "onboarding_story",
    title: "Your First Story Awaits 📖",
    body: "{{username}}, meet Ravi — a quiet boy who's never spoken up in class. Today that changes. Tap to begin!",
    drop_priority: 2, // never drop
  },
  {
    slot: 3,
    name: "Word of the Day",
    segment: "New Users",
    delay_minutes: 150, // 2.5 hrs
    image: "badge_earned", // FIX: unique image (gold medal theme)
    title: "📚 Word of the Day",
    body: "Hey {{username}}! Today's word: Confident — feeling sure about yourself. \"Ravi felt confident speaking up.\" Tap to learn more!",
    drop_priority: 4,
  },
  {
    slot: 4,
    name: "Cliffhanger",
    segment: "In Progress",
    delay_minutes: 300, // 5 hrs (2.5 hrs after #3)
    image: "pre_renewal", // FIX: unique image (clock/urgency theme)
    title_variants: {
      not_started: "{{username}}, Ravi Has a Secret 😱",
      started: "{{username}}, Don't Leave Ravi Hanging! 😱",
      completed: "{{username}}, You Won't Believe What Happens Next! 📖",
    },
    body_variants: {
      not_started: "{{cliffhanger_text}} Ravi's story has a twist you won't expect. Tap to start \"{{story_name}}\"!",
      started: "{{cliffhanger_text}} You stopped at the best part! Tap to continue \"{{story_name}}\"",
      completed: "{{cliffhanger_text}} Tap to continue \"{{story_name}}\"!",
    },
    drop_priority: 5,
  },
  {
    slot: 5,
    name: "Social Proof",
    segment: "3-Day Inactive",
    delay_minutes: 480, // 8 hrs (3 hrs after #4)
    image: "rank_climber",
    title_variants: {
      not_started: "{{username}}, Don't Miss Out! 🔥",
      completed: "You're Ahead, {{username}}! 🏆",
    },
    body_variants: {
      not_started: "70% of new users completed their first lesson on Day 1. Your story is waiting — just 3 minutes to start!",
      completed: "You're ahead of 70% of new users today! One more lesson to lock in your streak?",
    },
    drop_priority: 6, // first to drop
  },
  {
    slot: 6,
    name: "Progress Report",
    segment: "In Progress",
    delay_minutes: -1, // special: 30 min before DND
    image_variants: {
      active: "streak",
      inactive: "at_risk",
    },
    title: "Hey {{username}}, your Progress Report is out! 📊",
    body_variants: {
      active: "🏅 Ahead of 70% of new users!\n📖 Lessons: {{lesson_count}} completed\n⏱️ Time: {{time_spent}} min\nSee you tomorrow!",
      inactive: "Your first lesson takes just 3 min!\n✅ Premium: Activated\n📖 Lessons: 0 completed\nTomorrow is a fresh start 💪",
    },
    drop_priority: 3, // keeps if >= 3 slots
  },
];

// ─── SCHEDULE CALCULATOR ─────────────────────────────────────

/**
 * Calculate send times for Day 0 notifications based on payment time.
 * Respects DND (11PM-7AM) and drops low-priority notifications when time is limited.
 */
function calculateDay0Schedule(paymentTime) {
  const paymentDate = new Date(paymentTime);
  // Calculate DND start (11 PM IST = 17:30 UTC) for the same IST day
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const paymentIST = new Date(paymentDate.getTime() + IST_OFFSET_MS);
  const dndStart = new Date(paymentDate);
  // Set to 23:00 IST (= 17:30 UTC) on the same IST day
  dndStart.setTime(
    Date.UTC(paymentIST.getUTCFullYear(), paymentIST.getUTCMonth(), paymentIST.getUTCDate(), DND_START_HOUR, 0, 0, 0) - IST_OFFSET_MS
  );

  // If payment is after DND start, only slot 1 (immediate)
  if (paymentDate >= dndStart) {
    const availableMinutes = 0;
    return [{ ...DAY0_TEMPLATES[0], send_at: paymentDate.toISOString() }];
  }

  // Available minutes until DND
  const availableMinutes = (dndStart - paymentDate) / (1000 * 60);

  // Sort templates by drop_priority (lower = more important)
  const sorted = [...DAY0_TEMPLATES].sort((a, b) => a.drop_priority - b.drop_priority);

  // Calculate how many fit
  const schedule = [];
  const usedTimes = [];

  for (const template of sorted) {
    let sendTime;

    if (template.delay_minutes === 0) {
      // Immediate
      sendTime = new Date(paymentDate);
    } else if (template.delay_minutes === -1) {
      // Progress report: 30 min before DND
      sendTime = new Date(dndStart - 30 * 60 * 1000);
    } else {
      sendTime = new Date(paymentDate.getTime() + template.delay_minutes * 60 * 1000);
    }

    // Check if within DND
    if (sendTime >= dndStart) continue;

    // Check minimum gap from other scheduled notifications
    const tooClose = usedTimes.some(
      (t) => Math.abs(sendTime - t) < MIN_GAP_MINUTES * 60 * 1000
    );
    if (tooClose && template.delay_minutes !== 0) continue;

    schedule.push({
      ...template,
      send_at: sendTime.toISOString(),
    });
    usedTimes.push(sendTime);
  }

  // Sort by send time
  schedule.sort((a, b) => new Date(a.send_at) - new Date(b.send_at));

  return schedule;
}

// ─── NOTIFICATION RESOLVER ───────────────────────────────────

/**
 * Resolve the final notification content based on user state.
 * Uses Word of the Day library and Cliffhanger library for dynamic content.
 */
function resolveNotificationContent(template, userState) {
  const username = userState.username || "there";
  const storyName = userState.story_name || "The Quiet Boy";
  const lessonCount = userState.lessons_completed || 0;
  const timeSpent = userState.time_spent || 0;
  const journeyDay = userState.journey_day || 0;

  // Resolve cliffhanger from library based on story + lesson progress
  const storyCliffhangers = CLIFFHANGERS[storyName] || CLIFFHANGERS["The Quiet Boy"] || [];
  const lessonIndex = Math.min(lessonCount, storyCliffhangers.length - 1);
  const cliffhanger = storyCliffhangers[Math.max(0, lessonIndex)] || { teaser: "Something incredible is about to happen...", hook: "What happens next?" };
  const cliffhangerText = userState.cliffhanger_text || cliffhanger.teaser;

  // Resolve Word of the Day from library based on story + day
  const storyWords = WORD_OF_THE_DAY[storyName] || WORD_OF_THE_DAY["The Quiet Boy"] || [];
  const dayIndex = Math.min(journeyDay, storyWords.length - 1);
  const wordOfDay = storyWords[Math.max(0, dayIndex)] || { word: "Confident", meaning: "feeling sure about yourself", example: "Practice makes you confident." };

  let title = template.title || "";
  let body = template.body || "";
  let image = template.image || "onboarding_story";

  // Special handling for Word of the Day — use library content
  if (template.name === "Word of the Day") {
    body = `Hey {{username}}! Today's word: ${wordOfDay.word} — ${wordOfDay.meaning}. "${wordOfDay.example}" Tap to learn more!`;
  }

  // Handle variants
  if (template.title_variants) {
    const variant = lessonCount > 0
      ? (template.title_variants.completed || template.title_variants.not_started)
      : (userState.lesson_started ? template.title_variants.started : template.title_variants.not_started);
    title = variant;
  }

  if (template.body_variants) {
    if (template.name === "Progress Report") {
      body = lessonCount > 0 ? template.body_variants.active : template.body_variants.inactive;
      image = lessonCount > 0 ? template.image_variants.active : template.image_variants.inactive;
    } else {
      body = lessonCount > 0
        ? (template.body_variants.completed || template.body_variants.not_started)
        : template.body_variants.not_started;
    }
  }

  // Replace placeholders
  title = title
    .replace(/\{\{username\}\}/g, username)
    .replace(/\{\{story_name\}\}/g, storyName)
    .replace(/\{\{cliffhanger_text\}\}/g, cliffhangerText)
    .replace(/\{\{cliffhanger_hook\}\}/g, cliffhanger.hook);

  body = body
    .replace(/\{\{username\}\}/g, username)
    .replace(/\{\{story_name\}\}/g, storyName)
    .replace(/\{\{cliffhanger_text\}\}/g, cliffhangerText)
    .replace(/\{\{cliffhanger_hook\}\}/g, cliffhanger.hook)
    .replace(/\{\{lesson_count\}\}/g, String(lessonCount))
    .replace(/\{\{time_spent\}\}/g, String(timeSpent))
    .replace(/\{\{word\}\}/g, wordOfDay.word)
    .replace(/\{\{word_meaning\}\}/g, wordOfDay.meaning)
    .replace(/\{\{word_example\}\}/g, wordOfDay.example);

  const imageUrl = JOURNEY_IMAGES[image] || JOURNEY_IMAGES.onboarding_story;

  return { title, body, imageUrl };
}

// ─── PUSH SENDER ─────────────────────────────────────────────

/**
 * Send a push notification via CleverTap API.
 */
async function sendPush(identity, title, body, imageUrl) {
  const db = getDb();

  const accountId = db.prepare("SELECT value FROM settings WHERE key = 'clevertap_account_id'").get();
  const passcode = db.prepare("SELECT value FROM settings WHERE key = 'clevertap_passcode'").get();
  const region = db.prepare("SELECT value FROM settings WHERE key = 'clevertap_region'").get();

  if (!accountId?.value || !passcode?.value) {
    throw new Error("CleverTap credentials not configured");
  }

  const regionMap = {
    in1: "https://in1.api.clevertap.com",
    us1: "https://us1.api.clevertap.com",
    eu1: "https://eu1.api.clevertap.com",
    sg1: "https://sg1.api.clevertap.com",
    aps3: "https://aps3.api.clevertap.com",
    mec1: "https://mec1.api.clevertap.com",
  };
  const baseUrl = regionMap[region?.value] || regionMap.in1;

  const payload = {
    to: { Identity: [String(identity)] },
    tag_group: "NotifyGen Automation",
    content: {
      title,
      body,
      platform_specific: {
        android: {
          wzrk_cid: SPEAKX_CHANNEL,
          priority: "high",
          ...(imageUrl ? { wzrk_bp: imageUrl } : {}),
        },
        ios: {
          "mutable-content": "true",
          ...(imageUrl ? { media_url: imageUrl, media_dl: "true" } : {}),
        },
      },
    },
  };

  const response = await fetch(`${baseUrl}/1/send/push.json`, {
    method: "POST",
    headers: {
      "X-CleverTap-Account-Id": accountId.value,
      "X-CleverTap-Passcode": passcode.value,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  return { success: result.status === "success", result };
}

// ─── DND CHECK ───────────────────────────────────────────────

/**
 * Check if current time is within DND hours (11 PM - 7 AM IST).
 */
function isDNDActive(date) {
  const d = date ? new Date(date) : new Date();
  // Convert to IST (UTC+5:30) since DND hours are in Indian time
  const istHour = new Date(d.getTime() + (5.5 * 60 * 60 * 1000)).getUTCHours();
  return istHour >= DND_START_HOUR || istHour < DND_END_HOUR;
}

// ─── USER JOURNEY PROCESSOR ─────────────────────────────────

/**
 * Process an incoming event for a user and schedule notifications.
 * This is the main entry point called by the webhook handler.
 */
async function processUserEvent(identity, eventName, eventProperties, eventTimestamp) {
  const db = getDb();
  const now = eventTimestamp ? new Date(eventTimestamp) : new Date();

  // 1. Get or create user journey record
  let journey = db.prepare("SELECT * FROM user_journeys WHERE identity = ?").get(identity);

  if (!journey) {
    db.prepare(`
      INSERT INTO user_journeys (identity, username, first_event, current_day, payment_time, lesson_started, lessons_completed, story_name, cliffhanger_text, created_at)
      VALUES (?, ?, ?, 0, NULL, 0, 0, 'The Quiet Boy', 'Something incredible is about to happen...', datetime('now'))
    `).run(identity, eventProperties?.username || identity, eventName);

    journey = db.prepare("SELECT * FROM user_journeys WHERE identity = ?").get(identity);
  }

  // 2. Update user state based on event
  updateUserState(db, journey, eventName, eventProperties, now);

  // 3. Determine what to do based on event type
  if (eventName === "payment_success") {
    await handlePaymentSuccess(db, identity, now);
  } else if (eventName === "lesson_started") {
    db.prepare("UPDATE user_journeys SET lesson_started = 1, updated_at = datetime('now') WHERE identity = ?").run(identity);
  } else if (eventName === "lesson_completed") {
    const count = (journey.lessons_completed || 0) + 1;
    db.prepare("UPDATE user_journeys SET lessons_completed = ?, updated_at = datetime('now') WHERE identity = ?").run(count, identity);
  } else if (eventName === "ob_completed") {
    db.prepare("UPDATE user_journeys SET onboarding_completed = 1, updated_at = datetime('now') WHERE identity = ?").run(identity);
  }

  // Refresh journey
  journey = db.prepare("SELECT * FROM user_journeys WHERE identity = ?").get(identity);

  return { identity, journey, event: eventName };
}

/**
 * Update user state fields based on incoming event.
 */
function updateUserState(db, journey, eventName, properties, now) {
  const updates = {};

  if (properties?.username && properties.username !== journey.identity) {
    updates.username = properties.username;
  }
  if (properties?.story_name) {
    updates.story_name = properties.story_name;
  }
  if (properties?.cliffhanger_text) {
    updates.cliffhanger_text = properties.cliffhanger_text;
  }

  updates.last_event = eventName;
  updates.last_event_at = now.toISOString();

  const setClauses = Object.keys(updates).map((k) => `${k} = ?`).join(", ");
  const values = Object.values(updates);
  values.push(journey.identity);

  db.prepare(`UPDATE user_journeys SET ${setClauses}, updated_at = datetime('now') WHERE identity = ?`).run(...values);
}

/**
 * Handle payment_success event — schedule Day 0 notifications.
 */
async function handlePaymentSuccess(db, identity, paymentTime) {
  // Update journey with payment time
  db.prepare("UPDATE user_journeys SET payment_time = ?, current_day = 0, updated_at = datetime('now') WHERE identity = ?")
    .run(paymentTime.toISOString(), identity);

  // Calculate Day 0 schedule
  const schedule = calculateDay0Schedule(paymentTime);

  // Clear any existing scheduled notifications for this user on Day 0
  db.prepare("DELETE FROM scheduled_notifications WHERE identity = ? AND journey_day = 0 AND status = 'pending'")
    .run(identity);

  // Insert scheduled notifications
  const insert = db.prepare(`
    INSERT INTO scheduled_notifications (identity, journey_day, slot, notification_name, segment, send_at, status, created_at)
    VALUES (?, 0, ?, ?, ?, ?, 'pending', datetime('now'))
  `);

  for (const notif of schedule) {
    insert.run(identity, notif.slot, notif.name, notif.segment, notif.send_at);
  }

  // Send the first one immediately (Trial Payment)
  const immediate = schedule.find((s) => s.slot === 1);
  if (immediate) {
    await processScheduledNotification(identity, immediate, db);
  }

  return schedule;
}

/**
 * Process and send a single scheduled notification.
 */
async function processScheduledNotification(identity, scheduledNotif, db) {
  if (!db) db = getDb();

  // Get current user state
  const journey = db.prepare("SELECT * FROM user_journeys WHERE identity = ?").get(identity);
  if (!journey) return { success: false, error: "User journey not found" };

  // Find the template
  const template = DAY0_TEMPLATES.find((t) => t.slot === scheduledNotif.slot);
  if (!template) return { success: false, error: "Template not found" };

  // Check DND
  if (isDNDActive(scheduledNotif.send_at)) {
    db.prepare("UPDATE scheduled_notifications SET status = 'skipped_dnd', updated_at = datetime('now') WHERE identity = ? AND journey_day = ? AND slot = ?")
      .run(identity, scheduledNotif.journey_day || 0, scheduledNotif.slot);
    return { success: false, error: "DND active" };
  }

  // Resolve content based on user state
  const userState = {
    username: journey.username || identity,
    story_name: journey.story_name || "The Quiet Boy",
    cliffhanger_text: journey.cliffhanger_text || null,
    lessons_completed: journey.lessons_completed || 0,
    lesson_started: journey.lesson_started || false,
    time_spent: (journey.lessons_completed || 0) * 4,
    journey_day: journey.current_day || 0,
  };

  const { title, body, imageUrl } = resolveNotificationContent(template, userState);

  try {
    const result = await sendPush(identity, title, body, imageUrl);

    // Update scheduled notification status
    db.prepare("UPDATE scheduled_notifications SET status = ?, sent_title = ?, sent_body = ?, updated_at = datetime('now') WHERE identity = ? AND journey_day = ? AND slot = ?")
      .run(result.success ? "sent" : "failed", title, body, identity, scheduledNotif.journey_day || 0, scheduledNotif.slot);

    // Log to sent_log
    db.prepare(`
      INSERT INTO sent_log (identity, journey_day, slot, notification_name, title, body, image_url, status, clevertap_response, sent_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      identity,
      scheduledNotif.journey_day || 0,
      scheduledNotif.slot,
      scheduledNotif.notification_name || scheduledNotif.name,
      title,
      body,
      imageUrl,
      result.success ? "delivered" : "failed",
      JSON.stringify(result.result)
    );

    return result;
  } catch (err) {
    db.prepare("UPDATE scheduled_notifications SET status = 'failed', updated_at = datetime('now') WHERE identity = ? AND journey_day = ? AND slot = ?")
      .run(identity, scheduledNotif.journey_day || 0, scheduledNotif.slot);
    return { success: false, error: err.message };
  }
}

// ─── CRON: PROCESS PENDING NOTIFICATIONS ─────────────────────

/**
 * Called every minute by the cron job.
 * Finds pending notifications whose send_at has passed and sends them.
 */
async function processPendingNotifications() {
  const db = getDb();
  const now = new Date().toISOString();

  const pending = db.prepare(`
    SELECT * FROM scheduled_notifications
    WHERE status = 'pending' AND send_at <= ?
    ORDER BY send_at ASC
    LIMIT 10
  `).all(now);

  for (const notif of pending) {
    await processScheduledNotification(notif.identity, notif, db);
  }

  return pending.length;
}

// ─── DAILY CRON: 7 AM CHECK ──────────────────────────────────

/**
 * Called at 7 AM IST daily.
 * Checks all active users and schedules Day 1, 2, 3... notifications.
 * Also handles inaction-based segments (3-day inactive, dormant, etc.)
 */
async function dailyMorningCheck() {
  const db = getDb();
  const now = new Date();

  // Get all users with active journeys
  const users = db.prepare(`
    SELECT * FROM user_journeys
    WHERE payment_time IS NOT NULL
    ORDER BY payment_time DESC
  `).all();

  let processed = 0;

  for (const user of users) {
    const paymentDate = new Date(user.payment_time);
    const daysSincePayment = Math.floor((now - paymentDate) / (1000 * 60 * 60 * 24));

    // Update current day
    db.prepare("UPDATE user_journeys SET current_day = ?, updated_at = datetime('now') WHERE identity = ?")
      .run(daysSincePayment, user.identity);

    // Check for inaction-based notifications
    const lastEventAt = user.last_event_at ? new Date(user.last_event_at) : paymentDate;
    const daysSinceLastEvent = Math.floor((now - lastEventAt) / (1000 * 60 * 60 * 24));

    let segmentToTrigger = null;

    if (daysSinceLastEvent >= 7) {
      segmentToTrigger = "7-Day Inactive";
    } else if (daysSinceLastEvent >= 3) {
      segmentToTrigger = "3-Day Inactive";
    }

    if (user.lessons_completed < 2 && daysSincePayment >= 3) {
      segmentToTrigger = "Low Practice";
    }

    if (daysSinceLastEvent >= 14) {
      segmentToTrigger = "Dormant";
    }

    // Schedule an inaction notification if applicable
    if (segmentToTrigger) {
      const alreadyScheduled = db.prepare(`
        SELECT * FROM scheduled_notifications
        WHERE identity = ? AND segment = ? AND status IN ('pending', 'sent')
        AND send_at >= datetime('now', '-1 day')
      `).get(user.identity, segmentToTrigger);

      if (!alreadyScheduled) {
        // Schedule for 9 AM today
        const sendAt = new Date(now);
        sendAt.setHours(9, 0, 0, 0);
        if (sendAt <= now) sendAt.setHours(now.getHours() + 1);

        db.prepare(`
          INSERT INTO scheduled_notifications (identity, journey_day, slot, notification_name, segment, send_at, status, created_at)
          VALUES (?, ?, 1, ?, ?, ?, 'pending', datetime('now'))
        `).run(user.identity, daysSincePayment, segmentToTrigger, segmentToTrigger, sendAt.toISOString());

        processed++;
      }
    }
  }

  return { users_checked: users.length, notifications_scheduled: processed };
}

// ─── EXPORTS ─────────────────────────────────────────────────

export {
  processUserEvent,
  calculateDay0Schedule,
  resolveNotificationContent,
  processPendingNotifications,
  dailyMorningCheck,
  sendPush,
  isDNDActive,
  DAY0_TEMPLATES,
  JOURNEY_IMAGES,
  handlePaymentSuccess,
  processScheduledNotification,
};
