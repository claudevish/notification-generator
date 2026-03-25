import { Router } from "express";
import {
  generateKpiSummary,
  generateFunnelData,
  generateTimeSeriesData,
  generateStoryPerformance,
  generateHeatmapData,
  generateCohortData,
  generateNotificationImpact,
  generateMockUsers,
} from "../data/user-analytics-mock.js";

const router = Router();

// GET /api/user-analytics/overview
router.get("/overview", (req, res) => {
  res.json({
    kpi: generateKpiSummary(),
    funnel: generateFunnelData(),
  });
});

// GET /api/user-analytics/engagement
router.get("/engagement", (req, res) => {
  res.json(generateTimeSeriesData());
});

// GET /api/user-analytics/stories
router.get("/stories", (req, res) => {
  res.json(generateStoryPerformance());
});

// GET /api/user-analytics/heatmap
router.get("/heatmap", (req, res) => {
  res.json({
    heatmap: generateHeatmapData(),
    cohort: generateCohortData(),
    notificationImpact: generateNotificationImpact(),
  });
});

// GET /api/user-analytics/users
router.get("/users", (req, res) => {
  const users = generateMockUsers();
  users.sort((a, b) => b.lessonsCompleted - a.lessonsCompleted);
  res.json(users.slice(0, 20));
});

export default router;
