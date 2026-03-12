import { Router } from "express";
import { getDb } from "../database.js";

const router = Router();

function toCsv(rows, columns) {
  if (rows.length === 0) return columns.join(",") + "\n";

  const escape = (val) => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };

  const header = columns.join(",");
  const body = rows.map((r) => columns.map((c) => escape(r[c])).join(",")).join("\n");
  return header + "\n" + body + "\n";
}

router.get("/stories", (req, res) => {
  const db = getDb();
  const { batch_id } = req.query;
  let sql = "SELECT s.*, b.name as batch_name FROM stories s LEFT JOIN batches b ON b.id = s.batch_id";
  const params = [];
  if (batch_id) {
    sql += " WHERE s.batch_id = ?";
    params.push(batch_id);
  }
  sql += " ORDER BY s.id";
  const rows = db.prepare(sql).all(...params);
  const csv = toCsv(rows, [
    "id", "batch_name", "story_id", "title", "theme", "content",
    "difficulty", "lesson_number", "key_learning", "created_at",
  ]);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=stories.csv");
  res.send(csv);
});

router.get("/notifications", (req, res) => {
  const db = getDb();
  const { batch_id } = req.query;
  let sql = `SELECT
        n.id, b.name as batch_name, st.story_id, st.title as story_title, st.theme as story_theme,
        seg.segment_name, seg.logic_description,
        n.language, n.title, n.body, n.cta, n.image_prompt, n.created_at
      FROM notifications n
      JOIN segments seg ON seg.id = n.segment_id
      JOIN stories st ON st.id = seg.story_id
      LEFT JOIN batches b ON b.id = st.batch_id`;
  const params = [];
  if (batch_id) {
    sql += " WHERE st.batch_id = ?";
    params.push(batch_id);
  }
  sql += " ORDER BY st.id, seg.id, n.language";
  const rows = db.prepare(sql).all(...params);

  const csv = toCsv(rows, [
    "id", "batch_name", "story_id", "story_title", "story_theme",
    "segment_name", "logic_description",
    "language", "title", "body", "cta", "image_prompt", "created_at",
  ]);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=notifications.csv");
  res.send(csv);
});

router.get("/image-prompts", (req, res) => {
  const db = getDb();
  const { batch_id } = req.query;
  let sql = `SELECT
        n.id, b.name as batch_name, st.title as story_title, seg.segment_name,
        n.language, n.title as notification_title, n.image_prompt
      FROM notifications n
      JOIN segments seg ON seg.id = n.segment_id
      JOIN stories st ON st.id = seg.story_id
      LEFT JOIN batches b ON b.id = st.batch_id
      WHERE n.image_prompt IS NOT NULL`;
  const params = [];
  if (batch_id) {
    sql += " AND st.batch_id = ?";
    params.push(batch_id);
  }
  sql += " ORDER BY st.id, seg.id";
  const rows = db.prepare(sql).all(...params);

  const csv = toCsv(rows, [
    "id", "batch_name", "story_title", "segment_name",
    "language", "notification_title", "image_prompt",
  ]);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=image_prompts.csv");
  res.send(csv);
});

router.get("/all", (req, res) => {
  const db = getDb();
  const { batch_id } = req.query;
  let sql = `SELECT
        b.name as batch_name,
        st.id as story_db_id, st.story_id, st.title as story_title, st.theme, st.content,
        st.difficulty, st.lesson_number, st.key_learning,
        seg.segment_name, seg.logic_description,
        n.language, n.title as notif_title, n.body as notif_body,
        n.cta as notif_cta, n.image_prompt
      FROM stories st
      LEFT JOIN batches b ON b.id = st.batch_id
      LEFT JOIN segments seg ON seg.story_id = st.id
      LEFT JOIN notifications n ON n.segment_id = seg.id`;
  const params = [];
  if (batch_id) {
    sql += " WHERE st.batch_id = ?";
    params.push(batch_id);
  }
  sql += " ORDER BY st.id, seg.id, n.language";
  const rows = db.prepare(sql).all(...params);

  const csv = toCsv(rows, [
    "batch_name", "story_db_id", "story_id", "story_title", "theme", "content",
    "difficulty", "lesson_number", "key_learning",
    "segment_name", "logic_description",
    "language", "notif_title", "notif_body", "notif_cta", "image_prompt",
  ]);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=all_data.csv");
  res.send(csv);
});

export default router;
