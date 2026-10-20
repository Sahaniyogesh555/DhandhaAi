# Recon map: Dhanda AI Marketing by EZO (Android / iOS)

Scope: The core loop only - connect a local business, run a free Google
Business Profile (GBP) score audit, fix what the audit flags, reply to Google
reviews with AI help, create and schedule AI social-media + Google posts, and
track keywords and competitors. Web (mobile-first responsive) rebuild; the
original is a native mobile app, the clone targets web first so it can ship
without store review, and can be wrapped (Capacitor/Expo) later.
For: Local SMB owners (salons, clinics, restaurants, cafes, retailers) who
want more calls/walk-ins from Google Maps and social media without hiring a
marketer. Initial market: Nepal + India (original is India-focused).
Date: 2026-10-20

Clean-room note: this map is built only from public sources below. No account
was used, no login/paywall was passed, no source code, bundles or private APIs
were read. Features and UX patterns are rebuilt; the original's name, logo,
copy, images and content are NOT reused. The clone ships under this project's
own name (DhandhaAi as working name - see trademark warning in brand step:
"DhandhaAi" vs "Dhanda" is close, a trademark search is advised before sale).

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | marketing site | https://dhanda.app/ | Positioning, 2 hero feature blocks (Google Maps Optimization, AI Social Posting), claimed stats (10,000+ businesses, 50,000+ reviews managed, 2M+ posts, 4.8 rating), 5 app screenshots, version string |
| 2 | Google Play listing | https://play.google.com/store/apps/details?id=com.dhanda.app | 4.4 stars, ~74K reviews, 1M+ downloads; 5 named features (Free Google Score Audit, SEO Keyword Analysis, Competitor Analysis, Personalized Review Replies, Weekly Images/Updates for Google); 5 screenshots; visible 1-star reviews (support, autopay, upsell complaints) |
| 3 | Apple App Store listing | https://apps.apple.com/in/app/dhanda/id6739134664 | 4.6 stars, 8.5K ratings; same 5 features (says "Monthly" Google updates); English only; 161 MB |
| 4 | Free score landing page | https://checkmarketingscore.com/ | Score breakdown evidence: GBP /100, Social Media Consistency /100, Review Response Rate /100, Local Keyword Usage /100; "connect GBP, AI checks score in under 60 seconds" |
| 5 | Third-party listing data | https://www.appbrain.com/app/dhanda-ai-marketing-by-ezo/com.dhanda.app | v2.90.1 (Oct 2026), on Play since Nov 2024, ~1.3M installs, free with paid plans |
| 6 | Third-party review summaries | https://mwm.ai/apps/dhanda/6739134664 | Verbatim App Store reviews incl. AI-content-quality complaint; notes "lifetime free replies to Google Reviews" |
| 7 | Public job post (pricing evidence) | https://bebee.com/in/jobs/walk-in-sales-executive-ezo-technologies-navi-mumbai--theirstack-689738304 | "Managed service plans run from 999 to 4,999/month" (INR), targets clinics/salons/restaurants/retailers |
| 8 | Competitor comparison page | https://www.reviewpro.co.in/alternative/dhanda-ai-marketing | Feature table confirming: Maps score, AI social content, keyword + competitor analysis, post to FB & Instagram simultaneously; no QR review standees / private feedback gate (gaps) |

Screenshot references (NOT downloaded, NOT shipped - URLs only, per skill rules;
sandbox egress also prevents download): Play listing screenshots x5 and
dhanda.app `App Screen 1-5` images listed on source 1/2 above.

## Core loop

A local business connects its Google Business Profile, gets a free score and
fix-list, then stays active and trusted with AI-generated review replies and
social/Google posts - so it ranks higher on Google Maps and gets more calls.

## Screens

Confidence: screens are inferred from store-listing features, the marketing
site's two feature blocks and screenshot captions. No in-app account access,
so internal navigation is medium confidence; features are high confidence.

