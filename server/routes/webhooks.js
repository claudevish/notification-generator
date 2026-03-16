/**
 * WEBHOOK ROUTES — Receives events from CleverTap
 *
 * CleverTap sends webhooks when events occur.
 * This endpoint receives them and feeds into the automation engine.
 */

import { Router } from "express";
import { getDb } from "../database.js";
import {
  processUserEvent,
  calculateDay0Schedule,
  processPendingNotifications,
  dailyMorningCheck,
  DAY0_TEMPLATES,
  sendPush,
  resolveNotificationContent,
  handlePaymentSuccess,
} from "../services/automation-engine.js";

const router = Router();

// ─── MAIN WEBHOOK ENDPOINT ──────────────────────────────────
// CleverTap sends event data here
router.post("/clevertap", async (req, res) => {
  try {
    const { event, identity, timestamp, properties } = req.body;

    if (!event || !identity) {
      return res.status(400).json({ error: "event and identity are required" });
    }

    const result = await processUserEvent(
      identity,
      event,
      properties || {},
      timestamp || new Date().toISOString()
    );

    res.json({
      success: true,
      message: `Event "${event}" processed for ${identity}`,
      journey_day: result.journey?.current_day,
      scheduled: result.event === "payment_success" ? "Day 0 notifications scheduled" : null,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── SIMULATE EVENT (for testing) ────────────────────────────
// Manually trigger an event for a user without actual CleverTap webhook
router.post("/simulate", async (req, res) => {
  try {
    const { identity, event, properties, timestamp } = req.body;

    if (!identity || !event) {
      return res.status(400).json({ error: "identity and event are required" });
    }

    const result = await processUserEvent(
      identity,
      event,
      properties || {},
      timestamp || new Date().toISOString()
    );

    // Get schedule if payment event
    let schedule = null;
    if (event === "payment_success") {
      const paymentTime = timestamp ? new Date(timestamp) : new Date();
      schedule = calculateDay0Schedule(paymentTime);
    }

    res.json({
      success: true,
      message: `Simulated "${event}" for ${identity}`,
      journey: result.journey,
      schedule: schedule ? schedule.map((s) => ({
        slot: s.slot,
        name: s.name,
        send_at: s.send_at,
        drop_priority: s.drop_priority,
      })) : null,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── TEST: FIRE ALL DAY 0 NOTIFICATIONS NOW ──────────────────
// Sends all 6 (or fewer) Day 0 notifications immediately for testing
router.post("/test-day0", async (req, res) => {
  try {
    const { identity, username, story_name, cliffhanger_text, payment_time } = req.body;

    if (!identity) {
      return res.status(400).json({ error: "identity (phone number) is required" });
    }

    const db = getDb();
    const paymentTime = payment_time ? new Date(payment_time) : new Date();

    // Create/update user journey
    const existing = db.prepare("SELECT * FROM user_journeys WHERE identity = ?").get(identity);
    if (!existing) {
      db.prepare(`
        INSERT INTO user_journeys (identity, username, first_event, payment_time, current_day, lesson_started, lessons_completed, story_name, cliffhanger_text, created_at)
        VALUES (?, ?, 'payment_success', ?, 0, 0, 0, ?, ?, datetime('now'))
      `).run(
        identity,
        username || identity,
        paymentTime.toISOString(),
        story_name || "The Quiet Boy",
        cliffhanger_text || "Ravi has never spoken up in class... today that changes."
      );
    } else {
      db.prepare(`
        UPDATE user_journeys SET username = ?, payment_time = ?, current_day = 0,
        story_name = ?, cliffhanger_text = ?, updated_at = datetime('now')
        WHERE identity = ?
      `).run(
        username || existing.username || identity,
        paymentTime.toISOString(),
        story_name || existing.story_name || "The Quiet Boy",
        cliffhanger_text || existing.cliffhanger_text || "Ravi has never spoken up in class... today that changes.",
        identity
      );
    }

    // Get schedule
    const schedule = calculateDay0Schedule(paymentTime);

    // Send all immediately for testing
    const results = [];
    const userState = {
      username: username || identity,
      story_name: story_name || "The Quiet Boy",
      cliffhanger_text: cliffhanger_text || "Ravi has never spoken up in class... today that changes.",
      lessons_completed: 0,
      lesson_started: false,
      time_spent: 0,
    };

    for (const notif of schedule) {
      const template = DAY0_TEMPLATES.find((t) => t.slot === notif.slot);
      if (!template) continue;

      const { title, body, imageUrl } = resolveNotificationContent(template, userState);

      try {
        const pushResult = await sendPush(identity, title, body, imageUrl);

        // Log
        db.prepare(`
          INSERT INTO sent_log (identity, journey_day, slot, notification_name, title, body, image_url, status, sent_at)
          VALUES (?, 0, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).run(identity, notif.slot, notif.name, title, body, imageUrl, pushResult.success ? "delivered" : "failed");

        results.push({
          slot: notif.slot,
          name: notif.name,
          title,
          body,
          image: imageUrl,
          scheduled_for: notif.send_at,
          status: pushResult.success ? "✅ Sent" : "❌ Failed",
        });

        // Small delay between sends to avoid rate limiting
        await new Promise((r) => setTimeout(r, 2000));
      } catch (err) {
        results.push({
          slot: notif.slot,
          name: notif.name,
          title,
          body,
          status: `❌ Error: ${err.message}`,
        });
      }
    }

    res.json({
      success: true,
      identity,
      payment_time: paymentTime.toISOString(),
      total_scheduled: schedule.length,
      total_sent: results.filter((r) => r.status.includes("Sent")).length,
      notifications: results,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── VIEW USER JOURNEY ───────────────────────────────────────
router.get("/journey/:identity", (req, res) => {
  const db = getDb();
  const journey = db.prepare("SELECT * FROM user_journeys WHERE identity = ?").get(req.params.identity);

  if (!journey) {
    return res.status(404).json({ error: "User journey not found" });
  }

  const scheduled = db.prepare(
    "SELECT * FROM scheduled_notifications WHERE identity = ? ORDER BY send_at ASC"
  ).all(req.params.identity);

  const sentLog = db.prepare(
    "SELECT * FROM sent_log WHERE identity = ? ORDER BY sent_at DESC LIMIT 50"
  ).all(req.params.identity);

  res.json({ journey, scheduled, sent_log: sentLog });
});

// ─── VIEW ALL JOURNEYS ───────────────────────────────────────
router.get("/journeys", (req, res) => {
  const db = getDb();
  const journeys = db.prepare(`
    SELECT uj.*,
      (SELECT COUNT(*) FROM scheduled_notifications sn WHERE sn.identity = uj.identity AND sn.status = 'pending') as pending_count,
      (SELECT COUNT(*) FROM sent_log sl WHERE sl.identity = uj.identity AND sl.status = 'delivered') as sent_count
    FROM user_journeys uj
    ORDER BY uj.created_at DESC
  `).all();

  res.json(journeys);
});

// ─── MANUAL TRIGGER: Process pending now ─────────────────────
router.post("/process-pending", async (req, res) => {
  try {
    const count = await processPendingNotifications();
    res.json({ success: true, processed: count });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── MANUAL TRIGGER: Daily morning check ─────────────────────
router.post("/daily-check", async (req, res) => {
  try {
    const result = await dailyMorningCheck();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── PREVIEW: See what Day 0 schedule looks like ─────────────
router.post("/preview-schedule", (req, res) => {
  const { payment_time } = req.body;
  const paymentTime = payment_time ? new Date(payment_time) : new Date();
  const schedule = calculateDay0Schedule(paymentTime);

  res.json({
    payment_time: paymentTime.toISOString(),
    dnd_start: "11:00 PM",
    dnd_end: "7:00 AM",
    available_minutes: Math.max(0, Math.floor(
      (new Date(paymentTime).setHours(23, 0, 0, 0) - paymentTime) / (1000 * 60)
    )),
    total_notifications: schedule.length,
    dropped: 6 - schedule.length,
    schedule: schedule.map((s) => ({
      slot: s.slot,
      name: s.name,
      send_at: s.send_at,
      send_time: new Date(s.send_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
    })),
  });
});

export default router;
