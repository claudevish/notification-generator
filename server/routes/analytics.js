import { Router } from "express";
import { getDb } from "../database.js";

const router = Router();

// GET /api/analytics/overview
router.get("/overview", (req, res) => {
  const db = getDb();
  const batches = db.prepare("SELECT COUNT(*) as c FROM batches").get().c;
  const stories = db.prepare("SELECT COUNT(*) as c FROM stories").get().c;
  const segments = db.prepare("SELECT COUNT(*) as c FROM segments").get().c;
  const notifications = db.prepare("SELECT COUNT(*) as c FROM notifications").get().c;

  const events = db.prepare(`
    SELECT event_type, SUM(count) as total
    FROM notification_events
    GROUP BY event_type
  `).all();

  const eventMap = {};
  for (const e of events) {
    eventMap[e.event_type] = e.total;
  }

  res.json({
    batches,
    stories,
    segments,
    notifications,
    events: {
      sent: eventMap.sent || 0,
      delivered: eventMap.delivered || 0,
      opened: eventMap.opened || 0,
      clicked: eventMap.clicked || 0,
    },
  });
});

// GET /api/analytics/by-segment
router.get("/by-segment", (req, res) => {
  const db = getDb();
  const data = db.prepare(`
    SELECT
      seg.segment_name,
      COUNT(DISTINCT n.id) as notification_count,
      SUM(CASE WHEN ne.event_type='sent' THEN ne.count ELSE 0 END) as total_sent,
      SUM(CASE WHEN ne.event_type='delivered' THEN ne.count ELSE 0 END) as total_delivered,
      SUM(CASE WHEN ne.event_type='opened' THEN ne.count ELSE 0 END) as total_opened,
      SUM(CASE WHEN ne.event_type='clicked' THEN ne.count ELSE 0 END) as total_clicked
    FROM segments seg
    JOIN notifications n ON n.segment_id = seg.id
    LEFT JOIN notification_events ne ON ne.notification_id = n.id
    GROUP BY seg.segment_name
    ORDER BY total_sent DESC
  `).all();

  res.json(data.map(row => ({
    ...row,
    open_rate: row.total_delivered > 0 ? ((row.total_opened / row.total_delivered) * 100).toFixed(1) : "0.0",
    ctr: row.total_opened > 0 ? ((row.total_clicked / row.total_opened) * 100).toFixed(1) : "0.0",
  })));
});

// GET /api/analytics/by-language
router.get("/by-language", (req, res) => {
  const db = getDb();
  const data = db.prepare(`
    SELECT
      n.language,
      COUNT(DISTINCT n.id) as notification_count,
      SUM(CASE WHEN ne.event_type='sent' THEN ne.count ELSE 0 END) as total_sent,
      SUM(CASE WHEN ne.event_type='delivered' THEN ne.count ELSE 0 END) as total_delivered,
      SUM(CASE WHEN ne.event_type='opened' THEN ne.count ELSE 0 END) as total_opened,
      SUM(CASE WHEN ne.event_type='clicked' THEN ne.count ELSE 0 END) as total_clicked
    FROM notifications n
    LEFT JOIN notification_events ne ON ne.notification_id = n.id
    GROUP BY n.language
    ORDER BY total_sent DESC
  `).all();

  res.json(data.map(row => ({
    ...row,
    open_rate: row.total_delivered > 0 ? ((row.total_opened / row.total_delivered) * 100).toFixed(1) : "0.0",
    ctr: row.total_opened > 0 ? ((row.total_clicked / row.total_opened) * 100).toFixed(1) : "0.0",
  })));
});

// GET /api/analytics/timeline
router.get("/timeline", (req, res) => {
  const db = getDb();
  const data = db.prepare(`
    SELECT
      DATE(recorded_at) as date,
      event_type,
      SUM(count) as total
    FROM notification_events
    GROUP BY DATE(recorded_at), event_type
    ORDER BY date ASC
  `).all();

  // Group by date
  const dateMap = {};
  for (const row of data) {
    if (!dateMap[row.date]) {
      dateMap[row.date] = { date: row.date, sent: 0, delivered: 0, opened: 0, clicked: 0 };
    }
    dateMap[row.date][row.event_type] = row.total;
  }

  res.json(Object.values(dateMap));
});

// GET /api/analytics/top-notifications
router.get("/top-notifications", (req, res) => {
  const db = getDb();
  const data = db.prepare(`
    SELECT
      n.id,
      n.title,
      n.body,
      n.language,
      seg.segment_name,
      SUM(CASE WHEN ne.event_type='sent' THEN ne.count ELSE 0 END) as sent,
      SUM(CASE WHEN ne.event_type='delivered' THEN ne.count ELSE 0 END) as delivered,
      SUM(CASE WHEN ne.event_type='opened' THEN ne.count ELSE 0 END) as opened,
      SUM(CASE WHEN ne.event_type='clicked' THEN ne.count ELSE 0 END) as clicked
    FROM notifications n
    JOIN segments seg ON n.segment_id = seg.id
    LEFT JOIN notification_events ne ON ne.notification_id = n.id
    GROUP BY n.id
    HAVING sent > 0
    ORDER BY CASE WHEN delivered > 0 THEN CAST(opened AS REAL) / delivered ELSE 0 END DESC
    LIMIT 10
  `).all();

  res.json(data.map(row => ({
    ...row,
    open_rate: row.delivered > 0 ? ((row.opened / row.delivered) * 100).toFixed(1) : "0.0",
    ctr: row.opened > 0 ? ((row.clicked / row.opened) * 100).toFixed(1) : "0.0",
  })));
});

// POST /api/analytics/seed - Seed analytics data for existing notifications
router.post("/seed", (req, res) => {
  const db = getDb();

  // Check if events already exist
  const existing = db.prepare("SELECT COUNT(*) as c FROM notification_events").get().c;
  if (existing > 0) {
    return res.json({ message: "Analytics data already exists", count: existing });
  }

  const notifications = db.prepare("SELECT id FROM notifications").all();
  if (notifications.length === 0) {
    return res.json({ message: "No notifications to seed data for", count: 0 });
  }

  const insert = db.prepare(
    "INSERT INTO notification_events (notification_id, event_type, count, recorded_at) VALUES (?, ?, ?, ?)"
  );

  const seedAll = db.transaction(() => {
    for (const n of notifications) {
      const sent = Math.floor(800 + Math.random() * 1200);
      const delivered = Math.floor(sent * (0.92 + Math.random() * 0.06));
      const opened = Math.floor(delivered * (0.15 + Math.random() * 0.2));
      const clicked = Math.floor(opened * (0.3 + Math.random() * 0.35));

      const daysAgo = Math.floor(Math.random() * 30);
      const date = new Date(Date.now() - daysAgo * 86400000);
      const ts = date.toISOString();

      insert.run(n.id, "sent", sent, ts);
      insert.run(n.id, "delivered", delivered, ts);
      insert.run(n.id, "opened", opened, ts);
      insert.run(n.id, "clicked", clicked, ts);
    }
  });

  seedAll();
  res.json({ message: "Seeded analytics data", count: notifications.length * 4 });
});

export default router;
