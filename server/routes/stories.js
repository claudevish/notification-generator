import { Router } from "express";
import multer from "multer";
import csvParser from "csv-parser";
import { Readable } from "stream";
import { getDb } from "../database.js";
import { generateForStory } from "../services/ai-generator.js";
import { generateAndSave } from "../services/image-generator.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

/* ------------------------------------------------------------------ */
/*  CSV FORMAT DETECTION & PARSING                                    */
/* ------------------------------------------------------------------ */

const SPEAKX_MARKERS = [
  "journeyid", "journeytitle", "chapterid", "chaptertitle",
  "questid", "questtitle", "activitytitle",
];

function norm(s) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isSpeakxFormat(headers) {
  const normed = headers.map((h) => norm(h.replace(/^\uFEFF/, "")));
  return SPEAKX_MARKERS.some((m) => normed.some((n) => n.includes(m)));
}

function cleanVal(v) {
  if (!v || typeof v !== "string") return v || null;
  return v.replace(/\{\{userName\}\}/g, "Learner").trim() || null;
}

function getCol(row, ...candidates) {
  for (const key of Object.keys(row)) {
    const n = norm(key.replace(/^\uFEFF/, ""));
    for (const c of candidates) {
      if (n === norm(c) || n.includes(norm(c))) return cleanVal(row[key]);
    }
  }
  return null;
}

/**
 * Parse a SpeakX journey CSV.
 * Groups rows by chapter → one story per unique chapter.
 */
function parseSpeakxRows(rawRows) {
  const journeyTitle = getCol(rawRows[0], "journeyTitle") || "Untitled Journey";
  const journeyId = getCol(rawRows[0], "journeyID") || null;
  const journeyDesc = getCol(rawRows[0], "journeyDescription") || null;

  // Group by chapter
  const chapters = new Map();
  for (const row of rawRows) {
    const chId = getCol(row, "chapterID") || "unknown";
    if (!chapters.has(chId)) {
      chapters.set(chId, {
        chapter_id: chId,
        title: getCol(row, "chapterTitle") || `Chapter ${chapters.size + 1}`,
        description: getCol(row, "chapterDescription") || null,
        difficulty: getCol(row, "aiLevel") || getCol(row, "userLevel") || null,
        theme: getCol(row, "scenario") || getCol(row, "location") || null,
        quests: [],
      });
    }
    const ch = chapters.get(chId);
    const questTitle = getCol(row, "questTitle/En", "questTitleEn") ||
                       getCol(row, "questTitle/Hi", "questTitleHi") || null;
    const actTitle = getCol(row, "activityTitle/En", "activityTitleEn") ||
                     getCol(row, "activityTitle/Hi", "activityTitleHi") || null;
    const questDesc = getCol(row, "questDescription") || null;
    if (questTitle) ch.quests.push({ questTitle, actTitle, questDesc });
  }

  // Build stories from chapters
  const stories = [];
  for (const ch of chapters.values()) {
    const questSummary = ch.quests
      .map((q) => q.questTitle)
      .filter(Boolean)
      .join("; ");
    const content = [ch.description, questSummary].filter(Boolean).join("\n\n");
    const keyLearning = ch.quests
      .map((q) => q.questDesc)
      .filter(Boolean)
      .slice(0, 3)
      .join("; ");

    stories.push({
      story_id: ch.chapter_id,
      title: ch.title,
      theme: ch.theme,
      content: content || null,
      difficulty: ch.difficulty,
      lesson_number: null,
      key_learning: keyLearning || null,
    });
  }

  return {
    batchName: journeyTitle,
    journeyId,
    journeyDesc,
    stories,
  };
}

/**
 * Parse a simple/standard CSV with direct column mapping.
 */
