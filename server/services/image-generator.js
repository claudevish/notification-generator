import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { homedir } from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/* ═══════════════════════════════════════════════════════════════════════
   FONT REGISTRATION — Gilroy family
   ═══════════════════════════════════════════════════════════════════════ */

const BUNDLED_FONT_DIR = join(__dirname, "..", "fonts");
const SYSTEM_FONT_DIR = join(homedir(), "Library", "Fonts");
const FONT_MAP = {
  GilroyExtrabold: "Gilroy-Extrabold.otf",
  GilroyBold: "Gilroy-Bold.otf",
  GilroySemibold: "Gilroy-Semibold.otf",
  GilroyMedium: "Gilroy-Medium.otf",
  GilroyRegular: "Gilroy-Regular.otf",
};

for (const [name, file] of Object.entries(FONT_MAP)) {
  const bundled = join(BUNDLED_FONT_DIR, file);
  const system = join(SYSTEM_FONT_DIR, file);
  const p = existsSync(bundled) ? bundled : system;
  if (existsSync(p)) {
    try { GlobalFonts.registerFromPath(p, name); }
    catch { /* ignore registration errors */ }
  }
}

// Fallback font strings
const FONT_HEADLINE = "GilroyExtrabold, Arial, Helvetica, sans-serif";
const FONT_BOLD = "GilroyBold, Arial, Helvetica, sans-serif";
const FONT_SEMI = "GilroySemibold, Arial, Helvetica, sans-serif";
const FONT_MEDIUM = "GilroyMedium, Arial, Helvetica, sans-serif";
const FONT_REGULAR = "GilroyRegular, Arial, Helvetica, sans-serif";

/* ═══════════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════════ */

const WIDTH = 984;
const HEIGHT = 360;

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

/* ═══════════════════════════════════════════════════════════════════════
   BANNER COPY — segment-themed, generic marketing (no story titles)
   Goal: Visually compelling headlines that work for ANY story/lesson
   ═══════════════════════════════════════════════════════════════════════ */

function extractWordFromTitle(title) {
  if (!title) return null;
  const m = title.match(/:\s*([a-zA-Z]{4,})/);
  return m ? m[1].charAt(0).toUpperCase() + m[1].slice(1) : null;
}

function getBannerCopy(sk, notifTitle) {
  // For new_users, extract the featured word from the notification title
  const featuredWord = sk === "new_users" ? extractWordFromTitle(notifTitle) : null;

  const copy = {
    new_users: featuredWord ? {
      headlines: [
        `"${featuredWord}"`,
      ],
      subtitles: [
        "Learn this word through a fun story",
        "Master this word in just 5 minutes",
        "Boost your vocabulary today",
      ],
      cta: "Start Lesson Now",
      wordBadge: true,
    } : {
      headlines: [
        "Start Your\nEnglish Journey",
        "Word of\nthe Day",
        "Learn English\nThrough Stories",
      ],
      subtitles: [
        "5 minutes to a smarter you",
        "Build your vocabulary one word at a time",
      ],
      cta: "Start Lesson Now",
    },
    trial_payment: {
      headlines: [
        "Welcome to\nSpeakX Premium!",
        "7-Day Trial\nActivated!",
        "Your Premium\nJourney Begins",
      ],
      subtitles: [
        "Unlimited lessons, stories & quizzes await",
        "Start your first lesson and see the magic",
        "7 days of premium English learning",
      ],
      cta: "Start First Lesson",
    },
    onboarding_story: {
      headlines: [
        "Your First\nStory Awaits",
        "Learn Through\nReal Stories",
        "Discover\nEnglish Stories",
      ],
      subtitles: [
        "Learn real English through fun stories",
        "Just 5 minutes to boost your English",
        "Stories make learning easy & fun",
      ],
      cta: "Read Story Now",
    },
    badge_earned: {
      headlines: [
        "Badge\nUnlocked!",
        "Achievement\nEarned!",
        "You're a\nFast Learner!",
      ],
      subtitles: [
        "Keep this streak going strong",
        "You're making amazing progress",
        "Your dedication is paying off",
      ],
      cta: "Keep Learning",
    },
    pre_renewal: {
      headlines: [
        "Trial Ends\nTomorrow",
        "Your Trial Is\nAlmost Over",
        "1 Day Left\non Your Trial",
      ],
      subtitles: [
        "Monthly plan auto-renews seamlessly",
        "Keep your premium access uninterrupted",
        "Don't lose your learning progress",
      ],
      cta: "View Plan Details",
    },
    renewal_success: {
      headlines: [
        "Subscription\nRenewed!",
        "Monthly Plan\nActive!",
        "Premium\nContinues!",
      ],
      subtitles: [
        "Your English journey continues uninterrupted",
        "Keep learning with unlimited access",
        "Another month of premium learning ahead",
      ],
      cta: "Continue Learning",
    },
    at_risk: {
      headlines: [
        "Payment\nFailed",
        "Renewal Issue\nDetected",
        "Action\nRequired",
      ],
      subtitles: [
        "Update payment to keep premium access",
        "Don't lose your progress and streak",
        "Fix this in just 30 seconds",
      ],
      cta: "Fix Payment",
    },
    streak: {
      headlines: [
        "You're on\nFire!",
        "Streak Master\nUnlocked!",
        "Unstoppable\nLearner!",
      ],
      subtitles: [
        "Your consistency is legendary",
        "Keep the momentum going strong",
        "Top learners never stop",
      ],
      cta: "Continue Streak",
    },
    rank_climber: {
      headlines: [
        "Rank Up!\nYou're Rising",
        "Climbing the\nLeaderboard",
        "Top Ranker\nAlert!",
      ],
      subtitles: [
        "You're beating learners across India",
        "Your rank is climbing fast",
        "Keep pushing to reach #1",
      ],
      cta: "View Leaderboard",
    },
    started_not_finished: {
      headlines: [
        "Don't Stop\nNow!",
        "Today's English\nChallenge",
        "Finish What\nYou Started",
        "Almost There!\nKeep Going",
      ],
      subtitles: [
        "You're so close \u2014 don't give up now!",
        "Pick up right where you left off",
        "Just a few more minutes to finish",
      ],
      cta: "Continue Now",
    },
    low_practice: {
      headlines: [
        "Can You Solve\nThis English\nChallenge?",
        "Test Your\nEnglish Skills",
        "Quick Challenge\nAwaits You",
        "Sharpen Your\nEnglish Today",
      ],
      subtitles: [
        "Boost your score with a quick practice",
        "Challenge yourself and level up",
        "A 2-minute quiz can make a big difference",
      ],
      cta: "Take Challenge",
    },
    inactive_3d: {
      headlines: [
        "Practice\nEnglish Daily",
        "Don't Break\nYour Streak!",
        "Time for a\nQuick Lesson",
        "5 Minutes Is\nAll You Need",
      ],
      subtitles: [
        "Just 5 minutes keeps your skills sharp",
        "Stay consistent, stay fluent",
        "Your streak is counting on you",
      ],
      cta: "Practice Now",
    },
    inactive_7d: {
      headlines: [
        "You Are in All\nIndia Rank Top 3",
        "Welcome Back,\nChampion!",
        "Your Streak\nMisses You",
        "Ready for a\nFresh Start?",
      ],
      subtitles: [
        "Your learning journey continues here",
        "Come back and claim your spot",
        "It's never too late to restart",
      ],
      cta: "Restart Now",
    },
    dormant: {
      headlines: [
        "You Just Unlocked\na New Topic",
        "New Content\nAwaits You!",
        "Fresh Lessons\nJust Dropped",
        "Something New\nis Waiting",
      ],
      subtitles: [
        "Explore new topics and keep growing",
        "Your next level is one tap away",
        "Exciting new lessons added for you",
      ],
      cta: "Explore Now",
    },
  };
  return copy[sk] || copy.new_users;
}

