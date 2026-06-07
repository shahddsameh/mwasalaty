import { createClient, type Session, type User } from "@supabase/supabase-js";

export type SupabaseAuthUser = User;
export type SupabaseAuthSession = Session;

export type AuthResult = {
  user: SupabaseAuthUser | null;
  session: SupabaseAuthSession | null;
  error: string | null;
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: "pkce",
  },
});

function browserRedirectTo(path: string) {
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

function normalizeError(error: unknown, fallback: string) {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export async function signUp(
  email: string,
  password: string,
  metadata: Record<string, unknown> = {},
): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });

  return {
    user: data.user ?? null,
    session: data.session ?? null,
    error: error ? normalizeError(error, "Could not create your account.") : null,
  };
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return {
    user: data.user ?? null,
    session: data.session ?? null,
    error: error ? normalizeError(error, "Could not sign in.") : null,
  };
}

export async function signInWithGoogle(): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: browserRedirectTo("/auth/callback"),
    },
  });

  return {
    error: error ? normalizeError(error, "Could not start Google sign-in.") : null,
  };
}

export async function exchangeCodeForSession(code: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  return {
    user: data.user ?? null,
    session: data.session ?? null,
    error: error
      ? normalizeError(error, "Could not complete Google sign-in.")
      : null,
  };
}

export async function getCurrentUser(): Promise<SupabaseAuthUser | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user ?? null;
}

export async function getCurrentSession(): Promise<SupabaseAuthSession | null> {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

export async function signOut(): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signOut();
  return {
    error: error ? normalizeError(error, "Could not log out right now.") : null,
  };
}
