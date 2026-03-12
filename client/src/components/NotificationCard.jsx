import { RefreshCw, Pencil, Check, X } from "lucide-react";
import { useState } from "react";
import Badge from "./Badge";

const LANG_VARIANT = { English: "blue", Hindi: "amber", Hinglish: "pink" };

export default function NotificationCard({ notification, onRegenerate, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: notification.title,
    body: notification.body,
    cta: notification.cta,
  });
  const [loading, setLoading] = useState(false);

  function startEdit() {
    setForm({ title: notification.title, body: notification.body, cta: notification.cta });
    setEditing(true);
  }

  async function save() {
    setLoading(true);
    try {
      await onUpdate(notification.id, { ...form, image_prompt: notification.image_prompt });
      setEditing(false);
    } finally {
      setLoading(false);
    }
  }

  async function regenerate() {
    setLoading(true);
    try {
      await onRegenerate(notification.id);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-card rounded-xl p-4 space-y-3 hover-lift">
      {/* Notification image thumbnail */}
      {notification.image_url && !editing && (
        <div className="rounded-lg overflow-hidden border border-brand-500/10 -mx-1">
          <img
            src={notification.image_url}
            alt={`${notification.title} preview`}
            className="w-full h-auto"
            loading="lazy"
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        <Badge variant={LANG_VARIANT[notification.language] || "default"}>
          {notification.language}
        </Badge>
        <div className="flex items-center gap-1.5">
          {editing ? (
            <>
              <button
                onClick={save}
                disabled={loading}
                className="p-1.5 rounded-md hover:bg-emerald-600/15 text-emerald-400 transition-colors"
                aria-label="Save"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setEditing(false)}
                className="p-1.5 rounded-md hover:bg-zinc-800/60 text-zinc-500 transition-colors"
                aria-label="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={startEdit}
                className="p-1.5 rounded-md hover:bg-white/[0.05] text-zinc-500 hover:text-zinc-300 transition-colors"
                aria-label="Edit notification"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={regenerate}
                disabled={loading}
                className="p-1.5 rounded-md hover:bg-brand-600/15 text-brand-400 transition-colors disabled:opacity-50"
                aria-label="Regenerate notification"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <div className="space-y-2">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
              Title ({form.title.length}/35)
            </label>
            <input
              className="w-full mt-0.5 bg-zinc-800/60 border border-brand-500/10 rounded-md px-2.5 py-1.5 text-sm text-zinc-100 focus-neon"
              maxLength={35}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
              Body ({form.body.length}/65)
            </label>
            <textarea
              className="w-full mt-0.5 bg-zinc-800/60 border border-brand-500/10 rounded-md px-2.5 py-1.5 text-sm text-zinc-100 focus-neon resize-none"
              maxLength={65}
              rows={2}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
              CTA ({form.cta.length}/20)
            </label>
            <input
              className="w-full mt-0.5 bg-zinc-800/60 border border-brand-500/10 rounded-md px-2.5 py-1.5 text-sm text-zinc-100 focus-neon"
              maxLength={20}
              value={form.cta}
              onChange={(e) => setForm({ ...form, cta: e.target.value })}
            />
          </div>
        </div>
      ) : (
        <>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-0.5">Title</p>
            <p className="text-sm font-semibold text-zinc-100">{notification.title}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-0.5">Body</p>
            <p className="text-sm text-zinc-300">{notification.body}</p>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">CTA</p>
            <span className="text-xs font-semibold text-brand-400 bg-brand-600/10 border border-brand-500/15 px-2 py-0.5 rounded-md">
              {notification.cta}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
