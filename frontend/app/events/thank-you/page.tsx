"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";

function ThankYouContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status") || "success";
  const reason = searchParams.get("reason") || "Payment could not be completed. Please try again.";
  const isSuccess = status === "success";

  if (!isSuccess) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-[#EFF8FC] font-poppins">
        <div className="max-w-md w-full text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-950 tracking-tight mb-4">
            Payment Incomplete
          </h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-8">
            {reason}
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/events">
              <Button variant="primary" size="md" className="px-6 py-2.5 text-xs font-semibold cursor-pointer">
                Back to Events
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-[#EFF8FC] font-poppins">
      <div className="max-w-lg w-full text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-gray-950 tracking-tight mb-4">
          Thank You
        </h1>
        <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-md mx-auto mb-8">
          Your registration has been confirmed. A confirmation pass with event details has been sent to your email.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/">
            <Button variant="primary" size="md" className="px-6 py-2.5 text-xs font-semibold cursor-pointer">
              Back to Home
            </Button>
          </Link>
          <Link href="/events">
            <Button variant="secondary" size="md" className="px-6 py-2.5 text-xs font-semibold cursor-pointer">
              Explore Events
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[75vh] flex items-center justify-center bg-[#EFF8FC] font-poppins">
          <div className="w-8 h-8 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
        </div>
      }
    >
      <ThankYouContent />
    </Suspense>
  );
}
