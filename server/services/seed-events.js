import { getDb } from "../database.js";

export function seedEventsForNotifications(notificationIds) {
  const db = getDb();
  const insert = db.prepare(
    "INSERT INTO notification_events (notification_id, event_type, count, recorded_at) VALUES (?, ?, ?, ?)"
  );

  const seedAll = db.transaction(() => {
    for (const nId of notificationIds) {
      const sent = Math.floor(800 + Math.random() * 1200);
      const delivered = Math.floor(sent * (0.92 + Math.random() * 0.06));
      const opened = Math.floor(delivered * (0.15 + Math.random() * 0.2));
      const clicked = Math.floor(opened * (0.3 + Math.random() * 0.35));

      // Create events over last 30 days with realistic timestamps
      const now = new Date();
      const daysAgo = Math.floor(Math.random() * 30);
      const date = new Date(now.getTime() - daysAgo * 86400000);
      const ts = date.toISOString();

      insert.run(nId, "sent", sent, ts);
      insert.run(nId, "delivered", delivered, ts);
      insert.run(nId, "opened", opened, ts);
      insert.run(nId, "clicked", clicked, ts);
    }
  });

  seedAll();
}
