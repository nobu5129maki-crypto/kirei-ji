import { notFound } from "next/navigation";
import { LessonDetail } from "@/components/LessonDetail";
import { getLesson, LESSONS } from "@/lib/lessons";

export function generateStaticParams() {
  return LESSONS.map((l) => ({ slug: l.id }));
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lesson = getLesson(slug);
  if (!lesson) notFound();
  return <LessonDetail lesson={lesson} />;
}
