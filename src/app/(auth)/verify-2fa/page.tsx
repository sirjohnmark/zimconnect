import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { TwoFAVerifyForm } from "@/components/auth/TwoFAVerifyForm";

export const metadata: Metadata = { title: "Two-Factor Verification" };

interface PageProps {
  searchParams: Promise<{ token?: string; redirect?: string; stay?: string }>;
}

export default async function VerifyTwoFAPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const challengeToken = params.token ?? "";
  const redirectTo     = params.redirect ?? "/dashboard";
  const stay           = params.stay === "1";

  if (!challengeToken) {
    redirect("/login");
  }

  return (
    <Suspense>
      <TwoFAVerifyForm
        challengeToken={challengeToken}
        redirectTo={redirectTo}
        stay={stay}
      />
    </Suspense>
  );
}
