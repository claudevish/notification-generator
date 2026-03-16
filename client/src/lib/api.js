const BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Request failed");
  }
  return res;
}

export const api = {
  // Batches
  async getBatches() {
    const res = await request("/stories/batches");
    return res.json();
  },

  async deleteBatch(id) {
    const res = await request(`/stories/batches/${id}`, { method: "DELETE" });
    return res.json();
  },

  // Stories
  async uploadCSV(file) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${BASE}/stories/upload`, { method: "POST", body: form });
    if (!res.ok) throw new Error((await res.json()).error || "Upload failed");
    return res.json();
  },

  async getStories(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const res = await request(`/stories${qs ? `?${qs}` : ""}`);
    return res.json();
  },

  async getStory(id) {
    const res = await request(`/stories/${id}`);
    return res.json();
  },

  async deleteStory(id) {
    const res = await request(`/stories/${id}`, { method: "DELETE" });
    return res.json();
  },

  async generateForStory(id) {
    const res = await request(`/stories/${id}/generate`, { method: "POST" });
    return res.json();
  },

  async generateAll() {
    const res = await request("/generate-all", { method: "POST" });
    return res.json();
  },

  // Segments
  async getSegments(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const res = await request(`/segments${qs ? `?${qs}` : ""}`);
    return res.json();
  },

  async getSegment(id) {
    const res = await request(`/segments/${id}`);
    return res.json();
  },

  async updateSegment(id, data) {
    const res = await request(`/segments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deleteSegment(id) {
    const res = await request(`/segments/${id}`, { method: "DELETE" });
    return res.json();
  },

  // Notifications
  async getNotifications(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const res = await request(`/notifications${qs ? `?${qs}` : ""}`);
    return res.json();
  },

  async updateNotification(id, data) {
    const res = await request(`/notifications/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async regenerateNotification(id) {
    const res = await request(`/notifications/${id}/regenerate`, { method: "POST" });
    return res.json();
  },

  async getNotificationStats() {
    const res = await request("/notifications/stats");
    return res.json();
  },

  // Analytics
  async getAnalyticsOverview() {
    const res = await request("/analytics/overview");
    return res.json();
  },

  async getAnalyticsBySegment() {
    const res = await request("/analytics/by-segment");
    return res.json();
  },

  async getAnalyticsByLanguage() {
    const res = await request("/analytics/by-language");
    return res.json();
  },

  async getAnalyticsTimeline() {
    const res = await request("/analytics/timeline");
    return res.json();
  },

  async getTopNotifications() {
    const res = await request("/analytics/top-notifications");
    return res.json();
  },

  async seedAnalytics() {
    const res = await request("/analytics/seed", { method: "POST" });
    return res.json();
  },

  // Settings
  async getSettings() {
    const res = await request("/settings");
    return res.json();
  },

  async saveSettings(data) {
    const res = await request("/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async testCleverTapConnection() {
    const res = await request("/settings/test-connection");
    return res.json();
  },

  async testPush(data) {
    const res = await request("/campaigns/test-push", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Campaigns
  async getCampaigns() {
    const res = await request("/campaigns");
    return res.json();
  },

  async createCampaign(data) {
    const res = await request("/campaigns", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getCampaign(id) {
    const res = await request(`/campaigns/${id}`);
    return res.json();
  },

  async sendCampaign(id) {
    const res = await request(`/campaigns/${id}/send`, { method: "POST" });
    return res.json();
  },

  async deleteCampaign(id) {
    const res = await request(`/campaigns/${id}`, { method: "DELETE" });
    return res.json();
  },

  // Health
  async getHealth() {
    const res = await request("/health");
    return res.json();
  },
};
