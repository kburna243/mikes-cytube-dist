"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { API_BASE } from "@/lib/config";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }

    fetch(`${API_BASE}/api/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully.");
        } else {
          setStatus("error");
          setMessage(data.detail || "Verification failed.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Could not connect to server.");
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F2EFE9] dark:bg-[#1A1A1A]">
      <div className="max-w-[28rem] w-full mx-4 p-xl border border-primary/20 text-center">
        {status === "loading" && (
          <>
            <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-lg" />
            <h1 className="font-headline-lg text-headline-lg text-primary mb-md">
              Verifying your email
            </h1>
            <p className="text-body-md text-on-surface-variant">
              One moment please…
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="text-4xl mb-lg">&#10003;</div>
            <h1 className="font-headline-lg text-headline-lg text-primary mb-md">
              Email Verified
            </h1>
            <p className="text-body-md text-on-surface-variant mb-lg">
              {message}
            </p>
            <Link
              href="/dashboard"
              className="font-label-caps text-label-caps uppercase tracking-widest px-8 py-4 bg-primary text-on-primary hover:bg-secondary transition-colors duration-300 inline-block"
            >
              Go to Dashboard
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="text-4xl mb-lg">!</div>
            <h1 className="font-headline-lg text-headline-lg text-primary mb-md">
              Verification Failed
            </h1>
            <p className="text-body-md text-on-surface-variant mb-lg">
              {message}
            </p>
            <Link
              href="/settings"
              className="font-label-caps text-label-caps uppercase tracking-widest px-8 py-4 border border-primary text-primary hover:bg-primary hover:text-white transition-colors duration-300 inline-block"
            >
              Go to Settings
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F2EFE9] dark:bg-[#1A1A1A]">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
