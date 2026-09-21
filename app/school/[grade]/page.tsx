import { notFound } from "next/navigation";
import { SchoolGradeView } from "@/components/SchoolGrade";
import { SCHOOL_GRADES, type SchoolGradeId } from "@/lib/school";

export function generateStaticParams() {
  return SCHOOL_GRADES.map((g) => ({ grade: g.id }));
}

export default async function SchoolGradePage({
  params,
}: {
  params: Promise<{ grade: string }>;
}) {
  const { grade } = await params;
  if (!SCHOOL_GRADES.some((g) => g.id === grade)) notFound();
  return <SchoolGradeView gradeId={grade as SchoolGradeId} />;
}
