import { Router } from "express";
import { getDb } from "../database.js";
import { generateForStory, SEGMENT_DEFS } from "../services/ai-generator.js";
import { generateAndSave } from "../services/image-generator.js";

const router = Router();

router.get("/", (req, res) => {
  const db = getDb();
  const { segment_id, segment_name, language, story_id, batch_id } = req.query;

  let sql = `
    SELECT n.*, seg.segment_name, seg.story_id, st.title as story_title, st.batch_id
    FROM notifications n
    JOIN segments seg ON seg.id = n.segment_id
    JOIN stories st ON st.id = seg.story_id
  `;
  const conditions = [];
  const params = [];

  if (segment_id) {
    conditions.push("n.segment_id = ?");
    params.push(segment_id);
  }
  if (segment_name) {
    conditions.push("seg.segment_name = ?");
    params.push(segment_name);
  }
  if (language) {
    conditions.push("n.language = ?");
    params.push(language);
  }
  if (story_id) {
    conditions.push("seg.story_id = ?");
    params.push(story_id);
  }
  if (batch_id) {
    conditions.push("st.batch_id = ?");
    params.push(batch_id);
  }

  if (conditions.length > 0) sql += " WHERE " + conditions.join(" AND ");
  sql += " ORDER BY n.created_at DESC";

  const notifications = db.prepare(sql).all(...params);
  const enriched = notifications.map((n) => ({
    ...n,
    image_url: n.image_path ? `/static/${n.image_path}` : null,
  }));
  res.json(enriched);
});

router.put("/:id", (req, res) => {
  const db = getDb();
  const { title, body, cta, image_prompt } = req.body;

  const result = db
    .prepare(
      "UPDATE notifications SET title = ?, body = ?, cta = ?, image_prompt = ? WHERE id = ?"
    )
    .run(title, body, cta, image_prompt, req.params.id);

  if (result.changes === 0) return res.status(404).json({ error: "Notification not found" });
  res.json({ message: "Notification updated" });
});

router.post("/:id/regenerate", (req, res) => {
  const db = getDb();
  const notif = db
    .prepare(
      `SELECT n.*, seg.segment_name, seg.story_id
       FROM notifications n
       JOIN segments seg ON seg.id = n.segment_id
       WHERE n.id = ?`
    )
    .get(req.params.id);

  if (!notif) return res.status(404).json({ error: "Notification not found" });

  const story = db.prepare("SELECT * FROM stories WHERE id = ?").get(notif.story_id);
  if (!story) return res.status(404).json({ error: "Story not found" });

  const segDef = SEGMENT_DEFS.find((s) => s.name === notif.segment_name);
  if (!segDef) return res.status(400).json({ error: "Unknown segment type" });

  const result = generateForStory(story);
  const matchSeg = result.segments.find((s) => s.segment_name === notif.segment_name);
  if (!matchSeg) return res.status(500).json({ error: "Generation failed" });

  const langNotif = matchSeg.notifications.find((n) => n.language === notif.language);
  if (!langNotif) return res.status(500).json({ error: "Language not found" });

  db.prepare(
    "UPDATE notifications SET title = ?, body = ?, cta = ?, image_prompt = ? WHERE id = ?"
  ).run(langNotif.title, langNotif.body, langNotif.cta, langNotif.image_prompt, notif.id);

  // Regenerate the image
  try {
    const imagePath = generateAndSave({
      notificationId: notif.id,
      title: langNotif.title,
      body: langNotif.body,
      cta: langNotif.cta,
      language: notif.language,
      segmentName: notif.segment_name,
      storyTitle: story.title,
      theme: story.theme,
    });
    db.prepare("UPDATE notifications SET image_path = ? WHERE id = ?").run(imagePath, notif.id);
  } catch (err) {
    console.error("Image regen failed:", err.message);
  }

  const updated = db.prepare("SELECT * FROM notifications WHERE id = ?").get(notif.id);
  res.json({ ...updated, image_url: updated.image_path ? `/static/${updated.image_path}` : null });
});

