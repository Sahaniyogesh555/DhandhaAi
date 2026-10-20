import { useMemo, useState } from "react";
import {
  CalendarClock, Check, Copy, Download, Facebook, Globe, Instagram, LayoutGrid,
  Megaphone, PartyPopper, Package, Lightbulb, Send, ShieldCheck, Sparkles, Trash2,
} from "lucide-react";
import { Badge, Button, Card, EmptyState, Field, Input, PageHeader, Select, Textarea } from "../components/ui";
import { PosterPreview, downloadPosterPng } from "../components/Poster";
import { POSTER_THEMES, TEMPLATES, draftCaption, type Lang, type Template } from "../lib/engine";
import { fmtDateTime, uid, type Store as StoreT } from "../lib/store";
import type { Post, PostType, View } from "../lib/types";

export interface StudioPrefill { postType: PostType; occasion?: string; headline: string; theme: string; }
export const PLAN_POST_QUOTA: Record<string, number> = { free: 4, growth: 30, pro: Infinity };

const TYPE_META: { id: PostType; label: string; icon: typeof PartyPopper; headlineLabel: string; headlineHint: string }[] = [
  { id: "festival", label: "Festival greeting", icon: PartyPopper, headlineLabel: "Your greeting line", headlineHint: "Shown big on the poster." },
  { id: "offer", label: "Offer / discount", icon: Megaphone, headlineLabel: "Your offer (exactly as it is)", headlineHint: "Type the real offer - AI will not invent discounts." },
  { id: "product", label: "Product / new item", icon: Package, headlineLabel: "Product or service name", headlineHint: "Add price in the detail line if you want it shown." },
  { id: "update", label: "Announcement", icon: CalendarClock, headlineLabel: "Your announcement", headlineHint: "New hours, new branch, we are open..." },
  { id: "tip", label: "Helpful tip", icon: Lightbulb, headlineLabel: "Your tip", headlineHint: "Useful tips get shared more than ads." },
];

