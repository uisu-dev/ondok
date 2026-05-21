import { redirect } from "next/navigation";

// Legacy entry point — the quiz now splits into /quiz/mbti, /quiz/interest, /quiz/career.
// Anyone hitting /quiz directly is sent to the landing to pick a method.
export default function QuizIndexPage() {
  redirect("/");
}