/* ═══════════════════════════════════════════════════════════════════════
   6 VISUAL TEMPLATES — one per segment type
   ═══════════════════════════════════════════════════════════════════════ */

const TEMPLATES = {
  new_users: {
    bg: ["#3b1a8c", "#5b21b6", "#7c3aed"],
    textColor: "#ffffff",
    subColor: "rgba(255,255,255,0.80)",
    ctaBg: "#ffffff",
    ctaText: "#5b21b6",
    illustration: "phone",
    badge: null,
    decor: "rgba(255,255,255,0.12)",
  },
  trial_payment: {
    bg: ["#064e3b", "#047857", "#059669"],
    textColor: "#ffffff",
    subColor: "rgba(255,255,255,0.85)",
    ctaBg: "#ffffff",
    ctaText: "#047857",
    illustration: "diamond",
    badge: { text: "PREMIUM ACTIVATED", bg: "#10b981", dot: true },
    decor: "rgba(255,255,255,0.10)",
  },
  onboarding_story: {
    bg: ["#1e1b4b", "#3730a3", "#4f46e5"],
    textColor: "#ffffff",
    subColor: "rgba(255,255,255,0.80)",
    ctaBg: "#fbbf24",
    ctaText: "#1e1b4b",
    illustration: "book",
    badge: { text: "NEW STORY", bg: "#6366f1", dot: false },
    decor: "rgba(255,255,255,0.08)",
  },
  badge_earned: {
    bg: ["#78350f", "#92400e", "#b45309"],
    bgSplit: "#fbbf24",
    textColor: "#ffffff",
    subColor: "rgba(255,255,255,0.85)",
    ctaBg: "#ffffff",
    ctaText: "#92400e",
    illustration: "medal",
    badge: { text: "ACHIEVEMENT", bg: "#d97706", dot: true },
    decor: "rgba(255,255,255,0.10)",
  },
  pre_renewal: {
    bg: ["#7c2d12", "#c2410c", "#ea580c"],
    textColor: "#ffffff",
    subColor: "rgba(255,255,255,0.80)",
    ctaBg: "#fbbf24",
    ctaText: "#7c2d12",
    illustration: "clock",
    badge: { text: "TRIAL ENDING", bg: "#dc2626", dot: true },
    decor: "rgba(255,255,255,0.08)",
  },
  renewal_success: {
    bg: ["#14532d", "#166534", "#15803d"],
    textColor: "#ffffff",
    subColor: "rgba(255,255,255,0.85)",
    ctaBg: "#ffffff",
    ctaText: "#166534",
    illustration: "shield_check",
    badge: { text: "SUBSCRIPTION ACTIVE", bg: "#22c55e", dot: true },
    decor: "rgba(255,255,255,0.10)",
  },
  at_risk: {
    bg: ["#450a0a", "#7f1d1d", "#991b1b"],
    textColor: "#ffffff",
    subColor: "rgba(255,255,255,0.80)",
    ctaBg: "#fbbf24",
    ctaText: "#450a0a",
    illustration: "warning",
    badge: { text: "ACTION REQUIRED", bg: "#ef4444", dot: true },
    decor: "rgba(255,255,255,0.06)",
  },
  streak: {
    bg: ["#431407", "#9a3412", "#ea580c"],
    bgSplit: "#fbbf24",
    textColor: "#ffffff",
    subColor: "rgba(255,255,255,0.85)",
    ctaBg: "#ffffff",
    ctaText: "#9a3412",
    illustration: "flame",
    badge: { text: "ON FIRE!", bg: "#f97316", dot: true },
    decor: "rgba(255,255,255,0.08)",
  },
  rank_climber: {
    bg: ["#3a2a1a", "#44403c"],
    bgSplit: "#eab308",
    textColor: "#ffffff",
    subColor: "rgba(255,255,255,0.80)",
    ctaBg: "#ffffff",
    ctaText: "#3a2a1a",
    illustration: "trophy",
    badge: { text: "RANK UP!", bg: "#78350f", dot: false },
    decor: "rgba(255,255,255,0.08)",
  },
  started_not_finished: {
    bg: ["#6b1e3a", "#881337", "#9f1239"],
    textColor: "#ffffff",
    subColor: "rgba(255,255,255,0.80)",
    ctaBg: "#fbbf24",
    ctaText: "#6b1e3a",
    illustration: "checklist",
    badge: { text: "LIVE", bg: "#ef4444", dot: true },
    decor: "rgba(255,255,255,0.08)",
  },
  low_practice: {
    bg: ["#1e1b4b", "#312e81", "#4338ca"],
    textColor: "#ffffff",
    subColor: "rgba(255,255,255,0.80)",
    ctaBg: "#fbbf24",
    ctaText: "#1e1b4b",
    illustration: "lightbulb",
    badge: null,
    highlightWord: "English",
    highlightColor: "#fbbf24",
    decor: "rgba(255,255,255,0.10)",
  },
  inactive_3d: {
    bg: ["#facc15", "#eab308", "#facc15"],
    textColor: "#1c1917",
    subColor: "rgba(28,25,23,0.60)",
    ctaBg: "#7c3aed",
    ctaText: "#ffffff",
    illustration: "pencil",
    badge: { text: "Tip of the Day", bg: "#2563eb", dot: false },
    decor: "rgba(0,0,0,0.06)",
  },
  inactive_7d: {
    bg: ["#3a2a1a", "#44403c"],
    bgSplit: "#eab308",
    textColor: "#ffffff",
    subColor: "rgba(255,255,255,0.80)",
    ctaBg: "#ffffff",
    ctaText: "#3a2a1a",
    illustration: "trophy",
    badge: { text: "Congratulations", bg: "#78350f", dot: false },
    decor: "rgba(255,255,255,0.08)",
  },
  dormant: {
    bg: ["#ecfdf5", "#f0fdf4", "#fafaf9"],
    textColor: "#1c1917",
    subColor: "rgba(28,25,23,0.50)",
    ctaBg: "#16a34a",
    ctaText: "#ffffff",
    illustration: "lock",
    highlightWord: "Unlocked",
    highlightColor: "#16a34a",
    decor: "rgba(0,0,0,0.05)",
  },
};

