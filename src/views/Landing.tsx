import { useMemo, useState } from "react";
import {
  ArrowRight, BadgeCheck, CalendarClock, Check, ChevronDown, Gauge, ImagePlus,
  KeyRound, MapPin, MessageSquareHeart, Play, ShieldCheck, Sparkles, Swords, Wallet,
} from "lucide-react";
import { Button, Card, Field, ScoreRing, Select } from "../components/ui";
import { CATEGORIES } from "../lib/engine";
import type { View } from "../lib/types";

export const PLANS = [
  {
    id: "free" as const, name: "Free", price: "रू 0", period: "forever",
    blurb: "See where you stand, fix the basics.",
    features: ["Google score audit (unlimited re-runs)", "5 AI review replies / month", "4 AI posts / month with poster download", "1 business", "Festival template library"],
  },
  {
    id: "growth" as const, name: "Growth", price: "रू 999", period: "/ month",
    blurb: "For shops that want steady weekly growth.",
    features: ["Everything in Free", "50 AI review replies / month", "30 AI posts / month + scheduling", "Keyword & competitor tracking", "Nepali, Hindi & English captions", "2 businesses"],
  },
  {
    id: "pro" as const, name: "Pro", price: "रू 1,999", period: "/ month",
    blurb: "For busy, multi-branch local brands.",
    features: ["Everything in Growth", "Unlimited AI replies & posts", "5 businesses / branches", "Priority support (reply within 1 business day)", "Score trend reports"],
  },
];

const FAQS = [
  {
    q: "Do I need a sales call or agent visit to start?",
    a: "No. DhandhaAi is fully self-serve. Sign up, add your business, and your audit runs immediately. Nobody will call you twice a day - and if you ever need a human, support contacts are shown right inside the app.",
  },
  {
    q: "Will AI post wrong things about my products?",
    a: "Nothing publishes without your approval - ever. Our drafting engine only uses facts you type yourself (your offer, your price, your product name). It cannot invent products or claims, and every post shows a full preview before you approve it.",
  },
  {
    q: "How does billing work? Is there an autopay lock-in?",
    a: "Prices on this page are the prices - no 'starter pack' that turns useless tomorrow, no surprise upgrade calls. Cancel in two clicks inside the app and you keep access until the end of the period you paid for.",
  },
  {
    q: "Does it post directly to Google, Facebook and Instagram?",
    a: "Today you can download posters and copy captions to share anywhere in seconds. One-tap direct posting uses Google's and Meta's official APIs and needs their app approvals, which we are setting up with our own developer accounts - the publish queue you see in the app is exactly where it will plug in.",
  },
  {
    q: "My English is not strong. Can I use it?",
    a: "Yes - review replies and captions can be generated in Nepali and Hindi as well as English, in the words your own customers use.",
  },
];

