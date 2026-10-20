import type { Business, Post, Review } from "./types";

/* ------------------------------------------------------------------ */
/* Audit engine. Every point traces to a visible, fixable check.       */
/* No invented rankings or search volumes - ever.                      */
/* ------------------------------------------------------------------ */

export type FactorKey = "gbp" | "reviews" | "social" | "keywords";
export type CheckStatus = "pass" | "warn" | "fail";

export interface AuditCheck {
  id: string;
  factor: FactorKey;
  label: string;
  detail: string;
  status: CheckStatus;
  impact: number; // points available within its factor (0-100 scale)
  earned: number;
  fixHint: string;
}

export interface AuditResult {
  overall: number;
  factors: Record<FactorKey, number>;
  checks: AuditCheck[];
}

const clamp100 = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const capped = (n: number, max: number) => Math.max(0, Math.min(max, Math.round(n)));

export function buildKeywords(b: Business): { term: string; intent: string; competition: "low" | "medium" | "high"; inProfile: boolean }[] {
  const cat = b.category.trim();
  const city = b.city.trim();
  const area = b.area.trim();
  const hay = `${b.description} ${b.services.join(" ")} ${b.name}`.toLowerCase();
  const out: { term: string; intent: string; competition: "low" | "medium" | "high"; inProfile: boolean }[] = [];
  const push = (term: string, intent: string, competition: "low" | "medium" | "high", probe: string) => {
    if (term.trim().length > 3) out.push({ term, intent, competition, inProfile: hay.includes(probe.toLowerCase()) });
  };
  if (cat && city) {
    push(`${cat} in ${city}`, "Ready to visit / buy", "high", cat);
    push(`best ${cat} in ${city}`, "Comparing options", "high", cat);
    push(`${cat} near me`, "Ready to visit / buy", "high", cat);
    if (area) {
      push(`${cat} in ${area}, ${city}`, "Ready to visit / buy", "medium", area);
      push(`best ${cat} near ${area}`, "Comparing options", "medium", area);
    }
    push(`${cat} ${city} price`, "Checking price first", "medium", "price");
    push(`${cat} ${city} opening hours`, "Planning a visit", "low", "hour");
    push(`${cat} ${city} contact number`, "Wants to call", "low", "call");
  }
  for (const s of b.services.slice(0, 6)) {
    if (s && city) {
      push(`${s} in ${city}`, "Ready to visit / buy", "medium", s);
      if (area) push(`${s} near ${area}`, "Ready to visit / buy", "low", s);
    }
  }
  return out;
}

