import type { AuditSnapshot, Business, Competitor, Post, Review, Ticket, User } from "./types";

// Runtime mapper from PostgREST rows (snake_case) to the app's camelCase models.
// If the schema grows, generate Database types with `supabase gen types` and
// replace DbRow with the generated row types.
type DbRow = Record<string, any>;

const asPlan = (value: unknown): User["plan"] =>
  value === "growth" || value === "pro" ? value : "free";

export const profileToUser = (row: DbRow, authEmail = ""): User => ({
  id: row.id,
  name: row.name ?? "",
  email: row.email || authEmail,
  passwordHash: "", // Supabase Auth owns credentials; never stored client-side.
  plan: asPlan(row.plan),
  createdAt: row.created_at ?? new Date().toISOString(),
});

export const businessToRow = (b: Business) => ({
  id: b.id,
  owner_id: b.ownerId,
  name: b.name,
  category: b.category,
  city: b.city,
  area: b.area,
  address: b.address,
  phone: b.phone,
  website: b.website,
  description: b.description,
  services: b.services,
  hours: b.hours,
  photo_count: b.photoCount,
  google_connected: b.googleConnected,
  facebook_connected: b.facebookConnected,
  instagram_connected: b.instagramConnected,
  created_at: b.createdAt,
});

export const rowToBusiness = (r: DbRow): Business => ({
  id: r.id,
  ownerId: r.owner_id,
  name: r.name,
  category: r.category,
  city: r.city,
  area: r.area ?? "",
  address: r.address ?? "",
  phone: r.phone ?? "",
  website: r.website ?? "",
  description: r.description ?? "",
  services: r.services ?? [],
  hours: r.hours ?? {},
  photoCount: r.photo_count ?? 0,
  googleConnected: Boolean(r.google_connected),
  facebookConnected: Boolean(r.facebook_connected),
  instagramConnected: Boolean(r.instagram_connected),
  createdAt: r.created_at,
});

export const reviewToRow = (r: Review) => ({
  id: r.id,
  business_id: r.businessId,
  author: r.author,
  rating: r.rating,
  text: r.text,
  reviewed_at: r.date,
  reply_text: r.replyText ?? null,
  replied_at: r.repliedAt ?? null,
});

export const rowToReview = (r: DbRow): Review => ({
  id: r.id,
  businessId: r.business_id,
  author: r.author,
  rating: Number(r.rating),
  text: r.text ?? "",
  date: r.reviewed_at,
  replyText: r.reply_text ?? undefined,
  repliedAt: r.replied_at ?? undefined,
});

export const postToRow = (p: Post) => ({
  id: p.id,
  business_id: p.businessId,
  kind: p.kind,
  post_type: p.postType,
  headline: p.headline,
  caption: p.caption,
  hashtags: p.hashtags,
  image_theme: p.theme,
  channels: p.channels,
  status: p.status,
  scheduled_at: p.scheduledAt ?? null,
  published_at: p.publishedAt ?? null,
  created_at: p.createdAt,
});

export const rowToPost = (r: DbRow): Post => ({
  id: r.id,
  businessId: r.business_id,
  kind: r.kind,
  postType: r.post_type,
  headline: r.headline ?? "",
  caption: r.caption ?? "",
  hashtags: r.hashtags ?? [],
  theme: r.image_theme ?? "emerald",
  channels: r.channels ?? [],
  status: r.status,
  scheduledAt: r.scheduled_at ?? undefined,
  publishedAt: r.published_at ?? undefined,
  createdAt: r.created_at,
});

export const competitorToRow = (c: Competitor) => ({
  id: c.id,
  business_id: c.businessId,
  name: c.name,
  rating: c.rating,
  review_count: c.reviewCount,
  photo_count: c.photoCount,
  posts_per_month: c.postsPerMonth,
});

export const rowToCompetitor = (r: DbRow): Competitor => ({
  id: r.id,
  businessId: r.business_id,
  name: r.name,
  rating: Number(r.rating ?? 0),
  reviewCount: r.review_count ?? 0,
  photoCount: r.photo_count ?? 0,
  postsPerMonth: r.posts_per_month ?? 0,
});

export const snapshotToRow = (s: AuditSnapshot) => ({
  id: s.id,
  business_id: s.businessId,
  overall: s.overall,
  gbp_score: s.factors?.gbp ?? null,
  review_score: s.factors?.reviews ?? null,
  social_score: s.factors?.social ?? null,
  keyword_score: s.factors?.keywords ?? null,
  checks: s.checks ?? [],
  created_at: s.createdAt,
});

export const rowToSnapshot = (r: DbRow): AuditSnapshot => ({
  id: r.id,
  businessId: r.business_id,
  overall: r.overall,
  factors: r.gbp_score == null && r.review_score == null ? undefined : {
    gbp: r.gbp_score ?? 0,
    reviews: r.review_score ?? 0,
    social: r.social_score ?? 0,
    keywords: r.keyword_score ?? 0,
  },
  checks: r.checks ?? undefined,
  createdAt: r.created_at,
});

export const ticketToRow = (t: Ticket) => ({
  id: t.id,
  user_id: t.userId,
  subject: t.subject,
  message: t.message,
  status: t.status,
  created_at: t.createdAt,
});

export const rowToTicket = (r: DbRow): Ticket => ({
  id: r.id,
  userId: r.user_id,
  subject: r.subject,
  message: r.message,
  status: r.status,
  createdAt: r.created_at,
});
