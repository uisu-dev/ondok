import { getAdminSupabase } from "@/data/supabase-admin";
import { estimateGradeLabel, estimateGradeNumber } from "@/lib/grade";
import type { StudentRow } from "./StudentsTable";

interface DashRow {
  id: string;
  login_id: string | null;
  display_name: string | null;
  school_code: string | null;
  school_name: string | null;
  birth_year: number | null;
  grade: number | null;
  class_no: number | null;
  student_no: number | null;
  grade_year: number | null;
  mbti: string | null;
  sago: number;
  sago_g1: number;
  sago_g2: number;
  sago_g3: number;
  sago_g4: number;
  books: number;
  sheets: number;
  works_read: number;
  works_done: number;
  battle_wins: number;
  game_plays: number;
  last_active: string | null;
}

function toStudentRow(r: DashRow): StudentRow {
  return {
    id: r.id,
    name: r.display_name ?? "(이름 미입력)",
    loginId: r.login_id ?? null,
    schoolName: r.school_name,
    gradeLabel: estimateGradeLabel(r.birth_year),
    gradeNum: estimateGradeNumber(r.birth_year),
    grade: r.grade ?? null,
    classNo: r.class_no ?? null,
    studentNo: r.student_no ?? null,
    mbti: r.mbti,
    sago: Number(r.sago),
    sagoG1: Number(r.sago_g1 ?? 0),
    sagoG2: Number(r.sago_g2 ?? 0),
    sagoG3: Number(r.sago_g3 ?? 0),
    sagoG4: Number(r.sago_g4 ?? 0),
    books: Number(r.books),
    sheets: Number(r.sheets),
    worksRead: Number(r.works_read ?? 0),
    worksDone: Number(r.works_done ?? 0),
    battleWins: Number(r.battle_wins ?? 0),
    gamePlays: Number(r.game_plays ?? 0),
    lastActive: r.last_active ?? null,
  };
}

/** 학생 현황 표에 쓰는 행. 교원 화면과 새로고침 API가 같은 조회를 쓴다. */
export async function loadStudentDashboard(
  schoolCode: string | null
): Promise<StudentRow[]> {
  const admin = getAdminSupabase();
  const { data, error } = await admin.rpc("student_dashboard", {
    p_school_code: schoolCode,
  });
  if (error) throw new Error(error.message);
  return ((data ?? []) as DashRow[]).map(toStudentRow);
}
