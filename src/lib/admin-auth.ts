import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "ondok_admin";
const TOKEN = "admin-v1";

function sign(value: string): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not configured");
  return createHmac("sha256", secret).update(value).digest("hex");
}

/** Server-side check: is the current request from an admin? */
export async function isAdmin(): Promise<boolean> {
  let secret: string | undefined;
  try {
    secret = process.env.ADMIN_SESSION_SECRET;
  } catch {
    return false;
  }
  if (!secret) return false;
  const cookieStore = await cookies();
  const c = cookieStore.get(COOKIE_NAME);
  if (!c?.value) return false;
  let expected: string;
  try {
    expected = sign(TOKEN);
  } catch {
    return false;
  }
  try {
    const a = Buffer.from(c.value, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function setAdminCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, sign(TOKEN), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12, // 12시간
  });
}

export async function clearAdminCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/** Verify the user-typed password against env. Constant-time. */
export function verifyAdminPassword(input: string): boolean {
  const pass = process.env.ADMIN_PASSWORD;
  if (!pass) return false;
  const a = Buffer.from(input, "utf8");
  const b = Buffer.from(pass, "utf8");
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
