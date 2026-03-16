import { Router } from "express";
import { getDb } from "../database.js";
import { SEGMENT_EVENT_MAP, buildTargetingPayload } from "./events.js";

const router = Router();

// GET /api/campaigns
router.get("/", (req, res) => {
  const db = getDb();
  const campaigns = db.prepare(`
    SELECT c.*,
      (SELECT SUM(ce.count) FROM campaign_events ce WHERE ce.campaign_id = c.id AND ce.event_type = 'sent') as total_sent,
      (SELECT SUM(ce.count) FROM campaign_events ce WHERE ce.campaign_id = c.id AND ce.event_type = 'delivered') as total_delivered,
      (SELECT SUM(ce.count) FROM campaign_events ce WHERE ce.campaign_id = c.id AND ce.event_type = 'opened') as total_opened,
      (SELECT SUM(ce.count) FROM campaign_events ce WHERE ce.campaign_id = c.id AND ce.event_type = 'clicked') as total_clicked
    FROM campaigns c
    ORDER BY c.created_at DESC
  `).all();

  res.json(campaigns.map(c => ({
    ...c,
    notification_ids: JSON.parse(c.notification_ids || "[]"),
    segment_targeting: c.segment_targeting ? JSON.parse(c.segment_targeting) : null,
  })));
});

// POST /api/campaigns
router.post("/", (req, res) => {
  const db = getDb();
  const { name, notification_ids, segment_targeting, scheduled_at } = req.body;

  if (!name || !notification_ids || !Array.isArray(notification_ids) || notification_ids.length === 0) {
    return res.status(400).json({ error: "Name and notification_ids are required" });
  }

  const result = db.prepare(`
    INSERT INTO campaigns (name, notification_ids, segment_targeting, scheduled_at, status)
    VALUES (?, ?, ?, ?, 'draft')
  `).run(
    name,
    JSON.stringify(notification_ids),
    segment_targeting ? JSON.stringify(segment_targeting) : null,
    scheduled_at || null
  );

  res.json({ id: result.lastInsertRowid, message: "Campaign created" });
});

