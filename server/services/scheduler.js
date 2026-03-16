/**
 * SCHEDULER — Cron jobs for the automation engine
 *
 * 1. Every minute: check for pending notifications whose send_at has passed
 * 2. Every day at 7 AM: run daily morning check for all users
 */

import cron from "node-cron";
import { processPendingNotifications, dailyMorningCheck } from "./automation-engine.js";

let minuteCron = null;
let dailyCron = null;

/**
 * Start all cron jobs.
 */
function startScheduler() {
  // Every minute — process pending notifications
  minuteCron = cron.schedule("* * * * *", async () => {
    try {
      const count = await processPendingNotifications();
      if (count > 0) {
        console.log(`[Scheduler] Processed ${count} pending notification(s)`);
      }
    } catch (err) {
      console.error("[Scheduler] Error processing pending:", err.message);
    }
  });

  // Daily at 7:00 AM IST — morning check for all users
  dailyCron = cron.schedule("0 7 * * *", async () => {
    try {
      console.log("[Scheduler] Running daily morning check...");
      const result = await dailyMorningCheck();
      console.log(`[Scheduler] Morning check: ${result.users_checked} users, ${result.notifications_scheduled} scheduled`);
    } catch (err) {
      console.error("[Scheduler] Error in daily check:", err.message);
    }
  }, {
    timezone: "Asia/Kolkata",
  });

  console.log("[Scheduler] Started — checking pending every minute, daily check at 7 AM IST");
}

/**
 * Stop all cron jobs.
 */
function stopScheduler() {
  if (minuteCron) {
    minuteCron.stop();
    minuteCron = null;
  }
  if (dailyCron) {
    dailyCron.stop();
    dailyCron = null;
  }
  console.log("[Scheduler] Stopped");
}

export { startScheduler, stopScheduler };
