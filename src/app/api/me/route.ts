import { NextResponse } from "next/server";
import { getSignedInUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// 현재 로그인 사용자의 간단한 정보 (클라이언트 컴포넌트에서 권한 분기용).
export async function GET() {
  const user = await getSignedInUser();
  return NextResponse.json({
    signedIn: !!user,
    role: user?.profile?.role ?? null,
  });
}
