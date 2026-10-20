import { useEffect, useState } from "react";
import {
  CalendarClock, CheckCircle2, Gauge, Home, KeyRound, LayoutGrid, LifeBuoy,
  LogOut, Menu, MessageSquareHeart, Plus, Settings, Sparkles, Swords, Wallet, X,
} from "lucide-react";
import Landing from "./views/Landing";
import { AuthView, OnboardingView } from "./views/AuthOnboarding";
import { AuditView, DashboardView } from "./views/DashboardAudit";
import ReviewsView from "./views/Reviews";
import { LibraryView, PostsView, StudioView, type StudioPrefill } from "./views/Studio";
import { CompetitorsView, KeywordsView } from "./views/Growth";
import { BillingView, SettingsView, SupportView } from "./views/More";
import { useAppStore } from "./lib/store";
import type { Template } from "./lib/engine";
import type { View } from "./lib/types";

const NAV: { view: View; label: string; icon: typeof Home }[] = [
  { view: "dashboard", label: "Home", icon: Home },
  { view: "audit", label: "Score Audit", icon: Gauge },
  { view: "reviews", label: "Reviews", icon: MessageSquareHeart },
  { view: "studio", label: "Create Post", icon: Sparkles },
  { view: "library", label: "Templates", icon: LayoutGrid },
  { view: "posts", label: "Posts", icon: CalendarClock },
  { view: "keywords", label: "Keywords", icon: KeyRound },
  { view: "competitors", label: "Competitors", icon: Swords },
  { view: "billing", label: "Plan & Billing", icon: Wallet },
  { view: "support", label: "Support", icon: LifeBuoy },
  { view: "settings", label: "Business Profile", icon: Settings },
];

const APP_VIEWS: View[] = ["dashboard", "audit", "reviews", "studio", "library", "posts", "keywords", "competitors", "billing", "support", "settings", "onboarding"];

