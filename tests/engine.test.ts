/* Engine tests - run with: npm test (esbuild bundles, node executes).
   Covers the audit scorer and the no-invention AI drafting rules. */
import { POSTER_THEMES, TEMPLATES, buildKeywords, draftCaption, draftReviewReplies, runAudit } from "../src/lib/engine";
import type { Business, Post, Review } from "../src/lib/types";

let passed = 0; let failed = 0;
function check(name: string, cond: boolean, extra = "") {
  if (cond) { passed++; console.log(`ok - ${name}`); }
  else { failed++; console.error(`FAIL - ${name} ${extra}`); }
}

const hours = { mon: "9-8", tue: "9-8", wed: "9-8", thu: "9-8", fri: "9-8", sat: "9-8", sun: "9-8" };
const sparse: Business = {
  id: "b1", ownerId: "u1", name: "Test Salon", category: "Salon & Barbershop", city: "Pokhara",
  area: "", address: "", phone: "", website: "", description: "", services: [],
  hours: { mon: "", tue: "", wed: "", thu: "", fri: "", sat: "", sun: "" },
  photoCount: 0, googleConnected: false, facebookConnected: false, instagramConnected: false,
  createdAt: new Date().toISOString(),
};
const complete: Business = {
  ...sparse, area: "Lakeside", address: "Lakeside Road", phone: "+977 9800000000",
  website: "https://example.com",
  description: "We are a salon & barbershop in Lakeside, Pokhara offering haircuts, beard trims, hair colour, facials and head massage for men and women. Walk-ins welcome, call to book.",
  services: ["Haircut", "Beard trim", "Hair colour", "Facial", "Head massage"],
  hours, photoCount: 14,
};
const review = (rating: number, text: string, replied = false): Review => ({
  id: Math.random().toString(), businessId: "b1", author: "Mina Gurung", rating, text,
  date: new Date().toISOString(), replyText: replied ? "Thanks!" : undefined,
});
const post = (kind: "social" | "google"): Post => ({
  id: Math.random().toString(), businessId: "b1", kind, postType: "offer", headline: "x",
  caption: "x", hashtags: [], theme: "emerald", channels: [], status: "published",
  publishedAt: new Date().toISOString(), createdAt: new Date().toISOString(),
});

/* audit */
const aSparse = runAudit(sparse, [], []);
const manyReviews = Array.from({ length: 22 }, (_, i) => review(i % 3 === 0 ? 4 : 5, "Great haircut and friendly staff", true));
const aFull = runAudit(complete, manyReviews, [post("social"), post("social"), post("social"), post("social"), post("social"), post("social"), post("social"), post("social"), post("google"), post("google")]);
check("complete business scores higher than sparse", aFull.overall > aSparse.overall, `${aFull.overall} vs ${aSparse.overall}`);
check("scores stay within 0-100", [aFull, aSparse].every((a) => a.overall >= 0 && a.overall <= 100 && Object.values(a.factors).every((v) => v >= 0 && v <= 100)));
check("each factor's check impacts sum to exactly 100", (["gbp", "reviews", "social", "keywords"] as const).every((f) => aFull.checks.filter((c) => c.factor === f).reduce((s, c) => s + c.impact, 0) === 100));
check("earned never exceeds impact", aFull.checks.every((c) => c.earned <= c.impact));
check("fixing the phone raises the GBP factor", runAudit({ ...sparse, phone: "+977 1" }, [], []).factors.gbp > aSparse.factors.gbp);
check("replying to reviews raises the reviews factor", runAudit(complete, manyReviews, []).factors.reviews > runAudit(complete, manyReviews.map((r) => ({ ...r, replyText: undefined })), []).factors.reviews);
check("publishing posts raises the social factor", aFull.factors.social > runAudit(complete, manyReviews, []).factors.social);

/* review replies: tone, personalisation, no arguing */
const r1 = draftReviewReplies(complete, review(1, "Terrible haircut, rude staff, waited forever"), "warm", "en").join(" ").toLowerCase();
check("1-star reply apologises", r1.includes("sorry"));
check("1-star reply gives a direct contact", r1.includes("+977 9800000000"));
check("1-star reply never blames the customer", !r1.includes("your fault") && !r1.includes("you are wrong"));
const r5 = draftReviewReplies(complete, review(5, "Best haircut in Lakeside!"), "warm", "en").join(" ");
check("5-star reply uses the reviewer's first name", r5.includes("Mina"));
check("5-star reply names the business", r5.includes("Test Salon"));
check("mentioned service is reflected", r5.toLowerCase().includes("haircut"));
const rNe = draftReviewReplies(complete, review(5, "Ramro!"), "warm", "ne").join(" ");
check("Nepali reply is in Devanagari", /[\u0900-\u097F]/.test(rNe));

/* captions: only user facts, never invented */
const offer = draftCaption(complete, { postType: "offer", headline: "20% off haircuts this week", detail: "Valid till Sunday" }, "en");
check("offer caption quotes the user's exact offer", offer.caption.includes("20% off haircuts this week"));
check("offer caption includes user detail", offer.caption.includes("Valid till Sunday"));
check("caption includes phone CTA when set", offer.caption.includes("+977 9800000000"));
check("hashtags include the city", offer.hashtags.some((h) => h.toLowerCase().includes("pokhara")));
const fest = draftCaption(complete, { postType: "festival", occasion: "Dashain", headline: "Happy Dashain" }, "en");
check("festival caption names the occasion", fest.caption.includes("Dashain"));
check("caption invents no prices of its own", !/\bRs\.?\s?\d/.test(fest.caption) && !fest.caption.includes("%"));

/* keywords */
const kws = buildKeywords(complete);
check("keywords include category-in-city phrase", kws.some((k) => k.term === "Salon & Barbershop in Pokhara"));
check("service keywords are detected in profile", kws.filter((k) => k.inProfile).length >= 3, JSON.stringify(kws.filter((k) => k.inProfile).map((k) => k.term)));

/* templates */
check("library has Nepal templates", TEMPLATES.some((t) => t.region === "nepal"));
check("library has India templates", TEMPLATES.some((t) => t.region === "india"));
check("every template theme exists", TEMPLATES.every((t) => !!POSTER_THEMES[t.theme]));

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
