import { useState } from "react";
import { Check, Facebook, Globe, Instagram, LifeBuoy, LogOut, Mail, MessageCircle, Plus, Store } from "lucide-react";
import { Badge, Button, Card, EmptyState, Field, Input, PageHeader, Textarea } from "../components/ui";
import { PLANS } from "./Landing";
import { BusinessForm } from "./AuthOnboarding";
import { fmtDate, uid, type Store as StoreT } from "../lib/store";
import type { PlanId, Ticket, View } from "../lib/types";

export function BillingView({ store, toast }: { store: StoreT; toast: (m: string) => void }) {
  const user = store.currentUser!;
  const choose = (plan: PlanId) => {
    store.update((s) => ({ ...s, users: s.users.map((u) => u.id === user.id ? { ...u, plan } : u) }));
    toast(plan === "free" ? "Switched to Free. No lock-in, no calls - the door stays open both ways." : `${PLANS.find((p) => p.id === plan)?.name} preview selected for this session only. No payment or paid access is granted.`);
  };
  return (
    <div>
      <PageHeader title="Plan & billing" subtitle="The price you saw is the price. Cancel in two clicks, keep access until your paid period ends. Nobody will call to talk you out of it." />
      <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-warn">Demo billing only: plan buttons are a temporary preview. No money is taken, paid access is not granted, and a selected plan is not saved. Live checkout must be verified server-side.</p>
      <div className="grid gap-5 md:grid-cols-3">
        {PLANS.map((p) => (
          <Card key={p.id} className={`p-6 ${user.plan === p.id ? "border-accent ring-2 ring-accent" : ""}`}>
            <div className="flex items-center justify-between"><h3 className="font-extrabold text-ink">{p.name}</h3>{user.plan === p.id && <Badge tone="good">Current plan</Badge>}</div>
            <div className="mt-2 flex items-baseline gap-1"><span className="text-3xl font-extrabold text-ink">{p.price}</span><span className="text-sm text-muted">{p.period}</span></div>
            <p className="mt-1 text-sm text-muted">{p.blurb}</p>
            <ul className="mt-5 space-y-2.5 text-sm text-ink">
              {p.features.map((f) => <li key={f} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />{f}</li>)}
            </ul>
            <Button className="mt-6 w-full" variant={user.plan === p.id ? "secondary" : "primary"} disabled={user.plan === p.id} onClick={() => choose(p.id)}>
              {user.plan === p.id ? "Active" : `Switch to ${p.name}`}
            </Button>
          </Card>
        ))}
      </div>
      <Card className="mt-5 p-5">
        <h3 className="font-bold text-ink">Our billing promises</h3>
        <ul className="mt-3 grid gap-2 text-sm text-muted sm:grid-cols-2">
          <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden /> No autopay traps: renewals are reminder-first, cancellation keeps paid access.</li>
          <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden /> No "your plan is useless, pay 10x more" calls. Ever.</li>
          <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden /> Every quota is printed above before you pay.</li>
          <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden /> If we publish something wrong after your approval, that month's post quota is on us.</li>
        </ul>
        <p className="mt-4 text-xs text-muted">This demo takes no payment. Live checkout connects the owner's own eSewa/Khalti/Stripe account - money never passes through anyone else's hands.</p>
      </Card>
    </div>
  );
}

