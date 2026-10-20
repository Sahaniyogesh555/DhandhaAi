import { useCallback, useEffect, useRef, useState } from "react";
import type { User as AuthUser } from "@supabase/supabase-js";
import type { AppState, Business, Review, User } from "./types";
import { supabase } from "./supabase";
import {
  businessToRow, competitorToRow, postToRow, profileToUser, reviewToRow,
  rowToBusiness, rowToCompetitor, rowToPost, rowToReview, rowToSnapshot,
  rowToTicket, snapshotToRow, ticketToRow,
} from "./db";

const LOCAL_KEY = "dhandhaai_v1";
const ACTIVE_BIZ_KEY = "dhandhaai_active_business";
const DEMO_EMAIL = "demo@dhandhaai.app";
// Public shared demo account by design. Do not use this pattern for real users.
const DEMO_PASSWORD = "demo123456";

export const uid = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

// Used only by the browser-local fallback (not by Supabase Auth).
export function hashPw(pw: string): string {
  let h = 5381;
  for (let i = 0; i < pw.length; i++) h = ((h << 5) + h + pw.charCodeAt(i)) >>> 0;
  return "h" + h.toString(36);
}

export const emptyHours = () => ({
  mon: "9:00 AM – 8:00 PM", tue: "9:00 AM – 8:00 PM", wed: "9:00 AM – 8:00 PM",
  thu: "9:00 AM – 8:00 PM", fri: "9:00 AM – 8:00 PM", sat: "9:00 AM – 8:00 PM", sun: "",
});

export const initialState: AppState = {
  users: [], sessionUserId: null, businesses: [], activeBusinessId: null,
  reviews: [], posts: [], competitors: [], tickets: [], snapshots: [],
};

function buildDemoData(ownerId: string) {
  const biz: Business = {
    id: uid(), ownerId,
    name: "Thamel Bites Cafe", category: "Cafe & Bakery",
    city: "Kathmandu", area: "Thamel", address: "JP Street, Thamel",
    phone: "+977 98XXXXXXXX", website: "",
    description: "Cosy cafe in Thamel serving fresh bakery items, Ilam tea and all-day breakfast.",
    services: ["All-day breakfast", "Fresh bakery", "Ilam tea & coffee"],
    hours: {
      mon: "7:00 AM – 9:00 PM", tue: "7:00 AM – 9:00 PM", wed: "7:00 AM – 9:00 PM",
      thu: "7:00 AM – 9:00 PM", fri: "7:00 AM – 9:00 PM", sat: "7:00 AM – 9:00 PM", sun: "7:00 AM – 9:00 PM",
    },
    photoCount: 6, googleConnected: false, facebookConnected: false,
    instagramConnected: false, createdAt: new Date().toISOString(),
  };
  const now = Date.now();
  const reviews: Review[] = [
    { id: uid(), businessId: biz.id, author: "Aarav Sharma", rating: 5, text: "Best breakfast in Thamel. The fresh bakery items and Ilam tea were lovely, staff very friendly.", date: new Date(now - 2 * 864e5).toISOString() },
    { id: uid(), businessId: biz.id, author: "Priya Patel", rating: 4, text: "Nice cosy place, good coffee. Got a bit crowded at lunch but worth it.", date: new Date(now - 5 * 864e5).toISOString() },
    { id: uid(), businessId: biz.id, author: "Bibek Tamang", rating: 2, text: "Waited 25 minutes for my order and it was cold. Food taste was okay but service needs work.", date: new Date(now - 8 * 864e5).toISOString() },
    { id: uid(), businessId: biz.id, author: "Sunita Rai", rating: 5, text: "Our family stops here every Saturday. Clean, quick and the cakes are fresh.", date: new Date(now - 12 * 864e5).toISOString(), replyText: "Thank you so much, Sunita! Saturday visits from your family make our week. See you soon!", repliedAt: new Date(now - 11 * 864e5).toISOString() },
    { id: uid(), businessId: biz.id, author: "Rohit Kumar", rating: 3, text: "Average experience. Price is fair for Thamel. Nothing special.", date: new Date(now - 16 * 864e5).toISOString() },
  ];
  const competitors = [
    { id: uid(), businessId: biz.id, name: "Himalayan Java (sample)", rating: 4.6, reviewCount: 1820, photoCount: 240, postsPerMonth: 12 },
    { id: uid(), businessId: biz.id, name: "Corner Bakery Thamel (sample)", rating: 4.2, reviewCount: 310, photoCount: 45, postsPerMonth: 4 },
  ];
  return { biz, reviews, competitors };
}

