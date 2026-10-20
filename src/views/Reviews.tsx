import { useMemo, useState } from "react";
import { Check, Copy, Languages, MessageSquareHeart, Plus, RefreshCw, Send, Sparkles } from "lucide-react";
import { Badge, Button, Card, EmptyState, Field, Input, PageHeader, Select, Stars, Textarea } from "../components/ui";
import { draftReviewReplies, type Lang, type Tone } from "../lib/engine";
import { fmtDate, uid, type Store as StoreT } from "../lib/store";
import type { Review, View } from "../lib/types";

export default function ReviewsView({ store, go, toast }: { store: StoreT; go: (v: View) => void; toast: (msg: string) => void }) {
  const biz = store.activeBusiness;
  const [filter, setFilter] = useState<"all" | "unreplied" | "replied">("all");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ author: "", rating: 5, text: "" });

  const reviews = useMemo(() => {
    if (!biz) return [];
    return store.state.reviews.filter((r) => r.businessId === biz.id).sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [biz, store.state.reviews]);

  if (!biz) return <EmptyState icon={<MessageSquareHeart className="h-6 w-6" aria-hidden />} title="Add a business first" body="Reviews belong to a business profile." action={<Button onClick={() => go("onboarding")}>Add my business</Button>} />;

  const filtered = reviews.filter((r) => filter === "all" ? true : filter === "unreplied" ? !r.replyText : !!r.replyText);
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const addReview = () => {
    if (form.author.trim().length < 2) return toast("Add the reviewer's name first.");
    const r: Review = { id: uid(), businessId: biz.id, author: form.author.trim(), rating: form.rating, text: form.text.trim(), date: new Date().toISOString() };
    store.update((s) => ({ ...s, reviews: [r, ...s.reviews] }));
    setForm({ author: "", rating: 5, text: "" }); setShowAdd(false);
    toast("Review added - draft a reply below.");
  };

  return (
    <div>
      <PageHeader title="Reviews" subtitle="Reply to every review - Google and future customers both notice. AI drafts use only the review text and your business details."
        action={<Button variant="secondary" onClick={() => setShowAdd(!showAdd)}><Plus className="h-4 w-4" aria-hidden /> Add a review</Button>} />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Card className="p-4"><div className="text-sm font-bold text-muted">Average rating</div><div className="mt-1 flex items-center gap-2"><span className="text-2xl font-extrabold text-ink">{reviews.length ? avg.toFixed(1) : "-"}</span>{reviews.length > 0 && <Stars value={avg} />}</div></Card>
        <Card className="p-4"><div className="text-sm font-bold text-muted">Total reviews here</div><div className="mt-1 text-2xl font-extrabold text-ink">{reviews.length}</div></Card>
        <Card className="p-4"><div className="text-sm font-bold text-muted">Reply rate</div><div className="mt-1 text-2xl font-extrabold text-ink">{reviews.length ? Math.round((reviews.filter((r) => r.replyText).length / reviews.length) * 100) : 0}%</div></Card>
      </div>

      {showAdd && (
        <Card className="mb-5 p-5">
          <h2 className="font-bold text-ink">Add a review you received</h2>
          <p className="text-sm text-muted">Until the official Google connection is live, paste reviews from your Google profile here - replies work exactly the same.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Field label="Reviewer name"><Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} placeholder="e.g. Anita KC" /></Field>
            <Field label="Stars">
              <Select value={String(form.rating)} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 ? "s" : ""}</option>)}
              </Select>
            </Field>
            <Field label="Review text"><Input value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} placeholder="Paste the review..." /></Field>
          </div>
          <Button className="mt-4" onClick={addReview}>Add review</Button>
        </Card>
      )}

      <div className="mb-4 flex gap-2" role="tablist" aria-label="Review filter">
        {(["all", "unreplied", "replied"] as const).map((f) => (
          <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-2 text-sm font-bold capitalize ${filter === f ? "bg-accent text-white" : "bg-white border border-line text-muted hover:text-accent"}`}>{f}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<MessageSquareHeart className="h-6 w-6" aria-hidden />} title={reviews.length ? "Nothing in this filter" : "No reviews yet"}
          body={reviews.length ? "Try a different filter above." : "Add reviews you have received on Google (or open the demo cafe) and draft replies in seconds."}
          action={!reviews.length ? <Button onClick={() => setShowAdd(true)}>Add your first review</Button> : undefined} />
      ) : (
        <div className="space-y-4">{filtered.map((r) => <ReviewCard key={r.id} review={r} store={store} toast={toast} />)}</div>
      )}
    </div>
  );
}

function ReviewCard({ review, store, toast }: { review: Review; store: StoreT; toast: (m: string) => void }) {
  const biz = store.activeBusiness!;
  const [tone, setTone] = useState<Tone>("warm");
  const [lang, setLang] = useState<Lang>("en");
  const [drafts, setDrafts] = useState<string[]>([]);
  const [pick, setPick] = useState(0);
  const [text, setText] = useState("");

  const generate = () => {
    const d = draftReviewReplies(biz, review, tone, lang);
    setDrafts(d); setPick(0); setText(d[0]);
  };
  const choose = (i: number) => { setPick(i); setText(drafts[i]); };

  const saveReply = () => {
    if (!text.trim()) return toast("Write or generate a reply first.");
    store.update((s) => ({ ...s, reviews: s.reviews.map((x) => x.id === review.id ? { ...x, replyText: text.trim(), repliedAt: new Date().toISOString() } : x) }));
    toast("Reply saved. With the Google connection live, this posts directly; today, copy it into Google.");
  };
  const copy = async (t: string) => {
    try { await navigator.clipboard.writeText(t); toast("Copied - paste it as your Google reply."); }
    catch { toast("Copy failed - select the text manually."); }
  };

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft font-extrabold text-accent" aria-hidden>{review.author.charAt(0).toUpperCase()}</div>
          <div>
            <div className="font-bold text-ink">{review.author}</div>
            <div className="flex items-center gap-2 text-xs text-muted"><Stars value={review.rating} size={13} />{fmtDate(review.date)}</div>
          </div>
        </div>
        {review.replyText ? <Badge tone="good"><Check className="h-3 w-3" aria-hidden /> Replied</Badge> : <Badge tone="warn">Needs reply</Badge>}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-ink">{review.text || <em className="text-muted">(star rating only, no written review)</em>}</p>

      {review.replyText ? (
        <div className="mt-4 rounded-xl bg-surface p-3.5">
          <div className="text-xs font-bold text-muted uppercase tracking-wide">Your reply</div>
          <p className="mt-1 text-sm text-ink">{review.replyText}</p>
          <div className="mt-2 flex gap-2">
            <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => copy(review.replyText!)}><Copy className="h-3.5 w-3.5" aria-hidden /> Copy</Button>
            <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => store.update((s) => ({ ...s, reviews: s.reviews.map((x) => x.id === review.id ? { ...x, replyText: undefined, repliedAt: undefined } : x) }))}>Edit reply</Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 border-t border-line pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <Select className="!w-auto" value={tone} onChange={(e) => setTone(e.target.value as Tone)} aria-label="Reply tone">
              <option value="warm">Warm tone</option><option value="professional">Professional</option><option value="short">Short & sweet</option>
            </Select>
            <Select className="!w-auto" value={lang} onChange={(e) => setLang(e.target.value as Lang)} aria-label="Reply language">
              <option value="en">English</option><option value="ne">नेपाली</option><option value="hi">हिंदी</option>
            </Select>
            <Button onClick={generate}><Sparkles className="h-4 w-4" aria-hidden /> {drafts.length ? "Regenerate" : "Draft with AI"}</Button>
            {drafts.length > 0 && <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted"><Languages className="h-3.5 w-3.5" aria-hidden /> Edit freely - it's your voice.</span>}
          </div>
          {drafts.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {drafts.map((_, i) => (
                <button key={i} onClick={() => choose(i)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${pick === i ? "bg-accent text-white" : "bg-surface text-muted border border-line"}`}>Option {i + 1}</button>
              ))}
              <button onClick={generate} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold text-accent hover:bg-accent-soft"><RefreshCw className="h-3 w-3" aria-hidden /> More options</button>
            </div>
          )}
          <Textarea className="mt-3" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Your reply will appear here - or write your own..." aria-label="Reply text" />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={saveReply}><Send className="h-4 w-4" aria-hidden /> Save reply</Button>
            <Button variant="secondary" onClick={() => text.trim() && copy(text)}><Copy className="h-4 w-4" aria-hidden /> Copy for Google</Button>
          </div>
          {review.rating <= 2 && <p className="mt-2 text-xs text-muted">For low ratings our drafts apologise, own the issue and invite a direct conversation - never argue in public replies.</p>}
        </div>
      )}
    </Card>
  );
}