export function runAudit(b: Business, reviews: Review[], posts: Post[]): AuditResult {
  const checks: AuditCheck[] = [];
  const add = (c: AuditCheck) => checks.push(c);
  const bizReviews = reviews.filter((r) => r.businessId === b.id);
  const bizPosts = posts.filter((p) => p.businessId === b.id);

  /* ---- Google Business Profile completeness ---- */
  const hoursSet = Object.values(b.hours).filter((h) => h && h.trim().length > 0).length;
  add({ id: "gbp-category", factor: "gbp", label: "Business category is set", detail: b.category ? `Category: ${b.category}` : "No category - Google cannot match you to searches.", status: b.category ? "pass" : "fail", impact: 15, earned: b.category ? 15 : 0, fixHint: "Add your main category in Business profile." });
  add({ id: "gbp-address", factor: "gbp", label: "Full address with area", detail: b.address && b.area ? `${b.area}, ${b.city}` : "Area/address missing - 'near me' searches need this.", status: b.address && b.area ? "pass" : b.city ? "warn" : "fail", impact: 12, earned: b.address && b.area ? 12 : b.city ? 6 : 0, fixHint: "Add street address and area/locality." });
  add({ id: "gbp-phone", factor: "gbp", label: "Phone number customers can tap to call", detail: b.phone ? b.phone : "No phone listed - you lose one-tap calls from Maps.", status: b.phone ? "pass" : "fail", impact: 12, earned: b.phone ? 12 : 0, fixHint: "Add a mobile number you actually answer." });
  add({ id: "gbp-hours", factor: "gbp", label: "Opening hours for the week", detail: `${hoursSet} of 7 days have hours.`, status: hoursSet >= 6 ? "pass" : hoursSet >= 3 ? "warn" : "fail", impact: 12, earned: Math.round((hoursSet / 7) * 12), fixHint: "Set hours for every day (write Closed on off days)." });
  add({ id: "gbp-desc", factor: "gbp", label: "Description that says what you do and where", detail: b.description.length >= 120 ? `${b.description.length} characters - good length.` : b.description.length > 0 ? `Only ${b.description.length} characters. Aim for 120+ with your services and city.` : "No description yet.", status: b.description.length >= 120 ? "pass" : b.description.length > 0 ? "warn" : "fail", impact: 14, earned: b.description.length >= 120 ? 14 : b.description.length >= 40 ? 8 : b.description.length > 0 ? 4 : 0, fixHint: "Write 2-3 sentences: what you offer, who for, which area." });
  add({ id: "gbp-services", factor: "gbp", label: "Services / menu items listed", detail: `${b.services.length} listed. Google matches these to specific searches.`, status: b.services.length >= 5 ? "pass" : b.services.length >= 2 ? "warn" : "fail", impact: 13, earned: b.services.length >= 5 ? 13 : b.services.length >= 2 ? 7 : b.services.length === 1 ? 3 : 0, fixHint: "List at least 5 specific services or items." });
  add({ id: "gbp-photos", factor: "gbp", label: "Photos on the profile", detail: `${b.photoCount} photos. Profiles with 10+ photos earn far more taps.`, status: b.photoCount >= 10 ? "pass" : b.photoCount >= 4 ? "warn" : "fail", impact: 12, earned: b.photoCount >= 10 ? 12 : b.photoCount >= 4 ? 7 : b.photoCount > 0 ? 3 : 0, fixHint: "Add storefront, interior, team and product photos (target 10+)." });
  add({ id: "gbp-website", factor: "gbp", label: "Website or social link", detail: b.website ? b.website : "No link - interested customers have nowhere to go next.", status: b.website ? "pass" : "warn", impact: 10, earned: b.website ? 10 : 0, fixHint: "Add your website, or your Instagram/Facebook page URL." });

  /* ---- Reviews ---- */
  const replied = bizReviews.filter((r) => r.replyText).length;
  const responseRate = bizReviews.length ? replied / bizReviews.length : 0;
  const avg = bizReviews.length ? bizReviews.reduce((s, r) => s + r.rating, 0) / bizReviews.length : 0;
  add({ id: "rev-count", factor: "reviews", label: "Enough reviews to look trusted", detail: `${bizReviews.length} reviews tracked here. Most customers trust listings with 20+.`, status: bizReviews.length >= 20 ? "pass" : bizReviews.length >= 8 ? "warn" : "fail", impact: 30, earned: capped((bizReviews.length / 20) * 30, 30), fixHint: "Ask happy customers right after billing - and reply to every review you get." });
  add({ id: "rev-response", factor: "reviews", label: "Reply rate to reviews", detail: bizReviews.length ? `${replied} of ${bizReviews.length} replied (${Math.round(responseRate * 100)}%).` : "No reviews to reply to yet.", status: responseRate >= 0.8 ? "pass" : responseRate >= 0.4 ? "warn" : "fail", impact: 40, earned: Math.round(responseRate * 40), fixHint: "Use Reviews -> Reply with AI. Replies are free marketing." });
  add({ id: "rev-rating", factor: "reviews", label: "Average rating health", detail: bizReviews.length ? `Average ${avg.toFixed(1)} stars.` : "No ratings yet.", status: avg >= 4.3 ? "pass" : avg >= 3.8 ? "warn" : "fail", impact: 30, earned: avg > 0 ? capped(((avg - 1) / 4) * 30, 30) : 0, fixHint: "Fix the top complaint in low reviews, then ask recent happy customers to review." });

  /* ---- Social / posting consistency ---- */
  const now = Date.now();
  const last30 = bizPosts.filter((p) => p.status === "published" && now - new Date(p.publishedAt ?? p.createdAt).getTime() < 30 * 864e5).length;
  const scheduled = bizPosts.filter((p) => p.status === "scheduled").length;
  const googlePosts = bizPosts.filter((p) => p.kind === "google" && p.status === "published").length;
  add({ id: "soc-cadence", factor: "social", label: "Posts published in the last 30 days", detail: `${last30} published. Steady beats perfect: 2 per week wins.`, status: last30 >= 8 ? "pass" : last30 >= 3 ? "warn" : "fail", impact: 45, earned: capped((last30 / 8) * 45, 45), fixHint: "Create posts in Studio - batch a week in 10 minutes." });
  add({ id: "soc-scheduled", factor: "social", label: "Upcoming posts scheduled", detail: `${scheduled} in the queue.`, status: scheduled >= 2 ? "pass" : scheduled === 1 ? "warn" : "fail", impact: 25, earned: scheduled >= 2 ? 25 : scheduled === 1 ? 12 : 0, fixHint: "Schedule the next festival/offer post now, while you remember." });
  add({ id: "soc-google", factor: "social", label: "Google profile kept fresh with updates", detail: `${googlePosts} Google update(s) published. Fresh profiles get preferred placement.`, status: googlePosts >= 2 ? "pass" : googlePosts === 1 ? "warn" : "fail", impact: 30, earned: googlePosts >= 2 ? 30 : googlePosts === 1 ? 15 : 0, fixHint: "Post one Google update per week: an offer, photo or event." });

  /* ---- Keywords ---- */
  const kws = buildKeywords(b);
  const kwHit = kws.filter((k) => k.inProfile).length;
  const kwRatio = kws.length ? kwHit / kws.length : 0;
  const descHasCity = b.city && b.description.toLowerCase().includes(b.city.toLowerCase());
  const descHasCat = b.category && b.description.toLowerCase().includes(b.category.toLowerCase().split(" ")[0]);
  add({ id: "kw-coverage", factor: "keywords", label: "Search phrases present in your profile text", detail: `${kwHit} of ${kws.length} target phrases appear in your description/services.`, status: kwRatio >= 0.6 ? "pass" : kwRatio >= 0.3 ? "warn" : "fail", impact: 50, earned: Math.round(kwRatio * 50), fixHint: "Weave missing phrases naturally into description and services - never stuff the business name (Google suspends listings for that)." });
  add({ id: "kw-city", factor: "keywords", label: "Description names your city/area", detail: descHasCity ? `Mentions ${b.city}.` : "Your city never appears in your description.", status: descHasCity ? "pass" : "fail", impact: 25, earned: descHasCity ? 25 : 0, fixHint: "Add one sentence naming your area and city." });
  add({ id: "kw-cat", factor: "keywords", label: "Description names what you are", detail: descHasCat ? "Category words present." : "Your category words are missing from the description.", status: descHasCat ? "pass" : "warn", impact: 25, earned: descHasCat ? 25 : 0, fixHint: "Say it plainly: 'We are a ___ in ___.'" });

  const factor = (k: FactorKey) => clamp100(checks.filter((c) => c.factor === k).reduce((s, c) => s + c.earned, 0));
  const factors: Record<FactorKey, number> = { gbp: factor("gbp"), reviews: factor("reviews"), social: factor("social"), keywords: factor("keywords") };
  const overall = clamp100(factors.gbp * 0.4 + factors.reviews * 0.25 + factors.social * 0.2 + factors.keywords * 0.15);
  return { overall, factors, checks };
}

