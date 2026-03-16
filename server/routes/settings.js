import { Router } from "express";
import { getDb } from "../database.js";

const router = Router();

// GET /api/settings
router.get("/", (req, res) => {
  const db = getDb();
  const rows = db.prepare("SELECT key, value, updated_at FROM settings").all();
  const settings = {};
  for (const row of rows) {
    // Mask sensitive values
    if (row.key === "clevertap_passcode" && row.value) {
      settings[row.key] = { value: "***" + row.value.slice(-4), updated_at: row.updated_at };
    } else {
      settings[row.key] = { value: row.value, updated_at: row.updated_at };
    }
  }
  res.json(settings);
});

// PUT /api/settings
router.put("/", (req, res) => {
  const db = getDb();
  const upsert = db.prepare(
    "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')"
  );

  const updates = db.transaction(() => {
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof key === "string" && typeof value === "string") {
        upsert.run(key, value);
      }
    }
  });

  updates();
  res.json({ message: "Settings saved" });
});

// GET /api/settings/test-connection
router.get("/test-connection", async (req, res) => {
  const db = getDb();
  const accountId = db.prepare("SELECT value FROM settings WHERE key = 'clevertap_account_id'").get();
  const passcode = db.prepare("SELECT value FROM settings WHERE key = 'clevertap_passcode'").get();
  const region = db.prepare("SELECT value FROM settings WHERE key = 'clevertap_region'").get();

  if (!accountId?.value || !passcode?.value) {
    return res.status(400).json({ connected: false, error: "CleverTap credentials not configured" });
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
    const response = await fetch(`${baseUrl}/1/targets/list.json`, {
      method: "POST",
      headers: {
        "X-CleverTap-Account-Id": accountId.value,
        "X-CleverTap-Passcode": passcode.value,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: 20260301, to: 20260316 }),
    });

    if (response.ok) {
      res.json({ connected: true, message: "Successfully connected to CleverTap" });
    } else {
      const err = await response.json().catch(() => ({}));
      res.json({ connected: false, error: err.error || `HTTP ${response.status}` });
    }
  } catch (err) {
    res.json({ connected: false, error: err.message });
  }
});

export default router;
