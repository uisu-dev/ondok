import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { canAccessAdmin } from "@/lib/auth";
import { loadStudentDetail } from "./load";
import { StudentDetailLive } from "./StudentDetailLive";
import schoolsJson from "@/data/schools.json";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const access = await canAccessAdmin();
  if (!access.ok) redirect("/admin/login");
  const { id } = await params;
  const isSuper = access.reason === "hmac" || access.reason === "admin";

  const data = await loadStudentDetail(id);
  if (data.notFound) notFound();
  if (!data.error && !isSuper && data.student?.school_code !== access.user?.profile?.school_code) {
    redirect("/admin/students");
  }

  const {
    student,
    schoolName,
    breakdown,
    advice,
    favBooks,
    solvedSheets,
    readWorks,
    gameStats,
    totalKnown,
    totalAll,
  } = data;
  const envError = data.error;
  const fetchedAt = new Date().toISOString();
  const schools = (
    schoolsJson as {
      schools: { code: string; name: string; type: string }[];
    }
  ).schools;

  return (
    <div>
      <AdminHeader />
      <main className="flex-1 w-full">
        <div className="mx-auto max-w-[720px] px-6 py-8 space-y-5">
          <Link
            href="/admin/students"
            className="text-xs font-semibold text-fg-muted hover:text-fg-strong"
          >
            ← 학생 현황
          </Link>

          {envError ? (
            <Card as="section" className="px-6 py-5 bg-surface-muted">
              <p className="text-sm font-bold text-cat-hum">⚠️ 오류</p>
              <p className="text-xs text-fg-muted mt-1">{envError}</p>
            </Card>
          ) : (
            <StudentDetailLive
              studentId={id}
              isSuper={isSuper}
              schools={schools}
              fetchedAt={fetchedAt}
              initial={{
                student,
                schoolName,
                breakdown,
                advice,
                favBooks,
                solvedSheets,
                readWorks,
                gameStats,
                totalKnown,
                totalAll,
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
}
