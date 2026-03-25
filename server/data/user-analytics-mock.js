// Seeded PRNG (mulberry32) for deterministic mock data
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(42);

function randInt(min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function randFloat(min, max, decimals = 1) {
  return parseFloat((rng() * (max - min) + min).toFixed(decimals));
}

function pickRandom(arr) {
  return arr[Math.floor(rng() * arr.length)];
}

const NAMES = [
  "Aarav", "Priya", "Rohan", "Sneha", "Vikram", "Meera", "Ananya", "Kabir",
  "Ishita", "Dev", "Nisha", "Arjun", "Tanya", "Karan", "Pooja", "Rahul",
  "Simran", "Aditya", "Divya", "Manish", "Neha", "Sachin", "Riya", "Amit",
  "Shreya", "Vivek", "Kavita", "Harsh", "Sonal", "Rajesh", "Deepika", "Nitin",
  "Swati", "Varun", "Anjali", "Mohit", "Preeti", "Gaurav", "Sunita", "Rakesh",
  "Bhavna", "Suresh", "Jyoti", "Kunal", "Madhuri", "Rohit", "Seema", "Ashok",
  "Lata", "Pankaj",
];

const STORIES = [
  "The Quiet Boy",
  "The Lost Letter",
  "Chai with Strangers",
  "The Night Market",
  "Ravi's Big Day",
  "The Wrong Train",
];

const CHART_PALETTE = ["#8b5cf6", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4"];

function generatePhone() {
  let digits = "";
  for (let i = 0; i < 9; i++) {
    digits += randInt(0, 9);
  }
  return `+919${digits}`;
}

function daysAgoISO(days) {
  const d = new Date("2026-03-25T12:00:00Z");
  d.setDate(d.getDate() - days);
  d.setHours(randInt(6, 22), randInt(0, 59), randInt(0, 59));
  return d.toISOString();
}

export function generateMockUsers() {
  const users = [];
  for (let i = 0; i < 50; i++) {
    let lessonsCompleted;
    if (i < 10) {
      lessonsCompleted = randInt(8, 12);
    } else if (i < 35) {
      lessonsCompleted = randInt(2, 7);
    } else {
      lessonsCompleted = randInt(0, 1);
    }

    const notificationsReceived = randInt(1, 15);
    const notificationsClicked = randInt(0, notificationsReceived);

    users.push({
      id: `user_${String(i + 1).padStart(3, "0")}`,
      identity: generatePhone(),
      username: NAMES[i],
      storyName: pickRandom(STORIES),
      currentDay: randInt(0, 6),
      lessonStarted: lessonsCompleted > 0 ? 1 : (rng() > 0.5 ? 1 : 0),
      lessonsCompleted,
      onboardingCompleted: lessonsCompleted >= 1 ? 1 : (rng() > 0.6 ? 1 : 0),
      paymentTime: daysAgoISO(randInt(0, 6)),
      lastEventAt: daysAgoISO(randInt(0, 3)),
      totalTimeSpent: randInt(5, 180),
      appOpens: randInt(1, 25),
      notificationsReceived,
      notificationsClicked,
    });
  }
  return users;
}

export function generateTimeSeriesData() {
  const data = [];
  const baseDate = new Date("2026-03-25");
  for (let i = 29; i >= 0; i--) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - i);
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const trendBoost = Math.floor((30 - i) * 0.3);

    data.push({
      date: d.toISOString().slice(0, 10),
      dailyActiveUsers: randInt(isWeekend ? 15 : 22, isWeekend ? 30 : 45) + trendBoost,
      lessonsStarted: randInt(isWeekend ? 20 : 35, isWeekend ? 50 : 80) + trendBoost,
      lessonsCompleted: randInt(isWeekend ? 10 : 20, isWeekend ? 35 : 60) + trendBoost,
      notificationsSent: randInt(30, 100),
      appOpens: randInt(isWeekend ? 25 : 35, isWeekend ? 50 : 70) + trendBoost,
    });
  }
  return data;
}