function seedLocalDemo(state: AppState): AppState {
  const user: User = {
    id: uid(), name: "Demo Owner", email: DEMO_EMAIL, passwordHash: hashPw("demo"),
    plan: "free", createdAt: new Date().toISOString(),
  };
  const { biz, reviews, competitors } = buildDemoData(user.id);
  return {
    ...state,
    users: [...state.users, user], sessionUserId: user.id,
    businesses: [...state.businesses, biz], activeBusinessId: biz.id,
    reviews: [...state.reviews, ...reviews],
    competitors: [...state.competitors, ...competitors],
  };
}

const friendlyAuthError = (message: string): string => {
  const m = message.toLowerCase();
  if (m.includes("already registered") || m.includes("already exists")) return "An account with this email already exists. Log in instead.";
  if (m.includes("invalid login") || m.includes("invalid credentials")) return "Email or password does not match. Please try again.";
  if (m.includes("email not confirmed")) return "Please confirm your email first - we sent you a link.";
  if (m.includes("password")) return "Password must be at least 6 characters.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Wait a minute and try again.";
  return message;
};

const errorText = (error: unknown) => error instanceof Error ? error.message : "Could not connect to DhandhaAi. Check your internet and try again.";
type WriteResult = { error: { message: string } | null };
type PendingWrite = { ownerId: string; run: () => Promise<WriteResult> };

