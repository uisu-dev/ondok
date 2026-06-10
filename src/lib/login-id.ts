// 사용자가 정한 login_id ↔ Supabase email 변환.
// Supabase 는 email 필수이므로 내부에서 '<login_id>@ondok.local' 로 매핑.

export const LOGIN_ID_DOMAIN = "@ondok.local";

/** 사용자가 입력하는 아이디 규칙: 영문 시작, 4~20자, 영문/숫자/_/. */
export const LOGIN_ID_RE = /^[a-z][a-z0-9_.]{3,19}$/;

export function isValidLoginId(id: string): boolean {
  return LOGIN_ID_RE.test(id);
}

export function loginIdToEmail(id: string): string {
  return `${id.toLowerCase()}${LOGIN_ID_DOMAIN}`;
}

export function emailToLoginId(email: string | null | undefined): string | null {
  if (!email) return null;
  if (!email.endsWith(LOGIN_ID_DOMAIN)) return null;
  return email.slice(0, -LOGIN_ID_DOMAIN.length);
}