export function generateFunnelData() {
  return [
    { stage: "Payment", value: 50, color: CHART_PALETTE[0] },
    { stage: "App Open", value: 43, color: CHART_PALETTE[1] },
    { stage: "First Lesson Started", value: 35, color: CHART_PALETTE[2] },
    { stage: "First Lesson Completed", value: 28, color: CHART_PALETTE[3] },
    { stage: "3+ Lessons", value: 18, color: CHART_PALETTE[4] },
    { stage: "All Lessons Completed", value: 7, color: CHART_PALETTE[5] },
  ];
}

export function generateStoryPerformance() {
  const rng2 = mulberry32(99);
  return STORIES.map((storyName) => ({
    storyName,
    avgCompletionRate: parseFloat((rng2() * 55 + 30).toFixed(1)),
    avgEngagement: parseFloat((rng2() * 5.5 + 2.5).toFixed(1)),
    avgTimeSpent: parseFloat((rng2() * 30 + 15).toFixed(0)),
    totalUsers: Math.floor(rng2() * 30 + 5),
  }));
}

export function generateHeatmapData() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const slots = ["Morning", "Afternoon", "Evening", "Night"];
  const rng3 = mulberry32(77);
  const data = [];

  for (const day of days) {
    for (const slot of slots) {
      const isWeekend = day === "Sat" || day === "Sun";
      const isEvening = slot === "Evening";
      const isNight = slot === "Night";
      let base;
      if (isEvening && !isWeekend) {
        base = 60;
      } else if (isEvening && isWeekend) {
        base = 50;
      } else if (isNight) {
        base = 20;
      } else {
        base = 35;
      }
      data.push({
        day,
        slot,
        value: Math.min(100, Math.max(0, Math.floor(base + rng3() * 30))),
      });
    }
  }
  return data;
}

export function generateCohortData() {
  const rng4 = mulberry32(123);
  const data = [];
  let retention = 100;
  for (let day = 0; day <= 6; day++) {
    const users = Math.floor(50 * retention / 100);
    data.push({
      day,
      users,
      lessonsStarted: Math.floor(users * (0.5 + rng4() * 0.4)),
      lessonsCompleted: Math.floor(users * (0.3 + rng4() * 0.3)),
      avgEngagement: parseFloat((rng4() * 4 + 3).toFixed(1)),
      retentionRate: parseFloat(retention.toFixed(1)),
      notificationResponseRate: parseFloat((rng4() * 30 + 20).toFixed(1)),
    });
    retention = retention * (0.7 + rng4() * 0.15);
  }
  return data;
}

export function generateNotificationImpact() {
  const data = [];
  const baseDate = new Date("2026-03-25");
  const rng5 = mulberry32(200);
  for (let i = 29; i >= 0; i--) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - i);
    const sent = Math.floor(rng5() * 70 + 30);
    const correlation = sent * (0.3 + rng5() * 0.2);
    data.push({
      date: d.toISOString().slice(0, 10),
      notificationsSent: sent,
      lessonsStarted: Math.floor(correlation + rng5() * 10),
      lessonsCompleted: Math.floor(correlation * 0.6 + rng5() * 5),
    });
  }
  return data;
}

export function generateKpiSummary() {
  const users = generateMockUsers();
  const totalLessons = users.reduce((s, u) => s + u.lessonsCompleted, 0);
  const avgLessons = parseFloat((totalLessons / users.length).toFixed(1));
  const totalTime = users.reduce((s, u) => s + u.totalTimeSpent, 0);
  const avgTime = Math.round(totalTime / users.length);
  const engaged = users.filter((u) => u.lessonsCompleted >= 3).length;
  const engagementRate = parseFloat(((engaged / users.length) * 100).toFixed(1));

  return {
    totalUsers: 50,
    avgLessonsCompleted: avgLessons,
    engagementRate,
    avgTimeSpent: `${avgTime} min`,
    trends: {
      totalUsers: 12.5,
      avgLessons: 8.3,
      engagement: 5.1,
      timeSpent: -2.4,
    },
  };
}
