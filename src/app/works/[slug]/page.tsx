import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedWork, getWorkRecord } from "@/data/works";
import { parseSections } from "@/lib/work-types";
import { createClient } from "@/lib/supabase/server";
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const record = user ? await getWorkRecord(work.id) : null;

  return (
    <main className="flex-1 w-full">
      <div className="mx-auto max-w-[720px] px-6 py-6 space-y-4">
        <div className="text-xs font-semibold text-fg-muted">
          <Link href="/works" className="hover:text-fg-strong">
            ← 고전 읽기
          </Link>
        </div>
        <WorkReader
          work={work}
          sections={sections}
          initialRecord={record}
          signedIn={!!user}
        />
      </div>
    </main>
  );
}
