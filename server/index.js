import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import storiesRouter from "./routes/stories.js";
import segmentsRouter from "./routes/segments.js";
import notificationsRouter from "./routes/notifications.js";
import exportRouter from "./routes/export.js";
import analyticsRouter from "./routes/analytics.js";
import settingsRouter from "./routes/settings.js";
import campaignsRouter from "./routes/campaigns.js";
import eventsRouter from "./routes/events.js";
import webhooksRouter from "./routes/webhooks.js";
import { getDb } from "./database.js";
import { generateForStory } from "./services/ai-generator.js";
import { startScheduler } from "./services/scheduler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize database
getDb();

// Serve generated notification images
app.use("/static", express.static(join(__dirname, "static")));

// API routes
app.use("/api/stories", storiesRouter);
app.use("/api/segments", segmentsRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/export", exportRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/campaigns", campaignsRouter);
app.use("/api/events", eventsRouter);
app.use("/api/webhooks", webhooksRouter);

// Health check
app.get("/api/health", (req, res) => {
  const db = getDb();
  const stories = db.prepare("SELECT COUNT(*) as c FROM stories").get().c;
  const segments = db.prepare("SELECT COUNT(*) as c FROM segments").get().c;
  const notifications = db.prepare("SELECT COUNT(*) as c FROM notifications").get().c;
  const batches = db.prepare("SELECT COUNT(*) as c FROM batches").get().c;
  res.json({ status: "ok", counts: { stories, segments, notifications, batches } });
});

// Bulk generate for all stories without segments
app.post("/api/generate-all", (req, res) => {
  const db = getDb();

  const stories = db
    .prepare(
      `SELECT s.* FROM stories s
       WHERE s.id NOT IN (SELECT DISTINCT story_id FROM segments)`
    )
    .all();

  if (stories.length === 0) {
    return res.json({ message: "All stories already have segments", generated: 0 });
  }

  const insertSeg = db.prepare(
    "INSERT INTO segments (story_id, segment_name, logic_description) VALUES (?, ?, ?)"
  );
  const insertNotif = db.prepare(
    "INSERT INTO notifications (segment_id, language, title, body, cta, image_prompt) VALUES (?, ?, ?, ?, ?, ?)"
  );

  let totalSegments = 0;

  const bulkGenerate = db.transaction(() => {
    for (const story of stories) {
      const result = generateForStory(story);
      for (const seg of result.segments) {
        const segInfo = insertSeg.run(story.id, seg.segment_name, seg.logic);
        totalSegments++;
        for (const notif of seg.notifications) {
          insertNotif.run(
            segInfo.lastInsertRowid, notif.language,
            notif.title, notif.body, notif.cta, notif.image_prompt
          );
        }
      }
    }
  });

  bulkGenerate();
  res.json({ message: `Generated for ${stories.length} stories`, stories: stories.length, segments: totalSegments });
});

// Serve demo page and public assets
app.use(express.static(join(__dirname, "public")));
app.get("/demo", (req, res) => {
  res.sendFile(join(__dirname, "public", "demo.html"));
});

// Serve built client in production
const clientDist = join(__dirname, "..", "client", "dist");
app.use(express.static(clientDist));
app.get("*", (req, res) => {
  if (!req.path.startsWith("/api")) {
    res.sendFile(join(clientDist, "index.html"));
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  // Start the automation scheduler
  startScheduler();
});
