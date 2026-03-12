import { Router } from "express";
import { getDb } from "../database.js";

const router = Router();

router.get("/", (req, res) => {
  const db = getDb();
  const { story_id, batch_id } = req.query;

  let sql = `
    SELECT s.*, st.title as story_title, st.theme as story_theme, st.batch_id
    FROM segments s
    JOIN stories st ON st.id = s.story_id
  `;
  const conditions = [];
  const params = [];

  if (story_id) {
    conditions.push("s.story_id = ?");
    params.push(story_id);
  }
  if (batch_id) {
    conditions.push("st.batch_id = ?");
    params.push(batch_id);
  }

  if (conditions.length > 0) sql += " WHERE " + conditions.join(" AND ");
  sql += " ORDER BY s.created_at DESC";
  const segments = db.prepare(sql).all(...params);

  const notifCount = db.prepare(
    "SELECT COUNT(*) as c FROM notifications WHERE segment_id = ?"
  );
  const enriched = segments.map((seg) => ({
    ...seg,
    notification_count: notifCount.get(seg.id).c,
  }));

  res.json(enriched);
});

router.get("/:id", (req, res) => {
  const db = getDb();
  const segment = db
    .prepare(
      `SELECT s.*, st.title as story_title, st.theme as story_theme
       FROM segments s JOIN stories st ON st.id = s.story_id
       WHERE s.id = ?`
    )
    .get(req.params.id);

  if (!segment) return res.status(404).json({ error: "Segment not found" });

  const notifications = db
    .prepare("SELECT * FROM notifications WHERE segment_id = ? ORDER BY language")
    .all(segment.id);

  res.json({ ...segment, notifications });
});

router.put("/:id", (req, res) => {
  const db = getDb();
  const { segment_name, logic_description } = req.body;

  const result = db
    .prepare("UPDATE segments SET segment_name = ?, logic_description = ? WHERE id = ?")
    .run(segment_name, logic_description, req.params.id);

  if (result.changes === 0) return res.status(404).json({ error: "Segment not found" });
  res.json({ message: "Segment updated" });
});

router.delete("/:id", (req, res) => {
  const db = getDb();
  const result = db.prepare("DELETE FROM segments WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Segment not found" });
  res.json({ message: "Segment deleted" });
});

export default router;