export function useAppStore() {
  // Real accounts always use Supabase. The localStorage branch remains only as
  // a deliberate development fallback if this client is ever removed.
  const client = supabase;
  const [state, setStateRaw] = useState<AppState>(() => {
    if (client) return initialState;
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (raw) return { ...initialState, ...JSON.parse(raw) } as AppState;
    } catch { /* fresh start */ }
    return initialState;
  });
  const stateRef = useRef(state);
  const syncChainRef = useRef<Promise<void>>(Promise.resolve());
  const pendingWritesRef = useRef<PendingWrite[]>([]);
  const loadedForRef = useRef<string | null>(null);
  const [ready, setReady] = useState(!client);
  const [syncError, setSyncError] = useState<string | null>(null);

  const replaceState = useCallback((next: AppState) => {
    stateRef.current = next;
    setStateRaw(next);
  }, []);

  useEffect(() => {
    stateRef.current = state;
    if (client) {
      // Only remember selected business locally; all business data is in Postgres.
      try {
        if (state.activeBusinessId) localStorage.setItem(ACTIVE_BIZ_KEY, state.activeBusinessId);
      } catch { /* storage may be blocked */ }
      return;
    }
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(state)); } catch { /* storage may be blocked */ }
  }, [state, client]);

  const loadAll = useCallback(async (authUser: AuthUser): Promise<AppState> => {
    const previousUserId = loadedForRef.current;
    if (previousUserId && previousUserId !== authUser.id) {
      pendingWritesRef.current = pendingWritesRef.current.filter((write) => write.ownerId !== previousUserId);
    }
    loadedForRef.current = authUser.id;
    const [profileResult, businessesResult, reviewsResult, postsResult, competitorsResult, snapshotsResult, ticketsResult] = await Promise.all([
      client.from("profiles").select("*").eq("id", authUser.id).maybeSingle(),
      client.from("businesses").select("*").order("created_at"),
      client.from("reviews").select("*").order("reviewed_at", { ascending: false }),
      client.from("posts").select("*").order("created_at", { ascending: false }),
      client.from("competitors").select("*"),
      client.from("audit_snapshots").select("*").order("created_at"),
      client.from("support_tickets").select("*").order("created_at", { ascending: false }),
    ]);
    const queryError = [profileResult, businessesResult, reviewsResult, postsResult, competitorsResult, snapshotsResult, ticketsResult]
      .find((result) => result.error)?.error;
    if (queryError) {
      loadedForRef.current = null;
      throw new Error(queryError.message);
    }

    // The auth.users trigger creates the profile synchronously at signup. This
    // in-memory fallback is only for a transient read race; the client has no
    // permission to insert/update the plan-bearing profile row.
    const profile = profileResult.data ?? {
      id: authUser.id,
      name: (authUser.user_metadata?.name as string | undefined) ?? "",
      email: authUser.email ?? "",
      plan: "free",
      created_at: new Date().toISOString(),
    };
    const businesses = (businessesResult.data ?? []).map(rowToBusiness);
    let savedBusinessId: string | null = null;
    try { savedBusinessId = localStorage.getItem(ACTIVE_BIZ_KEY); } catch { /* ignore */ }
    const next: AppState = {
      users: [profileToUser(profile, authUser.email ?? "")],
      sessionUserId: authUser.id,
      businesses,
      activeBusinessId: businesses.some((b) => b.id === savedBusinessId) ? savedBusinessId : businesses[0]?.id ?? null,
      reviews: (reviewsResult.data ?? []).map(rowToReview),
      posts: (postsResult.data ?? []).map(rowToPost),
      competitors: (competitorsResult.data ?? []).map(rowToCompetitor),
      snapshots: (snapshotsResult.data ?? []).map(rowToSnapshot),
      tickets: (ticketsResult.data ?? []).map(rowToTicket),
    };
    replaceState(next);
    setSyncError(null);
    return next;
  }, [client, replaceState]);

  useEffect(() => {
    let mounted = true;
    client.auth.getSession().then(async ({ data, error }) => {
      if (!mounted) return;
      if (error) setSyncError(error.message);
      if (data.session?.user) {
        try { await loadAll(data.session.user); }
        catch (e) { if (mounted) setSyncError(errorText(e)); }
      } else {
        replaceState(initialState);
      }
      if (mounted) setReady(true);
    }).catch((e: unknown) => {
      if (mounted) {
        setSyncError(errorText(e));
        setReady(true);
      }
    });

    // Supabase warns against awaiting database work inside this auth callback;
    // defer it so auth's internal lock is released first.
    const { data: listener } = client.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        loadedForRef.current = null;
        pendingWritesRef.current = [];
        replaceState(initialState);
        return;
      }
      const user = session?.user;
      if (user && loadedForRef.current !== user.id) {
        window.setTimeout(() => {
          if (!mounted || loadedForRef.current === user.id) return;
          void loadAll(user).catch((e: unknown) => setSyncError(errorText(e)));
        }, 0);
      }
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [client, loadAll, replaceState]);

  const queueSync = useCallback((before: AppState, after: AppState) => {
    const ownerId = after.sessionUserId;
    if (!ownerId) return;
    const operations: PendingWrite[] = [];
    const diff = <T extends { id: string }>(
      previous: T[], next: T[], table: string, toRow: (item: T) => Record<string, unknown>,
    ) => {
      const oldById = new Map(previous.map((item) => [item.id, JSON.stringify(item)]));
      const newIds = new Set(next.map((item) => item.id));
      for (const item of next) {
        if (oldById.get(item.id) === JSON.stringify(item)) continue;
        const row = toRow(item);
        operations.push({ ownerId, run: async () => {
          const { error } = await client.from(table).upsert(row);
          return { error: error ? { message: error.message } : null };
        } });
      }
      for (const item of previous) {
        if (newIds.has(item.id)) continue;
        operations.push({ ownerId, run: async () => {
          const { error } = await client.from(table).delete().eq("id", item.id);
          return { error: error ? { message: error.message } : null };
        } });
      }
    };

    // Parent rows first for FK inserts; deletes cascade at the database.
    diff(before.businesses, after.businesses, "businesses", businessToRow);
    diff(before.reviews, after.reviews, "reviews", reviewToRow);
    diff(before.posts, after.posts, "posts", postToRow);
    diff(before.competitors, after.competitors, "competitors", competitorToRow);
    diff(before.snapshots, after.snapshots, "audit_snapshots", snapshotToRow);
    diff(before.tickets, after.tickets, "support_tickets", ticketToRow);
    // Profiles/subscriptions are deliberately excluded: only server-side
    // payment verification can grant a paid plan.
    if (!operations.length) return;

    pendingWritesRef.current.push(...operations);
    syncChainRef.current = syncChainRef.current.then(async () => {
      while (pendingWritesRef.current.length) {
        const pending = pendingWritesRef.current[0];
        const { data } = await client.auth.getSession();
        if (data.session?.user.id !== pending.ownerId) {
          pendingWritesRef.current = pendingWritesRef.current.filter((write) => write.ownerId !== pending.ownerId);
          continue;
        }
        const { error } = await pending.run();
        if (error) throw new Error(error.message);
        if (pendingWritesRef.current[0] === pending) pendingWritesRef.current.shift();
      }
      setSyncError(null);
    }).catch((e: unknown) => setSyncError(errorText(e)));
  }, [client]);

  const update = useCallback((fn: (s: AppState) => AppState) => {
    const previous = stateRef.current;
    const next = fn(previous);
    replaceState(next);
    queueSync(previous, next);
  }, [queueSync, replaceState]);

  const signup = useCallback(async (name: string, email: string, password: string): Promise<string | null> => {
    if (!client) {
      const old = stateRef.current;
      if (old.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) return "An account with this email already exists. Log in instead.";
      const user: User = { id: uid(), name, email, passwordHash: hashPw(password), plan: "free", createdAt: new Date().toISOString() };
      update((s) => ({ ...s, users: [...s.users, user], sessionUserId: user.id, activeBusinessId: null }));
      return null;
    }
    const { data, error } = await client.auth.signUp({ email, password, options: { data: { name } } });
    if (error) return friendlyAuthError(error.message);
    if (data.user && !data.session) return "Account created. Check your email to confirm it, then log in.";
    if (data.user) {
      try { await loadAll(data.user); }
      catch (e) { return `Your account was created, but its workspace did not load: ${errorText(e)}`; }
    }
    return null;
  }, [client, loadAll, update]);

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    if (!client) {
      const user = stateRef.current.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!user || user.passwordHash !== hashPw(password)) return "Email or password does not match. Please try again.";
      const biz = stateRef.current.businesses.find((b) => b.ownerId === user.id);
      update((s) => ({ ...s, sessionUserId: user.id, activeBusinessId: biz?.id ?? null }));
      return null;
    }
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) return friendlyAuthError(error.message);
    if (data.user) {
      try { await loadAll(data.user); }
      catch (e) { return `Signed in, but your workspace did not load: ${errorText(e)}`; }
    }
    return null;
  }, [client, loadAll, update]);

  const startDemo = useCallback(async (): Promise<void> => {
    if (!client) {
      const current = stateRef.current;
      const existing = current.users.find((u) => u.email === DEMO_EMAIL);
      if (existing) {
        const biz = current.businesses.find((b) => b.ownerId === existing.id);
        update((s) => ({ ...s, sessionUserId: existing.id, activeBusinessId: biz?.id ?? s.activeBusinessId }));
      } else {
        update((s) => seedLocalDemo(s));
      }
      return;
    }

    const { data: currentSession } = await client.auth.getSession();
    let authUser = currentSession.session?.user?.email === DEMO_EMAIL ? currentSession.session.user : null;
    if (!authUser) {
      if (currentSession.session) await client.auth.signOut();
      const signedIn = await client.auth.signInWithPassword({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
      if (!signedIn.error) authUser = signedIn.data.user;
      else {
        const created = await client.auth.signUp({ email: DEMO_EMAIL, password: DEMO_PASSWORD, options: { data: { name: "Demo Owner" } } });
        if (!created.error && created.data.session) authUser = created.data.user;
        else if (created.error?.message.toLowerCase().includes("already") || !created.data.session) {
          const retry = await client.auth.signInWithPassword({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
          if (!retry.error) authUser = retry.data.user;
          else throw new Error(friendlyAuthError(retry.error.message));
        } else if (created.error) {
          throw new Error(friendlyAuthError(created.error.message));
        }
      }
    }
    if (!authUser) throw new Error("Could not open the demo workspace. Please try again.");
    const loaded = await loadAll(authUser);
    if (!loaded.businesses.some((b) => b.ownerId === authUser!.id)) {
      const { biz, reviews, competitors } = buildDemoData(authUser.id);
      update((s) => ({
        ...s,
        businesses: [...s.businesses, biz], activeBusinessId: biz.id,
        reviews: [...s.reviews, ...reviews], competitors: [...s.competitors, ...competitors],
      }));
      // First demo launch waits for its seed writes; failures surface in the
      // shared sync banner without blocking the interactive demo.
      await syncChainRef.current;
    }
  }, [client, loadAll, update]);

  const logout = useCallback(() => {
    loadedForRef.current = null;
    pendingWritesRef.current = [];
    replaceState(initialState);
    void client.auth.signOut();
  }, [client, replaceState]);

  const currentUser = state.users.find((u) => u.id === state.sessionUserId) ?? null;
  const myBusinesses = currentUser ? state.businesses.filter((b) => b.ownerId === currentUser.id) : [];
  const activeBusiness = myBusinesses.find((b) => b.id === state.activeBusinessId) ?? myBusinesses[0] ?? null;

  return {
    state, update, currentUser, myBusinesses, activeBusiness,
    isSupabaseMode: Boolean(client), ready, syncError,
    clearSyncError: () => setSyncError(null),
    startDemo, signup, login, logout,
  };
}

export type Store = ReturnType<typeof useAppStore>;

export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
export const fmtDateTime = (iso: string) => new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
