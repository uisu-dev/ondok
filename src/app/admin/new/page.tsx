import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdmin } from "@/lib/admin-auth";
import { Card } from "@/components/ui/Card";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { TYPE_LABEL, TYPE_EMOJI } from "@/lib/worksheet-types";

export const dynamic = "force-dynamic";

const DESCRIPTIONS: Record<string, string> = {
  books: "추천도서 214권 중 한 권을 선택해 만드는 독후 활동",
  exam: "평가원 기출 지문 출처와 함께 만드는 사고도구어 관점 활동",
  written: "사고도구어가 들어간 자체 지문을 직접 작성해 만드는 활동",
};

export default async function NewWorksheetTypePage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const types = (["books", "exam", "written"] as const).map((t) => ({
    key: t,
    emoji: TYPE_EMOJI[t],
    title: TYPE_LABEL[t],
    description: DESCRIPTIONS[t],
  }));
  return (
    <div>
      <AdminHeader />
      <main className="flex-1 w-full">
        <div className="mx-auto max-w-[820px] px-6 py-8 space-y-5">
          <Link
            href="/admin"
            className="text-xs font-semibold text-fg-muted hover:text-fg-strong"
          >
            ← 관리자 대시보드
          </Link>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-fg-strong">
              새 활동지 만들기
            </h1>
            <p className="text-sm text-fg-muted">
              어떤 종류의 활동지를 만들까요?
            </p>
          </div>
          <div className="space-y-3">
            {types.map((t) => (
              <Link
                key={t.key}
                href={`/admin/new/${t.key}`}
                className="block group"
              >
                <Card
                  interactive
                  className="px-5 py-5 flex items-center gap-4 border border-transparent group-hover:border-accent-300 transition-colors"
                >
                  <div className="shrink-0 w-14 h-14 rounded-2xl bg-accent-50 flex items-center justify-center text-3xl">
                    {t.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-fg-strong">
                      {t.title}
                    </p>
                    <p className="text-sm text-fg-muted">{t.description}</p>
                  </div>
                  <div className="shrink-0 text-accent-600 text-xl group-hover:translate-x-0.5 transition-transform">
                    →
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