| ID | screen | route / how to reach | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| S01 | Landing / marketing home | web root; app-store entry | Pitch + free-audit CTA + app download | Hero, stats band, feature blocks, screenshot carousel, store badges, WhatsApp help button | filled |
| S02 | Sign up / log in | "Download Free" / app open | Account creation | Phone/email form, social login (inferred) | empty, error (inferred) |
| S03 | Onboarding: add business | After signup | Capture business name/category/city; connect GBP | Multi-step form, category picker, "connect Google" button | empty, filled |
| S04 | Dashboard (home) | Bottom nav: Home | Score at a glance + next actions | Score ring, insight cards, quick actions (create post, reply reviews), progress | filled, empty (no business) |
| S05 | Google Score Audit | Dashboard score tap / free-audit CTA | Breakdown: GBP, social consistency, review response, keyword usage; fix list | Score bars, checklist with impact, "track progress" trend | filled, loading (auditing) |
| S06 | Reviews inbox | Bottom nav / dashboard card | Read Google reviews, send personalised replies | Review list (stars, text, date), AI reply suggestions, reply editor, replied/unreplied filter | empty, filled |
| S07 | Social studio: create post | "Create post" CTA | Generate image idea + caption, post to FB + Instagram at once | Post-type picker (festival/offer/product), caption editor, hashtags, channel toggles, preview | empty, filled, scheduled |
| S08 | Ready-to-share library | Studio tab | Browse ready AI images/templates, post instantly | Template grid, category filter, one-tap use | filled |
| S09 | Google updates planner | Posts/Google tab | Weekly/monthly GBP posts: offers, festivals, events, photos | Calendar/list of planned updates, create update | empty, filled |
| S10 | Keywords | SEO tab | Local keyword analysis to improve rank | Keyword table (term, opportunity), add-to-profile suggestions | filled |
| S11 | Competitors | Insights tab | Compare nearby competitors' visible strength | Competitor list, comparison bars/table | empty, filled |
| S12 | Business profile / settings | Profile tab | Business details, hours, photos, connected accounts | Profile form, connect FB/Instagram/Google, completeness | filled |
| S13 | Plans / paywall | Upgrade CTA | Paid plans (public evidence: INR 999 entry, managed 999-4,999/mo, upsell packs reported in reviews) | Plan cards, UPI AutoPay checkout (reported) | filled |
| S14 | Support / tickets | Help | Contact support (reviews report ticket errors / no direct number - a key gap) | Ticket form, WhatsApp link | error (reported) |

## Flows

```
F01 Free audit (the paid-for loop entry)
    S01 -> S02 -> S03 (add business) -> S05 audit result -> S04 dashboard
    happy path clicks: ~6 (site claims score "in seconds / under 60s")
    edge: business not on Google yet; duplicate/unverified GBP (reported in reviews);
          GBP connect fails; no reviews/photos yet (low score, empty states)

F02 Fix the profile from the audit
    S05 checklist item -> S12 edit field -> S05 score improves -> S04 progress
    happy path clicks: 2-3 per fix
    edge: change needs Google verification; duplicate profile exists

F03 Reply to a Google review
    S04/S06 review -> AI suggestion -> edit -> send/copy -> marked replied
    happy path clicks: 3
    edge: 1-star review (tone must de-escalate); review with no text; reply fails

F04 Create and publish a social post
    S07 pick type -> generate caption/image idea -> preview -> post to FB+IG (or schedule)
    happy path clicks: 4 ("one-click posting" once accounts connected)
    edge: FB/IG not connected (top review complaint: never aligned after payment);
          AI content wrong about the product (reported) -> human preview is essential

F05 Weekly Google update
    S09 -> pick offer/festival/event -> generate -> schedule/publish to GBP
    happy path clicks: 4
    edge: GBP post rejected by Google policies; festival date wrong for region

F06 Keyword + competitor check
    S10 keywords -> apply suggestion in S12; S11 add competitor -> compare -> act
    happy path clicks: 3
    edge: no competitors found nearby; keyword stuffing risk (Google spam policy)

F07 Upgrade to paid plan
    S13 plan -> pay -> features unlock
    happy path clicks: ~4
    edge: AutoPay cancellation/refund disputes (heavily reported) - clone must differ here
```

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| Button | primary, secondary, ghost, WhatsApp/help | default, hover, focus, disabled, loading | all |
| Score ring / score bar | ring (0-100), segmented bars per factor | low/mid/high colour coding | S04, S05 |
| Insight / action card | checklist item with impact points | todo, done | S04, S05 |
| Review card | with/without owner reply | unreplied, replied, flagged | S06 |
| AI suggestion box | caption, review reply | generating (skeleton), ready, regenerate | S06, S07 |
| Post preview | Instagram-style, Facebook-style, Google-post-style | draft, scheduled, published, failed | S07, S09 |
| Template tile | festival, offer, product, generic | default, selected | S08 |
| Bottom nav (mobile pattern) | 4-5 tabs + center create | active/inactive | S04-S12 |
| Plan card | monthly packs | current, recommended | S13 |
| Empty state | no business, no reviews, no posts | illustration + CTA | S04, S06, S09, S11 |
| Toast / banner | success, error | - | all |