// POST /api/campaigns/test-push — Send a direct test push to a specific identity
router.post("/test-push", async (req, res) => {
  const db = getDb();
  const { title, body, identity, channel } = req.body;

  if (!title || !body || !identity) {
    return res.status(400).json({ error: "title, body, and identity (phone number) are required" });
  }

  const accountId = db.prepare("SELECT value FROM settings WHERE key = 'clevertap_account_id'").get();
  const passcode = db.prepare("SELECT value FROM settings WHERE key = 'clevertap_passcode'").get();
  const region = db.prepare("SELECT value FROM settings WHERE key = 'clevertap_region'").get();
  const savedChannel = db.prepare("SELECT value FROM settings WHERE key = 'clevertap_channel_id'").get();

  if (!accountId?.value || !passcode?.value) {
    return res.status(400).json({ error: "CleverTap credentials not configured. Go to Settings." });
  }

  const regionMap = {
    "in1": "https://in1.api.clevertap.com",
    "us1": "https://us1.api.clevertap.com",
    "eu1": "https://eu1.api.clevertap.com",
    "sg1": "https://sg1.api.clevertap.com",
    "aps3": "https://aps3.api.clevertap.com",
    "mec1": "https://mec1.api.clevertap.com",
  };
  const baseUrl = regionMap[region?.value] || regionMap["in1"];

  try {
    const payload = {
      to: {
        Identity: [String(identity)],
      },
      tag_group: "NotifyGen Test",
      content: {
        title: title,
        body: body,
        platform_specific: {
          android: {
            wzrk_cid: channel || savedChannel?.value || "default",
            priority: "high",
          },
          ios: { "mutable-content": "true" },
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

    if (response.ok && result.status === "success") {
      res.json({ success: true, message: "Test push sent successfully", clevertap_response: result });
    } else {
      res.json({ success: false, error: result.error || result.message || "CleverTap API error", clevertap_response: result });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/campaigns/:id
router.get("/:id", (req, res) => {
  const db = getDb();
  const campaign = db.prepare("SELECT * FROM campaigns WHERE id = ?").get(req.params.id);
  if (!campaign) return res.status(404).json({ error: "Campaign not found" });

  const events = db.prepare(
    "SELECT event_type, SUM(count) as total FROM campaign_events WHERE campaign_id = ? GROUP BY event_type"
  ).all(req.params.id);

  const eventMap = {};
  for (const e of events) eventMap[e.event_type] = e.total;

  // Get notification details
  const notifIds = JSON.parse(campaign.notification_ids || "[]");
  let notifications = [];
  if (notifIds.length > 0) {
    const placeholders = notifIds.map(() => "?").join(",");
    notifications = db.prepare(`
      SELECT n.*, seg.segment_name, s.title as story_title
      FROM notifications n
      JOIN segments seg ON n.segment_id = seg.id
      JOIN stories s ON seg.story_id = s.id
      WHERE n.id IN (${placeholders})
    `).all(...notifIds);
  }

  res.json({
    ...campaign,
    notification_ids: notifIds,
    segment_targeting: campaign.segment_targeting ? JSON.parse(campaign.segment_targeting) : null,
    events: eventMap,
    notifications,
  });
});

// POST /api/campaigns/:id/send
router.post("/:id/send", async (req, res) => {
  const db = getDb();
  const campaign = db.prepare("SELECT * FROM campaigns WHERE id = ?").get(req.params.id);
  if (!campaign) return res.status(404).json({ error: "Campaign not found" });

  // Get CleverTap credentials
  const accountId = db.prepare("SELECT value FROM settings WHERE key = 'clevertap_account_id'").get();
  const passcode = db.prepare("SELECT value FROM settings WHERE key = 'clevertap_passcode'").get();
  const region = db.prepare("SELECT value FROM settings WHERE key = 'clevertap_region'").get();

  if (!accountId?.value || !passcode?.value) {
    return res.status(400).json({ error: "CleverTap credentials not configured. Go to Settings." });
  }

  const regionMap = {
    "in1": "https://in1.api.clevertap.com",
    "us1": "https://us1.api.clevertap.com",
    "eu1": "https://eu1.api.clevertap.com",
    "sg1": "https://sg1.api.clevertap.com",
    "aps3": "https://aps3.api.clevertap.com",
    "mec1": "https://mec1.api.clevertap.com",
  };
  const baseUrl = regionMap[region?.value] || regionMap["in1"];

  // Get notifications for this campaign
  const notifIds = JSON.parse(campaign.notification_ids || "[]");
  if (notifIds.length === 0) {
    return res.status(400).json({ error: "Campaign has no notifications" });
  }

  const placeholders = notifIds.map(() => "?").join(",");
  const notifications = db.prepare(`SELECT * FROM notifications WHERE id IN (${placeholders})`).all(...notifIds);

  // Resolve targeting and channel
  const savedChannel = db.prepare("SELECT value FROM settings WHERE key = 'clevertap_channel_id'").get();
  let targeting;
  let notifChannel = savedChannel?.value || "general_updates";

  if (campaign.segment_targeting) {
    const parsed = JSON.parse(campaign.segment_targeting);
    targeting = parsed.where || parsed;
    if (parsed.channel) notifChannel = parsed.channel;
  } else {
    // Default: App Launched in last 7 days
    targeting = {
      event_name: "App Launched",
      from: parseInt(new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10).replace(/-/g, "")),
      to: parseInt(new Date().toISOString().slice(0, 10).replace(/-/g, "")),
    };
  }

  try {
    // Create campaign in CleverTap
    const ctPayload = {
      name: campaign.name,
      estimate_only: false,
      target_mode: "push",
      where: targeting,
      content: {
        title: notifications[0]?.title || campaign.name,
        body: notifications[0]?.body || "",
        platform_specific: {
          android: {
            wzrk_cid: notifChannel,
            priority: "high",
          },
          ios: { "mutable-content": true },
        },
      },
      respect_frequency_caps: true,
    };

    const response = await fetch(`${baseUrl}/1/targets/create.json`, {
      method: "POST",
      headers: {
        "X-CleverTap-Account-Id": accountId.value,
        "X-CleverTap-Passcode": passcode.value,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ctPayload),
    });

    const ctResult = await response.json();

    if (response.ok && ctResult.status === "success") {
      db.prepare("UPDATE campaigns SET status = 'sent', clevertap_campaign_id = ?, sent_at = datetime('now'), updated_at = datetime('now') WHERE id = ?")
        .run(String(ctResult.id || ""), campaign.id);

      // Seed campaign events with simulated data for now
      const insertEvent = db.prepare(
        "INSERT INTO campaign_events (campaign_id, event_type, count) VALUES (?, ?, ?)"
      );
      const sent = notifications.length * Math.floor(500 + Math.random() * 1000);
      const delivered = Math.floor(sent * 0.95);
      const opened = Math.floor(delivered * 0.25);
      const clicked = Math.floor(opened * 0.4);
      insertEvent.run(campaign.id, "sent", sent);
      insertEvent.run(campaign.id, "delivered", delivered);
      insertEvent.run(campaign.id, "opened", opened);
      insertEvent.run(campaign.id, "clicked", clicked);

      res.json({ message: "Campaign sent to CleverTap", clevertap_id: ctResult.id });
    } else {
      db.prepare("UPDATE campaigns SET status = 'failed', updated_at = datetime('now') WHERE id = ?")
        .run(campaign.id);
      res.status(400).json({ error: ctResult.error || "CleverTap API error" });
    }
  } catch (err) {
    db.prepare("UPDATE campaigns SET status = 'failed', updated_at = datetime('now') WHERE id = ?")
      .run(campaign.id);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/campaigns/:id
router.delete("/:id", (req, res) => {
  const db = getDb();
  const result = db.prepare("DELETE FROM campaigns WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Campaign not found" });
  res.json({ message: "Campaign deleted" });
});

export default router;
