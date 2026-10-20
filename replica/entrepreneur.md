# Entrepreneur analysis: what Dhanda users hate, and our angle

Sample honesty: only 6 verbatim public reviews were collectable in this pass
(Google Play listing excerpts + App Store via mwm.ai). `reviews.py` flags this
as a small sample ("under 30 reviews supports a direction, not a ranking") -
see `replica/feedback.md`. Direction is consistent with the app's very visible
1-star pattern on its own listing, but collect 100+ reviews across Play/App
Store before betting pricing on it. Two machine themes are false positives and
are discarded by hand: "Ads" (matched the word "advertised") and "Teams and
sharing" (matched "their team called me").

## What they hate (ranked, linked - see feedback.md for full quotes)

1. **Pay-then-abandoned support.** 4/6 reviews. Sales calls twice a day before
   payment, unreachable after; no direct contact number; ticket form errors.
   "they have no direct number to contact and while raising the ticket it
   shows an error" - Google Play, https://play.google.com/store/apps/details?id=com.dhanda.app
2. **Price pressure / bait pricing.** 4/6 reviews. INR 999 starter sold, then
   told it is "useless" and pressured to INR 12,000; nothing posted before the
   upsell ask. Same Play URL as above.
3. **Billing traps.** AutoPay hard to escape, access cut the moment the mandate
   is revoked, refunds refused ("no refund policy for posted content").
   Play URL above + https://mwm.ai/apps/dhanda/6739134664
4. **AI content that is wrong about the product, posted anyway.** Loban (resin)
   described as a healthy snack; corrections promised, same wrong content kept
   posting. https://mwm.ai/apps/dhanda/6739134664 (App Store review)
5. **Account connection failures.** FB/Instagram never aligned after payment;
   verified Google profile not connectable when a duplicate profile exists.
   Play URL above.

What satisfied users praise (1 detailed 5-star, App Store): guided onboarding,
personalised suggestions, practical AI tools. Keep: guided setup + personalised
next-action suggestions. https://apps.apple.com/in/app/dhanda/id6739134664

## Fix plan baked into this clone

| # | Fix | Where in the build |
| --- | --- | --- |
| 1 | Self-serve, no sales call needed; support tickets with visible status + direct email/WhatsApp shown in-app | S14 Support screen |
| 2 | Public pricing on the landing page; free tier genuinely useful; every plan states exactly what posts/replies it includes | S01 pricing section, S13 |
| 3 | No autopay lock-in messaging; cancel in 2 clicks keeps access till period end (policy copy in billing UI) | S13 Billing |
| 4 | **Nothing publishes without human preview.** AI drafts only; user edits and approves; product facts come from fields the user typed, never invented | S07 Studio preview step (hard gate) |
| 5 | Works before any account connection: copy reply, download poster, share manually; duplicate-business warning in onboarding | S06 copy, S07 download, S03 warning |
| 6 | Nepal localisation the original lacks: Dashain/Tihar/New Year etc. template calendar, Nepali caption toggle, NPR pricing | S08 Library, S07, S01 |

## Positioning angle

"Your Google profile, run like clockwork - no sales calls, no autopay traps,
and nothing posts without your OK."
Self-serve AI marketing for local shops in Nepal & India: free honest audit,
approve-every-post AI, transparent flat pricing.

Pricing proposal (to validate): Free (audit + 5 AI replies/mo + 4 posts/mo),
Growth NPR 999/mo, Pro NPR 1,999/mo.
