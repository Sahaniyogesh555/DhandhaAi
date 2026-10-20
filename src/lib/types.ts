export type ID = string;

export interface User {
  id: ID;
  name: string;
  email: string;
  passwordHash: string; // demo-only local hash, replaced by Supabase Auth in v2
  plan: PlanId;
  createdAt: string;
}

export type PlanId = "free" | "growth" | "pro";

export interface BusinessHours {
  mon: string; tue: string; wed: string; thu: string; fri: string; sat: string; sun: string;
}

export interface Business {
  id: ID;
  ownerId: ID;
  name: string;
  category: string;
  city: string;
  area: string;
  address: string;
  phone: string;
  website: string;
  description: string;
  services: string[];
  hours: BusinessHours;
  photoCount: number;
  googleConnected: boolean; // simulated in v1 (owner's own GBP API approval pending)
  facebookConnected: boolean; // simulated in v1
  instagramConnected: boolean; // simulated in v1
  createdAt: string;
}

export interface Review {
  id: ID;
  businessId: ID;
  author: string;
  rating: number; // 1-5
  text: string;
  date: string; // ISO
  replyText?: string;
  repliedAt?: string;
}

export type PostKind = "social" | "google";
export type PostType = "festival" | "offer" | "product" | "update" | "tip";
export type PostStatus = "draft" | "scheduled" | "published";
export type Channel = "facebook" | "instagram" | "google";

export interface Post {
  id: ID;
  businessId: ID;
  kind: PostKind;
  postType: PostType;
  headline: string;
  caption: string;
  hashtags: string[];
  theme: string; // poster theme key
  channels: Channel[];
  status: PostStatus;
  scheduledAt?: string;
  publishedAt?: string;
  createdAt: string;
}

export interface Competitor {
  id: ID;
  businessId: ID;
  name: string;
  rating: number;
  reviewCount: number;
  photoCount: number;
  postsPerMonth: number;
}

export interface Ticket {
  id: ID;
  userId: ID;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved";
  createdAt: string;
}

export interface AuditSnapshot {
  id: ID;
  businessId: ID;
  overall: number;
  createdAt: string;
}

export interface AppState {
  users: User[];
  sessionUserId: ID | null;
  businesses: Business[];
  activeBusinessId: ID | null;
  reviews: Review[];
  posts: Post[];
  competitors: Competitor[];
  tickets: Ticket[];
  snapshots: AuditSnapshot[];
}

export type View =
  | "landing" | "auth" | "onboarding"
  | "dashboard" | "audit" | "reviews" | "studio" | "library" | "posts"
  | "keywords" | "competitors" | "billing" | "support" | "settings";
