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

  const schools = (schoolsJson as { schools: { code: string; name: string }[] })
    .schools;

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
              아이디·비밀번호와 이름·학교만 입력하면 가입이 끝나요. 모든 회원은 우선 <strong>학생</strong> 권한이며,
              교사이신 경우 가입 후 마이페이지에서 <strong>교원 승인 신청</strong>을 따로 하시면 됩니다.
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
