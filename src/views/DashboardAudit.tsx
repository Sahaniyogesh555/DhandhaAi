import { useEffect, useMemo } from "react";
import {
  ArrowRight, CalendarClock, CheckCircle2, CircleAlert, CircleX, Gauge,
  MessageSquareHeart, Sparkles, Store, TrendingUp, Wrench,
} from "lucide-react";
import { Badge, Button, Card, EmptyState, PageHeader, ScoreBar, ScoreRing } from "../components/ui";
import { runAudit, type CheckStatus } from "../lib/engine";
import { uid, type Store as StoreT } from "../lib/store";
import type { Business, View } from "../lib/types";

const FACTOR_LABELS = { gbp: "Google profile", reviews: "Reviews & replies", social: "Social activity", keywords: "Local keywords" } as const;

export function useAudit(store: StoreT, biz: Business | null) {
  return useMemo(() => (biz ? runAudit(biz, store.state.reviews, store.state.posts) : null), [biz, store.state.reviews, store.state.posts]);
}

export function DashboardView({ store, go }: { store: StoreT; go: (v: View) => void }) {
  const biz = store.activeBusiness;
  const audit = useAudit(store, biz);
  const bizReviews = biz ? store.state.reviews.filter((r) => r.businessId === biz.id) : [];
  const unreplied = bizReviews.filter((r) => !r.replyText).length;
  const bizPosts = biz ? store.state.posts.filter((p) => p.businessId === biz.id) : [];
  const scheduled = bizPosts.filter((p) => p.status === "scheduled").length;

  // record a daily score snapshot for the trend
  useEffect(() => {
    if (!biz || !audit) return;
    const today = new Date().toDateString();
    const exists = store.state.snapshots.some((s) => s.businessId === biz.id && new Date(s.createdAt).toDateString() === today);
    if (!exists) {
      store.update((s) => ({ ...s, snapshots: [...s.snapshots, { id: uid(), businessId: biz.id, overall: audit.overall, factors: audit.factors, checks: audit.checks, createdAt: new Date().toISOString() }] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biz?.id, audit?.overall]);

  if (!biz || !audit) {
    return (
      <div>
        <PageHeader title="Welcome to DhandhaAi" subtitle="Add your business to unlock your free audit, AI replies and posts." />
        <EmptyState icon={<Store className="h-6 w-6" aria-hidden />} title="No business yet" body="It takes about two minutes. Your details power the audit and every AI draft - nothing is invented about your business, ever."
          action={<Button onClick={() => go("onboarding")}>Add my business <ArrowRight className="h-4 w-4" aria-hidden /></Button>} />
      </div>
    );
  }

  const topFixes = audit.checks.filter((c) => c.status !== "pass").sort((a, b) => (b.impact - b.earned) - (a.impact - a.earned)).slice(0, 3);
  const snaps = store.state.snapshots.filter((s) => s.businessId === biz.id).slice(-7);

  return (
    <div>
      <PageHeader title={biz.name} subtitle={`${biz.category} • ${[biz.area, biz.city].filter(Boolean).join(", ")}`}
        action={<Button onClick={() => go("studio")}><Sparkles className="h-4 w-4" aria-hidden /> Create a post</Button>} />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-6 flex flex-col items-center justify-center">
          <ScoreRing value={audit.overall} size={150} />
          <p className="mt-3 text-center text-sm font-semibold text-muted">Overall profile health</p>
          <Button variant="ghost" className="mt-1" onClick={() => go("audit")}>See full audit <ArrowRight className="h-4 w-4" aria-hidden /></Button>
          {snaps.length > 1 && (
            <div className="mt-3 flex items-end gap-1.5" aria-label="Score trend">
              {snaps.map((s) => <div key={s.id} title={`${s.overall}`} className="w-4 rounded-t bg-accent/70" style={{ height: `${Math.max(6, s.overall / 2)}px` }} />)}
              <span className="ml-2 inline-flex items-center gap-1 text-xs font-bold text-accent"><TrendingUp className="h-3.5 w-3.5" aria-hidden /> trend</span>
            </div>
          )}
        </Card>

        <Card className="p-6 lg:col-span-2">
          <h2 className="font-bold text-ink">Where you stand</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <ScoreBar label={FACTOR_LABELS.gbp} value={audit.factors.gbp} />
            <ScoreBar label={FACTOR_LABELS.reviews} value={audit.factors.reviews} />
            <ScoreBar label={FACTOR_LABELS.social} value={audit.factors.social} />
            <ScoreBar label={FACTOR_LABELS.keywords} value={audit.factors.keywords} />
          </div>
          <h3 className="mt-6 font-bold text-ink">Next best actions</h3>
          {topFixes.length ? (
            <ul className="mt-3 space-y-2.5">
              {topFixes.map((c) => (
                <li key={c.id} className="flex items-start gap-3 rounded-xl bg-surface px-3.5 py-3">
                  <StatusIcon status={c.status} />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-bold text-ink">{c.label}</span><Badge tone="accent">+{c.impact - c.earned} pts</Badge></div>
                    <p className="text-sm text-muted">{c.detail}</p>
                  </div>
                  <Button variant="secondary" className="shrink-0 px-3 py-1.5 text-xs" onClick={() => go("audit")}><Wrench className="h-3.5 w-3.5" aria-hidden /> Fix</Button>
                </li>
              ))}
            </ul>
          ) : <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-success"><CheckCircle2 className="h-4 w-4" aria-hidden /> Every check passing. Keep the weekly rhythm going.</p>}
        </Card>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted"><MessageSquareHeart className="h-5 w-5 text-accent" aria-hidden /><span className="text-sm font-bold">Reviews waiting</span></div>
          <div className="mt-2 text-3xl font-extrabold text-ink">{unreplied}</div>
          <p className="text-sm text-muted">{unreplied ? "Unanswered reviews lose you customers reading them today." : "All caught up. Well done."}</p>
          <Button variant="ghost" className="mt-2 px-0" onClick={() => go("reviews")}>Reply with AI <ArrowRight className="h-4 w-4" aria-hidden /></Button>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted"><CalendarClock className="h-5 w-5 text-accent" aria-hidden /><span className="text-sm font-bold">Posts scheduled</span></div>
          <div className="mt-2 text-3xl font-extrabold text-ink">{scheduled}</div>
          <p className="text-sm text-muted">{scheduled ? "Your upcoming week is covered." : "Nothing lined up - batch next week in 10 minutes."}</p>
          <Button variant="ghost" className="mt-2 px-0" onClick={() => go("posts")}>View calendar <ArrowRight className="h-4 w-4" aria-hidden /></Button>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted"><Gauge className="h-5 w-5 text-accent" aria-hidden /><span className="text-sm font-bold">Quick win available</span></div>
          <div className="mt-2 text-base font-extrabold text-ink">{topFixes[0] ? `+${topFixes[0].impact - topFixes[0].earned} points: ${topFixes[0].label}` : "Profile complete"}</div>
          <p className="text-sm text-muted">{topFixes[0]?.fixHint ?? "Keep posting weekly to hold your score."}</p>
          <Button variant="ghost" className="mt-2 px-0" onClick={() => go("audit")}>Open audit <ArrowRight className="h-4 w-4" aria-hidden /></Button>
        </Card>
      </div>
    </div>
  );
}

export function StatusIcon({ status }: { status: CheckStatus }) {
  if (status === "pass") return <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden />;
  if (status === "warn") return <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-warn" aria-hidden />;
  return <CircleX className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden />;
}

const FIX_ROUTE: Record<string, View> = {
  "gbp-category": "settings", "gbp-address": "settings", "gbp-phone": "settings", "gbp-hours": "settings",
  "gbp-desc": "settings", "gbp-services": "settings", "gbp-photos": "settings", "gbp-website": "settings",
  "rev-count": "reviews", "rev-response": "reviews", "rev-rating": "reviews",
  "soc-cadence": "studio", "soc-scheduled": "studio", "soc-google": "studio",
  "kw-coverage": "keywords", "kw-city": "settings", "kw-cat": "settings",
};

export function AuditView({ store, go }: { store: StoreT; go: (v: View) => void }) {
  const biz = store.activeBusiness;
  const audit = useAudit(store, biz);
  if (!biz || !audit) {
    return <EmptyState icon={<Store className="h-6 w-6" aria-hidden />} title="Add a business first" body="The audit needs your business details to check against." action={<Button onClick={() => go("onboarding")}>Add my business</Button>} />;
  }
  const factors = (Object.keys(FACTOR_LABELS) as (keyof typeof FACTOR_LABELS)[]);
  return (
    <div>
      <PageHeader title="Google Score Audit" subtitle="Every point below traces to a check you can see and fix. Fix one, and your score updates instantly - no waiting, no agent." />
      <Card className="p-6 mb-5 flex flex-col sm:flex-row items-center gap-8">
        <ScoreRing value={audit.overall} size={150} />
        <div className="grid flex-1 w-full gap-4 sm:grid-cols-2">
          {factors.map((k) => <ScoreBar key={k} label={FACTOR_LABELS[k]} value={audit.factors[k]} />)}
        </div>
      </Card>
      {factors.map((k) => (
        <section key={k} className="mb-6">
          <h2 className="mb-3 text-lg font-extrabold text-ink">{FACTOR_LABELS[k]} <span className="text-sm font-bold text-muted">- {audit.factors[k]}/100</span></h2>
          <div className="space-y-2.5">
            {audit.checks.filter((c) => c.factor === k).map((c) => (
              <Card key={c.id} className="p-4 flex items-start gap-3">
                <StatusIcon status={c.status} />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-ink">{c.label}</span>
                    {c.status === "pass" ? <Badge tone="good">Done</Badge> : <Badge tone={c.status === "warn" ? "warn" : "bad"}>+{c.impact - c.earned} pts available</Badge>}
                  </div>
                  <p className="mt-0.5 text-sm text-muted">{c.detail}</p>
                  {c.status !== "pass" && <p className="mt-1 text-sm text-accent font-semibold">{c.fixHint}</p>}
                </div>
                {c.status !== "pass" && <Button variant="secondary" className="shrink-0" onClick={() => go(FIX_ROUTE[c.id] ?? "settings")}>Fix now</Button>}
              </Card>
            ))}
          </div>
        </section>
      ))}
      <p className="text-xs text-muted">How scoring works: Google profile 40%, reviews 25%, social activity 20%, local keywords 15%. We never invent search volumes or map rankings - when the official Google connection is live, these same checks run on your real profile data.</p>
    </div>
  );
}