// Regenerate ALL notification images (for design updates)
router.post("/regenerate-images", (req, res) => {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT n.id, n.title, n.body, n.cta, n.language,
              seg.segment_name, st.title as story_title, st.theme
       FROM notifications n
       JOIN segments seg ON seg.id = n.segment_id
       JOIN stories st ON st.id = seg.story_id`
    )
    .all();

  let ok = 0;
  let fail = 0;
  const updateStmt = db.prepare("UPDATE notifications SET image_path = ? WHERE id = ?");

  for (const r of rows) {
    try {
      const imagePath = generateAndSave({
        notificationId: r.id,
        title: r.title,
        body: r.body,
        cta: r.cta,
        language: r.language,
        segmentName: r.segment_name,
        storyTitle: r.story_title,
        theme: r.theme,
      });
      updateStmt.run(imagePath, r.id);
      ok++;
    } catch (err) {
      fail++;
    }
  }

  res.json({ message: `Regenerated ${ok} images (${fail} failed)`, total: rows.length, ok, fail });
});

// Regenerate ALL notifications — text content + images
router.post("/regenerate-all", (req, res) => {
  const db = getDb();

  const stories = db
    .prepare(
      `SELECT DISTINCT st.id, st.title, st.theme, st.difficulty, st.key_learning
       FROM stories st
       JOIN segments seg ON seg.story_id = st.id
       JOIN notifications n ON n.segment_id = seg.id`
    )
    .all();

  let textOk = 0;
  let imgOk = 0;
  let fail = 0;

  const updateText = db.prepare(
    "UPDATE notifications SET title = ?, body = ?, cta = ?, image_prompt = ? WHERE id = ?"
  );
  const updateImg = db.prepare(
    "UPDATE notifications SET image_path = ? WHERE id = ?"
  );

  for (const story of stories) {
    const result = generateForStory(story);

    const notifs = db
      .prepare(
        `SELECT n.id, n.language, seg.segment_name
         FROM notifications n
         JOIN segments seg ON seg.id = n.segment_id
         WHERE seg.story_id = ?`
      )
      .all(story.id);

    for (const n of notifs) {
      try {
        const matchSeg = result.segments.find((s) => s.segment_name === n.segment_name);
        if (!matchSeg) { fail++; continue; }

        const langNotif = matchSeg.notifications.find((ln) => ln.language === n.language);
        if (!langNotif) { fail++; continue; }

        updateText.run(langNotif.title, langNotif.body, langNotif.cta, langNotif.image_prompt, n.id);
        textOk++;

        const imagePath = generateAndSave({
          notificationId: n.id,
          title: langNotif.title,
          body: langNotif.body,
          cta: langNotif.cta,
          language: n.language,
          segmentName: n.segment_name,
          storyTitle: story.title,
          theme: story.theme,
        });
        updateImg.run(imagePath, n.id);
        imgOk++;
      } catch (err) {
        console.error("Regenerate-all error:", err.message);
        fail++;
      }
    }
  }

  res.json({
    message: `Regenerated ${textOk} texts + ${imgOk} images (${fail} failed)`,
    total: textOk + fail,
    textOk,
    imgOk,
    fail,
  });
});

router.get("/stats", (req, res) => {
  const db = getDb();
  const total = db.prepare("SELECT COUNT(*) as c FROM notifications").get().c;
  const byLang = db
    .prepare("SELECT language, COUNT(*) as count FROM notifications GROUP BY language")
    .all();
  const bySegment = db
    .prepare(
      `SELECT seg.segment_name, COUNT(*) as count
       FROM notifications n JOIN segments seg ON seg.id = n.segment_id
       GROUP BY seg.segment_name`
    )
    .all();

  res.json({ total, by_language: byLang, by_segment: bySegment });
});

export default router;