export default function App() {
  const store = useAppStore();
  const [view, setView] = useState<View>(() => (store.currentUser ? "dashboard" : "landing"));
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<StudioPrefill | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 4200);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const go = (v: View) => { setView(v); setMoreOpen(false); window.scrollTo({ top: 0 }); };
  const toast = (m: string) => setToastMsg(m);
  const onDemo = () => { store.startDemo(); go("dashboard"); };

  // Auth guards
  const needsAuth = APP_VIEWS.includes(view);
  useEffect(() => {
    if (needsAuth && !store.currentUser) setView("auth");
  }, [needsAuth, store.currentUser]);

  if (view === "landing") return <><Landing go={go} onDemo={onDemo} /><Toast msg={toastMsg} /></>;
  if (view === "auth") return <><AuthView store={store} go={go} /><Toast msg={toastMsg} /></>;
  if (!store.currentUser) {
    return <><AuthView store={store} go={go} /><Toast msg={toastMsg} /></>;
  }

  const useTemplate = (t: Template) => {
    setPrefill({ postType: t.postType, occasion: t.occasion, headline: t.suggestedHeadline, theme: t.theme });
    go("studio");
  };

  const unreplied = store.activeBusiness ? store.state.reviews.filter((r) => r.businessId === store.activeBusiness!.id && !r.replyText).length : 0;

  const content = (() => {
    switch (view) {
      case "onboarding": return <OnboardingView store={store} go={go} />;
      case "dashboard": return <DashboardView store={store} go={go} />;
      case "audit": return <AuditView store={store} go={go} />;
      case "reviews": return <ReviewsView store={store} go={go} toast={toast} />;
      case "studio": return <StudioView store={store} go={go} toast={toast} prefill={prefill} clearPrefill={() => setPrefill(null)} />;
      case "library": return <LibraryView useTemplate={useTemplate} />;
      case "posts": return <PostsView store={store} go={go} toast={toast} />;
      case "keywords": return <KeywordsView store={store} go={go} />;
      case "competitors": return <CompetitorsView store={store} go={go} toast={toast} />;
      case "billing": return <BillingView store={store} toast={toast} />;
      case "support": return <SupportView store={store} toast={toast} />;
      case "settings": return <SettingsView store={store} go={go} toast={toast} />;
      default: return <DashboardView store={store} go={go} />;
    }
  })();

  const navBtn = (n: typeof NAV[number]) => (
    <button key={n.view} onClick={() => go(n.view)}
      className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition ${view === n.view ? "bg-accent text-white shadow-sm" : "text-muted hover:bg-surface hover:text-accent"}`}
      aria-current={view === n.view ? "page" : undefined}>
      <n.icon className="h-5 w-5 shrink-0" aria-hidden />
      {n.label}
      {n.view === "reviews" && unreplied > 0 && <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-extrabold ${view === "reviews" ? "bg-white text-accent" : "bg-danger text-white"}`}>{unreplied}</span>}
    </button>
  );

  return (
    <div className="min-h-screen lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-white px-4 py-5 lg:flex">
        <div className="flex items-center gap-2.5 px-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-lg font-extrabold text-white">D</div>
          <div className="leading-tight">
            <div className="font-extrabold text-ink">Dhandha<span className="text-accent">Ai</span></div>
            <div className="text-[11px] font-semibold text-muted truncate max-w-40">{store.activeBusiness?.name ?? "No business yet"}</div>
          </div>
        </div>
        <nav className="mt-6 flex-1 space-y-1 overflow-y-auto" aria-label="Main">{NAV.map(navBtn)}</nav>
        <div className="border-t border-line pt-3">
          <div className="px-2 text-xs font-semibold text-muted truncate">{store.currentUser.name} - {store.currentUser.plan} plan</div>
          <button className="mt-1.5 flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold text-muted hover:bg-surface hover:text-danger" onClick={() => { store.logout(); go("landing"); }}>
            <LogOut className="h-5 w-5" aria-hidden /> Log out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent font-extrabold text-white">D</div>
          <div className="leading-tight">
            <div className="font-extrabold text-ink">Dhandha<span className="text-accent">Ai</span></div>
            <div className="text-[11px] font-semibold text-muted max-w-44 truncate">{store.activeBusiness?.name ?? "Add your business"}</div>
          </div>
        </div>
        <button className="rounded-lg border border-line p-2 text-muted" onClick={() => setMoreOpen(!moreOpen)} aria-label="Toggle menu" aria-expanded={moreOpen}>
          {moreOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
        </button>
      </header>
      {moreOpen && (
        <div className="border-b border-line bg-white px-4 py-3 lg:hidden sticky top-[57px] z-20 shadow-card">
          <nav className="grid grid-cols-2 gap-1.5" aria-label="All sections">
            {NAV.map((n) => (
              <button key={n.view} onClick={() => go(n.view)} className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold ${view === n.view ? "bg-accent text-white" : "bg-surface text-muted"}`}>
                <n.icon className="h-4.5 w-4.5 shrink-0" aria-hidden />{n.label}
              </button>
            ))}
            <button onClick={() => { store.logout(); go("landing"); }} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold bg-surface text-danger">
              <LogOut className="h-4.5 w-4.5 shrink-0" aria-hidden />Log out
            </button>
          </nav>
        </div>
      )}

      <main className="flex-1 px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:pb-8 max-w-6xl w-full mx-auto">{content}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="Primary">
        <div className="grid grid-cols-5">
          {([
            { view: "dashboard" as View, label: "Home", icon: Home },
            { view: "reviews" as View, label: "Reviews", icon: MessageSquareHeart },
            { view: "studio" as View, label: "Create", icon: Plus },
            { view: "posts" as View, label: "Posts", icon: CalendarClock },
            { view: "audit" as View, label: "Score", icon: Gauge },
          ]).map((n) => (
            <button key={n.view} onClick={() => go(n.view)} aria-current={view === n.view ? "page" : undefined}
              className={`relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-bold ${view === n.view ? "text-accent" : "text-muted"}`}>
              {n.view === "studio" ? (
                <span className="flex h-9 w-9 -mt-4 items-center justify-center rounded-full bg-accent text-white shadow-pop border-4 border-[#f7faf8]"><n.icon className="h-5 w-5" aria-hidden /></span>
              ) : <n.icon className="h-5 w-5" aria-hidden />}
              {n.label}
              {n.view === "reviews" && unreplied > 0 && <span className="absolute right-1/2 translate-x-4 top-1 rounded-full bg-danger px-1.5 text-[10px] font-extrabold text-white">{unreplied}</span>}
            </button>
          ))}
        </div>
      </nav>

      <Toast msg={toastMsg} />
    </div>
  );
}

function Toast({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <div className="fixed bottom-24 lg:bottom-6 left-1/2 z-50 w-[92%] max-w-md -translate-x-1/2 rounded-2xl bg-ink px-4.5 py-3.5 text-sm font-semibold text-white shadow-pop flex gap-2.5 px-4" role="status" aria-live="polite">
      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" aria-hidden />
      <span>{msg}</span>
    </div>
  );
}
