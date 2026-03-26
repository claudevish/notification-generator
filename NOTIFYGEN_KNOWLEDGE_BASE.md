# NotifyGen Knowledge Base — Complete Implementation Guide

> **Version:** 1.0
> **Last updated:** March 2026
> **Purpose:** A self-contained guide to implement the NotifyGen notification trigger system on any existing dashboard with CleverTap integration.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Notification Trigger Logic](#2-notification-trigger-logic)
3. [Notification Templates](#3-notification-templates)
4. [Dynamic Content Resolution](#4-dynamic-content-resolution)
5. [DND Implementation](#5-dnd-do-not-disturb-implementation)
6. [Drop Priority System](#6-drop-priority-system)
7. [Database Schema](#7-database-schema)
8. [API Endpoints Reference](#8-api-endpoints-reference)
9. [CleverTap Integration](#9-clevertap-integration)
10. [Click Tracking System](#10-click-tracking-system)
11. [Scheduler (Cron Jobs)](#11-scheduler-cron-jobs)
12. [Environment Variables](#12-environment-variables)
13. [Deployment Checklist](#13-deployment-checklist)
14. [Testing Guide](#14-testing-guide)
15. [Known Issues and Fixes](#15-known-issues-and-fixes)

---

## 1. System Overview

### What NotifyGen Does

NotifyGen is a server-side notification automation engine that schedules and delivers personalized push notifications to users based on their journey stage. When a user pays for a trial subscription, NotifyGen calculates up to 6 time-staggered notifications for that day (Day 0), resolves dynamic content (username, word of the day, story cliffhangers, progress data), respects Do Not Disturb hours, and delivers each notification via the CleverTap push API.

Beyond Day 0, a daily cron job checks all active users and triggers inaction-based notifications for users who have gone inactive (3-day, 7-day, 14-day thresholds).

### Architecture Diagram

```
                        CleverTap Journey
                              |
                    (webhook on payment_success)
                              |
                              v
                   +---------------------+
                   |   /api/webhooks/    |
                   |   clevertap         |
                   +---------------------+
                              |
                              v
                   +---------------------+
                   |  Automation Engine  |
                   |  (automation-       |
                   |   engine.js)        |
                   +---------------------+
                      |             |
           immediate  |             |  deferred
           (slot 1)   |             |  (slots 2-6)
                      v             v
              +----------+   +-----------------+
              | sendPush |   | scheduled_      |
              | (CleverTap|   | notifications   |
              |  API)    |   | table (SQLite)  |
              +----------+   +-----------------+
                                    |
                                    v
                          +------------------+
                          |   Cron Job       |
                          |  (every minute)  |
                          +------------------+
                                    |
                              (when send_at <= now)
                                    |
                                    v
                              +----------+
                              | sendPush |
                              +----------+
                                    |
                                    v
                              +-----------+
                              | sent_log  |
                              | table     |
                              +-----------+
```

### Tech Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Node.js (ES modules) |
| Framework | Express.js |
| Database | SQLite via better-sqlite3 |
| Cron | node-cron |
| Push delivery | CleverTap Server API |
| Hosting | Railway (or any Node host) |
| Image hosting | GitHub raw (public repo) |

### How It Fits with CleverTap

CleverTap acts as two things:

1. **Event source** — A CleverTap Journey fires a webhook to NotifyGen when a user triggers the `payment_success` event. CleverTap sends a `profiles` array with the user's identity, name, email, and phone.

2. **Push delivery channel** — NotifyGen calls CleverTap's `/1/send/push.json` API to actually deliver the push notification to the user's device. CleverTap handles token management, platform routing (Android/iOS), and delivery.

NotifyGen sits between these two roles: it receives the event, decides *what* to send and *when*, then tells CleverTap to send it.

---

## 2. Notification Trigger Logic

### Day 0 Flow (Payment Day)

When a user pays for a trial subscription, the following sequence occurs:

```
User pays
   |
   v
CleverTap fires payment_success event
   |
   v
CleverTap Journey sends webhook to POST /api/webhooks/clevertap
   |
   v
processUserEvent() called with event="payment_success"
   |
   +--> Create or update user_journeys record
   |    (set payment_time, current_day=0, story defaults)
   |
   +--> handlePaymentSuccess() called
        |
        +--> calculateDay0Schedule(paymentTime)
        |    Returns 1-6 notifications based on time available before DND
        |
        +--> Clear any existing pending Day 0 notifications for this user
        |
        +--> Insert all scheduled notifications into scheduled_notifications table
        |
        +--> Send Slot 1 (Trial Payment) immediately via sendPush()
        |
        +--> Remaining slots wait in DB for the cron processor
```

### All 6 Notification Slots

| Slot | Name | Delay from Payment | Drop Priority | When It Fires |
|------|------|-------------------|---------------|---------------|
| 1 | Trial Payment | Immediate (0 min) | 1 (never drop) | Instantly on payment |
| 2 | Onboarding Nudge | +30 minutes | 2 (never drop) | 30 min after payment |
| 3 | Word of the Day | +150 minutes (2.5 hrs) | 4 | 2.5 hrs after payment |
| 4 | Cliffhanger | +300 minutes (5 hrs) | 5 | 5 hrs after payment |
| 5 | Social Proof | +480 minutes (8 hrs) | 6 (first to drop) | 8 hrs after payment |
| 6 | Progress Report | 30 min before DND | 3 | 10:30 PM IST |

### Timing Rules

The schedule calculator (`calculateDay0Schedule`) works as follows:

1. Calculate DND start time: 11:00 PM IST on the payment day
2. If payment is after DND start, only Slot 1 (immediate) fires
3. Calculate available minutes = DND start - payment time
4. Sort all 6 templates by drop_priority (ascending = most important first)
5. For each template, calculate its send time:
   - `delay_minutes = 0` means immediate (same as payment time)
   - `delay_minutes = -1` means 30 minutes before DND (10:30 PM IST)
   - All others: payment time + delay_minutes
6. Skip if send time falls within/after DND window
7. Skip if send time is within 20 minutes of an already-scheduled notification
8. Sort the final schedule by send time ascending

### Timing Examples

**Payment at 10:00 AM IST** — 13 hours before DND, all 6 fit:

| Slot | Fires At | Status |
|------|----------|--------|
| 1 - Trial Payment | 10:00 AM | Sends |
| 2 - Onboarding Nudge | 10:30 AM | Sends |
| 3 - Word of the Day | 12:30 PM | Sends |
| 4 - Cliffhanger | 3:00 PM | Sends |
| 5 - Social Proof | 6:00 PM | Sends |
| 6 - Progress Report | 10:30 PM | Sends |

**Payment at 6:00 PM IST** — 5 hours before DND:

| Slot | Would Fire At | Status |
|------|--------------|--------|
| 1 - Trial Payment | 6:00 PM | Sends (priority 1) |
| 2 - Onboarding Nudge | 6:30 PM | Sends (priority 2) |
| 6 - Progress Report | 10:30 PM | Sends (priority 3) |
| 3 - Word of the Day | 8:30 PM | Sends (priority 4) |
| 4 - Cliffhanger | 11:00 PM | DROPPED (hits DND) |
| 5 - Social Proof | 2:00 AM | DROPPED (hits DND) |

**Payment at 10:00 PM IST** — 1 hour before DND:

| Slot | Would Fire At | Status |
|------|--------------|--------|
| 1 - Trial Payment | 10:00 PM | Sends |
| 2 - Onboarding Nudge | 10:30 PM | Sends (within 20-min gap of Progress Report, but priority 2 wins) |
| 6 - Progress Report | 10:30 PM | May be skipped due to gap conflict |
| All others | After 11 PM | DROPPED |

**Payment at 11:30 PM IST** — after DND start:

| Slot | Status |
|------|--------|
| 1 - Trial Payment | Sends (immediate, always fires) |
| All others | DROPPED (payment is after DND start) |

### MIN_GAP_MINUTES

There is a 20-minute minimum gap between any two notifications. If a notification's calculated send time is within 20 minutes of an already-scheduled one, and it is not the immediate (slot 1) notification, it gets skipped. This prevents users from feeling spammed.

---

## 3. Notification Templates

### Slot 1 — Trial Payment (Welcome)

| Field | Value |
|-------|-------|
| Segment | Trial Payment |
| Delay | Immediate (0 min) |
| Drop Priority | 1 (never drops) |
| Title | `Welcome to SpeakX Premium! 🎉` |
| Body | `Congrats {{username}}! Your 7-day premium journey starts now. Let's make every day count!` |
| Image | `https://raw.githubusercontent.com/claudevish/notification-generator/notification-images/public-images/journey/trial_payment.png` |
| Variants | None |

This notification always sends, even if payment happens at 11:30 PM.

### Slot 2 — Onboarding Nudge

| Field | Value |
|-------|-------|
| Segment | New Users |
| Delay | +30 minutes |
| Drop Priority | 2 (never drops if time allows) |
| Title | `Your First Story Awaits 📖` |
| Body | `{{username}}, meet Ravi — a quiet boy who's never spoken up in class. Today that changes. Tap to begin!` |
| Image | `https://raw.githubusercontent.com/claudevish/notification-generator/notification-images/public-images/journey/onboarding_story.png` |
| Variants | None |

Drops only if payment time + 30 min exceeds DND start.

### Slot 3 — Word of the Day

| Field | Value |
|-------|-------|
| Segment | New Users |
| Delay | +150 minutes (2.5 hours) |
| Drop Priority | 4 |
| Title | `📚 Word of the Day` |
| Body (template) | `Hey {{username}}! Today's word: {{word}} — {{word_meaning}}. "{{word_example}}" Tap to learn more!` |
| Image | `https://raw.githubusercontent.com/claudevish/notification-generator/notification-images/public-images/journey/badge_earned.png` |
| Variants | Content is dynamically resolved from the Word of the Day library based on `story_name` + `journey_day` |

Example resolved body: "Hey Rahul! Today's word: Shy — feeling nervous around other people. 'Ravi was too shy to raise his hand in class.' Tap to learn more!"

### Slot 4 — Cliffhanger

| Field | Value |
|-------|-------|
| Segment | In Progress |
| Delay | +300 minutes (5 hours) |
| Drop Priority | 5 |
| Image | `https://raw.githubusercontent.com/claudevish/notification-generator/notification-images/public-images/journey/pre_renewal.png` |

**Title variants** (based on lesson progress):

| User State | Title |
|------------|-------|
| Not started any lesson | `{{username}}, Ravi Has a Secret 😱` |
| Started but not completed | `{{username}}, Don't Leave Ravi Hanging! 😱` |
| Completed at least 1 lesson | `{{username}}, You Won't Believe What Happens Next! 📖` |

**Body variants:**

| User State | Body |
|------------|------|
| Not started | `{{cliffhanger_text}} Ravi's story has a twist you won't expect. Tap to start "{{story_name}}"!` |
| Started | `{{cliffhanger_text}} You stopped at the best part! Tap to continue "{{story_name}}"` |
| Completed | `{{cliffhanger_text}} Tap to continue "{{story_name}}"!` |

The `{{cliffhanger_text}}` placeholder resolves from the Cliffhanger library based on the user's current story and lesson progress.

### Slot 5 — Social Proof

| Field | Value |
|-------|-------|
| Segment | 3-Day Inactive |
| Delay | +480 minutes (8 hours) |
| Drop Priority | 6 (first to be dropped) |
| Image | `https://raw.githubusercontent.com/claudevish/notification-generator/notification-images/public-images/journey/rank_climber.png` |

**Title variants:**

| User State | Title |
|------------|-------|
| Not started | `{{username}}, Don't Miss Out! 🔥` |
| Completed lessons | `You're Ahead, {{username}}! 🏆` |

**Body variants:**

| User State | Body |
|------------|------|
| Not started | `70% of new users completed their first lesson on Day 1. Your story is waiting — just 3 minutes to start!` |
| Completed | `You're ahead of 70% of new users today! One more lesson to lock in your streak?` |

### Slot 6 — Progress Report

| Field | Value |
|-------|-------|
| Segment | In Progress |
| Delay | 30 minutes before DND (10:30 PM IST) |
| Drop Priority | 3 |
| Title | `Hey {{username}}, your Progress Report is out! 📊` |

**Body variants:**

| User State | Body | Image |
|------------|------|-------|
| Active (lessons > 0) | `🏅 Ahead of 70% of new users!`<br>`📖 Lessons: {{lesson_count}} completed`<br>`⏱️ Time: {{time_spent}} min`<br>`See you tomorrow!` | `streak.png` |
| Inactive (0 lessons) | `Your first lesson takes just 3 min!`<br>`✅ Premium: Activated`<br>`📖 Lessons: 0 completed`<br>`Tomorrow is a fresh start 💪` | `at_risk.png` |

Image URLs:
- Active: `https://raw.githubusercontent.com/claudevish/notification-generator/notification-images/public-images/journey/streak.png`
- Inactive: `https://raw.githubusercontent.com/claudevish/notification-generator/notification-images/public-images/journey/at_risk.png`

Time spent is calculated as `lessons_completed * 4` minutes.

---

## 4. Dynamic Content Resolution

All content resolution happens in the `resolveNotificationContent()` function at the moment a notification is about to be sent (not when it is scheduled). This means the content reflects the user's latest state.

### Username Resolution

The `{{username}}` placeholder is resolved from the user journey record:
- If the user has a `username` field set (from the webhook's `Name` or `username` property), use that
- Fallback: the literal string `"there"` (e.g., "Congrats there!")

The username is set during the first webhook call and updated if subsequent events include a `username` property.

### Word of the Day

**Resolution logic:** `story_name` + `journey_day` maps to a specific word object.

**Library structure:**
- 14 stories, each with 7 words (one per day of the trial)
- Total: 98 word entries
- Each entry has: `word`, `meaning`, `example`

**Stories in the library:**

The Quiet Boy, New City New Start, Moving Ahead, Love and Big Decisions, The Hidden Talent, Friends and Fights, The Big Interview, A Second Chance, Lost and Found, The Unexpected Journey, Standing Up, Dreams and Reality, The Last Chance, Breaking Free

**Resolution flow:**

```
story_name (e.g., "The Quiet Boy")
    |
    v
Look up WORD_OF_THE_DAY["The Quiet Boy"]
    |
    v
Get array of 7 word objects
    |
    v
Use journey_day as index (clamped to array bounds)
    |
    v
Returns { word: "Shy", meaning: "feeling nervous around other people",
          example: "Ravi was too shy to raise his hand in class." }
```

**Example:** User assigned to "The Quiet Boy", Day 0:
- Word: **Shy**
- Meaning: feeling nervous around other people
- Example: "Ravi was too shy to raise his hand in class."

**Fallback:** If the story name is not found in the library, defaults to "The Quiet Boy". If the day index exceeds the array, the last word is used.

### Cliffhanger

**Resolution logic:** `story_name` + `lessons_completed` maps to a specific cliffhanger.

**Library structure:**
- 14 stories, each with 6 cliffhangers (one per lesson)
- Total: 84 cliffhanger entries
- Each entry has: `teaser` (the cliffhanger text) and `hook` (a short label)

**Resolution flow:**

```
story_name (e.g., "The Quiet Boy")
    |
    v
Look up CLIFFHANGERS["The Quiet Boy"]
    |
    v
Get array of 6 cliffhanger objects
    |
    v
Use lessons_completed as index (clamped to array bounds)
    |
    v
Returns { teaser: "Ravi opened his mouth to speak, but no words came out...",
          hook: "Will Ravi find his voice?" }
```

**Three variant paths for the Cliffhanger notification (Slot 4):**

| Condition | Variant Used | Behavior |
|-----------|-------------|----------|
| `lessons_completed == 0` and `lesson_started == false` | `not_started` | Encourages user to begin the story |
| `lessons_completed == 0` and `lesson_started == true` | `started` | User started but did not finish a lesson |
| `lessons_completed > 0` | `completed` | User has finished lessons, teases what comes next |

**Example for "The Quiet Boy", 0 lessons completed, not started:**
- Title: "Rahul, Ravi Has a Secret 😱"
- Body: "Ravi opened his mouth to speak, but no words came out... Ravi's story has a twist you won't expect. Tap to start 'The Quiet Boy'!"

**Fallback:** If story not found, uses "The Quiet Boy". If lesson index exceeds array, uses the last cliffhanger. If no cliffhanger data at all, falls back to "Something incredible is about to happen..."

### Progress Report

The Progress Report (Slot 6) adapts based on whether the user has completed any lessons:

| Condition | Content Path |
|-----------|-------------|
| `lessons_completed > 0` | Shows lesson count, time spent, "ahead of 70%" message, uses streak image |
| `lessons_completed == 0` | Shows "your first lesson takes just 3 min", uses at_risk image |

Time spent formula: `lessons_completed * 4` (assumes ~4 minutes per lesson).

---

## 5. DND (Do Not Disturb) Implementation

### DND Window

- **Start:** 11:00 PM IST (23:00)
- **End:** 7:00 AM IST (07:00)
- No notifications are scheduled or sent during this window

### IST Conversion Formula

Since servers typically run in UTC, the system must convert to IST for DND checks. The conversion is critical:

```
IST = UTC + 5 hours 30 minutes
IST_OFFSET_MS = 5.5 * 60 * 60 * 1000 = 19,800,000 ms
```

**To check if a given UTC time falls in DND:**
1. Add the IST offset to get the IST equivalent
2. Extract the hour component
3. If hour >= 23 OR hour < 7, DND is active

**To calculate DND start for a given payment day:**
1. Convert payment time to IST
2. Get the IST calendar date (year, month, day)
3. Set time to 23:00:00 on that IST date
4. Convert back to UTC by subtracting the IST offset

### No Carryover Rule

Each day's notifications are self-contained. If notifications are dropped due to DND on Day 0, they are not rescheduled for Day 1. The daily morning cron job handles Day 1+ logic separately with different notification types.

### DND Check in the Cron Processor

When the every-minute cron picks up a pending notification:
1. It calls `isDNDActive(send_at)` on the notification's scheduled time
2. If DND is active, the notification status is set to `skipped_dnd`
3. The notification is never retried

This is a safety net. Normally, `calculateDay0Schedule()` prevents scheduling anything during DND in the first place. The cron DND check catches edge cases (e.g., a manually inserted notification or timezone drift).

---

## 6. Drop Priority System

### Priority Table

| Drop Priority | Slot | Name | Behavior |
|--------------|------|------|----------|
| 1 | 1 | Trial Payment | Never drops (immediate) |
| 2 | 2 | Onboarding Nudge | Drops only if payment is < 30 min before DND |
| 3 | 6 | Progress Report | Keeps if there are >= 3 available slots |
| 4 | 3 | Word of the Day | Drops when time is limited |
| 5 | 4 | Cliffhanger | Drops before Social Proof only because of higher delay |
| 6 | 5 | Social Proof | First to be dropped (lowest importance) |

### Algorithm

1. Sort all 6 templates by `drop_priority` ascending (most important first)
2. Iterate through sorted list
3. For each template, calculate its send time
4. If send time is at or after DND start, skip it
5. If send time is within 20 minutes of an already-accepted notification (and it is not the immediate notification), skip it
6. Otherwise, add it to the schedule
7. After iteration, sort the final schedule by send time

The key insight: by processing in priority order, high-priority notifications claim their time slots first. Lower-priority ones are more likely to conflict or fall outside the window.

### Walk-Through: Payment at 9:00 PM IST

Available window: 9:00 PM to 11:00 PM = 120 minutes.

Processing in priority order:

| Priority | Slot | Name | Calculated Time | Result |
|----------|------|------|----------------|--------|
| 1 | 1 | Trial Payment | 9:00 PM (immediate) | ACCEPTED |
| 2 | 2 | Onboarding Nudge | 9:30 PM (+30 min) | ACCEPTED (30 min gap from slot 1) |
| 3 | 6 | Progress Report | 10:30 PM (-30 min from DND) | ACCEPTED (60 min gap from slot 2) |
| 4 | 3 | Word of the Day | 11:30 PM (+150 min) | DROPPED (after DND start) |
| 5 | 4 | Cliffhanger | 2:00 AM (+300 min) | DROPPED (after DND start) |
| 6 | 5 | Social Proof | 5:00 AM (+480 min) | DROPPED (after DND start) |

Result: 3 notifications sent at 9:00 PM, 9:30 PM, and 10:30 PM.

---

## 7. Database Schema

NotifyGen uses SQLite with WAL mode and foreign keys enabled. Tables are auto-created on first database access.

### user_journeys

Tracks each user's lifecycle state. Primary key is the user's identity (typically phone number).

| Column | Type | Purpose |
|--------|------|---------|
| identity | TEXT (PK) | User identifier (phone number or CleverTap identity) |
| username | TEXT | Display name for personalization |
| first_event | TEXT | The first event that created this record |
| payment_time | DATETIME | When the user paid (triggers Day 0) |
| current_day | INTEGER | Days since payment (0, 1, 2...) |
| lesson_started | INTEGER | 0 or 1 — has user started any lesson |
| lessons_completed | INTEGER | Count of completed lessons |
| onboarding_completed | INTEGER | 0 or 1 — has user completed onboarding |
| story_name | TEXT | Currently assigned story (default: "The Quiet Boy") |
| cliffhanger_text | TEXT | Override cliffhanger text from event properties |
| last_event | TEXT | Most recent event name received |
| last_event_at | DATETIME | Timestamp of most recent event |
| created_at | DATETIME | Record creation time |
| updated_at | DATETIME | Last update time |

### scheduled_notifications

Queue of notifications waiting to be sent. The cron job processes rows where `status = 'pending'` and `send_at <= now`.

| Column | Type | Purpose |
|--------|------|---------|
| id | INTEGER (PK) | Auto-increment ID |
| identity | TEXT | User identifier |
| journey_day | INTEGER | Which day of the journey (0 for Day 0) |
| slot | INTEGER | Notification slot number (1-6) |
| notification_name | TEXT | Human-readable name (e.g., "Trial Payment") |
| segment | TEXT | Target segment name |
| send_at | DATETIME | Scheduled send time (UTC) |
| status | TEXT | One of: pending, sent, failed, skipped_dnd, cancelled |
| sent_title | TEXT | Actual title sent (populated after send) |
| sent_body | TEXT | Actual body sent (populated after send) |
| created_at | DATETIME | When the row was inserted |
| updated_at | DATETIME | Last status change |

Indexes: `identity`, `(status, send_at)`

### sent_log

Immutable log of every notification delivery attempt.

| Column | Type | Purpose |
|--------|------|---------|
| id | INTEGER (PK) | Auto-increment ID |
| identity | TEXT | User identifier |
| journey_day | INTEGER | Journey day when sent |
| slot | INTEGER | Notification slot number |
| notification_name | TEXT | Notification name |
| title | TEXT | Resolved title that was sent |
| body | TEXT | Resolved body that was sent |
| image_url | TEXT | Image URL included in the push |
| status | TEXT | "delivered" or "failed" |
| clevertap_response | TEXT | Raw JSON response from CleverTap API |
| sent_at | DATETIME | When the push was sent |

Indexes: `identity`, `sent_at`

### notification_tracking

Records user interactions (clicks, app opens) triggered by notifications.

| Column | Type | Purpose |
|--------|------|---------|
| id | INTEGER (PK) | Auto-increment ID |
| identity | TEXT | User identifier |
| journey_day | INTEGER | Journey day |
| slot | INTEGER | Which notification slot was clicked |
| notification_name | TEXT | Notification name |
| event_type | TEXT | "click" or "app_open" |
| tracked_at | DATETIME | When the interaction was recorded |

Indexes: `identity`, `event_type`

### Other Tables

The database also contains tables for the broader NotifyGen content management system (batches, stories, segments, notifications, settings, campaigns, campaign_events, notification_events). These are used by the dashboard UI for content creation and are not part of the automation engine flow.

The `settings` table stores CleverTap credentials as a fallback when environment variables are not set:

| Key | Value |
|-----|-------|
| clevertap_account_id | Your CleverTap account ID |
| clevertap_passcode | Your CleverTap passcode |
| clevertap_region | Region code (e.g., "in1") |

---

## 8. API Endpoints Reference

All endpoints are prefixed with `/api/webhooks`.

### POST /api/webhooks/clevertap

**Purpose:** Main webhook endpoint. Receives events from CleverTap Journeys or direct calls.

**Accepts two formats:**

**Format A — Direct/Simulate:**
```json
{
  "event": "payment_success",
  "identity": "+919876543210",
  "timestamp": "2026-03-26T10:00:00Z",
  "properties": {
    "username": "Rahul",
    "story_name": "The Quiet Boy"
  }
}
```

**Format B — CleverTap Journey (profiles array):**
```json
{
  "profiles": [
    {
      "identity": "+919876543210",
      "Name": "Rahul Kumar",
      "phone": "+919876543210",
      "email": "rahul@example.com",
      "objectId": "ct_abc123"
    }
  ]
}
```

When Format B is received, the system treats it as a `payment_success` event for each profile.

**Response:**
```json
{
  "success": true,
  "message": "Processed 1 profile(s) from CleverTap Journey",
  "results": [
    {
      "identity": "+919876543210",
      "journey_day": 0,
      "scheduled": "Day 0 notifications scheduled"
    }
  ]
}
```

---

### POST /api/webhooks/simulate

**Purpose:** Manually trigger any event for a user without a real CleverTap webhook. Useful for testing.

**Request:**
```json
{
  "identity": "+919876543210",
  "event": "payment_success",
  "properties": { "username": "Rahul" },
  "timestamp": "2026-03-26T10:00:00Z"
}
```

**Response:** Returns journey state and calculated schedule (if payment event).

---

### POST /api/webhooks/test-day0

**Purpose:** Fire all Day 0 notifications immediately for a user (bypasses schedule). All 6 notifications send right now with a 2-second gap between each.

**Request:**
```json
{
  "identity": "+919876543210",
  "username": "Rahul",
  "story_name": "The Quiet Boy",
  "cliffhanger_text": "Ravi opened his mouth to speak...",
  "payment_time": "2026-03-26T10:00:00Z"
}
```

Only `identity` is required. All other fields are optional with sensible defaults.

**Response:** Returns each notification's slot, name, resolved title/body, image, and delivery status.

---

### POST /api/webhooks/test-realtime

**Purpose:** Schedule all 6 notifications at custom intervals (e.g., every 5 minutes) so you can watch them arrive via the cron processor.

**Request:**
```json
{
  "identity": "+919876543210",
  "username": "Rahul",
  "story_name": "The Quiet Boy",
  "interval_minutes": 5
}
```

**Response:** Returns the schedule with exact send times and minutes from now for each.

---

### POST /api/webhooks/preview-schedule

**Purpose:** See what the Day 0 schedule would look like for a given payment time without actually scheduling anything.

**Request:**
```json
{
  "payment_time": "2026-03-26T18:00:00+05:30"
}
```

**Response:** Returns total notifications, how many were dropped, and the schedule with times.

---

### POST /api/webhooks/process-pending

**Purpose:** Manually trigger the cron processor to process all pending notifications whose send_at has passed.

**Request:** Empty body.

**Response:** `{ "success": true, "processed": 3 }`

---

### POST /api/webhooks/daily-check

**Purpose:** Manually trigger the daily morning check (normally runs at 7 AM IST).

**Request:** Empty body.

**Response:** `{ "success": true, "users_checked": 15, "notifications_scheduled": 3 }`

---

### GET /api/webhooks/journey/:identity

**Purpose:** View a user's complete journey state, all scheduled notifications, and sent log.

**URL param:** `identity` (URL-encoded phone number)

**Response:**
```json
{
  "journey": { "identity": "+919876543210", "username": "Rahul", "current_day": 0, ... },
  "scheduled": [ { "slot": 1, "send_at": "...", "status": "sent" }, ... ],
  "sent_log": [ { "title": "Welcome to SpeakX Premium!", "status": "delivered", ... }, ... ]
}
```

---

### GET /api/webhooks/journeys

**Purpose:** List all user journeys with pending and sent counts.

---

### GET /api/webhooks/sent-log?limit=50

**Purpose:** View recent sent notifications across all users.

---

### GET /api/webhooks/track

**Purpose:** Notification click tracking endpoint (see Section 10).

---

### POST /api/webhooks/track-open

**Purpose:** Record an app open event for tracking.

**Request:** `{ "identity": "+919876543210", "source": "notification" }`

---

### GET /api/webhooks/tracking/:identity

**Purpose:** Get click and app open tracking data for a specific user, including click rate calculation.

---

## 9. CleverTap Integration

### Webhook Setup in CleverTap

Create a webhook template in CleverTap with these settings:

| Setting | Value |
|---------|-------|
| URL | `https://your-server.com/api/webhooks/clevertap` |
| Method | POST |
| Content-Type | application/json |
| Headers | None required (NotifyGen does not authenticate incoming webhooks) |

**What CleverTap sends (profiles format):**

CleverTap Journeys send a `profiles` array. Each profile object contains whatever user properties you have configured. NotifyGen uses these fields:

| CleverTap Field | NotifyGen Usage |
|-----------------|-----------------|
| identity | Primary user identifier |
| phone | Fallback identifier if identity is missing |
| objectId | Last-resort identifier |
| Name or name | Used as `username` for personalization |
| email | Stored but not currently used |

### Push Notification Delivery

NotifyGen sends push notifications by calling CleverTap's Server API.

**Endpoint:** `https://{region}.api.clevertap.com/1/send/push.json`

**Region mapping:**

| Region Code | API URL |
|-------------|---------|
| in1 | https://in1.api.clevertap.com |
| us1 | https://us1.api.clevertap.com |
| eu1 | https://eu1.api.clevertap.com |
| sg1 | https://sg1.api.clevertap.com |
| aps3 | https://aps3.api.clevertap.com |
| mec1 | https://mec1.api.clevertap.com |

**Required headers:**

| Header | Value |
|--------|-------|
| X-CleverTap-Account-Id | Your CleverTap account ID |
| X-CleverTap-Passcode | Your CleverTap passcode |
| Content-Type | application/json |

**Push payload structure:**

```json
{
  "to": {
    "Identity": ["+919876543210"]
  },
  "tag_group": "NotifyGen Automation",
  "content": {
    "title": "Welcome to SpeakX Premium! 🎉",
    "body": "Congrats Rahul! Your 7-day premium journey starts now.",
    "platform_specific": {
      "android": {
        "wzrk_cid": "general_updates",
        "priority": "high",
        "wzrk_bp": "https://...image-url...",
        "wzrk_dl": "https://your-server.com/api/webhooks/track?..."
      },
      "ios": {
        "mutable-content": "true",
        "media_url": "https://...image-url...",
        "media_dl": "true",
        "wzrk_dl": "https://your-server.com/api/webhooks/track?..."
      }
    }
  }
}
```

**Platform-specific fields explained:**

| Field | Platform | Purpose |
|-------|----------|---------|
| wzrk_cid | Android | Notification channel ID. Must be `general_updates`. If this channel does not exist on the user's device, the notification will be silently dropped on Android 8+. |
| priority | Android | Set to `"high"` for immediate delivery |
| wzrk_bp | Android | Big picture image URL (shown as expanded notification image) |
| wzrk_dl | Both | Deep link URL. When user taps the notification, this URL is opened. Used for click tracking. |
| mutable-content | iOS | Required for rich notifications (images) on iOS |
| media_url | iOS | Image URL for iOS rich notification |
| media_dl | iOS | Set to "true" to download the media |

### Journey Setup in CleverTap

1. Go to **Journeys** in CleverTap dashboard
2. Create a new Journey
3. Set entry criteria:
   - **Trigger type:** Live behavior
   - **Event:** `payment_success`
   - This fires when a user makes their first trial payment
4. Add a **Webhook** action node:
   - Select the webhook template you created
   - The Journey will send the user's profile to your NotifyGen server
5. Publish the Journey

The Journey fires once per user when `payment_success` occurs. NotifyGen handles all subsequent notification timing and scheduling.

---

## 10. Click Tracking System

### How Tracking URLs Work

Every push notification includes a `wzrk_dl` deep link that points to the NotifyGen tracking endpoint. When a user taps the notification:

```
User taps notification
    |
    v
Device opens wzrk_dl URL:
  /api/webhooks/track?type=click&identity=+91...&slot=1&name=Trial+Payment&day=0
    |
    v
NotifyGen server:
  1. Logs the click in notification_tracking table
  2. Redirects user to https://www.speakx.in/lesson
    |
    v
User lands on the lesson page in the app/browser
```

### Tracking URL Format

```
https://your-server.com/api/webhooks/track?type=click&identity={identity}&slot={slot}&name={notification_name}&day={journey_day}
```

| Parameter | Description |
|-----------|-------------|
| type | Always "click" for notification clicks |
| identity | URL-encoded user identity |
| slot | Notification slot number (1-6) |
| name | URL-encoded notification name |
| day | Journey day (0 for Day 0) |

### Analytics Data

The tracking endpoint `GET /api/webhooks/tracking/:identity` returns:

- **clicks:** Array of all click events with timestamps
- **opens:** Array of app open events
- **sent_log:** Recent sent notifications for comparison
- **summary:** Total clicks, total opens, and click rate (clicks / sent notifications * 100)

---

## 11. Scheduler (Cron Jobs)

The scheduler uses `node-cron` and runs two jobs:

### Every-Minute Job

**Schedule:** `* * * * *` (every minute, system timezone)

**What it does:**
1. Queries `scheduled_notifications` for rows where `status = 'pending'` and `send_at <= now`
2. Processes up to 10 notifications per run (to avoid overloading)
3. For each notification:
   - Fetches the user's current journey state
   - Checks DND (marks as `skipped_dnd` if active)
   - Resolves dynamic content using latest user state
   - Sends via CleverTap push API
   - Updates status to `sent` or `failed`
   - Logs to `sent_log` table

### Daily 7 AM Job

**Schedule:** `0 7 * * *` with timezone `Asia/Kolkata` (7:00 AM IST daily)

**What it does:**
1. Fetches all users with a `payment_time` (i.e., active journeys)
2. Calculates `days_since_payment` and updates `current_day`
3. Calculates `days_since_last_event` for inaction detection
4. Determines if the user falls into an inaction segment:

| Days Since Last Event | Days Since Payment | Segment |
|----------------------|-------------------|---------|
| >= 14 | any | Dormant |
| >= 7 | any | 7-Day Inactive |
| >= 3 | any | 3-Day Inactive |
| any | >= 3 (and < 2 lessons) | Low Practice |

5. If a segment applies and no similar notification was already sent/scheduled in the last 24 hours, schedules a notification for 9 AM that day (or 1 hour from now if already past 9 AM)

### Timezone Handling

- The every-minute cron runs in system timezone (does not matter since it just checks `send_at <= now`)
- The daily cron is explicitly configured with `timezone: "Asia/Kolkata"` to ensure it runs at 7 AM IST regardless of server timezone
- All `send_at` values in the database are stored in UTC (ISO 8601 format)
- DND checks always convert to IST before comparing hours

---

## 12. Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| PORT | No | 3001 | HTTP server port |
| CLEVERTAP_ACCOUNT_ID | Yes | (none) | CleverTap account ID for API authentication |
| CLEVERTAP_PASSCODE | Yes | (none) | CleverTap passcode for API authentication |
| CLEVERTAP_REGION | No | in1 | CleverTap data region (in1, us1, eu1, sg1, aps3, mec1) |
| RAILWAY_PUBLIC_DOMAIN | No | (none) | Auto-set by Railway. Used to construct tracking URLs |
| BASE_URL | No | https://notification-generator-production.up.railway.app | Fallback base URL for tracking links if RAILWAY_PUBLIC_DOMAIN is not set |

**Credential fallback chain:**
1. Environment variable (preferred, especially on Railway)
2. `settings` table in SQLite database (set via the dashboard UI)

If neither is set, push delivery will fail with "CleverTap credentials not configured."

---

## 13. Deployment Checklist

### Step 1: Set Environment Variables

On your hosting platform (Railway, Render, VPS), set:
- `CLEVERTAP_ACCOUNT_ID` — your CleverTap account ID
- `CLEVERTAP_PASSCODE` — your CleverTap passcode
- `CLEVERTAP_REGION` — your data region (likely `in1` for India)
- `BASE_URL` — your server's public URL (for tracking links)

### Step 2: Deploy and Start

The SQLite database auto-creates on first request. All tables are created by `initTables()` in `database.js`. No manual migration needed.

Start the server:
```
npm start
```

The scheduler starts automatically and logs: `[Scheduler] Started — checking pending every minute, daily check at 7 AM IST`

### Step 3: Configure CleverTap Webhook

1. In CleverTap, go to **Settings > Channels > Webhooks**
2. Create a webhook template:
   - Name: "NotifyGen Day 0 Trigger"
   - URL: `https://your-server.com/api/webhooks/clevertap`
   - Method: POST
   - Content-Type: application/json
3. Save the template

### Step 4: Create CleverTap Journey

1. Go to **Journeys > Create Journey**
2. Entry: Live behavior > Event: `payment_success`
3. Add action: Webhook > select the template from Step 3
4. Publish

### Step 5: Verify

Use the simulate endpoint to verify end-to-end:

```
POST /api/webhooks/simulate
{
  "identity": "+919876543210",
  "event": "payment_success",
  "properties": { "username": "Test User" }
}
```

Then check:
- `GET /api/webhooks/journey/+919876543210` — should show journey and scheduled notifications
- `GET /api/webhooks/sent-log` — should show the immediate Slot 1 notification as delivered
- Wait for the cron to process remaining slots (or call `POST /api/webhooks/process-pending`)

### Step 6: Verify Android Notification Channel

The push payload uses `wzrk_cid: "general_updates"`. This notification channel must exist in your Android app. If it does not, notifications will be silently dropped on Android 8+ devices.

In your Android app's code, ensure you create this channel:
- Channel ID: `general_updates`
- Channel name: whatever you want users to see (e.g., "General Updates")

---

## 14. Testing Guide

### Test 1: Preview the Schedule (No Actual Sends)

Use the preview endpoint to see what the schedule would look like:

```
POST /api/webhooks/preview-schedule
{ "payment_time": "2026-03-26T18:00:00+05:30" }
```

This returns the number of notifications, which ones were dropped, and their scheduled times. Try different payment times to verify drop logic.

### Test 2: Fire All Immediately (test-day0)

This sends all eligible Day 0 notifications to a real device right now:

```
POST /api/webhooks/test-day0
{
  "identity": "+919876543210",
  "username": "Rahul",
  "story_name": "The Quiet Boy"
}
```

All notifications fire with a 2-second gap. Check your device for 6 push notifications.

### Test 3: Real-Time Staggered Delivery (test-realtime)

This schedules all 6 at custom intervals and lets the cron processor deliver them:

```
POST /api/webhooks/test-realtime
{
  "identity": "+919876543210",
  "username": "Rahul",
  "interval_minutes": 3
}
```

Over the next 15 minutes (6 notifications * 3 min interval), you will receive one notification every 3 minutes. This tests the full cron pipeline.

### Test 4: Simulate a Webhook

Test the CleverTap webhook format:

```
POST /api/webhooks/clevertap
{
  "profiles": [
    {
      "identity": "+919876543210",
      "Name": "Rahul Kumar",
      "phone": "+919876543210"
    }
  ]
}
```

### Verifying Delivery

1. **Check sent log:** `GET /api/webhooks/sent-log` — shows all recent sends with status
2. **Check user journey:** `GET /api/webhooks/journey/+919876543210` — shows journey state, all scheduled notifications, and sent history
3. **Check tracking:** `GET /api/webhooks/tracking/+919876543210` — shows click and open events after user interacts with notifications
4. **Manual cron trigger:** `POST /api/webhooks/process-pending` — forces the cron processor to run immediately

---

## 15. Known Issues and Fixes

### DND Timezone Bug (UTC vs IST)

**Issue:** If the server runs in UTC and DND hours are not properly converted, notifications may be sent during night hours in India.

**Fix:** The `isDNDActive()` function explicitly adds the IST offset (5.5 hours) before checking the hour. The `calculateDay0Schedule()` function calculates DND start as 23:00 IST converted to UTC. Always store and compare times in UTC, and only convert to IST for the DND hour check.

**Verification:** Call `POST /api/webhooks/preview-schedule` with a payment time of 10:45 PM IST. It should return only 1 notification (the immediate one).

### Notification Channel (Android)

**Issue:** Push notifications silently fail on Android 8+ if the notification channel does not exist.

**Fix:** The system uses `wzrk_cid: "general_updates"` in the push payload. Your Android app must register a notification channel with ID `general_updates` before any notifications can be displayed. If you previously used a different channel name (e.g., "Speakx"), update the `SPEAKX_CHANNEL` constant in `automation-engine.js` to match your app's registered channel.

### Credentials Persistence (SQLite vs Env Vars)

**Issue:** CleverTap credentials stored in the SQLite `settings` table are lost if the database file is deleted or the server is redeployed on an ephemeral filesystem (e.g., Railway without a persistent volume).

**Fix:** Always set `CLEVERTAP_ACCOUNT_ID`, `CLEVERTAP_PASSCODE`, and `CLEVERTAP_REGION` as environment variables. The code checks env vars first, falling back to the database only if env vars are not set.

### CleverTap Throttling on Rapid Sends

**Issue:** When sending multiple notifications quickly (e.g., during test-day0), CleverTap may throttle or reject requests.

**Fix:** The test-day0 endpoint includes a 2-second delay (`setTimeout(r, 2000)`) between each send. If you still see failures, increase this delay. In production, notifications are naturally staggered by the schedule (minimum 20-minute gap), so throttling is not an issue.

### SQLite Concurrency

**Issue:** SQLite does not handle heavy concurrent writes well. If multiple webhook events arrive simultaneously, writes may conflict.

**Fix:** WAL mode is enabled (`journal_mode = WAL`) which allows concurrent reads with a single writer. For most use cases (up to ~100 events/second), this is sufficient. If you need higher throughput, consider migrating to PostgreSQL.

### Tracking URL Length

**Issue:** Some push notification platforms truncate very long deep link URLs, which can break the tracking parameters.

**Fix:** Keep notification names short. The tracking URL encodes the identity, slot number, notification name, and journey day. Identity (phone number) and name are URL-encoded, which can increase length. If issues occur, shorten notification names or use numeric IDs instead.

---

## Appendix: Image URLs Reference

| Key | URL |
|-----|-----|
| trial_payment | `https://raw.githubusercontent.com/claudevish/notification-generator/notification-images/public-images/journey/trial_payment.png` |
| onboarding_story | `https://raw.githubusercontent.com/claudevish/notification-generator/notification-images/public-images/journey/onboarding_story.png` |
| streak | `https://raw.githubusercontent.com/claudevish/notification-generator/notification-images/public-images/journey/streak.png` |
| rank_climber | `https://raw.githubusercontent.com/claudevish/notification-generator/notification-images/public-images/journey/rank_climber.png` |
| at_risk | `https://raw.githubusercontent.com/claudevish/notification-generator/notification-images/public-images/journey/at_risk.png` |
| badge_earned | `https://raw.githubusercontent.com/claudevish/notification-generator/notification-images/public-images/journey/badge_earned.png` |
| pre_renewal | `https://raw.githubusercontent.com/claudevish/notification-generator/notification-images/public-images/journey/pre_renewal.png` |
| renewal_success | `https://raw.githubusercontent.com/claudevish/notification-generator/notification-images/public-images/journey/renewal_success.png` |

---

## Appendix: Segment-to-Event Mapping

These segments are used by the automation engine and correspond to CleverTap events:

| Segment | Primary CleverTap Event | Description |
|---------|------------------------|-------------|
| Trial Payment | payment_success | User just paid for 7-day trial |
| New Users | new_user_login | Fresh signup + onboarding |
| In Progress | lesson_started | Actively doing lessons |
| Auto-Renewal | any_payment_success | Monthly subscription renewed |
| 3-Day Inactive | (inaction-based) | No events for 3+ days |
| 7-Day Inactive | (inaction-based) | No events for 7+ days |
| Dormant | (inaction-based) | No events for 14+ days |
| Low Practice | (inaction-based) | < 2 lessons after 3+ days since payment |

Inaction-based segments are detected by the daily 7 AM cron job, not by incoming events.
