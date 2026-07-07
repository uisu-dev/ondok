import Link from "next/link";
import { Card } from "@/components/ui/Card";

interface SubMenu {
  href: string;
  emoji: string;
  title: string;
  subtitle: string;
  hint: string;
  status: "준비중" | "공개";
}

const SUB_MENUS: SubMenu[] = [
  {
    href: "/worksheet/exam",
    emoji: "🎯",
    title: "수능·모의고사 비문학 활동지",
    subtitle: "평가원 기출 비문학 지문을 사고도구어 관점에서 풀어보기",
    hint: "출처 명시 + 사고도구어 관점 문제",
    status: "공개",
  },
  {
    href: "/worksheet/written",
    emoji: "✍️",
    title: "사고도구어 활용 지문 활동지",
    subtitle: "사고도구어가 자연스럽게 등장하는 짧은 글로 매일 학습",
    hint: "등급별 자체 제작 지문 + 활동",
    status: "공개",
  },
];

export default function WorksheetHub() {
  return (
    <main className="flex-1 w-full">
      <div className="mx-auto max-w-[720px] px-6 py-8 space-y-6">
        <div className="text-xs font-semibold text-fg-muted">
          <Link href="/" className="hover:text-fg-strong">
            ← 홈으로
          </Link>
        </div>

        <Card as="section" className="px-6 py-7 space-y-3">
          <p className="text-sm font-semibold text-accent-600">사고도구어</p>
          <h1 className="text-2xl font-bold text-fg-strong leading-snug">
            사고도구어 활동지
          </h1>
          <p className="text-sm text-fg leading-relaxed">
            글을 읽고, 사고도구어를 찾아내고, 자기 언어로 다시 표현하는
            독해 활동지예요. (온독도서로 만든 독후 활동은 홈의 <strong>온독도서</strong> 메뉴에 있어요.)
          </p>
        </Card>

        <div className="space-y-3">
          {SUB_MENUS.map((m) => (
            <Link key={m.href} href={m.href} className="block group">
              <Card
                interactive
                className="px-5 py-5 flex items-center gap-4 border border-transparent group-hover:border-accent-300 transition-colors"
              >
                <div className="shrink-0 w-14 h-14 rounded-2xl bg-accent-50 flex items-center justify-center text-3xl">
                  {m.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-bold text-fg-strong">
                      {m.title}
                    </p>
                    {m.status === "준비중" && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-chip bg-surface-muted text-fg-muted">
                        준비 중
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-fg-muted">{m.subtitle}</p>
                  <p className="text-xs text-fg-subtle mt-1 truncate">
                    {m.hint}
                  </p>
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
  );
}
