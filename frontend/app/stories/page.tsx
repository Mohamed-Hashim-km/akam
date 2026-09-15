import { redirect } from "next/navigation";

export default async function StoriesRedirect({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const search = typeof sp.search === "string" ? sp.search : "";
  const category = typeof sp.category === "string" ? sp.category : "";

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (category) params.set("category", category);

  const query = params.toString() ? `?${params.toString()}` : "";
  redirect(`/works${query}`);
}