export function scoreBand(n: number): { label: string; color: string } {
  if (n >= 75) return { label: "Strong", color: "#067647" };
  if (n >= 50) return { label: "Getting there", color: "#b54708" };
  if (n >= 30) return { label: "Needs work", color: "#b54708" };
  return { label: "At risk", color: "#b42318" };
}

/* ------------------------------------------------------------------ */
/* AI drafting engine (deterministic templates).                       */
/* It ONLY uses facts the user typed. It cannot invent products,      */
/* prices or claims - the fix for the original's worst failure.        */
/* Every output is a draft until the user approves it.                 */
/* ------------------------------------------------------------------ */

export type Lang = "en" | "ne" | "hi";
export type Tone = "warm" | "professional" | "short";

const firstName = (n: string) => n.trim().split(/\s+/)[0] || "there";

function mentionedService(b: Business, text: string): string | null {
  const t = text.toLowerCase();
  for (const s of b.services) {
    const probe = s.toLowerCase().split(" ").slice(0, 2).join(" ");
    if (probe && t.includes(probe)) return s;
  }
  const topics: [string, string][] = [
    ["staff", "our team"], ["service", "the service"], ["food", "the food"], ["clean", "the cleanliness"],
    ["price", "the pricing"], ["wait", "the waiting time"], ["quality", "the quality"], ["taste", "the taste"],
  ];
  for (const [k, label] of topics) if (t.includes(k)) return label;
  return null;
}

