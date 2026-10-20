import { useMemo, useState } from "react";
import { AlertTriangle, Check, KeyRound, Plus, Swords, Trash2, Trophy } from "lucide-react";
import { Badge, Button, Card, EmptyState, Field, Input, PageHeader, ScoreBar } from "../components/ui";
import { buildKeywords } from "../lib/engine";
import { uid, type Store as StoreT } from "../lib/store";
import type { Competitor, View } from "../lib/types";

export function KeywordsView({ store, go }: { store: StoreT; go: (v: View) => void }) {
  const biz = store.activeBusiness;
  const kws = useMemo(() => (biz ? buildKeywords(biz) : []), [biz]);
  if (!biz) return <EmptyState icon={<KeyRound className="h-6 w-6" aria-hidden />} title="Add a business first" body="Keywords are built from your category, city and services." action={<Button onClick={() => go("onboarding")}>Add my business</Button>} />;
  const hit = kws.filter((k) => k.inProfile).length;

  return (
    <div>
      <PageHeader title="Local keywords" subtitle="Phrases nearby customers actually type, built from your category, area and services - checked against your own profile text." />
      <Card className="p-5 mb-5">
        <ScoreBar label="Profile coverage" value={kws.length ? Math.round((hit / kws.length) * 100) : 0} hint={`${hit} of ${kws.length} target phrases appear in your description or services. Missing ones are your easiest wins.`} />
      </Card>
      <div className="mb-5 flex gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-warn">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span><strong>Important:</strong> put keywords in your <strong>description and services</strong> naturally. Never stuff them into your business name ("Best Cheap Salon Kathmandu") - Google suspends listings for that. We also never invent search volumes; competition below is a relative guide, not a data product.</span>
      </div>
      <div className="space-y-2.5">
        {kws.map((k) => (
          <Card key={k.term} className="p-4 flex flex-wrap items-center gap-3">
            <span className="flex-1 min-w-52 font-bold text-ink">"{k.term}"</span>
            <Badge>{k.intent}</Badge>
            <Badge tone={k.competition === "low" ? "good" : k.competition === "medium" ? "warn" : "bad"}>{k.competition} competition</Badge>
            {k.inProfile ? <Badge tone="good"><Check className="h-3 w-3" aria-hidden /> In your profile</Badge> : <Badge tone="bad">Missing</Badge>}
          </Card>
        ))}
      </div>
      <Button className="mt-5" onClick={() => go("settings")}>Improve my description & services</Button>
      <p className="mt-3 text-xs text-muted">Tip: a "low competition, missing" phrase with your area name is usually the fastest win - one honest sentence in your description covers it.</p>
    </div>
  );
}