/* ═══════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════ */

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrap(ctx, text, maxW) {
  const words = text.split(" ");
  const lines = [];
  let cur = words[0] || "";
  for (let i = 1; i < words.length; i++) {
    const t = cur + " " + words[i];
    if (ctx.measureText(t).width > maxW) { lines.push(cur); cur = words[i]; }
    else cur = t;
  }
  lines.push(cur);
  return lines;
}

function star4(ctx, cx, cy, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    ctx.lineTo(cx + Math.cos(a) * s, cy + Math.sin(a) * s);
    const ma = a + Math.PI / 4;
    ctx.lineTo(cx + Math.cos(ma) * s * 0.35, cy + Math.sin(ma) * s * 0.35);
  }
  ctx.closePath();
  ctx.fill();
}

function star5(ctx, cx, cy, outerR, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  const innerR = outerR * 0.4;
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function segKey(name) {
  const s = (name || "").toLowerCase();
  // Journey-stage segments (new)
  if (s.includes("trial payment") || s.includes("trial_payment")) return "trial_payment";
  if (s.includes("onboarding") || s.includes("first story") || s.includes("onboarding_story")) return "onboarding_story";
  if (s.includes("badge") || s.includes("achievement") || s.includes("badge_earned")) return "badge_earned";
  if (s.includes("pre-renewal") || s.includes("pre_renewal") || s.includes("trial end")) return "pre_renewal";
  if (s.includes("renewal success") || s.includes("renewal_success") || s.includes("renewed") || s.includes("subscription active")) return "renewal_success";
  if (s.includes("at risk") || s.includes("at_risk") || s.includes("payment fail") || s.includes("payment error")) return "at_risk";
  if (s.includes("streak") || s.includes("on fire")) return "streak";
  if (s.includes("rank") || s.includes("leaderboard") || s.includes("rank_climber")) return "rank_climber";
  // Original segments
  if (s.includes("new user") || s.includes("haven't started")) return "new_users";
  if (s.includes("started but") || s.includes("didn't finish")) return "started_not_finished";
  if (s.includes("dormant") || s.includes("7+ days")) return "dormant";
  if (s.includes("less than 50") || s.includes("low practice")) return "low_practice";
  if (s.includes("inactive for 3")) return "inactive_3d";
  if (s.includes("inactive for 7")) return "inactive_7d";
  return "new_users";
}

/* ═══════════════════════════════════════════════════════════════════════
   DRAWING: BACKGROUNDS
   ═══════════════════════════════════════════════════════════════════════ */

function drawBg(ctx, t) {
  if (t.bgSplit) {
    const grad = ctx.createLinearGradient(0, 0, WIDTH, 0);
    t.bg.forEach((c, i) => grad.addColorStop(i / Math.max(t.bg.length - 1, 1), c));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT * 0.55);
    ctx.fillStyle = t.bgSplit;
    ctx.fillRect(0, HEIGHT * 0.55, WIDTH, HEIGHT * 0.45);
  } else {
    const grad = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT * 0.6);
    t.bg.forEach((c, i) => grad.addColorStop(i / Math.max(t.bg.length - 1, 1), c));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
}

function drawDecor(ctx, color) {
  const spots = [
    [60, 25, 10], [130, 320, 14], [380, 35, 7], [480, 330, 11],
    [680, 20, 6], [830, 310, 8], [940, 45, 10], [40, 200, 7],
    [280, 300, 5], [620, 345, 9], [750, 50, 6], [560, 15, 8],
  ];
  for (const [x, y, r2] of spots) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r2, 0, Math.PI * 2);
    ctx.fill();
  }
  star4(ctx, 100, 55, 7, color);
  star4(ctx, 420, 28, 5, color);
  star4(ctx, 860, 70, 6, color);
  star4(ctx, 180, 335, 5, color);
  star4(ctx, 730, 340, 6, color);
}

/* ═══════════════════════════════════════════════════════════════════════
   DRAWING: ILLUSTRATIONS (one per segment template)
   ═══════════════════════════════════════════════════════════════════════ */