export function draftReviewReplies(b: Business, r: Review, tone: Tone, lang: Lang): string[] {
  const name = firstName(r.author);
  const topic = mentionedService(b, r.text);
  const biz = b.name;
  const high = r.rating >= 4;
  const mid = r.rating === 3;

  if (lang === "ne") {
    if (high) return [
      `नमस्ते ${name} जी, ${biz} मा आउनुभएकोमा धेरै धेरै धन्यवाद! तपाईंको मायालु प्रतिक्रियाले हामीलाई अझ राम्रो गर्ने हौसला दिन्छ। फेरि छिट्टै भेटौंला!`,
      `धन्यवाद ${name} जी! तपाईं सन्तुष्ट हुनुभएकोमा हामी खुसी छौं। ${biz} को तर्फबाट हार्दिक आभार — फेरि सेवा गर्ने मौका दिनुहोस्।`,
    ];
    if (mid) return [
      `नमस्ते ${name} जी, प्रतिक्रियाका लागि धन्यवाद। तपाईंको अनुभव अझ राम्रो बनाउन हामी के सुधार गर्न सक्छौं, कृपया बताइदिनुहोस् — हामी सुधार्ने प्रतिबद्धता गर्छौं। - ${biz}`,
    ];
    return [
      `नमस्ते ${name} जी, तपाईंको नराम्रो अनुभवका लागि हामी साँच्चै क्षमाप्रार्थी छौं। यो हाम्रो स्तर होइन। कृपया हामीलाई ${b.phone || "सिधै"} मा सम्पर्क गर्नुहोस् — हामी समाधान नगरेसम्म यो कुरा बन्द गर्दैनौं। - ${biz}`,
    ];
  }
  if (lang === "hi") {
    if (high) return [
      `नमस्ते ${name} जी, ${biz} को चुनने के लिए दिल से धन्यवाद! आपकी अच्छी प्रतिक्रिया हमारी पूरी टीम का हौसला बढ़ाती है। जल्द फिर मुलाकात होगी!`,
      `धन्यवाद ${name} जी! आपको हमारा काम पसंद आया, यही हमारी सबसे बड़ी कमाई है। - टीम ${biz}`,
    ];
    if (mid) return [
      `नमस्ते ${name} जी, आपकी प्रतिक्रिया के लिए धन्यवाद। बताइए कहाँ सुधार करें — हम अगली बार आपको पूरी तरह खुश करना चाहते हैं। - ${biz}`,
    ];
    return [
      `नमस्ते ${name} जी, इस अनुभव के लिए हम सच में माफ़ी चाहते हैं। यह हमारी सेवा का स्तर नहीं है। कृपया ${b.phone || "हमसे सीधे"} संपर्क करें — हम इसे ठीक करके ही मानेंगे। - ${biz}`,
    ];
  }

  // English
  if (high) {
    const t = topic ? ` We're glad you enjoyed ${topic}.` : "";
    if (tone === "short") return [`Thank you, ${name}! We're delighted you had a great experience at ${biz}. See you again soon!`];
    if (tone === "professional") return [
      `Dear ${name}, thank you for your kind review of ${biz}.${t} Feedback like yours keeps our standards high. We look forward to welcoming you again.`,
      `Thank you for choosing ${biz}, ${name}.${t} We appreciate you taking the time to share this - it means a lot to our whole team.`,
    ];
    return [
      `Hi ${name}, thank you so much for the love!${t} Reviews like yours make our day at ${biz}. Come back soon - the next visit is on us to impress you again!`,
      `${name}, you're the best! Thanks for choosing ${biz}.${t} Can't wait to serve you again.`,
    ];
  }
  if (mid) {
    const t = topic ? ` Your note about ${topic} is noted.` : "";
    return [
      `Hi ${name}, thank you for the honest feedback.${t} We'd love to turn your next visit into a 5-star one - tell us what to improve at ${b.phone || "the counter"} and we'll act on it. - Team ${biz}`,
    ];
  }
  return [
    `Hi ${name}, we're genuinely sorry - this is not the experience ${biz} stands for.${topic ? ` Your point about ${topic} is fair, and we're fixing it.` : ""} Please reach us at ${b.phone || "our shop directly"} so we can make it right personally. - Team ${biz}`,
    `${name}, thank you for telling us straight. We fell short, and we own that. The issue has been raised with our team today. If you give us one more chance, contact us at ${b.phone || "the shop"} and we'll take care of you ourselves. - ${biz}`,
  ];
}

const tagify = (s: string) => "#" + s.replace(/[^a-zA-Z0-9 ]/g, "").split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");