export function CompetitorsView({ store, go, toast }: { store: StoreT; go: (v: View) => void; toast: (m: string) => void }) {
  const biz = store.activeBusiness;
  const [form, setForm] = useState({ name: "", rating: 4.2, reviewCount: 50, photoCount: 10, postsPerMonth: 2 });
  const reviews = biz ? store.state.reviews.filter((r) => r.businessId === biz.id) : [];
  const myAvg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const myPosts30 = biz ? store.state.posts.filter((p) => p.businessId === biz.id && p.status === "published").length : 0;
  const comps = biz ? store.state.competitors.filter((c) => c.businessId === biz.id) : [];

  if (!biz) return <EmptyState icon={<Swords className="h-6 w-6" aria-hidden />} title="Add a business first" body="Competitor comparison needs your business as the baseline." action={<Button onClick={() => go("onboarding")}>Add my business</Button>} />;

  const rows: { name: string; rating: number; reviewCount: number; photoCount: number; posts: number; you?: boolean }[] = [
    { name: biz.name + " (you)", rating: myAvg, reviewCount: reviews.length, photoCount: biz.photoCount, posts: myPosts30, you: true },
    ...comps.map((c) => ({ name: c.name, rating: c.rating, reviewCount: c.reviewCount, photoCount: c.photoCount, posts: c.postsPerMonth })),
  ];
  const best = {
    rating: Math.max(...rows.map((r) => r.rating)),
    reviewCount: Math.max(...rows.map((r) => r.reviewCount)),
    photoCount: Math.max(...rows.map((r) => r.photoCount)),
    posts: Math.max(...rows.map((r) => r.posts)),
  };
  const add = () => {
    if (form.name.trim().length < 2) return toast("Enter the competitor's name.");
    const c: Competitor = { id: uid(), businessId: biz.id, name: form.name.trim(), rating: Math.min(5, Math.max(1, form.rating)), reviewCount: form.reviewCount, photoCount: form.photoCount, postsPerMonth: form.postsPerMonth };
    store.update((s) => ({ ...s, competitors: [...s.competitors, c] }));
    setForm({ name: "", rating: 4.2, reviewCount: 50, photoCount: 10, postsPerMonth: 2 });
    toast("Competitor added to your watch list.");
  };
  const gap = (() => {
    if (!comps.length) return null;
    const top = comps.reduce((a, b) => (b.reviewCount > a.reviewCount ? b : a));
    if (top.reviewCount > reviews.length) return `${top.name} has ${top.reviewCount} reviews vs your ${reviews.length} tracked here. Review count is your biggest gap - ask every happy customer, and reply to all of them.`;
    if (top.postsPerMonth > myPosts30) return `${top.name} posts about ${top.postsPerMonth}x/month vs your ${myPosts30}. A steady weekly post closes this within a month.`;
    return "You are level or ahead on the visible numbers. Keep the weekly rhythm and watch for changes.";
  })();

  return (
    <div>
      <PageHeader title="Competitor watch" subtitle="Compare the numbers customers can see on Google: rating, reviews, photos and how active the profile looks. Enter figures from their public Google listings." />
      <Card className="overflow-x-auto mb-5">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-muted">
              <th className="px-4 py-3 font-bold">Business</th><th className="px-4 py-3 font-bold">Rating</th><th className="px-4 py-3 font-bold">Reviews</th><th className="px-4 py-3 font-bold">Photos</th><th className="px-4 py-3 font-bold">Posts / month</th><th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className={`border-b border-line last:border-0 ${r.you ? "bg-accent-soft/60 font-bold" : ""}`}>
                <td className="px-4 py-3 text-ink">{r.name}</td>
                <td className="px-4 py-3">{r.rating ? r.rating.toFixed(1) : "-"} {r.rating === best.rating && r.rating > 0 && <Trophy className="inline h-3.5 w-3.5 text-accent" aria-label="best" />}</td>
                <td className="px-4 py-3">{r.reviewCount} {r.reviewCount === best.reviewCount && r.reviewCount > 0 && <Trophy className="inline h-3.5 w-3.5 text-accent" aria-label="best" />}</td>
                <td className="px-4 py-3">{r.photoCount} {r.photoCount === best.photoCount && r.photoCount > 0 && <Trophy className="inline h-3.5 w-3.5 text-accent" aria-label="best" />}</td>
                <td className="px-4 py-3">{r.posts} {r.posts === best.posts && r.posts > 0 && <Trophy className="inline h-3.5 w-3.5 text-accent" aria-label="best" />}</td>
                <td className="px-4 py-3">{!r.you && <button className="text-muted hover:text-danger" aria-label={`Remove ${r.name}`} onClick={() => store.update((s) => ({ ...s, competitors: s.competitors.filter((c) => c.name !== r.name || c.businessId !== biz.id) }))}><Trash2 className="h-4 w-4" aria-hidden /></button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      {gap && <div className="mb-5 rounded-2xl border border-emerald-200 bg-accent-soft px-4 py-3 text-sm font-semibold text-accent-deep">{gap}</div>}
      <Card className="p-5">
        <h2 className="font-bold text-ink">Add a nearby competitor</h2>
        <p className="text-sm text-muted">Open their Google Maps listing (public info) and copy the four numbers.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sharma Sweets" /></Field>
          <Field label="Rating"><Input type="number" step="0.1" min={1} max={5} value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} /></Field>
          <Field label="Reviews"><Input type="number" min={0} value={form.reviewCount} onChange={(e) => setForm({ ...form, reviewCount: Number(e.target.value) })} /></Field>
          <Field label="Photos"><Input type="number" min={0} value={form.photoCount} onChange={(e) => setForm({ ...form, photoCount: Number(e.target.value) })} /></Field>
          <Field label="Posts / month"><Input type="number" min={0} value={form.postsPerMonth} onChange={(e) => setForm({ ...form, postsPerMonth: Number(e.target.value) })} /></Field>
        </div>
        <Button className="mt-4" onClick={add}><Plus className="h-4 w-4" aria-hidden /> Add competitor</Button>
      </Card>
    </div>
  );
}