function parseSimpleRows(rawRows, headers) {
  const cleaned = headers.map((k) => k.replace(/^\uFEFF/, "").trim());
  const rules = [
    { field: "story_id",      patterns: ["storyid", "id"] },
    { field: "title",         patterns: ["storytitle", "title", "storyname"] },
    { field: "theme",         patterns: ["storytheme", "theme", "topic", "category"] },
    { field: "content",       patterns: ["storycontent", "content", "description", "body", "text", "summary"] },
    { field: "difficulty",    patterns: ["difficultylevel", "difficulty", "level"] },
    { field: "lesson_number", patterns: ["lessonnumber", "lesson", "chapter"] },
    { field: "key_learning",  patterns: ["keylearning", "learning", "objective"] },
  ];

  const colMap = {};
  for (const { field, patterns } of rules) {
    for (const rawKey of cleaned) {
      if (colMap[rawKey]) continue;
      const n = norm(rawKey);
      if (patterns.includes(n) || patterns.some((p) => n.includes(p))) {
        colMap[rawKey] = field;
        break;
      }
    }
  }

  const stories = rawRows.map((row) => {
    const mapped = {};
    for (const [rawKey, value] of Object.entries(row)) {
      const ck = rawKey.replace(/^\uFEFF/, "").trim();
      const dbField = colMap[ck];
      if (dbField) mapped[dbField] = typeof value === "string" ? value.trim() : value;
    }
    return {
      story_id: mapped.story_id || null,
      title: mapped.title || "Untitled",
      theme: mapped.theme || null,
      content: mapped.content || null,
      difficulty: mapped.difficulty || null,
      lesson_number: mapped.lesson_number || null,
      key_learning: mapped.key_learning || null,
    };
  });

  // Derive batch name from filename or first title
  const batchName = stories[0]?.title || "Uploaded Stories";
  return { batchName, journeyId: null, journeyDesc: null, stories };
}

/* ------------------------------------------------------------------ */
/*  AUTO-GENERATE helper                                              */
/* ------------------------------------------------------------------ */

function autoGenerate(db, storyIds) {
  const insertSeg = db.prepare(
    "INSERT INTO segments (story_id, segment_name, logic_description) VALUES (?, ?, ?)"
  );
  const insertNotif = db.prepare(
    "INSERT INTO notifications (segment_id, language, title, body, cta, image_prompt, image_path) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  const updateImgPath = db.prepare(
    "UPDATE notifications SET image_path = ? WHERE id = ?"
  );
  const getStory = db.prepare("SELECT * FROM stories WHERE id = ?");

  let totalSegs = 0;
  let totalNotifs = 0;
  const pendingImages = [];

  const run = db.transaction(() => {
    for (const sid of storyIds) {
      const story = getStory.get(sid);
      if (!story) continue;
      const result = generateForStory(story);
      for (const seg of result.segments) {
        const segInfo = insertSeg.run(story.id, seg.segment_name, seg.logic);
        totalSegs++;
        for (const notif of seg.notifications) {
          const notifInfo = insertNotif.run(
            segInfo.lastInsertRowid,
            notif.language, notif.title, notif.body, notif.cta, notif.image_prompt, null
          );
          totalNotifs++;
          pendingImages.push({
            notificationId: notifInfo.lastInsertRowid,
            title: notif.title,
            body: notif.body,
            cta: notif.cta,
            language: notif.language,
            segmentName: seg.segment_name,
            storyTitle: story.title,
            theme: story.theme,
          });
        }
      }
    }
  });

  run();

  // Generate images outside the transaction (I/O-heavy)
  let totalImages = 0;
  for (const img of pendingImages) {
    try {
      const imagePath = generateAndSave(img);
      updateImgPath.run(imagePath, img.notificationId);
      totalImages++;
    } catch (err) {
      console.error(`Image generation failed for notification ${img.notificationId}:`, err.message);
    }
  }
  console.log(`[AutoGen] Generated ${totalImages} notification images`);

  return { totalSegs, totalNotifs };
}

