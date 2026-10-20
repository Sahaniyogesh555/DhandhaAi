# Component specs (built in src/components/ui.tsx)

Tokens: replica/design/tokens.json - roles bg/surface/border/border-input/text/
text-muted/accent/on-accent/danger/success. Contrast: 9 pairs, 0 failing AA.
Icons: Lucide (MIT). Font: Manrope (open). All copy written fresh for this clone.

Button        primary (accent bg), secondary (surface + border), ghost, danger
              sizes sm/md/lg; states hover, focus-visible 2px ring, disabled, loading (spinner keeps label)
ScoreRing     0-100 ring, colour by band (<40 danger, <70 amber #b54708, else success); centre number + label
ScoreBar      labelled 0-100 bar per audit factor, same band colours
CheckItem     audit checklist row: pass/warn/fail icon, label, impact "+N pts", Fix button -> settings field
ReviewCard    stars, author, date, text, reply box or "Reply with AI" CTA; replied state shows owner reply
PostPreview   channel tabs (Instagram / Facebook / Google), poster + caption exactly as it will publish
PosterCanvas  1080x1080 generated poster (gradient theme, business facts only), PNG download
TemplateTile  occasion, region badge (Nepal/India/All), theme preview, Use button
StatCard      dashboard metric with delta-safe wording (no invented precision)
BottomNav     mobile: Home, Reviews, Create (centre), Posts, More; desktop: left sidebar with full list
EmptyState    icon + one-line explanation + single CTA (every list view has one)
PlanCard      price, period, included quotas stated numerically, current-plan state
Toast         success/error, auto-dismiss, aria-live