function MiniChecker({ go, onDemo }: { go: (v: View) => void; onDemo: () => void }) {
  const [photos, setPhotos] = useState("few");
  const [reply, setReply] = useState("sometimes");
  const [posts, setPosts] = useState("rarely");
  const [hours, setHours] = useState("yes");
  const [desc, setDesc] = useState("short");
  const [cat, setCat] = useState(CATEGORIES[0]);

  const { score, fixes } = useMemo(() => {
    let s = 18; // having a listing at all
    const f: string[] = [];
    if (hours === "yes") s += 14; else f.push("Add opening hours for all 7 days - 'open now' searches skip you without them.");
    if (photos === "many") s += 18; else if (photos === "few") { s += 8; f.push("Add photos up to 10+ (storefront, inside, team, products) - photo-rich profiles get far more taps."); }
    else f.push("Add your first photos today - listings without photos look closed.");
    if (desc === "detailed") s += 16; else if (desc === "short") { s += 6; f.push("Write a fuller description naming your services and your city - that text is what Google matches."); }
    else f.push("Write a description: what you do, who for, which area. Two honest sentences work.");
    if (reply === "always") s += 18; else if (reply === "sometimes") { s += 8; f.push("Reply to every review - reply rate is a ranking and trust signal, and it's free."); }
    else f.push("Start replying to reviews (even the tough ones). Unanswered 1-star reviews scare new customers most.");
    if (posts === "weekly") s += 16; else if (posts === "monthly") { s += 7; f.push("Post weekly, not monthly - fresh Google and social updates keep you visible."); }
    else f.push("Begin a simple weekly post: one offer, one photo, one festival greeting.");
    return { score: Math.min(96, s), fixes: f.slice(0, 3) };
  }, [photos, reply, posts, hours, desc]);

  return (
    <Card className="p-6 sm:p-8">
      <div className="flex items-center gap-2 text-accent font-bold text-sm uppercase tracking-wide"><Gauge className="h-4 w-4" aria-hidden /> Free score check</div>
      <h3 className="mt-2 text-xl font-extrabold text-ink">How healthy is your Google profile?</h3>
      <p className="mt-1 text-sm text-muted">Answer honestly - this estimate uses the same checks as the full audit, based only on your answers.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="What kind of business?">
          <Select value={cat} onChange={(e) => setCat(e.target.value)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select>
        </Field>
        <Field label="Opening hours listed on Google?">
          <Select value={hours} onChange={(e) => setHours(e.target.value)}>
            <option value="yes">Yes, for the whole week</option><option value="no">No / not sure</option>
          </Select>
        </Field>
        <Field label="Photos on your Google profile?">
          <Select value={photos} onChange={(e) => setPhotos(e.target.value)}>
            <option value="many">10 or more</option><option value="few">A few (1-9)</option><option value="none">None yet</option>
          </Select>
        </Field>
        <Field label="Business description on Google?">
          <Select value={desc} onChange={(e) => setDesc(e.target.value)}>
            <option value="detailed">Detailed, with services & city</option><option value="short">Short / one line</option><option value="none">None</option>
          </Select>
        </Field>
        <Field label="Do you reply to Google reviews?">
          <Select value={reply} onChange={(e) => setReply(e.target.value)}>
            <option value="always">Almost always</option><option value="sometimes">Sometimes</option><option value="never">Never / rarely</option>
          </Select>
        </Field>
        <Field label="How often do you post offers/photos?">
          <Select value={posts} onChange={(e) => setPosts(e.target.value)}>
            <option value="weekly">Every week</option><option value="monthly">About monthly</option><option value="rarely">Rarely / never</option>
          </Select>
        </Field>
      </div>
      <div className="mt-6 flex flex-col sm:flex-row items-center gap-6 rounded-2xl bg-surface p-5">
        <ScoreRing value={score} size={120} />
        <div className="flex-1">
          <p className="font-bold text-ink">Your estimated profile health for a {cat.toLowerCase()}</p>
          {fixes.length ? (
            <ul className="mt-2 space-y-1.5 text-sm text-muted">
              {fixes.map((x) => <li key={x} className="flex gap-2"><ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />{x}</li>)}
            </ul>
          ) : <p className="mt-2 text-sm text-muted">Strong basics! The full audit digs into keywords, competitors and posting rhythm.</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => go("auth")}>Run my full free audit <ArrowRight className="h-4 w-4" aria-hidden /></Button>
            <Button variant="secondary" onClick={onDemo}><Play className="h-4 w-4" aria-hidden /> See the demo</Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function Landing({ go, onDemo }: { go: (v: View) => void; onDemo: () => void }) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const features = [
    { icon: Gauge, title: "Free Google Score Audit", body: "One clear score across your Google profile, reviews, social activity and keywords - with a fix-list ordered by impact, not jargon." },
    { icon: MessageSquareHeart, title: "AI review replies", body: "Personal replies in seconds, in English, Nepali or Hindi - warm for fans, calm and accountable for 1-star reviews." },
    { icon: Sparkles, title: "AI social posts + posters", body: "Festival greetings, offers and product posts with a ready poster image. Preview exactly what will go out, then approve." },
    { icon: CalendarClock, title: "Weekly Google updates", body: "Keep your Maps profile fresh with a weekly offer, photo or event - scheduled in one sitting for the whole month." },
    { icon: KeyRound, title: "Local keyword finder", body: "The exact phrases nearby customers search, checked against your own profile text - with honest guidance, no fake numbers." },
    { icon: Swords, title: "Competitor watch", body: "See how nearby rivals compare on rating, reviews, photos and posting rhythm - and what to do about it." },
  ];
  return (
    <div className="bg-[#f7faf8]">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-lg font-extrabold text-white">D</div>
            <span className="text-lg font-extrabold tracking-tight text-ink">Dhandha<span className="text-accent">Ai</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-muted">
            <a href="#features" className="hover:text-accent">Features</a>
            <a href="#score" className="hover:text-accent">Free score</a>
            <a href="#pricing" className="hover:text-accent">Pricing</a>
            <a href="#faq" className="hover:text-accent">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => go("auth")}>Log in</Button>
            <Button onClick={() => go("auth")}>Start free</Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-14 pb-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-accent-soft px-3.5 py-1.5 text-xs font-bold text-accent">
          <MapPin className="h-3.5 w-3.5" aria-hidden /> Built for local shops in Nepal & India
        </div>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl sm:text-5xl font-extrabold leading-[1.08] tracking-tight text-ink">
          Get found on Google. <span className="text-accent">Stay active everywhere.</span> Without a marketing team.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg text-muted">
          DhandhaAi audits your Google Business Profile, drafts your review replies and social posts,
          and keeps your profile fresh every week - and nothing ever posts without your approval.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button className="px-6 py-3 text-base" onClick={() => go("auth")}>Check my score - free <ArrowRight className="h-5 w-5" aria-hidden /></Button>
          <Button variant="secondary" className="px-6 py-3 text-base" onClick={onDemo}><Play className="h-5 w-5" aria-hidden /> Try the live demo</Button>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-semibold text-muted">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-accent" aria-hidden /> No sales calls</span>
          <span className="inline-flex items-center gap-1.5"><BadgeCheck className="h-4 w-4 text-accent" aria-hidden /> You approve every post</span>
          <span className="inline-flex items-center gap-1.5"><Wallet className="h-4 w-4 text-accent" aria-hidden /> Transparent pricing, cancel in 2 clicks</span>
        </div>
      </section>

      {/* Score checker */}
      <section id="score" className="mx-auto max-w-4xl px-4 sm:px-6 pb-16">
        <MiniChecker go={go} onDemo={onDemo} />
      </section>

      {/* Features */}
      <section id="features" className="border-y border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-ink">Everything a busy owner needs. Nothing to learn.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-muted">Salons, clinics, cafes, kirana stores, workshops - if customers find you on Google Maps, this is your weekly marketing, handled.</p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title} className="p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent"><f.icon className="h-5 w-5" aria-hidden /></div>
                <h3 className="mt-4 font-bold text-ink">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-ink">From invisible to active in one sitting</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            { n: "1", icon: Gauge, t: "Audit", b: "Add your business once. Get your score and a plain-language fix list - most fixes take under a minute each." },
            { n: "2", icon: MessageSquareHeart, t: "Reply & post", b: "Clear your review backlog with AI drafts, then create this week's posts from festival and offer templates." },
            { n: "3", icon: ImagePlus, t: "Stay fresh weekly", b: "Schedule Google updates and social posts ahead. Watch your score climb as your profile stays alive." },
          ].map((s) => (
            <Card key={s.n} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-white"><s.icon className="h-5 w-5" aria-hidden /></div>
                <span className="text-4xl font-extrabold text-accent-soft">{s.n}</span>
              </div>
              <h3 className="mt-4 font-bold text-ink">{s.t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.b}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-y border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-ink">Honest pricing. Printed right here.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-muted">No starter pack that "won't work" tomorrow. No upgrade pressure calls. Cancel in two clicks and keep access till your paid period ends.</p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {PLANS.map((p) => (
              <Card key={p.id} className={`p-6 ${p.id === "growth" ? "border-accent ring-2 ring-accent" : ""}`}>
                {p.id === "growth" && <div className="mb-3 inline-block rounded-full bg-accent px-3 py-1 text-xs font-bold text-white">Most popular</div>}
                <h3 className="font-extrabold text-ink">{p.name}</h3>
                <div className="mt-2 flex items-baseline gap-1"><span className="text-3xl font-extrabold text-ink">{p.price}</span><span className="text-sm text-muted">{p.period}</span></div>
                <p className="mt-1 text-sm text-muted">{p.blurb}</p>
                <ul className="mt-5 space-y-2.5 text-sm text-ink">
                  {p.features.map((f) => <li key={f} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />{f}</li>)}
                </ul>
                <Button className="mt-6 w-full" variant={p.id === "growth" ? "primary" : "secondary"} onClick={() => go("auth")}>Start with {p.name}</Button>
              </Card>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-muted">Prices in NPR. Pay by eSewa, Khalti or card when checkout opens - the free plan needs no card, ever.</p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-ink">Questions, answered straight</h2>
        <div className="mt-8 space-y-3">
          {FAQS.map((f, i) => (
            <Card key={f.q} className="overflow-hidden">
              <button className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left font-bold text-ink" onClick={() => setOpenFaq(openFaq === i ? null : i)} aria-expanded={openFaq === i}>
                {f.q}
                <ChevronDown className={`h-5 w-5 shrink-0 text-muted transition ${openFaq === i ? "rotate-180" : ""}`} aria-hidden />
              </button>
              {openFaq === i && <p className="border-t border-line px-5 py-4 text-sm leading-relaxed text-muted">{f.a}</p>}
            </Card>
          ))}
        </div>
        <div className="mt-10 rounded-3xl bg-accent p-8 text-center text-white">
          <h3 className="text-2xl font-extrabold">Your competitors are on Google Maps. Be easier to find than them.</h3>
          <p className="mx-auto mt-2 max-w-xl text-white/85">Run the free audit now - it takes about a minute and shows exactly what to fix first.</p>
          <Button className="mt-5 bg-white text-accent hover:bg-surface" onClick={() => go("auth")}>Start free <ArrowRight className="h-4 w-4" aria-hidden /></Button>
        </div>
      </section>

      <footer className="border-t border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted sm:flex-row sm:px-6">
          <span className="font-bold text-ink">DhandhaAi</span>
          <span>Self-serve AI marketing for local businesses. Nothing posts without your approval.</span>
          <span>hello@dhandhaai.example</span>
        </div>
      </footer>
    </div>
  );
}