function drawPhone(ctx, cx, cy) {
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath(); ctx.arc(cx, cy, 110, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.beginPath(); ctx.arc(cx, cy, 135, 0, Math.PI * 2); ctx.fill();

  const px = cx - 42, py = cy - 68;
  rr(ctx, px, py, 84, 136, 14);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 2;
  ctx.stroke();

  rr(ctx, px + 6, py + 16, 72, 98, 6);
  ctx.fillStyle = "#4c1d95";
  ctx.fill();

  ctx.fillStyle = "#a78bfa";
  ctx.beginPath(); ctx.arc(cx, cy - 16, 18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = `20px ${FONT_BOLD}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("S", cx, cy - 15);

  ctx.fillStyle = "rgba(255,255,255,0.5)";
  rr(ctx, px + 18, cy + 14, 48, 5, 2); ctx.fill();
  rr(ctx, px + 24, cy + 24, 36, 5, 2); ctx.fill();

  rr(ctx, cx - 16, py + 4, 32, 8, 4);
  ctx.fillStyle = "#e5e7eb";
  ctx.fill();

  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  ctx.fillStyle = "#a78bfa";
  ctx.beginPath();
  ctx.moveTo(cx + 55, cy - 10);
  ctx.lineTo(cx + 80, cy);
  ctx.lineTo(cx + 55, cy + 10);
  ctx.closePath();
  ctx.fill();
}

function drawChecklist(ctx, cx, cy) {
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.beginPath(); ctx.arc(cx, cy, 110, 0, Math.PI * 2); ctx.fill();

  const bx = cx - 50, by = cy - 72;
  rr(ctx, bx, by, 100, 135, 12);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  rr(ctx, cx - 22, by - 6, 44, 18, 8);
  ctx.fillStyle = "#e5e7eb";
  ctx.fill();
  rr(ctx, cx - 14, by - 2, 28, 10, 5);
  ctx.fillStyle = "#d4d4d8";
  ctx.fill();

  for (let i = 0; i < 4; i++) {
    const ry = by + 28 + i * 26;
    const done = i < 2;
    rr(ctx, bx + 14, ry, 16, 16, 4);
    ctx.fillStyle = done ? "#22c55e" : "#e5e7eb";
    ctx.fill();
    if (done) {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(bx + 18, ry + 8);
      ctx.lineTo(bx + 22, ry + 12);
      ctx.lineTo(bx + 28, ry + 5);
      ctx.stroke();
    }
    rr(ctx, bx + 38, ry + 4, done ? 46 : 38, 7, 3);
    ctx.fillStyle = done ? "rgba(0,0,0,0.12)" : "rgba(0,0,0,0.06)";
    ctx.fill();
  }

  const tx = cx + 60, ty = cy + 40;
  [30, 22, 14, 8].forEach((r2, i) => {
    ctx.fillStyle = i % 2 === 0 ? "#ef4444" : "#ffffff";
    ctx.beginPath(); ctx.arc(tx, ty, r2, 0, Math.PI * 2); ctx.fill();
  });
  ctx.strokeStyle = "#1c1917";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(tx + 20, ty - 25);
  ctx.lineTo(tx + 2, ty - 2);
  ctx.stroke();
  ctx.fillStyle = "#1c1917";
  ctx.beginPath();
  ctx.moveTo(tx + 2, ty - 2);
  ctx.lineTo(tx + 8, ty - 8);
  ctx.lineTo(tx + 6, ty + 1);
  ctx.closePath();
  ctx.fill();
}

function drawBulb(ctx, cx, cy) {
  ctx.fillStyle = "rgba(251,191,36,0.12)";
  ctx.beginPath(); ctx.arc(cx, cy - 20, 110, 0, Math.PI * 2); ctx.fill();

  const glow = ctx.createRadialGradient(cx, cy - 35, 10, cx, cy - 35, 60);
  glow.addColorStop(0, "rgba(251,191,36,0.25)");
  glow.addColorStop(1, "rgba(251,191,36,0)");
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(cx, cy - 35, 60, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = "#fbbf24";
  ctx.beginPath(); ctx.arc(cx, cy - 38, 48, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.beginPath(); ctx.arc(cx - 14, cy - 52, 18, 0, Math.PI * 2); ctx.fill();

  rr(ctx, cx - 20, cy + 8, 40, 22, 5);
  ctx.fillStyle = "#d4d4d8";
  ctx.fill();
  ctx.strokeStyle = "#a1a1aa";
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(cx - 18, cy + 12 + i * 7);
    ctx.lineTo(cx + 18, cy + 12 + i * 7);
    ctx.stroke();
  }

  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI * 2) / 8;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 56, cy - 38 + Math.sin(a) * 56);
    ctx.lineTo(cx + Math.cos(a) * 70, cy - 38 + Math.sin(a) * 70);
    ctx.stroke();
  }

  const bx = cx - 55, by = cy + 42;
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.beginPath();
  ctx.moveTo(bx + 55, by);
  ctx.quadraticCurveTo(bx + 28, by + 5, bx, by + 12);
  ctx.lineTo(bx, by + 48);
  ctx.quadraticCurveTo(bx + 28, by + 42, bx + 55, by + 48);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(bx + 55, by);
  ctx.quadraticCurveTo(bx + 82, by + 5, bx + 110, by + 12);
  ctx.lineTo(bx + 110, by + 48);
  ctx.quadraticCurveTo(bx + 82, by + 42, bx + 55, by + 48);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(99,102,241,0.25)";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath(); ctx.moveTo(bx + 8, by + 18 + i * 9); ctx.lineTo(bx + 46, by + 18 + i * 9); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx + 64, by + 18 + i * 9); ctx.lineTo(bx + 102, by + 18 + i * 9); ctx.stroke();
  }

  star4(ctx, cx - 65, cy - 75, 9, "rgba(251,191,36,0.5)");
  star4(ctx, cx + 70, cy - 70, 7, "rgba(251,191,36,0.5)");
  star4(ctx, cx + 80, cy - 20, 5, "rgba(251,191,36,0.35)");
}

function drawPencilIllus(ctx, cx, cy) {
  ctx.fillStyle = "rgba(0,0,0,0.05)";
  ctx.beginPath(); ctx.arc(cx, cy, 110, 0, Math.PI * 2); ctx.fill();

  ctx.save();
  ctx.translate(cx + 10, cy - 5);
  ctx.rotate(-Math.PI / 5);

  rr(ctx, -18, -85, 36, 130, 4);
  ctx.fillStyle = "#f97316";
  ctx.fill();
  ctx.fillStyle = "#ea580c";
  ctx.fillRect(-18, -35, 36, 12);
  ctx.fillStyle = "#fdba74";
  ctx.fillRect(-18, -85, 36, 12);

  ctx.fillStyle = "#fef3c7";
  ctx.beginPath();
  ctx.moveTo(-18, 45); ctx.lineTo(18, 45); ctx.lineTo(0, 72);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#292524";
  ctx.beginPath();
  ctx.moveTo(-6, 60); ctx.lineTo(6, 60); ctx.lineTo(0, 72);
  ctx.closePath(); ctx.fill();

  rr(ctx, -18, -98, 36, 16, 6);
  ctx.fillStyle = "#f472b6";
  ctx.fill();
  ctx.fillStyle = "#a8a29e";
  ctx.fillRect(-18, -86, 36, 5);

  ctx.restore();

  ctx.strokeStyle = "rgba(0,0,0,0.10)";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  const lx = cx - 80;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(lx, cy + 55 + i * 16);
    ctx.lineTo(lx + 50 - i * 10, cy + 55 + i * 16);
    ctx.stroke();
  }

  rr(ctx, cx + 55, cy + 20, 45, 55, 6);
  ctx.fillStyle = "rgba(0,0,0,0.08)";
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.12)";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(cx + 62, cy + 32 + i * 10);
    ctx.lineTo(cx + 92, cy + 32 + i * 10);
    ctx.stroke();
  }
}

function drawTrophyIllus(ctx, cx, cy) {
  const glow = ctx.createRadialGradient(cx, cy - 15, 10, cx, cy - 15, 100);
  glow.addColorStop(0, "rgba(251,191,36,0.25)");
  glow.addColorStop(1, "rgba(251,191,36,0)");
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(cx, cy - 15, 100, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = "#fbbf24";
  ctx.beginPath();
  ctx.moveTo(cx - 48, cy - 60); ctx.lineTo(cx + 48, cy - 60);
  ctx.quadraticCurveTo(cx + 44, cy + 5, cx + 30, cy + 5);
  ctx.lineTo(cx - 30, cy + 5);
  ctx.quadraticCurveTo(cx - 44, cy + 5, cx - 48, cy - 60);
  ctx.closePath(); ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.beginPath();
  ctx.moveTo(cx - 28, cy - 55); ctx.lineTo(cx - 16, cy - 55);
  ctx.quadraticCurveTo(cx - 18, cy - 5, cx - 22, cy - 5);
  ctx.lineTo(cx - 30, cy - 5);
  ctx.quadraticCurveTo(cx - 30, cy - 5, cx - 28, cy - 55);
  ctx.closePath(); ctx.fill();

  ctx.strokeStyle = "#f59e0b";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.beginPath(); ctx.arc(cx - 54, cy - 32, 20, -Math.PI * 0.5, Math.PI * 0.5); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx + 54, cy - 32, 20, Math.PI * 0.5, -Math.PI * 0.5); ctx.stroke();

  rr(ctx, cx - 8, cy + 5, 16, 28, 3);
  ctx.fillStyle = "#d97706"; ctx.fill();
  rr(ctx, cx - 32, cy + 30, 64, 14, 5);
  ctx.fillStyle = "#b45309"; ctx.fill();
  rr(ctx, cx - 28, cy + 32, 56, 5, 3);
  ctx.fillStyle = "rgba(255,255,255,0.15)"; ctx.fill();

  star5(ctx, cx, cy - 30, 16, "#ffffff");

  star4(ctx, cx - 65, cy - 78, 9, "rgba(251,191,36,0.6)");
  star4(ctx, cx + 72, cy - 72, 7, "rgba(251,191,36,0.5)");
  star4(ctx, cx + 55, cy - 85, 5, "rgba(251,191,36,0.4)");
  star4(ctx, cx - 50, cy + 50, 5, "rgba(251,191,36,0.3)");

  const sy = HEIGHT - 10;
  ctx.fillStyle = "rgba(0,0,0,0.10)";
  const bldgs = [
    [-95, 30], [-75, 52], [-52, 38], [-32, 62], [-10, 42],
    [10, 58], [32, 32], [52, 48], [75, 36], [95, 44],
  ];
  for (const [ox, h] of bldgs) ctx.fillRect(cx + ox - 8, sy - h, 16, h);
  ctx.beginPath();
  ctx.arc(cx + 15, sy - 58, 10, Math.PI, 0);
  ctx.fillStyle = "rgba(0,0,0,0.10)"; ctx.fill();
}

function drawLockIllus(ctx, cx, cy) {
  ctx.fillStyle = "rgba(34,197,94,0.06)";
  ctx.beginPath(); ctx.arc(cx, cy, 110, 0, Math.PI * 2); ctx.fill();

  rr(ctx, cx - 44, cy - 12, 88, 72, 12);
  ctx.fillStyle = "#92400e"; ctx.fill();
  rr(ctx, cx - 44, cy - 12, 88, 32, 12);
  ctx.fillStyle = "#a16207"; ctx.fill();

  ctx.strokeStyle = "#78716c";
  ctx.lineWidth = 11;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx - 24, cy - 12);
  ctx.lineTo(cx - 24, cy - 42);
  ctx.arc(cx, cy - 42, 24, Math.PI, 0, false);
  ctx.lineTo(cx + 24, cy - 28);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 24, cy - 38);
  ctx.lineTo(cx - 24, cy - 42);
  ctx.arc(cx, cy - 42, 24, Math.PI, Math.PI * 1.5, false);
  ctx.stroke();

  ctx.fillStyle = "#1c1917";
  ctx.beginPath(); ctx.arc(cx, cy + 15, 11, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(cx - 5, cy + 23, 10, 18);

  star4(ctx, cx + 58, cy - 55, 11, "#22c55e");
  star4(ctx, cx - 62, cy - 48, 8, "#22c55e");
  star4(ctx, cx + 65, cy + 35, 7, "#16a34a");
  star4(ctx, cx - 55, cy + 45, 6, "#16a34a");

  const sy = HEIGHT - 8;
  ctx.fillStyle = "rgba(0,0,0,0.05)";
  const bldgs = [
    [-100, 28], [-80, 48], [-55, 34], [-35, 56], [-12, 38],
    [8, 52], [30, 28], [50, 44], [72, 32], [92, 40],
  ];
  for (const [ox, h] of bldgs) ctx.fillRect(cx + ox - 7, sy - h, 14, h);
  ctx.beginPath();
  ctx.arc(cx + 12, sy - 52, 9, Math.PI, 0); ctx.fill();
}

/* ═══════════════════════════════════════════════════════════════════════
   DRAWING: NEW JOURNEY-STAGE ILLUSTRATIONS
   ═══════════════════════════════════════════════════════════════════════ */

function drawDiamond(ctx, cx, cy) {
  // Premium diamond illustration for trial payment
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.beginPath(); ctx.arc(cx, cy, 110, 0, Math.PI * 2); ctx.fill();

  const glow = ctx.createRadialGradient(cx, cy - 10, 10, cx, cy - 10, 80);
  glow.addColorStop(0, "rgba(16,185,129,0.3)");
  glow.addColorStop(1, "rgba(16,185,129,0)");
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(cx, cy - 10, 80, 0, Math.PI * 2); ctx.fill();

  // Diamond shape
  ctx.fillStyle = "#34d399";
  ctx.beginPath();
  ctx.moveTo(cx, cy - 65);
  ctx.lineTo(cx + 50, cy - 20);
  ctx.lineTo(cx, cy + 45);
  ctx.lineTo(cx - 50, cy - 20);
  ctx.closePath();
  ctx.fill();

  // Diamond facets
  ctx.fillStyle = "#6ee7b7";
  ctx.beginPath();
  ctx.moveTo(cx, cy - 65);
  ctx.lineTo(cx + 50, cy - 20);
  ctx.lineTo(cx, cy - 10);
  ctx.lineTo(cx - 50, cy - 20);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.beginPath();
  ctx.moveTo(cx - 15, cy - 65);
  ctx.lineTo(cx - 5, cy - 20);
  ctx.lineTo(cx - 50, cy - 20);
  ctx.closePath();
  ctx.fill();

  // Inner lines
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx, cy - 65); ctx.lineTo(cx, cy + 45); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - 50, cy - 20); ctx.lineTo(cx + 50, cy - 20); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - 25, cy - 42); ctx.lineTo(cx, cy + 45); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 25, cy - 42); ctx.lineTo(cx, cy + 45); ctx.stroke();

  // Sparkles
  star4(ctx, cx - 60, cy - 55, 10, "rgba(52,211,153,0.6)");
  star4(ctx, cx + 65, cy - 50, 8, "rgba(52,211,153,0.5)");
  star4(ctx, cx + 55, cy + 30, 6, "rgba(52,211,153,0.4)");
  star4(ctx, cx - 55, cy + 40, 7, "rgba(52,211,153,0.3)");

  // Checkmark circle
  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.arc(cx + 38, cy + 30, 18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#059669";
  ctx.beginPath(); ctx.arc(cx + 38, cy + 30, 15, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx + 31, cy + 30);
  ctx.lineTo(cx + 36, cy + 35);
  ctx.lineTo(cx + 46, cy + 24);
  ctx.stroke();
}

function drawBookIllus(ctx, cx, cy) {
  // Open book illustration for onboarding/story
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.beginPath(); ctx.arc(cx, cy, 110, 0, Math.PI * 2); ctx.fill();

  // Book left page
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(cx - 5, cy - 50);
  ctx.quadraticCurveTo(cx - 45, cy - 45, cx - 70, cy - 40);
  ctx.lineTo(cx - 70, cy + 50);
  ctx.quadraticCurveTo(cx - 45, cy + 45, cx - 5, cy + 50);
  ctx.closePath();
  ctx.fill();

  // Book right page
  ctx.fillStyle = "#e0e7ff";
  ctx.beginPath();
  ctx.moveTo(cx - 5, cy - 50);
  ctx.quadraticCurveTo(cx + 35, cy - 45, cx + 60, cy - 40);
  ctx.lineTo(cx + 60, cy + 50);
  ctx.quadraticCurveTo(cx + 35, cy + 45, cx - 5, cy + 50);
  ctx.closePath();
  ctx.fill();

  // Book spine
  ctx.strokeStyle = "#a5b4fc";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 5, cy - 50);
  ctx.lineTo(cx - 5, cy + 50);
  ctx.stroke();

  // Text lines on left page
  ctx.fillStyle = "rgba(99,102,241,0.20)";
  for (let i = 0; i < 5; i++) {
    rr(ctx, cx - 60, cy - 30 + i * 16, 42 - i * 3, 5, 2);
    ctx.fill();
  }

  // Text lines on right page
  ctx.fillStyle = "rgba(99,102,241,0.15)";
  for (let i = 0; i < 5; i++) {
    rr(ctx, cx + 10, cy - 30 + i * 16, 38 - i * 2, 5, 2);
    ctx.fill();
  }

  // Reading character bubble
  ctx.fillStyle = "#818cf8";
  ctx.beginPath(); ctx.arc(cx + 50, cy - 60, 22, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = `18px ${FONT_BOLD}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Aa", cx + 50, cy - 60);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  // Stars around book
  star4(ctx, cx - 75, cy - 65, 8, "rgba(165,180,252,0.5)");
  star4(ctx, cx + 72, cy + 40, 7, "rgba(165,180,252,0.4)");
  star4(ctx, cx - 65, cy + 55, 6, "rgba(165,180,252,0.3)");
}

function drawMedal(ctx, cx, cy) {
  // Medal/badge illustration for achievements
  const glow = ctx.createRadialGradient(cx, cy - 5, 10, cx, cy - 5, 90);
  glow.addColorStop(0, "rgba(251,191,36,0.3)");
  glow.addColorStop(1, "rgba(251,191,36,0)");
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(cx, cy - 5, 90, 0, Math.PI * 2); ctx.fill();

  // Ribbon tails
  ctx.fillStyle = "#dc2626";
  ctx.beginPath();
  ctx.moveTo(cx - 20, cy - 50);
  ctx.lineTo(cx - 45, cy - 90);
  ctx.lineTo(cx - 30, cy - 90);
  ctx.lineTo(cx - 8, cy - 50);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.moveTo(cx + 20, cy - 50);
  ctx.lineTo(cx + 45, cy - 90);
  ctx.lineTo(cx + 30, cy - 90);
  ctx.lineTo(cx + 8, cy - 50);
  ctx.closePath();
  ctx.fill();

  // Medal circle - outer
  ctx.fillStyle = "#fbbf24";
  ctx.beginPath(); ctx.arc(cx, cy, 48, 0, Math.PI * 2); ctx.fill();

  // Medal circle - inner ring
  ctx.strokeStyle = "#f59e0b";
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(cx, cy, 38, 0, Math.PI * 2); ctx.stroke();

  // Medal shine
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.beginPath(); ctx.arc(cx - 12, cy - 15, 16, 0, Math.PI * 2); ctx.fill();

  // Star in center
  star5(ctx, cx, cy, 22, "#ffffff");
  star5(ctx, cx, cy, 16, "#fbbf24");

  // Sparkles
  star4(ctx, cx - 60, cy - 60, 10, "rgba(251,191,36,0.6)");
  star4(ctx, cx + 65, cy - 55, 8, "rgba(251,191,36,0.5)");
  star4(ctx, cx + 58, cy + 45, 7, "rgba(251,191,36,0.4)");
  star4(ctx, cx - 55, cy + 50, 6, "rgba(251,191,36,0.3)");
}

function drawClock(ctx, cx, cy) {
  // Clock/timer for pre-renewal warning
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.beginPath(); ctx.arc(cx, cy, 110, 0, Math.PI * 2); ctx.fill();

  // Clock body
  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.arc(cx, cy, 55, 0, Math.PI * 2); ctx.fill();

  // Clock face
  ctx.fillStyle = "#fef2f2";
  ctx.beginPath(); ctx.arc(cx, cy, 48, 0, Math.PI * 2); ctx.fill();

  // Hour markers
  ctx.fillStyle = "#991b1b";
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI * 2) / 12 - Math.PI / 2;
    const r = i % 3 === 0 ? 38 : 40;
    const len = i % 3 === 0 ? 8 : 5;
    ctx.lineWidth = i % 3 === 0 ? 3 : 1.5;
    ctx.strokeStyle = "#991b1b";
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    ctx.lineTo(cx + Math.cos(a) * (r + len), cy + Math.sin(a) * (r + len));
    ctx.stroke();
  }

  // Hour hand
  ctx.strokeStyle = "#1c1917";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + 14, cy - 20);
  ctx.stroke();

  // Minute hand
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx - 8, cy - 32);
  ctx.stroke();

  // Center dot
  ctx.fillStyle = "#dc2626";
  ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();

  // Warning triangle
  ctx.fillStyle = "#fbbf24";
  ctx.beginPath();
  ctx.moveTo(cx + 40, cy + 30);
  ctx.lineTo(cx + 65, cy + 70);
  ctx.lineTo(cx + 15, cy + 70);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#1c1917";
  ctx.font = `bold 22px ${FONT_BOLD}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("!", cx + 40, cy + 56);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  // Alarm lines
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  for (let i = 0; i < 4; i++) {
    const a = -Math.PI / 4 + (i * Math.PI) / 8;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 62, cy + Math.sin(a) * 62);
    ctx.lineTo(cx + Math.cos(a) * 72, cy + Math.sin(a) * 72);
    ctx.stroke();
  }
}

function drawShieldCheck(ctx, cx, cy) {
  // Shield with checkmark for renewal success
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.beginPath(); ctx.arc(cx, cy, 110, 0, Math.PI * 2); ctx.fill();

  const glow = ctx.createRadialGradient(cx, cy, 10, cx, cy, 80);
  glow.addColorStop(0, "rgba(34,197,94,0.25)");
  glow.addColorStop(1, "rgba(34,197,94,0)");
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(cx, cy, 80, 0, Math.PI * 2); ctx.fill();

  // Shield shape
  ctx.fillStyle = "#22c55e";
  ctx.beginPath();
  ctx.moveTo(cx, cy - 68);
  ctx.quadraticCurveTo(cx + 55, cy - 55, cx + 55, cy - 20);
  ctx.quadraticCurveTo(cx + 52, cy + 25, cx, cy + 62);
  ctx.quadraticCurveTo(cx - 52, cy + 25, cx - 55, cy - 20);
  ctx.quadraticCurveTo(cx - 55, cy - 55, cx, cy - 68);
  ctx.closePath();
  ctx.fill();

  // Shield inner
  ctx.fillStyle = "#16a34a";
  ctx.beginPath();
  ctx.moveTo(cx, cy - 56);
  ctx.quadraticCurveTo(cx + 42, cy - 45, cx + 42, cy - 16);
  ctx.quadraticCurveTo(cx + 40, cy + 18, cx, cy + 50);
  ctx.quadraticCurveTo(cx - 40, cy + 18, cx - 42, cy - 16);
  ctx.quadraticCurveTo(cx - 42, cy - 45, cx, cy - 56);
  ctx.closePath();
  ctx.fill();

  // Shine
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.beginPath();
  ctx.moveTo(cx - 20, cy - 56);
  ctx.quadraticCurveTo(cx - 42, cy - 45, cx - 42, cy - 16);
  ctx.quadraticCurveTo(cx - 40, cy + 5, cx - 20, cy + 20);
  ctx.lineTo(cx - 20, cy - 56);
  ctx.closePath();
  ctx.fill();

  // Checkmark
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(cx - 18, cy - 2);
  ctx.lineTo(cx - 4, cy + 14);
  ctx.lineTo(cx + 22, cy - 16);
  ctx.stroke();

  // Stars
  star4(ctx, cx - 62, cy - 65, 9, "rgba(34,197,94,0.5)");
  star4(ctx, cx + 68, cy - 58, 7, "rgba(34,197,94,0.4)");
  star4(ctx, cx + 60, cy + 45, 8, "rgba(34,197,94,0.3)");
}

function drawWarning(ctx, cx, cy) {
  // Warning/alert for at-risk (payment failed)
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.beginPath(); ctx.arc(cx, cy, 110, 0, Math.PI * 2); ctx.fill();

  // Large warning triangle
  ctx.fillStyle = "#fbbf24";
  ctx.beginPath();
  ctx.moveTo(cx, cy - 62);
  ctx.lineTo(cx + 60, cy + 42);
  ctx.lineTo(cx - 60, cy + 42);
  ctx.closePath();
  ctx.fill();

  // Inner triangle
  ctx.fillStyle = "#f59e0b";
  ctx.beginPath();
  ctx.moveTo(cx, cy - 44);
  ctx.lineTo(cx + 45, cy + 32);
  ctx.lineTo(cx - 45, cy + 32);
  ctx.closePath();
  ctx.fill();

  // Exclamation mark
  ctx.fillStyle = "#1c1917";
  rr(ctx, cx - 5, cy - 25, 10, 32, 3);
  ctx.fill();
  ctx.beginPath(); ctx.arc(cx, cy + 18, 6, 0, Math.PI * 2); ctx.fill();

  // Broken card icon
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  rr(ctx, cx + 40, cy + 48, 52, 34, 6);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx + 46, cy + 58);
  ctx.lineTo(cx + 86, cy + 58);
  ctx.stroke();
  // X mark on card
  ctx.strokeStyle = "#ef4444";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(cx + 58, cy + 64); ctx.lineTo(cx + 72, cy + 76); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 72, cy + 64); ctx.lineTo(cx + 58, cy + 76); ctx.stroke();

  star4(ctx, cx - 65, cy - 55, 8, "rgba(251,191,36,0.4)");
  star4(ctx, cx + 70, cy - 50, 6, "rgba(251,191,36,0.3)");
}

function drawFlame(ctx, cx, cy) {
  // Fire/flame for streak
  const glow = ctx.createRadialGradient(cx, cy, 10, cx, cy, 90);
  glow.addColorStop(0, "rgba(249,115,22,0.3)");
  glow.addColorStop(1, "rgba(249,115,22,0)");
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(cx, cy, 90, 0, Math.PI * 2); ctx.fill();

  // Outer flame
  ctx.fillStyle = "#f97316";
  ctx.beginPath();
  ctx.moveTo(cx, cy - 75);
  ctx.quadraticCurveTo(cx + 20, cy - 50, cx + 45, cy - 15);
  ctx.quadraticCurveTo(cx + 55, cy + 15, cx + 40, cy + 45);
  ctx.quadraticCurveTo(cx + 20, cy + 65, cx, cy + 60);
  ctx.quadraticCurveTo(cx - 20, cy + 65, cx - 40, cy + 45);
  ctx.quadraticCurveTo(cx - 55, cy + 15, cx - 45, cy - 15);
  ctx.quadraticCurveTo(cx - 20, cy - 50, cx, cy - 75);
  ctx.closePath();
  ctx.fill();

  // Inner flame (yellow)
  ctx.fillStyle = "#fbbf24";
  ctx.beginPath();
  ctx.moveTo(cx, cy - 40);
  ctx.quadraticCurveTo(cx + 12, cy - 20, cx + 25, cy + 5);
  ctx.quadraticCurveTo(cx + 30, cy + 25, cx + 20, cy + 40);
  ctx.quadraticCurveTo(cx + 8, cy + 52, cx, cy + 48);
  ctx.quadraticCurveTo(cx - 8, cy + 52, cx - 20, cy + 40);
  ctx.quadraticCurveTo(cx - 30, cy + 25, cx - 25, cy + 5);
  ctx.quadraticCurveTo(cx - 12, cy - 20, cx, cy - 40);
  ctx.closePath();
  ctx.fill();

  // Core flame (white-hot)
  ctx.fillStyle = "#fef3c7";
  ctx.beginPath();
  ctx.moveTo(cx, cy - 10);
  ctx.quadraticCurveTo(cx + 8, cy + 5, cx + 10, cy + 20);
  ctx.quadraticCurveTo(cx + 5, cy + 35, cx, cy + 32);
  ctx.quadraticCurveTo(cx - 5, cy + 35, cx - 10, cy + 20);
  ctx.quadraticCurveTo(cx - 8, cy + 5, cx, cy - 10);
  ctx.closePath();
  ctx.fill();

  // Streak count circle
  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.arc(cx + 45, cy + 35, 20, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#ea580c";
  ctx.font = `bold 18px ${FONT_BOLD}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("5+", cx + 45, cy + 35);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  // Embers
  star4(ctx, cx - 55, cy - 65, 7, "rgba(249,115,22,0.5)");
  star4(ctx, cx + 60, cy - 60, 6, "rgba(251,191,36,0.5)");
  star4(ctx, cx - 45, cy + 50, 5, "rgba(249,115,22,0.3)");
}