export function buildHashtags(b: Business, extra: string[] = []): string[] {
  const tags = new Set<string>();
  if (b.category) tags.add(tagify(b.category));
  if (b.city) tags.add(tagify(b.city));
  if (b.category && b.city) tags.add(tagify(`${b.category} ${b.city}`));
  if (b.area) tags.add(tagify(b.area));
  for (const s of b.services.slice(0, 3)) tags.add(tagify(s));
  tags.add("#SupportLocal");
  tags.add("#SmallBusiness");
  for (const e of extra) tags.add(e.startsWith("#") ? e : tagify(e));
  return Array.from(tags).slice(0, 10);
}

export interface PostDraftInput {
  postType: "festival" | "offer" | "product" | "update" | "tip";
  occasion?: string;
  headline: string; // the user's own fact: offer text / product name / announcement
  detail?: string; // price, validity, extra line - user typed
}

export function draftCaption(b: Business, inp: PostDraftInput, lang: Lang): { caption: string; hashtags: string[] } {
  const biz = b.name;
  const where = [b.area, b.city].filter(Boolean).join(", ");
  const contact = b.phone ? `\nCall/WhatsApp: ${b.phone}` : "";
  const detail = inp.detail?.trim();
  let caption = "";
  let extra: string[] = [];

  if (lang === "ne") {
    switch (inp.postType) {
      case "festival":
        caption = `${inp.occasion ?? "चाडपर्व"}को हार्दिक शुभकामना! ${biz} परिवारको तर्फबाट तपाईं र तपाईंको परिवारमा सुख, शान्ति र समृद्धिको कामना।${detail ? `\n${detail}` : ""}${contact}`;
        extra = [inp.occasion ?? "Festival"]; break;
      case "offer":
        caption = `विशेष अफर! ${inp.headline}${detail ? `\n${detail}` : ""}\nआजै ${biz}${where ? ` (${where})` : ""} मा आउनुहोस्।${contact}`;
        extra = ["Offer"]; break;
      case "product":
        caption = `नयाँ आएको छ! ${inp.headline}${detail ? `\n${detail}` : ""}\n${biz} मा आएर हेर्नुहोस्।${contact}`;
        extra = ["NewArrival"]; break;
      default:
        caption = `${inp.headline}${detail ? `\n${detail}` : ""}\n- ${biz}${where ? `, ${where}` : ""}${contact}`;
    }
    return { caption, hashtags: buildHashtags(b, extra) };
  }
  if (lang === "hi") {
    switch (inp.postType) {
      case "festival":
        caption = `${inp.occasion ?? "त्योहार"} की हार्दिक शुभकामनाएँ! ${biz} परिवार की ओर से आप सभी को सुख और समृद्धि की कामना।${detail ? `\n${detail}` : ""}${contact}`;
        extra = [inp.occasion ?? "Festival"]; break;
      case "offer":
        caption = `खास ऑफ़र! ${inp.headline}${detail ? `\n${detail}` : ""}\nआज ही ${biz}${where ? ` (${where})` : ""} आएँ।${contact}`;
        extra = ["Offer"]; break;
      case "product":
        caption = `नया आया है! ${inp.headline}${detail ? `\n${detail}` : ""}\n${biz} पर आकर देखें।${contact}`;
        extra = ["NewArrival"]; break;
      default:
        caption = `${inp.headline}${detail ? `\n${detail}` : ""}\n- ${biz}${where ? `, ${where}` : ""}${contact}`;
    }
    return { caption, hashtags: buildHashtags(b, extra) };
  }

  switch (inp.postType) {
    case "festival":
      caption = `Happy ${inp.occasion ?? "festival season"} from all of us at ${biz}! Wishing you and your family health, happiness and good fortune.${detail ? `\n${detail}` : ""}${contact}`;
      extra = [inp.occasion ?? "Festival"]; break;
    case "offer":
      caption = `Special offer at ${biz}: ${inp.headline}${detail ? `\n${detail}` : ""}\nVisit us${where ? ` at ${where}` : ""} - walk-ins welcome.${contact}`;
      extra = ["SpecialOffer"]; break;
    case "product":
      caption = `New at ${biz}: ${inp.headline}${detail ? `\n${detail}` : ""}\nCome see it in person${where ? ` - ${where}` : ""}.${contact}`;
      extra = ["NewArrival"]; break;
    case "tip":
      caption = `Good to know: ${inp.headline}${detail ? `\n${detail}` : ""}\nQuestions? Ask us at ${biz} - we reply to everyone.${contact}`;
      extra = ["Tips"]; break;
    default:
      caption = `${inp.headline}${detail ? `\n${detail}` : ""}\n- ${biz}${where ? `, ${where}` : ""}${contact}`;
  }
  return { caption, hashtags: buildHashtags(b, extra) };
}