export function SupportView({ store, toast }: { store: StoreT; toast: (m: string) => void }) {
  const user = store.currentUser!;
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const mine = store.state.tickets.filter((t) => t.userId === user.id);

  const submit = () => {
    if (subject.trim().length < 4 || message.trim().length < 8) return toast("Please add a short subject and describe the problem.");
    const t: Ticket = { id: uid(), userId: user.id, subject: subject.trim(), message: message.trim(), status: "open", createdAt: new Date().toISOString() };
    store.update((s) => ({ ...s, tickets: [t, ...s.tickets] }));
    setSubject(""); setMessage("");
    toast("Ticket raised. Its status stays visible right here - no error screens, no dead ends.");
  };

  return (
    <div>
      <PageHeader title="Support" subtitle="Real ways to reach a human, printed in the open. Target: first reply within 1 business day." />
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Card className="p-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent"><Mail className="h-5 w-5" aria-hidden /></div><div><div className="text-sm font-bold text-ink">Email us</div><div className="text-sm text-muted">hello@dhandhaai.example</div></div></Card>
        <Card className="p-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent"><MessageCircle className="h-5 w-5" aria-hidden /></div><div><div className="text-sm font-bold text-ink">WhatsApp</div><div className="text-sm text-muted">+977 98XXXXXXXX (owner to set)</div></div></Card>
        <Card className="p-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent"><LifeBuoy className="h-5 w-5" aria-hidden /></div><div><div className="text-sm font-bold text-ink">Hours</div><div className="text-sm text-muted">Sun-Fri, 10 AM - 6 PM NPT</div></div></Card>
      </div>
      <Card className="p-5 mb-5">
        <h2 className="font-bold text-ink">Raise a ticket</h2>
        <div className="mt-4 space-y-4">
          <Field label="Subject"><Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. My Instagram will not connect" /></Field>
          <Field label="What happened?" hint="What you tried, what you expected, what you saw. Screenshots can be sent on WhatsApp.">
            <Textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe it in your own words..." />
          </Field>
          <Button onClick={submit}><Plus className="h-4 w-4" aria-hidden /> Raise ticket</Button>
        </div>
      </Card>
      {mine.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-bold text-ink">Your tickets</h2>
          {mine.map((t) => (
            <Card key={t.id} className="p-4">
              <div className="flex flex-wrap items-center gap-2"><span className="font-bold text-ink">{t.subject}</span><Badge tone={t.status === "resolved" ? "good" : t.status === "in_progress" ? "warn" : "accent"}>{t.status.replace("_", " ")}</Badge><span className="text-xs text-muted">{fmtDate(t.createdAt)}</span></div>
              <p className="mt-1 text-sm text-muted">{t.message}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function SettingsView({ store, go, toast }: { store: StoreT; go: (v: View) => void; toast: (m: string) => void }) {
  const biz = store.activeBusiness;
  const user = store.currentUser!;
  if (!biz) return <EmptyState icon={<Store className="h-6 w-6" aria-hidden />} title="Add a business first" body="Your business profile powers the audit, keywords and every AI draft." action={<Button onClick={() => go("onboarding")}>Add my business</Button>} />;

  const toggle = (k: "googleConnected" | "facebookConnected" | "instagramConnected", label: string) => {
    const next = !biz[k];
    store.update((s) => ({ ...s, businesses: s.businesses.map((b) => b.id === biz.id ? { ...b, [k]: next } : b) }));
    toast(next ? `${label} marked connected (simulated). Live connection uses ${label}'s official sign-in once our developer app is approved - your password is never asked here.` : `${label} disconnected.`);
  };

  return (
    <div>
      <PageHeader title="Business profile" subtitle="This is the source of truth for your audit and AI drafts. Keep it accurate - drafts quote these facts." />
      {store.myBusinesses.length > 1 && (
        <Card className="p-4 mb-5 flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-ink mr-1">Your businesses:</span>
          {store.myBusinesses.map((b) => (
            <button key={b.id} onClick={() => store.update((s) => ({ ...s, activeBusinessId: b.id }))}
              className={`rounded-full px-3.5 py-1.5 text-sm font-bold ${b.id === biz.id ? "bg-accent text-white" : "bg-surface border border-line text-muted"}`}>{b.name}</button>
          ))}
        </Card>
      )}
      <Card className="p-6 mb-5">
        <BusinessForm initial={biz} saveLabel="Save profile (audit re-runs instantly)" onSave={(partial) => {
          store.update((s) => ({ ...s, businesses: s.businesses.map((b) => b.id === biz.id ? { ...b, ...partial } : b) }));
          toast("Profile saved. Check your new score on the Dashboard.");
          go("dashboard");
        }} />
      </Card>
      <Card className="p-6 mb-5">
        <h2 className="font-bold text-ink">Connected accounts</h2>
        <p className="mt-1 text-sm text-muted">Connections use each platform's official sign-in with our own approved developer apps. Until approvals complete these toggles are simulated - and every feature still works via download & copy.</p>
        <div className="mt-4 space-y-3">
          {([
            ["googleConnected", "Google Business Profile", Globe],
            ["facebookConnected", "Facebook Page", Facebook],
            ["instagramConnected", "Instagram", Instagram],
          ] as const).map(([k, label, Icon]) => (
            <div key={k} className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
              <span className="inline-flex items-center gap-2.5 font-semibold text-ink"><Icon className="h-5 w-5 text-accent" aria-hidden />{label}</span>
              <div className="flex items-center gap-2">
                {biz[k] ? <Badge tone="good">Connected (simulated)</Badge> : <Badge>Not connected</Badge>}
                <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => toggle(k, label)}>{biz[k] ? "Disconnect" : "Connect"}</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-6">
        <h2 className="font-bold text-ink">Account</h2>
        <p className="mt-1 text-sm text-muted">Signed in as {user.name} ({user.email}) on the {user.plan} plan.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => go("onboarding")}><Plus className="h-4 w-4" aria-hidden /> Add another business</Button>
          <Button variant="ghost" className="text-danger" onClick={() => { store.logout(); go("landing"); }}><LogOut className="h-4 w-4" aria-hidden /> Log out</Button>
        </div>
      </Card>
    </div>
  );
}
