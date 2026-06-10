import { redirect } from "next/navigation";
import Link from "next/link";
import { canAccessAdmin, hasFullWorksheetAccess } from "@/lib/auth";
import {
  listAllWorksheetsAdmin,
  listMyWorksheetsAdmin,
} from "@/data/worksheets";
import { Card } from "@/components/ui/Card";
import { buttonClass } from "@/components/ui/Button";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminRowActions } from "@/components/admin/AdminRowActions";
import { TYPE_LABEL, TYPE_EMOJI } from "@/lib/worksheet-types";
import type { Worksheet } from "@/lib/worksheet-types";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const access = await canAccessAdmin();
  if (!access.ok) {
    // 로그인은 되었는데 학생인 경우 → mypage 로
    if (access.user && access.user.profile?.role === "student") {
      redirect("/mypage?msg=teacher-required");
    }
    redirect("/admin/login");
  }

  let worksheets: Worksheet[] = [];
  let envError: string | null = null;
  try {
    // HMAC 슈퍼관리자·admin 은 전부, 교원은 본인이 만든 것만
    if (hasFullWorksheetAccess(access.reason) || !access.user?.id) {
      worksheets = await listAllWorksheetsAdmin();
    } else {
      worksheets = await listMyWorksheetsAdmin(access.user.id);
    }
  } catch (e: unknown) {
    envError = e instanceof Error ? e.message : "Supabase 설정을 확인해 주세요.";
  }

  return (
    <div>
      <AdminHeader />
      <main className="flex-1 w-full">
        <div className="mx-auto max-w-[820px] px-6 py-8 space-y-6">
          <Card as="section" className="px-6 py-6 space-y-3">
            <h1 className="text-2xl font-bold text-fg-strong">활동지 관리</h1>
            <p className="text-sm text-fg-muted">
              세 가지 활동지 중 하나를 골라 새로 만들거나, 만든 활동지를
              관리할 수 있어요.
            </p>
            <div className="pt-2">
              <Link href="/admin/new" className={buttonClass("primary")}>
                + 새 활동지 만들기
              </Link>
            </div>
          </Card>

          {envError && (
            <Card as="section" className="px-6 py-5 space-y-2 bg-surface-muted">
              <p className="text-sm font-bold text-cat-hum">⚠️ 설정이 필요해요</p>
              <p className="text-xs text-fg-muted leading-relaxed">
                {envError}
              </p>
              <p className="text-xs text-fg-muted leading-relaxed">
                안내: Supabase Dashboard → Project Settings → API →
                <span className="font-mono mx-1">service_role secret</span>
                값을 복사한 뒤 <span className="font-mono">SUPABASE_SERVICE_ROLE_KEY</span>로
                .env.local과 Vercel 환경변수에 추가하세요. 그리고{" "}
                <span className="font-mono">scripts/migrations/2026-05-22-worksheets.sql</span>
                을 Supabase SQL Editor에서 실행해 주세요.
              </p>
            </Card>
          )}

          {!envError && worksheets.length === 0 && (
            <Card as="section" className="px-6 py-8 text-center space-y-3">
              <p className="text-3xl">📝</p>
              <p className="text-sm text-fg-muted">
                아직 만들어진 활동지가 없어요. 첫 활동지를 만들어 보세요.
              </p>
              <div>
                <Link href="/admin/new" className={buttonClass("primary")}>
                  첫 활동지 만들기
                </Link>
              </div>
            </Card>
          )}

          {worksheets.length > 0 && (
            <div className="space-y-2">
              {worksheets.map((w) => (
                <Card
                  key={w.id}
                  as="article"
                  className="px-5 py-4 space-y-1.5"
                >
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-xs font-bold text-accent-600">
                      {TYPE_EMOJI[w.type]} {TYPE_LABEL[w.type]}
                    </span>
                    {!w.published && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-chip bg-surface-muted text-fg-muted">
                        비공개
                      </span>
                    )}
                    <span className="text-xs text-fg-subtle ml-auto">
                      {new Date(w.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                  <p className="text-base font-bold text-fg-strong">{w.title}</p>
                  <div className="flex flex-wrap gap-3 pt-1 text-xs">
                    <Link
                      href={`/worksheet/${w.type}/${w.id}`}
                      className="font-semibold text-accent-600 hover:text-accent-700"
                    >
                      미리보기 →
                    </Link>
                    <Link
                      href={`/admin/edit/${w.id}`}
                      className="font-semibold text-accent-600 hover:text-accent-700"
                    >
                      수정
                    </Link>
                    <AdminRowActions id={w.id} published={w.published} />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
