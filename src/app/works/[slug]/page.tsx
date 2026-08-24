import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedWork, getWorkRecord } from "@/data/works";
import { parseSections } from "@/lib/work-types";
import { getSignedInUser, isTeacherOrAdmin } from "@/lib/auth";
import { WorkReader } from "./WorkReader";

export const dynamic = "force-dynamic";

export default async function WorkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const work = await getPublishedWork(slug);
  if (!work) notFound();

  const sections = parseSections(work.body);

  const user = await getSignedInUser();
  const record = user ? await getWorkRecord(work.id) : null;

  // 학생에게는 예시 답안·평가 기준을 아예 내려보내지 않는다.
  // 화면에서 가리기만 하면 페이지 소스에 그대로 남아 베껴 쓸 수 있다.
  // (교원·관리자는 수업 준비에 필요하므로 그대로 본다)
  const canSeeAnswers = isTeacherOrAdmin(user?.profile ?? null);
  const safeWork = canSeeAnswers
    ? work
    : {
        ...work,
        questions: work.questions.map((q) => {
          const { sampleAnswer: _s, rubric: _r, ...rest } = q;
          return rest;
        }),
      };

  return (
    <main className="flex-1 w-full">
      <div className="mx-auto max-w-[720px] px-6 py-6 space-y-4">
        <div className="text-xs font-semibold text-fg-muted">
          <Link href="/works" className="hover:text-fg-strong">
            ← 필수 고전소설
          </Link>
        </div>
        <WorkReader
          work={safeWork}
          sections={sections}
          initialRecord={record}
          signedIn={!!user}
          canSeeAnswers={canSeeAnswers}
        />
      </div>
    </main>
  );
}