export function StudioView({ store, go, toast, prefill, clearPrefill }: { store: StoreT; go: (v: View) => void; toast: (m: string) => void; prefill: StudioPrefill | null; clearPrefill: () => void }) {
  const biz = store.activeBusiness;
  const [postType, setPostType] = useState<PostType>(prefill?.postType ?? "offer");
  const [occasion, setOccasion] = useState(prefill?.occasion ?? "Dashain");
  const [headline, setHeadline] = useState(prefill?.headline ?? "");
  const [detail, setDetail] = useState("");
  const [kind, setKind] = useState<"social" | "google">("social");
  const [lang, setLang] = useState<Lang>("en");
  const [theme, setTheme] = useState(prefill?.theme ?? "emerald");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [generated, setGenerated] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");
  const [previewTab, setPreviewTab] = useState<"instagram" | "facebook" | "google">("instagram");

  // sync when a template is chosen from Library
  const [lastPrefill, setLastPrefill] = useState<StudioPrefill | null>(null);
  if (prefill && prefill !== lastPrefill) {
    setLastPrefill(prefill);
    setPostType(prefill.postType); setHeadline(prefill.headline); setTheme(prefill.theme);
    if (prefill.occasion) setOccasion(prefill.occasion);
    setGenerated(false); setCaption("");
  }

  const meta = TYPE_META.find((t) => t.id === postType)!;
  const plan = store.currentUser?.plan ?? "free";
  const quota = PLAN_POST_QUOTA[plan];
  const monthPublished = useMemo(() => {
    if (!biz) return 0;
    const now = new Date();
    return store.state.posts.filter((p) => p.businessId === biz.id && p.status === "published" && p.publishedAt && new Date(p.publishedAt).getMonth() === now.getMonth() && new Date(p.publishedAt).getFullYear() === now.getFullYear()).length;
  }, [biz, store.state.posts]);

  if (!biz) return <EmptyState icon={<Sparkles className="h-6 w-6" aria-hidden />} title="Add a business first" body="Posts are generated from your business details." action={<Button onClick={() => go("onboarding")}>Add my business</Button>} />;

  const generate = () => {
    if (!headline.trim()) return toast(`Type ${meta.headlineLabel.toLowerCase()} first - AI drafts only from your facts.`);
    const d = draftCaption(biz, { postType, occasion, headline: headline.trim(), detail: detail.trim() || undefined }, lang);
    setCaption(d.caption); setHashtags(d.hashtags); setGenerated(true);
  };

  const makePost = (status: Post["status"]): Post => ({
    id: uid(), businessId: biz.id, kind, postType,
    headline: headline.trim(), caption: caption.trim(), hashtags,
    theme, channels: kind === "google" ? ["google"] : ["facebook", "instagram"],
    status,
    scheduledAt: status === "scheduled" && scheduleAt ? new Date(scheduleAt).toISOString() : undefined,
    publishedAt: status === "published" ? new Date().toISOString() : undefined,
    createdAt: new Date().toISOString(),
  });

  const save = (status: Post["status"]) => {
    if (!generated || !caption.trim()) return toast("Generate and review your draft first - nothing goes out unapproved.");
    if (status === "scheduled" && !scheduleAt) return toast("Pick a date and time to schedule.");
    if (status === "published" && monthPublished >= quota) return toast(`Your ${plan} plan includes ${quota} published posts/month. Upgrade in Billing - drafts and downloads stay free.`);
    const post = makePost(status);
    store.update((s) => ({ ...s, posts: [post, ...s.posts] }));
    clearPrefill();
    toast(status === "published" ? "Published to your queue (simulated until official FB/IG/Google posting is approved). Poster download works today." : status === "scheduled" ? "Scheduled. Find it any time under Posts." : "Draft saved under Posts.");
    go("posts");
  };

  const copyCaption = async () => {
    try { await navigator.clipboard.writeText(`${caption}\n\n${hashtags.join(" ")}`); toast("Caption copied - paste it into Instagram, Facebook, WhatsApp or Google."); }
    catch { toast("Copy failed - select the caption text manually."); }
  };

  return (
    <div>
      <PageHeader title="Create a post" subtitle="AI drafts from facts you type. You preview and approve everything - nothing ever auto-posts."
        action={<Badge tone="accent">{plan} plan: {quota === Infinity ? "unlimited" : `${monthPublished}/${quota}`} published this month</Badge>} />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ---- Left: create ---- */}
        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="font-bold text-ink">1. What are you posting?</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {TYPE_META.map((t) => (
                <button key={t.id} onClick={() => { setPostType(t.id); setGenerated(false); }}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-bold ${postType === t.id ? "bg-accent text-white" : "bg-white border border-line text-muted hover:text-accent"}`}>
                  <t.icon className="h-4 w-4" aria-hidden />{t.label}
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Post to">
                <Select value={kind} onChange={(e) => setKind(e.target.value as "social" | "google")}>
                  <option value="social">Facebook + Instagram together</option>
                  <option value="google">Google profile update</option>
                </Select>
              </Field>
              <Field label="Language">
                <Select value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
                  <option value="en">English</option><option value="ne">नेपाली</option><option value="hi">हिंदी</option>
                </Select>
              </Field>
              {postType === "festival" && (
                <Field label="Occasion">
                  <Select value={occasion} onChange={(e) => setOccasion(e.target.value)}>
                    {["Dashain", "Tihar", "Nepali New Year", "Teej", "Holi", "Diwali", "Eid", "Christmas", "New Year"].map((o) => <option key={o}>{o}</option>)}
                  </Select>
                </Field>
              )}
            </div>
            <div className="mt-4 space-y-4">
              <Field label={meta.headlineLabel} hint={meta.headlineHint}>
                <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder={postType === "offer" ? "e.g. 20% off all haircuts this week" : "Type your own line..."} />
              </Field>
              <Field label="Detail line (optional)" hint="Validity, price, timings - only what's true.">
                <Input value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="e.g. Valid till Sunday. Walk-ins welcome." />
              </Field>
            </div>
            <h3 className="mt-5 text-sm font-semibold text-ink">Poster colour</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries(POSTER_THEMES).map(([key, t]) => (
                <button key={key} onClick={() => setTheme(key)} aria-label={`Poster theme ${t.label}`}
                  className={`h-9 w-9 rounded-full border-2 ${theme === key ? "border-ink scale-110" : "border-transparent"}`}
                  style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }} />
              ))}
            </div>
            <Button className="mt-5 w-full py-3" onClick={generate}><Sparkles className="h-4 w-4" aria-hidden /> 2. Generate my draft</Button>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs font-semibold text-muted"><ShieldCheck className="h-3.5 w-3.5 text-accent" aria-hidden /> Drafts only use what you typed above - no invented offers or products.</p>
          </Card>

          {generated && (
            <Card className="p-5">
              <h2 className="font-bold text-ink">3. Review & approve</h2>
              <Field label="Caption (edit freely)">
                <Textarea rows={5} value={caption} onChange={(e) => setCaption(e.target.value)} />
              </Field>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {hashtags.map((h) => <span key={h} className="rounded-full bg-surface border border-line px-2.5 py-1 text-xs font-semibold text-accent">{h}</span>)}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field label="Schedule for (optional)"><Input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} /></Field>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={() => save("published")}><Send className="h-4 w-4" aria-hidden /> Approve & publish</Button>
                <Button variant="secondary" onClick={() => save("scheduled")}><CalendarClock className="h-4 w-4" aria-hidden /> Schedule</Button>
                <Button variant="ghost" onClick={() => save("draft")}>Save draft</Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                <Button variant="secondary" onClick={() => downloadPosterPng(biz, headline, detail, theme)}><Download className="h-4 w-4" aria-hidden /> Download poster</Button>
                <Button variant="secondary" onClick={copyCaption}><Copy className="h-4 w-4" aria-hidden /> Copy caption</Button>
              </div>
              <p className="mt-3 text-xs text-muted">Direct posting to Facebook/Instagram/Google needs Meta/Google app approval with our own developer accounts - in progress. Until then "publish" records to your queue, and download + copy let you share anywhere today.</p>
            </Card>
          )}
        </div>

        {/* ---- Right: preview ---- */}
        <div className="space-y-4 lg:sticky lg:top-6 self-start">
          <PosterPreview business={biz} headline={headline || meta.headlineLabel} subline={detail} theme={theme} />
          <Card className="p-4">
            <div className="flex gap-2" role="tablist" aria-label="Preview channel">
              {([["instagram", Instagram, "Instagram"], ["facebook", Facebook, "Facebook"], ["google", Globe, "Google"]] as const).map(([id, Icon, label]) => (
                <button key={id} role="tab" aria-selected={previewTab === id} onClick={() => setPreviewTab(id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${previewTab === id ? "bg-accent text-white" : "bg-surface text-muted border border-line"}`}>
                  <Icon className="h-3.5 w-3.5" aria-hidden />{label}
                </button>
              ))}
            </div>
            <div className="mt-3 rounded-xl border border-line p-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-extrabold text-white" aria-hidden>{biz.name.charAt(0)}</div>
                <div>
                  <div className="text-sm font-bold text-ink leading-none">{biz.name}</div>
                  <div className="text-[11px] text-muted mt-0.5">{previewTab === "google" ? "Google Business Profile update" : [biz.area, biz.city].filter(Boolean).join(", ") || "Your location"}</div>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-ink">{generated && caption ? caption : "Your caption preview will appear here after you generate the draft."}</p>
              {generated && hashtags.length > 0 && <p className="mt-2 text-sm font-semibold text-accent">{hashtags.join(" ")}</p>}
            </div>
            <p className="mt-2 text-center text-xs text-muted">This is exactly what customers will see. Happy with it? Approve on the left.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function LibraryView({ useTemplate }: { useTemplate: (t: Template) => void }) {
  const [region, setRegion] = useState<"all" | "nepal" | "india">("all");
  const list = TEMPLATES.filter((t) => region === "all" || t.region === region || t.region === "all");
  return (
    <div>
      <PageHeader title="Ready-to-share library" subtitle="Festival and everyday templates made for Nepal and India. Pick one, add your own line, approve, share." />
      <div className="mb-5 flex gap-2" role="tablist" aria-label="Region filter">
        {(["all", "nepal", "india"] as const).map((r) => (
          <button key={r} role="tab" aria-selected={region === r} onClick={() => setRegion(r)}
            className={`rounded-full px-4 py-2 text-sm font-bold capitalize ${region === r ? "bg-accent text-white" : "bg-white border border-line text-muted"}`}>{r === "all" ? "All templates" : r}</button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((t) => {
          const th = POSTER_THEMES[t.theme];
          return (
            <Card key={t.id} className="overflow-hidden">
              <div className="flex h-28 items-center justify-center px-5 text-center text-white" style={{ background: `linear-gradient(140deg, ${th.from}, ${th.to})` }}>
                <span className="font-extrabold leading-snug">{t.suggestedHeadline}</span>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-ink">{t.title}</h3>
                  <Badge tone={t.region === "nepal" ? "accent" : t.region === "india" ? "warn" : "neutral"}>{t.region === "all" ? "Everywhere" : t.region}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted capitalize">{t.postType} post - {t.occasion}</p>
                <Button className="mt-3 w-full" variant="secondary" onClick={() => useTemplate(t)}>Use this template</Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export function PostsView({ store, go, toast }: { store: StoreT; go: (v: View) => void; toast: (m: string) => void }) {
  const biz = store.activeBusiness;
  const [tab, setTab] = useState<"all" | "scheduled" | "published" | "draft">("all");
  if (!biz) return <EmptyState icon={<LayoutGrid className="h-6 w-6" aria-hidden />} title="Add a business first" body="Your posts will live here." action={<Button onClick={() => go("onboarding")}>Add my business</Button>} />;
  const posts = store.state.posts.filter((p) => p.businessId === biz.id && (tab === "all" || p.status === tab));
  const setStatus = (p: Post, status: Post["status"]) => {
    store.update((s) => ({ ...s, posts: s.posts.map((x) => x.id === p.id ? { ...x, status, publishedAt: status === "published" ? new Date().toISOString() : x.publishedAt } : x) }));
    toast(status === "published" ? "Marked published in your queue." : "Updated.");
  };
  const remove = (p: Post) => { store.update((s) => ({ ...s, posts: s.posts.filter((x) => x.id !== p.id) })); toast("Post deleted."); };

  return (
    <div>
      <PageHeader title="Posts" subtitle="Your drafts, schedule and history for social media and Google updates."
        action={<Button onClick={() => go("studio")}><Sparkles className="h-4 w-4" aria-hidden /> New post</Button>} />
      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Post status filter">
        {(["all", "scheduled", "published", "draft"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-sm font-bold capitalize ${tab === t ? "bg-accent text-white" : "bg-white border border-line text-muted"}`}>{t === "draft" ? "Drafts" : t}</button>
        ))}
      </div>
      {posts.length === 0 ? (
        <EmptyState icon={<CalendarClock className="h-6 w-6" aria-hidden />} title="No posts here yet"
          body="Create your first post from a template - a festival greeting takes about a minute."
          action={<div className="flex gap-2"><Button onClick={() => go("studio")}>Create a post</Button><Button variant="secondary" onClick={() => go("library")}>Browse templates</Button></div>} />
      ) : (
        <div className="space-y-3">
          {posts.map((p) => {
            const th = POSTER_THEMES[p.theme] ?? POSTER_THEMES.emerald;
            return (
              <Card key={p.id} className="p-4 flex gap-4">
                <div className="hidden sm:flex h-16 w-16 shrink-0 items-center justify-center rounded-xl px-1.5 text-center text-[10px] font-bold leading-tight text-white" style={{ background: `linear-gradient(140deg, ${th.from}, ${th.to})` }}>{p.headline.slice(0, 40)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-ink truncate">{p.headline}</span>
                    <Badge tone={p.status === "published" ? "good" : p.status === "scheduled" ? "warn" : "neutral"}>{p.status}</Badge>
                    <Badge>{p.kind === "google" ? "Google update" : "FB + Instagram"}</Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{p.caption}</p>
                  <p className="mt-1 text-xs text-muted">
                    {p.status === "published" && p.publishedAt ? `Published ${fmtDateTime(p.publishedAt)} (queue)` : p.status === "scheduled" && p.scheduledAt ? `Scheduled ${fmtDateTime(p.scheduledAt)}` : `Created ${fmtDateTime(p.createdAt)}`}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {p.status !== "published" && <Button className="px-3 py-1.5 text-xs" onClick={() => setStatus(p, "published")}><Check className="h-3.5 w-3.5" aria-hidden /> Publish now</Button>}
                    <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => downloadPosterPng(biz, p.headline, "", p.theme)}><Download className="h-3.5 w-3.5" aria-hidden /> Poster</Button>
                    <Button variant="ghost" className="px-3 py-1.5 text-xs text-danger" onClick={() => remove(p)}><Trash2 className="h-3.5 w-3.5" aria-hidden /> Delete</Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
