import { POSTER_THEMES } from "../lib/engine";
import type { Business } from "../lib/types";
import { MapPin, Phone } from "lucide-react";

/** On-screen poster preview (the actual downloadable PNG is rendered by canvas below). */
export function PosterPreview({ business, headline, subline, theme }: { business: Business; headline: string; subline?: string; theme: string }) {
  const t = POSTER_THEMES[theme] ?? POSTER_THEMES.emerald;
  return (
    <div
      className="relative aspect-square w-full overflow-hidden rounded-2xl text-white"
      style={{ background: `linear-gradient(150deg, ${t.from}, ${t.to})` }}
      role="img"
      aria-label={`Poster preview: ${headline}`}
    >
      <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full opacity-20" style={{ background: t.accent }} />
      <div className="absolute -left-14 -bottom-14 h-52 w-52 rounded-full opacity-15" style={{ background: t.accent }} />
      <div className="relative flex h-full flex-col items-center justify-between p-[7%] text-center">
        <div className="text-sm font-bold uppercase tracking-[0.18em]" style={{ color: t.accent }}>{business.name}</div>
        <div>
          <div className="mx-auto mb-3 h-1 w-14 rounded-full" style={{ background: t.accent }} />
          <p className="text-2xl sm:text-[1.7rem] font-extrabold leading-snug">{headline || "Your headline here"}</p>
          {subline && <p className="mt-3 text-sm text-white/85 leading-relaxed line-clamp-3">{subline}</p>}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs font-semibold text-white/90">
          {[business.area, business.city].filter(Boolean).length > 0 && (
            <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden />{[business.area, business.city].filter(Boolean).join(", ")}</span>
          )}
          {business.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" aria-hidden />{business.phone}</span>}
        </div>
      </div>
    </div>
  );
}

/** Render a real 1080x1080 PNG with the browser canvas - works offline, no libraries. */
export function downloadPosterPng(business: Business, headline: string, subline: string, theme: string) {
  const t = POSTER_THEMES[theme] ?? POSTER_THEMES.emerald;
  const S = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = S; canvas.height = S;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const grad = ctx.createLinearGradient(0, 0, S, S);
  grad.addColorStop(0, t.from); grad.addColorStop(1, t.to);
  ctx.fillStyle = grad; ctx.fillRect(0, 0, S, S);

  ctx.globalAlpha = 0.18; ctx.fillStyle = t.accent;
  ctx.beginPath(); ctx.arc(S - 60, 60, 240, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(40, S - 40, 280, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;

  const wrap = (text: string, x: number, y: number, maxW: number, lineH: number, maxLines: number) => {
    const words = text.split(/\s+/);
    let line = ""; let lines = 0;
    for (const w of words) {
      const test = line ? line + " " + w : w;
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, x, y); y += lineH; line = w; lines++;
        if (lines >= maxLines - 1) break;
      } else line = test;
    }
    if (line && lines < maxLines) ctx.fillText(line, x, y);
    return y;
  };

  ctx.textAlign = "center";
  ctx.fillStyle = t.accent;
  ctx.font = "700 40px Manrope, Arial, sans-serif";
  ctx.fillText(business.name.toUpperCase().slice(0, 42), S / 2, 130);

  ctx.fillStyle = t.accent;
  ctx.fillRect(S / 2 - 70, 320, 140, 8);

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 76px Manrope, Arial, sans-serif";
  const afterHead = wrap(headline || "Your headline", S / 2, 430, S - 180, 92, 4);

  if (subline) {
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "500 36px Manrope, Arial, sans-serif";
    wrap(subline, S / 2, afterHead + 90, S - 220, 48, 3);
  }

  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "600 34px Manrope, Arial, sans-serif";
  const footer = [[business.area, business.city].filter(Boolean).join(", "), business.phone].filter(Boolean).join("   •   ");
  if (footer) ctx.fillText(footer.slice(0, 60), S / 2, S - 90);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${business.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-poster.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }, "image/png");
}