## Inferred data model

```
User        id, name, email, phone, password_hash, created_at
            evidence: S02; confidence: high (generic)
Business    id, owner_id, name, category, city, area, address, phone, website,
            hours (json), description, services[], photo_count, google_place_id?,
            rating, review_count, created_at
            evidence: S03/S12 + audit factors (source 4); confidence: high for fields,
            google_place_id is a guess (how GBP connect is implemented is not public)
Audit       id, business_id, overall, gbp_score, social_score, review_score,
            keyword_score, checks (json: key, label, status, impact), created_at
            evidence: source 4 score breakdown + S05; confidence: high
Review      id, business_id, author, rating (1-5), text, date, source (google),
            reply_text, replied_at
            evidence: S06 feature text; confidence: high
Post        id, business_id, kind (social|google), post_type (festival|offer|product|update),
            caption, hashtags, image_theme, channels[] (facebook, instagram, google),
            status (draft|scheduled|published|failed), scheduled_at, published_at
            evidence: S07/S09 feature text ("post to FB & IG simultaneously"); confidence: high
Template    id, title, occasion, caption_pattern, hashtags, theme
            evidence: S08 "ready-to-share library"; confidence: medium (catalogue not public)
Keyword     id, business_id, term, intent, competition, in_profile (bool)
            evidence: S10 feature text; confidence: medium (metrics not public - no
            search-volume data source is claimed anywhere public)
Competitor  id, business_id, name, category, rating, review_count, photo_count, posts_per_month
            evidence: S11 feature text; confidence: medium
Plan/Sub    id, user_id, plan, price_cents, currency, status, renews_at
            evidence: reviews cite INR 999 starter, 5,500/3mo, 12,000 upsell; source 7
            cites 999-4,999/mo managed; confidence: medium (no public pricing page found
            on dhanda.app itself - note dhanda.online pricing appears to be a DIFFERENT
            product and was excluded)
SupportTicket id, user_id, subject, message, status
            evidence: S14 (reviews mention ticket errors); confidence: medium
```

Relationships: User 1-n Business; Business 1-n Audit/Review/Post/Keyword/Competitor.

## Feature matrix

See `features.csv`. Must: 12, should: 8, could: 5, skip: 4.

## Out of scope (cannot or should not be cloned)

- Their brand: name/trademark, logo, mascot, screenshots, marketing copy, stats claims.
- Their managed-service operation: sales/onboarding call centre, human account managers.
- Their user base, review corpus and any data they own; their app-store presence/ratings.
- Actually posting to a user's real GBP/Facebook/Instagram until the clone owner
  registers their OWN Google/Meta apps and passes their reviews - the clone builds
  this integration-ready (official APIs, user's own keys) with a simulated publish
  queue meanwhile. No use of the original's private APIs/OAuth client, ever.
- Licensed stock/AI-image catalogue contents (clone generates its own poster
  compositions from templates/gradients, no copied assets).

## Size

Screens 14, flows 7, entities 10. Hard parts: (1) Google Business Profile API
access (Google approval-gated) and Meta app review for real publishing;
(2) audit rules that are useful without fake precision - no invented search
volumes/rankings; (3) AI content quality/safety - must be preview-and-approve,
never auto-posted unreviewed (direct fix for a reported failure).
Size: M (core loop is a few weeks solo; real GBP/Meta integrations are the long pole).
No promise of a perfect clone - parity will be scored with replica-diff.
