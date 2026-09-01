"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EditorQueueRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/editorial");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#040706] flex items-center justify-center font-poppins text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E4F953]"></div>
        <p className="text-xs font-semibold tracking-wider">Redirecting to Editorial Workspace...</p>
      </div>
    </div>
  );
}
