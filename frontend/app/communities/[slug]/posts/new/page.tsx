"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function NewPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  useEffect(() => {
    if (slug) {
      router.replace(`/communities/${slug}`);
    }
  }, [slug, router]);

  return (
    <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center font-poppins">
      <div className="flex flex-col items-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500 mb-3" />
        <p className="text-xs font-semibold text-gray-500">Opening post editor...</p>
      </div>
    </div>
  );
}
