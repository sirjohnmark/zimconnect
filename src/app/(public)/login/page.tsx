import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "@/components/forms/LoginForm";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Sign in — ${SITE_NAME}`,
  description: "Sign in to your ZimConnect account.",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center">
          <span className="text-2xl font-bold text-green-600">{SITE_NAME}</span>
        </Link>
        <h1 className="mt-6 text-center text-2xl font-bold tracking-tight text-gray-900">
          Sign in to your account
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Welcome back to {SITE_NAME}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm ring-1 ring-gray-200 rounded-lg sm:px-10">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
