import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { getSignedInUser } from "@/lib/auth";
import schoolsJson from "@/data/schools.json";
import { SignupForm } from "./SignupForm";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const user = await getSignedInUser();
  if (user) redirect("/mypage");

  const schools = (
    schoolsJson as { schools: { code: string; name: string; type: string }[] }
  ).schools;

  return (
    <main className="flex-1 w-full">
      <div className="mx-auto max-w-[560px] px-6 py-10 space-y-4">
        <div className="text-xs font-semibold text-fg-muted">
          <Link href="/" className="hover:text-fg-strong">
            ← 홈으로
          </Link>
        </div>
        <Card as="section" className="px-6 py-8 space-y-5">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-accent-600">온독 플러스</p>
            <h1 className="text-xl font-bold text-fg-strong">회원가입</h1>
            <p className="text-sm text-fg-muted leading-relaxed">
              가입 유형을 고르고 몇 가지만 입력하면 끝나요. <strong>학생</strong>은 바로 이용할 수 있고,
              <strong>교사</strong>는 관리자 승인을 거쳐 교원 권한으로 올려 드립니다.
            </p>
          </div>
          <SignupForm schools={schools} />
          <p className="text-xs text-fg-subtle text-center">
            이미 계정이 있다면{" "}
            <Link href="/login" className="text-accent-600 font-semibold">
              로그인
            </Link>
          </p>
        </Card>
      </div>
    </main>
  );
}