/* ═══════════════════════════════════════════════════════════════════════
   DRAWING: BADGE LABELS
   ═══════════════════════════════════════════════════════════════════════ */

function drawBadge(ctx, badge, x, y) {
  ctx.font = `15px ${FONT_BOLD}`;
  const tw = ctx.measureText(badge.text).width;
  const dotSpace = badge.dot ? 20 : 0;
  const pw = tw + 22 + dotSpace;
  const ph = 30;

  rr(ctx, x, y, pw, ph, 6);
  ctx.fillStyle = badge.bg;
  ctx.fill();

  let tx = x + 10;
  if (badge.dot) {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.arc(tx + 6, y + ph / 2, 5, 0, Math.PI * 2); ctx.fill();
    tx += dotSpace;
  }

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.fillText(badge.text, tx, y + 20);
  return pw;
}

/* ═══════════════════════════════════════════════════════════════════════
   DRAWING: CTA BUTTON
   ═══════════════════════════════════════════════════════════════════════ */

function drawCTA(ctx, text, x, y, bgColor, textColor) {
  ctx.font = `16px ${FONT_BOLD}`;
  const tw = ctx.measureText(text).width;
  const iconSp = 28;
  const pw = tw + 40 + iconSp;
  const ph = 42;

  rr(ctx, x, y, pw, ph, ph / 2);
  ctx.fillStyle = bgColor;
  ctx.fill();

  const ix = x + 18, iy = y + ph / 2;
  ctx.fillStyle = textColor;
  ctx.beginPath();
  ctx.moveTo(ix - 5, iy - 7);
  ctx.lineTo(ix + 10, iy);
  ctx.lineTo(ix - 5, iy + 7);
  ctx.lineTo(ix - 1, iy);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = textColor;
  ctx.textAlign = "left";
  ctx.fillText(text, x + iconSp + 14, y + ph / 2 + 6);
  return pw;
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN GENERATOR — story-contextualized, Gilroy font
   ═══════════════════════════════════════════════════════════════════════ */

export function generateNotificationImage({ title, body, cta, language, segmentName, storyTitle, theme }) {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");

  const sk = segKey(segmentName);
  const t = { ...(TEMPLATES[sk] || TEMPLATES.new_users) };
  const copy = getBannerCopy(sk, title);

  // If copy has a "Word of the Day" badge, add it to the template
  if (copy.wordBadge) {
    t.badge = { text: "WORD OF THE DAY", bg: "#7c3aed", dot: false };
  }

  const headline = pick(copy.headlines);
  const subtitle = pick(copy.subtitles);
  const ctaLabel = copy.cta;

  // 1. Background
  drawBg(ctx, t);

  // 2. Decorative dots & sparkles
  drawDecor(ctx, t.decor);

  // 3. Illustration on right side
  const illusCx = WIDTH - 200;
  const illusCy = HEIGHT / 2;
  switch (t.illustration) {
    case "phone": drawPhone(ctx, illusCx, illusCy); break;
    case "checklist": drawChecklist(ctx, illusCx, illusCy); break;
    case "lightbulb": drawBulb(ctx, illusCx, illusCy); break;
    case "pencil": drawPencilIllus(ctx, illusCx, illusCy); break;
    case "trophy": drawTrophyIllus(ctx, illusCx, illusCy); break;
    case "lock": drawLockIllus(ctx, illusCx, illusCy); break;
    case "diamond": drawDiamond(ctx, illusCx, illusCy); break;
    case "book": drawBookIllus(ctx, illusCx, illusCy); break;
    case "medal": drawMedal(ctx, illusCx, illusCy); break;
    case "clock": drawClock(ctx, illusCx, illusCy); break;
    case "shield_check": drawShieldCheck(ctx, illusCx, illusCy); break;
    case "warning": drawWarning(ctx, illusCx, illusCy); break;
    case "flame": drawFlame(ctx, illusCx, illusCy); break;
  }

  // 4. Text content — Gilroy font, story-contextualized
  const contentX = 55;
  let curY = 42;
  const maxW = WIDTH - 440;

  // Badge label
  if (t.badge) {
    drawBadge(ctx, t.badge, contentX, curY);
    curY += 46;
  }

  // Headline — large Gilroy Extrabold (bigger for single featured word)
  const headlineSize = copy.wordBadge ? 56 : 44;
  ctx.font = `${headlineSize}px ${FONT_HEADLINE}`;
  const headlineLines = headline.includes("\n")
    ? headline.split("\n")
    : wrap(ctx, headline, maxW);

  const lineHeight = copy.wordBadge ? 62 : 50;
  for (const line of headlineLines.slice(0, 3)) {
    curY += lineHeight;
    if (t.highlightWord && line.includes(t.highlightWord)) {
      let tx = contentX;
      const parts = line.split(t.highlightWord);
      for (let pi = 0; pi < parts.length; pi++) {
        if (parts[pi]) {
          ctx.fillStyle = t.textColor;
          ctx.fillText(parts[pi], tx, curY);
          tx += ctx.measureText(parts[pi]).width;
        }
        if (pi < parts.length - 1) {
          ctx.fillStyle = t.highlightColor;
          ctx.fillText(t.highlightWord, tx, curY);
          tx += ctx.measureText(t.highlightWord).width;
        }
      }
    } else {
      ctx.fillStyle = t.textColor;
      ctx.textAlign = "left";
      ctx.fillText(line, contentX, curY);
    }
  }

  curY += 16;

  // Subtitle — Gilroy Medium
  ctx.font = `17px ${FONT_MEDIUM}`;
  ctx.fillStyle = t.subColor;
  ctx.fillText(subtitle, contentX, curY + 14);
  curY += 38;

  // CTA button
  if (curY + 42 < HEIGHT - 10) {
    drawCTA(ctx, ctaLabel, contentX, curY, t.ctaBg, t.ctaText);
  }

  return canvas.toBuffer("image/png");
}

/* ═══════════════════════════════════════════════════════════════════════
   SAVE HELPER
   ═══════════════════════════════════════════════════════════════════════ */

export function generateAndSave({ notificationId, title, body, cta, language, segmentName, storyTitle, theme }) {
  const outputDir = join(__dirname, "..", "static", "notifications");
  mkdirSync(outputDir, { recursive: true });
  const buffer = generateNotificationImage({ title, body, cta, language, segmentName, storyTitle, theme });
  const filename = `${notificationId}.png`;
  writeFileSync(join(outputDir, filename), buffer);
  return `notifications/${filename}`;
}