/* ------------------------------------------------------------------ */
/*  ROUTES                                                            */
/* ------------------------------------------------------------------ */

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    let csvText = req.file.buffer.toString("utf-8");
    if (csvText.charCodeAt(0) === 0xfeff) csvText = csvText.slice(1);

    const rawRows = [];
    let headers = [];
    const stream = Readable.from(csvText);

    await new Promise((resolve, reject) => {
      stream
        .pipe(csvParser())
        .on("headers", (h) => { headers = h; })
        .on("data", (row) => rawRows.push(row))
        .on("end", resolve)
        .on("error", reject);
    });

    if (rawRows.length === 0) {
      return res.status(400).json({ error: "CSV file is empty" });
    }

    const speakx = isSpeakxFormat(headers);
    console.log(`[Upload] Format: ${speakx ? "SpeakX" : "Simple"}, rows: ${rawRows.length}, headers:`, headers.slice(0, 10));

    const parsed = speakx
      ? parseSpeakxRows(rawRows)
      : parseSimpleRows(rawRows, headers);

    // Override batch name with filename if useful
    const filename = req.file.originalname || "upload.csv";
    const batchName = parsed.batchName || filename.replace(/\.csv$/i, "");

    console.log(`[Upload] Batch: "${batchName}", stories: ${parsed.stories.length}`);
    if (parsed.stories[0]) console.log("[Upload] First story:", parsed.stories[0]);

    const db = getDb();

    // Create batch
    const batchInfo = db.prepare(
      "INSERT INTO batches (name, filename, journey_id, description, story_count) VALUES (?, ?, ?, ?, ?)"
    ).run(batchName, filename, parsed.journeyId, parsed.journeyDesc, parsed.stories.length);
    const batchId = batchInfo.lastInsertRowid;

    // Insert stories
    const insertStory = db.prepare(`
      INSERT INTO stories (batch_id, story_id, title, theme, content, difficulty, lesson_number, key_learning)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const storyIds = [];
    const insertAll = db.transaction(() => {
      for (const s of parsed.stories) {
        const info = insertStory.run(
          batchId, s.story_id, s.title || "Untitled",
          s.theme, s.content, s.difficulty,
          parseInt(s.lesson_number || "0", 10) || null,
          s.key_learning
        );
        storyIds.push(info.lastInsertRowid);
      }
    });
    insertAll();

    // Auto-generate segments + notifications
    const gen = autoGenerate(db, storyIds);

    res.json({
      message: `${parsed.stories.length} stories created with ${gen.totalSegs} segments and ${gen.totalNotifs} notifications`,
      batch_id: batchId,
      batch_name: batchName,
      stories: parsed.stories.length,
      segments: gen.totalSegs,
      notifications: gen.totalNotifs,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Failed to process CSV: " + err.message });
  }
});

/* Batches */
router.get("/batches", (req, res) => {
  const db = getDb();
  const batches = db.prepare(`
    SELECT b.*,
      (SELECT COUNT(*) FROM segments seg JOIN stories s ON s.id = seg.story_id WHERE s.batch_id = b.id) as segments_count,
      (SELECT COUNT(*) FROM notifications n JOIN segments seg ON seg.id = n.segment_id JOIN stories s ON s.id = seg.story_id WHERE s.batch_id = b.id) as notifications_count
    FROM batches b ORDER BY b.created_at DESC
  `).all();
  res.json(batches);
});

router.delete("/batches/:id", (req, res) => {
  const db = getDb();
  const result = db.prepare("DELETE FROM batches WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Batch not found" });
  res.json({ message: "Batch deleted" });
});

/* Stories */
router.get("/", (req, res) => {
  const db = getDb();
  const { search, difficulty, batch_id } = req.query;

  let sql = `SELECT s.*, b.name as batch_name FROM stories s LEFT JOIN batches b ON b.id = s.batch_id`;
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push("(s.title LIKE ? OR s.theme LIKE ? OR s.content LIKE ?)");
    const term = `%${search}%`;
    params.push(term, term, term);
  }
  if (difficulty) {
    conditions.push("s.difficulty = ?");
    params.push(difficulty);
  }
  if (batch_id) {
    conditions.push("s.batch_id = ?");
    params.push(batch_id);
  }

  if (conditions.length > 0) sql += " WHERE " + conditions.join(" AND ");
  sql += " ORDER BY s.created_at DESC";

  const stories = db.prepare(sql).all(...params);
  const countSeg = db.prepare("SELECT COUNT(*) as c FROM segments WHERE story_id = ?");
  const enriched = stories.map((s) => ({
    ...s,
    segments_count: countSeg.get(s.id).c,
  }));

  res.json(enriched);
});

router.get("/:id", (req, res) => {
  const db = getDb();
  const story = db.prepare("SELECT * FROM stories WHERE id = ?").get(req.params.id);
  if (!story) return res.status(404).json({ error: "Story not found" });

  const segments = db.prepare("SELECT * FROM segments WHERE story_id = ?").all(story.id);
  const notifStmt = db.prepare("SELECT * FROM notifications WHERE segment_id = ?");
  const enrichedSegments = segments.map((seg) => ({
    ...seg,
    notifications: notifStmt.all(seg.id),
  }));

  res.json({ ...story, segments: enrichedSegments });
});

router.delete("/:id", (req, res) => {
  const db = getDb();
  const result = db.prepare("DELETE FROM stories WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Story not found" });
  res.json({ message: "Story deleted" });
});

router.post("/:id/generate", (req, res) => {
  const db = getDb();
  const story = db.prepare("SELECT * FROM stories WHERE id = ?").get(req.params.id);
  if (!story) return res.status(404).json({ error: "Story not found" });

  db.prepare("DELETE FROM segments WHERE story_id = ?").run(story.id);
  const gen = autoGenerate(db, [story.id]);
  res.json({ message: "Generated successfully", segments: gen.totalSegs });
});

export default router;
