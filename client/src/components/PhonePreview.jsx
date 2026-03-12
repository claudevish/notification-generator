import { ChevronUp, Wifi, Signal, Battery } from "lucide-react";

export default function PhonePreview({ notification }) {
  if (!notification) return null;

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Android phone frame */}
      <div
        className="rounded-[2.5rem] overflow-hidden border-[3px] border-zinc-700 shadow-2xl"
        style={{
          background:
            "linear-gradient(145deg, rgba(40,20,60,0.95) 0%, rgba(25,15,35,0.98) 50%, rgba(20,30,30,0.95) 100%)",
        }}
      >
        {/* Status bar */}
        <div className="px-6 pt-3 pb-1 flex items-center justify-between">
          <span className="text-[11px] text-white/80 font-semibold tracking-wide">
            4:03 PM
          </span>
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3 h-3 text-white/60" />
            <Signal className="w-3 h-3 text-white/60" />
            <div className="flex items-center gap-0.5">
              <Battery className="w-4 h-3.5 text-white/60" />
              <span className="text-[9px] text-white/50">53</span>
            </div>
          </div>
        </div>

        {/* App group header */}
        <div className="px-5 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
              <span className="text-[8px] font-bold text-white">S</span>
            </div>
            <span className="text-[11px] text-white/70 font-medium">
              SpeakX English
            </span>
          </div>
          <ChevronUp className="w-4 h-4 text-white/40" />
        </div>

        {/* Notification card */}
        <div className="mx-3 mb-2">
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, rgba(60,40,70,0.85) 0%, rgba(40,30,50,0.9) 100%)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {/* Notification header */}
            <div className="px-4 pt-3 pb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-orange-500 flex items-center justify-center shadow-sm">
                  <span className="text-[7px] font-bold text-white">S</span>
                </div>
                <span className="text-[10px] text-white/50">now</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-orange-500 flex items-center justify-center">
                  <span className="text-[7px] font-bold text-white">S</span>
                </div>
                <ChevronUp className="w-3.5 h-3.5 text-white/40" />
              </div>
            </div>

            {/* Title + Body */}
            <div className="px-4 pb-2">
              <p className="text-[13px] font-bold text-white leading-snug">
                {notification.title}
              </p>
              <p className="text-[11px] text-white/70 mt-0.5 leading-relaxed">
                {notification.body}
              </p>
            </div>

            {/* Large notification image */}
            {notification.image_url && (
              <div className="px-3 pb-2">
                <div className="rounded-xl overflow-hidden">
                  <img
                    src={notification.image_url}
                    alt="Notification banner"
                    className="w-full h-auto"
                    key={notification.id}
                  />
                </div>
              </div>
            )}

            {/* Action CTA */}
            <div className="px-4 pb-3">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-300/90">
                <span>&#10145;&#65039;</span>
                <span>{notification.cta || "Open Lesson"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Empty space below (rest of notification shade) */}
        <div className="h-32" />

        {/* Bottom bar buttons */}
        <div className="px-5 pb-2 flex items-center justify-between">
          <span className="text-[10px] text-white/30 font-medium px-3 py-1.5 rounded-full border border-white/10">
            Notification settings
          </span>
          <span className="text-[10px] text-white/30 font-medium px-3 py-1.5 rounded-full border border-white/10">
            Clear
          </span>
        </div>

        {/* Home indicator */}
        <div className="flex justify-center pb-3 pt-1">
          <div className="w-28 h-1 rounded-full bg-white/20" />
        </div>
      </div>
    </div>
  );
}
