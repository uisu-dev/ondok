import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

function getAllowedAdminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

function hasAdminRole(user: User): boolean {
  const role = user.app_metadata?.role;
  const roles = user.app_metadata?.roles;
  const isAdmin = user.app_metadata?.is_admin;

  return (
    role === "admin" ||
    (Array.isArray(roles) && roles.includes("admin")) ||
    isAdmin === true
  );
}

export function isAuthorizedAdmin(user: User): boolean {
  const allowedEmails = getAllowedAdminEmails();
  if (hasAdminRole(user)) return true;
  return user.email ? allowedEmails.has(user.email.toLowerCase()) : false;
}

export async function getAdminUser(): Promise<User | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user || !isAuthorizedAdmin(user)) return null;
    return user;
  } catch {
    return null;
  }
}

/** Server-side check: is the current request from an authorized admin? */
export async function isAdmin(): Promise<boolean> {
  return (await getAdminUser()) !== null;
}
