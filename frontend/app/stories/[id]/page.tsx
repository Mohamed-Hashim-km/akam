import { redirect } from "next/navigation";

export default async function StoryDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/works/${id}`);
}
