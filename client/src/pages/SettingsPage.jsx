import { useState, useEffect } from "react";
import {
  Settings,
  Key,
  Globe,
  CheckCircle2,
  XCircle,
  Loader2,
  Shield,
  Send,
} from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../components/PageHeader";
import { api } from "../lib/api";

const REGIONS = [
  { value: "in1", label: "India (in1)" },
  { value: "us1", label: "US (us1)" },
  { value: "eu1", label: "Europe (eu1)" },
  { value: "sg1", label: "Singapore (sg1)" },
  { value: "aps3", label: "Indonesia (aps3)" },
  { value: "mec1", label: "Middle East (mec1)" },
];

export default function SettingsPage() {
  const [form, setForm] = useState({
    clevertap_account_id: "",
    clevertap_passcode: "",
    clevertap_region: "in1",
    clevertap_channel_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testPushing, setTestPushing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [testPhone, setTestPhone] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const settings = await api.getSettings();
        setForm({
          clevertap_account_id: settings.clevertap_account_id?.value || "",
          clevertap_passcode: "",
          clevertap_region: settings.clevertap_region?.value || "in1",
          clevertap_channel_id: settings.clevertap_channel_id?.value || "",
        });
      } catch { /* no settings yet */ }
      setLoaded(true);
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const data = { ...form };
      if (!data.clevertap_passcode) delete data.clevertap_passcode;
      await api.saveSettings(data);
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setConnectionStatus(null);
    try {
      const result = await api.testCleverTapConnection();
      setConnectionStatus(result);
      if (result.connected) {
        toast.success("Connected to CleverTap!");
      } else {
        toast.error(result.error || "Connection failed");
      }
    } catch (err) {
      setConnectionStatus({ connected: false, error: err.message });
      toast.error(err.message);
    } finally {
      setTesting(false);
    }
  }

  async function handleTestPush() {
    setTestPushing(true);
    try {
      const result = await api.testPush({
        title: "Test from NotifyGen",
        body: "This is a test push notification from your NotifyGen dashboard!",
        identity: testPhone.trim(),
        channel: form.clevertap_channel_id || undefined,
      });
      if (result.success) {
        toast.success("Test push sent!");
      } else {
        toast.error(result.error || "Push failed");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setTestPushing(false);
    }
  }

  if (!loaded) {
    return (
      <>
        <PageHeader title="Settings" description="Configure integrations and preferences." />
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Settings" description="Configure CleverTap integration and preferences." />

      <div className="max-w-2xl">
        {/* CleverTap Integration */}
        <div className="glass-card rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-brand-600/15 flex items-center justify-center">
              <Shield className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">CleverTap Integration</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Connect to CleverTap to send push notifications</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-3 h-3" /> Account ID
              </label>
              <input
                type="text"
                value={form.clevertap_account_id}
                onChange={(e) => setForm({ ...form, clevertap_account_id: e.target.value })}
                placeholder="Your CleverTap Account ID"
                className="w-full mt-1.5 bg-zinc-100/80 dark:bg-zinc-800/60 border border-brand-500/10 rounded-lg px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus-neon"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-3 h-3" /> Passcode
              </label>
              <input
                type="password"
                value={form.clevertap_passcode}
                onChange={(e) => setForm({ ...form, clevertap_passcode: e.target.value })}
                placeholder="Enter passcode (leave blank to keep existing)"
                className="w-full mt-1.5 bg-zinc-100/80 dark:bg-zinc-800/60 border border-brand-500/10 rounded-lg px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus-neon"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3 h-3" /> Region
              </label>
              <select
                value={form.clevertap_region}
                onChange={(e) => setForm({ ...form, clevertap_region: e.target.value })}
                className="w-full mt-1.5 appearance-none bg-zinc-100/80 dark:bg-zinc-800/60 border border-brand-500/10 rounded-lg px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus-neon cursor-pointer"
              >
                {REGIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-3 h-3" /> Android Notification Channel ID
              </label>
              <input
                type="text"
                value={form.clevertap_channel_id}
                onChange={(e) => setForm({ ...form, clevertap_channel_id: e.target.value })}
                placeholder="e.g. engagement, marketing, default"
                className="w-full mt-1.5 bg-zinc-100/80 dark:bg-zinc-800/60 border border-brand-500/10 rounded-lg px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus-neon"
              />
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">Must match a channel ID registered in CleverTap Dashboard → Settings → Channels → Push</p>
            </div>
          </div>

          {connectionStatus && (
            <div className={`mt-4 rounded-lg p-3 flex items-center gap-2 ${
              connectionStatus.connected
                ? "bg-emerald-500/10 border border-emerald-500/20"
                : "bg-red-500/10 border border-red-500/20"
            }`}>
              {connectionStatus.connected ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              )}
              <p className={`text-xs font-medium ${connectionStatus.connected ? "text-emerald-300" : "text-red-300"}`}>
                {connectionStatus.connected ? connectionStatus.message : connectionStatus.error}
              </p>
            </div>
          )}

          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand-600 hover:bg-brand-500 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
              Save Settings
            </button>
            <button
              onClick={handleTest}
              disabled={testing || !form.clevertap_account_id}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-brand-400 bg-brand-600/10 border border-brand-500/15 hover:bg-brand-600/20 transition-all disabled:opacity-50"
            >
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Test Connection
            </button>
          </div>
        </div>

        {/* Test Push Notification */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-emerald-600/15 flex items-center justify-center">
              <Send className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Test Push Notification</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Send a test notification to a specific phone number</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Phone Number / Identity</label>
              <input
                type="text"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full mt-1.5 bg-zinc-100/80 dark:bg-zinc-800/60 border border-brand-500/10 rounded-lg px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus-neon"
              />
            </div>
            <button
              onClick={handleTestPush}
              disabled={testPushing || !testPhone.trim() || !form.clevertap_account_id}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 transition-colors disabled:opacity-50"
            >
              {testPushing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Test Push
            </button>
          </div>
        </div>
      </div>
    </>
  );
}