/* ------------------------------------------------------------------ */
/* Ready-to-share template library (our own catalogue).                */
/* Localised for Nepal + India - a gap in the original (English/IN).   */
/* ------------------------------------------------------------------ */

export interface Template {
  id: string;
  title: string;
  occasion: string;
  region: "nepal" | "india" | "all";
  postType: PostDraftInput["postType"];
  theme: string;
  suggestedHeadline: string;
}

export const POSTER_THEMES: Record<string, { from: string; to: string; accent: string; label: string }> = {
  emerald: { from: "#0a6b4f", to: "#063f30", accent: "#ffd166", label: "Emerald" },
  marigold: { from: "#b54708", to: "#7c2d12", accent: "#ffe6b0", label: "Marigold" },
  crimson: { from: "#b42318", to: "#6e150e", accent: "#ffd9d0", label: "Crimson" },
  indigo: { from: "#363f9e", to: "#1c2260", accent: "#c7d2fe", label: "Indigo" },
  plum: { from: "#7c2d62", to: "#481a3a", accent: "#f5c6e6", label: "Plum" },
  slate: { from: "#334155", to: "#0f172a", accent: "#bae6fd", label: "Slate" },
};

export const TEMPLATES: Template[] = [
  { id: "t-dashain", title: "Dashain greetings", occasion: "Dashain", region: "nepal", postType: "festival", theme: "crimson", suggestedHeadline: "Wishing you a joyful Dashain" },
  { id: "t-tihar", title: "Tihar / Deepawali lights", occasion: "Tihar", region: "nepal", postType: "festival", theme: "marigold", suggestedHeadline: "Happy Tihar - may your home shine bright" },
  { id: "t-nepnewyear", title: "Nepali New Year", occasion: "Nepali New Year", region: "nepal", postType: "festival", theme: "indigo", suggestedHeadline: "Happy New Year" },
  { id: "t-teej", title: "Teej wishes", occasion: "Teej", region: "nepal", postType: "festival", theme: "plum", suggestedHeadline: "Happy Teej to all the wonderful women" },
  { id: "t-holi", title: "Holi colours", occasion: "Holi", region: "all", postType: "festival", theme: "plum", suggestedHeadline: "Happy Holi - play safe, stay colourful" },
  { id: "t-diwali", title: "Diwali greetings", occasion: "Diwali", region: "india", postType: "festival", theme: "marigold", suggestedHeadline: "Shubh Diwali from our family to yours" },
  { id: "t-eid", title: "Eid Mubarak", occasion: "Eid", region: "all", postType: "festival", theme: "emerald", suggestedHeadline: "Eid Mubarak" },
  { id: "t-christmas", title: "Christmas & New Year", occasion: "Christmas", region: "all", postType: "festival", theme: "crimson", suggestedHeadline: "Merry Christmas and a Happy New Year" },
  { id: "t-weekend", title: "Weekend offer", occasion: "Weekend", region: "all", postType: "offer", theme: "emerald", suggestedHeadline: "Weekend special - this Saturday & Sunday only" },
  { id: "t-newarrival", title: "New arrival", occasion: "New stock", region: "all", postType: "product", theme: "indigo", suggestedHeadline: "Just arrived - fresh stock in store" },
  { id: "t-thanks100", title: "Thank-you milestone", occasion: "Milestone", region: "all", postType: "update", theme: "slate", suggestedHeadline: "Thank you for 100 Google reviews - you keep us going" },
  { id: "t-nowopen", title: "Now open / new hours", occasion: "Announcement", region: "all", postType: "update", theme: "emerald", suggestedHeadline: "We are now open - walk-ins welcome" },
  { id: "t-tip", title: "Useful tip post", occasion: "Tip", region: "all", postType: "tip", theme: "slate", suggestedHeadline: "One small tip that saves you money" },
  { id: "t-monsoon", title: "Monsoon-season post", occasion: "Monsoon", region: "all", postType: "update", theme: "indigo", suggestedHeadline: "Rainy day? We are open as usual" },
];

export const CATEGORIES = [
  "Salon & Barbershop", "Restaurant", "Cafe & Bakery", "Clinic & Dental", "Pharmacy",
  "Grocery / Kirana Store", "Clothing Store", "Mobile & Electronics", "Gym & Fitness",
  "Beauty Parlour & Spa", "Hotel & Lodge", "Auto Workshop", "Education / Tuition",
  "Real Estate", "Furniture & Hardware", "Jewellery", "Other Local Business",
];
