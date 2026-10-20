import { useState } from "react";
import { AlertTriangle, ArrowLeft, Play, Store } from "lucide-react";
import { Button, Card, Field, Input, Select, Textarea } from "../components/ui";
import { CATEGORIES } from "../lib/engine";
import { emptyHours, uid, type Store as StoreT } from "../lib/store";
import type { Business, View } from "../lib/types";

export function AuthView({ store, go }: { store: StoreT; go: (v: View) => void }) {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    setError(null);
    if (mode === "signup") {
      if (name.trim().length < 2) return setError("Please enter your name.");
      if (password.length < 6) return setError("Password must be at least 6 characters.");
      const err = store.signup(name.trim(), email.trim(), password);
      if (err) return setError(err);
      go("onboarding");
    } else {
      const err = store.login(email.trim(), password);
      if (err) return setError(err);
      // onboarding vs dashboard decided by App once state settles; try dashboard, App guards.
      go("dashboard");
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <button className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-accent" onClick={() => go("landing")}>
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back to home
      </button>
      <div className="mb-6 flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-xl font-extrabold text-white">D</div>
        <div>
          <div className="text-lg font-extrabold text-ink leading-none">DhandhaAi</div>
          <div className="text-xs text-muted mt-1">Free forever plan - no card needed</div>
        </div>
      </div>
      <Card className="p-6">
        <div className="grid grid-cols-2 rounded-xl bg-surface p-1 text-sm font-bold" role="tablist" aria-label="Auth mode">
          <button role="tab" aria-selected={mode === "signup"} className={`rounded-lg py-2 ${mode === "signup" ? "bg-white text-accent shadow-card" : "text-muted"}`} onClick={() => setMode("signup")}>Sign up</button>
          <button role="tab" aria-selected={mode === "login"} className={`rounded-lg py-2 ${mode === "login" ? "bg-white text-accent shadow-card" : "text-muted"}`} onClick={() => setMode("login")}>Log in</button>
        </div>
        <form className="mt-5 space-y-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          {mode === "signup" && <Field label="Your name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sarita Sharma" autoComplete="name" /></Field>}
          <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required /></Field>
          <Field label="Password" hint={mode === "signup" ? "At least 6 characters. (Demo build: accounts live in this browser only.)" : undefined}>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete={mode === "signup" ? "new-password" : "current-password"} required />
          </Field>
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-danger" role="alert">{error}</div>}
          <Button type="submit" className="w-full py-3">{mode === "signup" ? "Create free account" : "Log in"}</Button>
        </form>
        <div className="my-5 flex items-center gap-3 text-xs font-semibold text-muted"><span className="h-px flex-1 bg-line" />OR<span className="h-px flex-1 bg-line" /></div>
        <Button variant="secondary" className="w-full py-3" onClick={() => { store.startDemo(); go("dashboard"); }}>
          <Play className="h-4 w-4" aria-hidden /> Explore the demo cafe
        </Button>
        <p className="mt-3 text-center text-xs text-muted">Demo opens a sample Kathmandu cafe with sample reviews, so you can see every feature working.</p>
      </Card>
    </div>
  );
}

const DAYS: [keyof Business["hours"], string][] = [
  ["mon", "Monday"], ["tue", "Tuesday"], ["wed", "Wednesday"], ["thu", "Thursday"],
  ["fri", "Friday"], ["sat", "Saturday"], ["sun", "Sunday"],
];

