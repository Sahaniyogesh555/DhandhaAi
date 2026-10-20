import { useEffect, useState } from "react";
import type { AppState, Business, Review, User } from "./types";

const KEY = "dhandhaai_v1";

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

// Demo-only password obfuscation (NOT production security - replaced by Supabase Auth in v2).
export function hashPw(pw: string): string {
  let h = 5381;
  for (let i = 0; i < pw.length; i++) h = ((h << 5) + h + pw.charCodeAt(i)) >>> 0;
  return "h" + h.toString(36);
}

export const emptyHours = () => ({ mon: "9:00 AM – 8:00 PM", tue: "9:00 AM – 8:00 PM", wed: "9:00 AM – 8:00 PM", thu: "9:00 AM – 8:00 PM", fri: "9:00 AM – 8:00 PM", sat: "9:00 AM – 8:00 PM", sun: "" });

export const initialState: AppState = {
  users: [], sessionUserId: null, businesses: [], activeBusinessId: null,
  reviews: [], posts: [], competitors: [], tickets: [], snapshots: [],
};

function seedDemo(state: AppState): AppState {
  const user: User = { id: uid(), name: "Demo Owner", email: "demo@dhandhaai.app", passwordHash: hashPw("demo"), plan: "free", createdAt: new Date().toISOString() };
  const biz: Business = {
    id: uid(), ownerId: user.id,
    name: "Thamel Bites Cafe",
    category: "Cafe & Bakery",
    city: "Kathmandu", area: "Thamel", address: "JP Street, Thamel",
    phone: "+977 98XXXXXXXX", website: "",
    description: "Cosy cafe in Thamel serving fresh bakery items, Ilam tea and all-day breakfast.",
    services: ["All-day breakfast", "Fresh bakery", "Ilam tea & coffee"],
    hours: { ...emptyHours(), mon: "7:00 AM – 9:00 PM", tue: "7:00 AM – 9:00 PM", wed: "7:00 AM – 9:00 PM", thu: "7:00 AM – 9:00 PM", fri: "7:00 AM – 9:00 PM", sat: "7:00 AM – 9:00 PM", sun: "7:00 AM – 9:00 PM" },
    photoCount: 6,
    googleConnected: false, facebookConnected: false, instagramConnected: false,
    createdAt: new Date().toISOString(),
  };
  // Sample reviews written for this demo (fictional, labelled in UI as demo data).
  const now = Date.now();
  const reviews: Review[] = [
    { id: uid(), businessId: biz.id, author: "Aarav Sharma", rating: 5, text: "Best breakfast in Thamel. The fresh bakery items and Ilam tea were lovely, staff very friendly.", date: new Date(now - 2 * 864e5).toISOString() },
    { id: uid(), businessId: biz.id, author: "Priya Patel", rating: 4, text: "Nice cosy place, good coffee. Got a bit crowded at lunch but worth it.", date: new Date(now - 5 * 864e5).toISOString() },
    { id: uid(), businessId: biz.id, author: "Bibek Tamang", rating: 2, text: "Waited 25 minutes for my order and it was cold. Food taste was okay but service needs work.", date: new Date(now - 8 * 864e5).toISOString() },
    { id: uid(), businessId: biz.id, author: "Sunita Rai", rating: 5, text: "Our family stops here every Saturday. Clean, quick and the cakes are fresh.", date: new Date(now - 12 * 864e5).toISOString(), replyText: "Thank you so much, Sunita! Saturday visits from your family make our week. See you soon!", repliedAt: new Date(now - 11 * 864e5).toISOString() },
    { id: uid(), businessId: biz.id, author: "Rohit Kumar", rating: 3, text: "Average experience. Price is fair for Thamel. Nothing special.", date: new Date(now - 16 * 864e5).toISOString() },
  ];
  return {
    ...state,
    users: [...state.users, user],
    sessionUserId: user.id,
    businesses: [...state.businesses, biz],
    activeBusinessId: biz.id,
    reviews: [...state.reviews, ...reviews],
    competitors: [
      ...state.competitors,
      { id: uid(), businessId: biz.id, name: "Himalayan Java (sample)", rating: 4.6, reviewCount: 1820, photoCount: 240, postsPerMonth: 12 },
      { id: uid(), businessId: biz.id, name: "Corner Bakery Thamel (sample)", rating: 4.2, reviewCount: 310, photoCount: 45, postsPerMonth: 4 },
    ],
  };
}

export function useAppStore() {
  const [state, setState] = useState<AppState>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return { ...initialState, ...JSON.parse(raw) } as AppState;
    } catch { /* fresh start */ }
    return initialState;
  });

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full/blocked */ }
  }, [state]);

  const update = (fn: (s: AppState) => AppState) => setState((s) => fn(s));

  const currentUser = state.users.find((u) => u.id === state.sessionUserId) ?? null;
  const myBusinesses = currentUser ? state.businesses.filter((b) => b.ownerId === currentUser.id) : [];
  const activeBusiness = myBusinesses.find((b) => b.id === state.activeBusinessId) ?? myBusinesses[0] ?? null;

  return {
    state, update, currentUser, myBusinesses, activeBusiness,
    startDemo: () => update((s) => {
      const existing = s.users.find((u) => u.email === "demo@dhandhaai.app");
      if (existing) {
        const biz = s.businesses.find((b) => b.ownerId === existing.id);
        return { ...s, sessionUserId: existing.id, activeBusinessId: biz?.id ?? s.activeBusinessId };
      }
      return seedDemo(s);
    }),
    signup: (name: string, email: string, password: string): string | null => {
      if (state.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) return "An account with this email already exists. Log in instead.";
      const user: User = { id: uid(), name, email, passwordHash: hashPw(password), plan: "free", createdAt: new Date().toISOString() };
      update((s) => ({ ...s, users: [...s.users, user], sessionUserId: user.id, activeBusinessId: null }));
      return null;
    },
    login: (email: string, password: string): string | null => {
      const user = state.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!user || user.passwordHash !== hashPw(password)) return "Email or password does not match. Please try again.";
      const biz = state.businesses.find((b) => b.ownerId === user.id);
      update((s) => ({ ...s, sessionUserId: user.id, activeBusinessId: biz?.id ?? null }));
      return null;
    },
    logout: () => update((s) => ({ ...s, sessionUserId: null })),
  };
}

export type Store = ReturnType<typeof useAppStore>;

export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
export const fmtDateTime = (iso: string) => new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
