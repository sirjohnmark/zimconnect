import type { Metadata } from "next";
import { Suspense } from "react";
import { EmailVerificationForm } from "@/components/auth/EmailVerificationForm";

export const metadata: Metadata = { title: "Verify Email" };

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <EmailVerificationForm />
    </Suspense>
  );
}