export function BusinessForm({ initial, onSave, saveLabel }: { initial?: Partial<Business>; onSave: (b: Partial<Business>) => void; saveLabel: string }) {
  const [f, setF] = useState({
    name: initial?.name ?? "", category: initial?.category ?? CATEGORIES[0],
    city: initial?.city ?? "", area: initial?.area ?? "", address: initial?.address ?? "",
    phone: initial?.phone ?? "", website: initial?.website ?? "", description: initial?.description ?? "",
    services: (initial?.services ?? []).join(", "), photoCount: initial?.photoCount ?? 0,
  });
  const [hours, setHours] = useState(initial?.hours ?? emptyHours());
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f, v: string | number) => setF((p) => ({ ...p, [k]: v }));

  const submit = () => {
    if (f.name.trim().length < 2) return setError("Please enter your business name exactly as customers know it.");
    if (!f.city.trim()) return setError("Please enter your city - local search needs it.");
    onSave({
      name: f.name.trim(), category: f.category, city: f.city.trim(), area: f.area.trim(),
      address: f.address.trim(), phone: f.phone.trim(), website: f.website.trim(),
      description: f.description.trim(),
      services: f.services.split(",").map((s) => s.trim()).filter(Boolean),
      photoCount: Number(f.photoCount) || 0, hours,
    });
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Business name" hint="Use your real shop name - do not add keywords like 'Best Salon Kathmandu'. Google suspends listings for that.">
          <Input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Sajilo Hair Studio" />
        </Field>
        <Field label="Category">
          <Select value={f.category} onChange={(e) => set("category", e.target.value)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select>
        </Field>
        <Field label="City"><Input value={f.city} onChange={(e) => set("city", e.target.value)} placeholder="e.g. Kathmandu" /></Field>
        <Field label="Area / locality"><Input value={f.area} onChange={(e) => set("area", e.target.value)} placeholder="e.g. Thamel" /></Field>
        <Field label="Full address"><Input value={f.address} onChange={(e) => set("address", e.target.value)} placeholder="Street, landmark" /></Field>
        <Field label="Phone (tap-to-call on Google)"><Input value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+977 98XXXXXXXX" /></Field>
        <Field label="Website or social page URL"><Input value={f.website} onChange={(e) => set("website", e.target.value)} placeholder="https://..." /></Field>
        <Field label="Photos currently on Google profile" hint="Rough count is fine - the audit uses it.">
          <Input type="number" min={0} value={f.photoCount} onChange={(e) => set("photoCount", Number(e.target.value))} />
        </Field>
      </div>
      <Field label="Description" hint="Aim for 120+ characters: what you offer, who for, which area and city. This text is what Google matches to searches.">
        <Textarea rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="We are a ... in ... We offer ..." />
      </Field>
      <Field label="Services / main items" hint="Comma separated, at least 5. Be specific - each one can match a separate search.">
        <Input value={f.services} onChange={(e) => set("services", e.target.value)} placeholder="Haircut, Beard trim, Hair colour, Facial, Head massage" />
      </Field>
      <div>
        <span className="mb-2 block text-sm font-semibold text-ink">Opening hours</span>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {DAYS.map(([k, label]) => (
            <label key={k} className="flex items-center gap-2 text-sm">
              <span className="w-24 shrink-0 font-semibold text-muted">{label}</span>
              <Input value={hours[k]} onChange={(e) => setHours((h) => ({ ...h, [k]: e.target.value }))} placeholder="Closed" />
            </label>
          ))}
        </div>
      </div>
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-danger" role="alert">{error}</div>}
      <Button type="submit" className="py-3 px-6"><Store className="h-4 w-4" aria-hidden /> {saveLabel}</Button>
    </form>
  );
}

export function OnboardingView({ store, go }: { store: StoreT; go: (v: View) => void }) {
  const user = store.currentUser;
  const dupWarning = (name: string, phone?: string) =>
    store.myBusinesses.some((b) => b.name.toLowerCase() === name.toLowerCase() || (phone && b.phone && b.phone === phone));
  const [warn, setWarn] = useState(false);

  if (!user) return null;
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold text-ink">Add your business, {user.name.split(" ")[0]}</h1>
      <p className="mt-1 text-sm text-muted">Two minutes now powers your audit, keywords and every AI draft. You can fix anything later in Business profile.</p>
      {warn && (
        <div className="mt-4 flex gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-warn" role="alert">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span><strong>Possible duplicate:</strong> you already have a business with this name or phone. On Google, duplicate profiles split your reviews and hurt ranking - check your existing business first, or save anyway if this is a separate branch.</span>
        </div>
      )}
      <Card className="mt-5 p-6">
        <BusinessForm
          saveLabel="Save & run my free audit"
          onSave={(partial) => {
            if (!warn && dupWarning(partial.name ?? "", partial.phone)) { setWarn(true); return; }
            const biz: Business = {
              id: uid(), ownerId: user.id, name: "", category: CATEGORIES[0], city: "", area: "", address: "",
              phone: "", website: "", description: "", services: [], hours: emptyHours(), photoCount: 0,
              googleConnected: false, facebookConnected: false, instagramConnected: false,
              createdAt: new Date().toISOString(), ...partial,
            } as Business;
            store.update((s) => ({ ...s, businesses: [...s.businesses, biz], activeBusinessId: biz.id }));
            go("audit");
          }}
        />
      </Card>
      <button className="mt-4 text-sm font-semibold text-muted hover:text-accent" onClick={() => go("dashboard")}>Skip for now - look around first</button>
    </div>
  );
}
