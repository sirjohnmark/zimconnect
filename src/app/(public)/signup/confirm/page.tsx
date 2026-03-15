import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Confirm your email — ${SITE_NAME}`,
};

export default function ConfirmPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center">
          <span className="text-2xl font-bold text-green-600">{SITE_NAME}</span>
        </Link>
        <div className="mt-8 bg-white py-8 px-4 shadow-sm ring-1 ring-gray-200 rounded-lg sm:px-10 text-center space-y-4">
          <div className="text-4xl">📬</div>
          <h1 className="text-xl font-bold text-gray-900">Check your email</h1>
          <p className="text-sm text-gray-600">
            We&apos;ve sent a confirmation link to your email address. Click it to activate
            your account and start using {SITE_NAME}.
          </p>
          <Link
            href="/login"
            className="inline-block mt-4 text-sm font-medium text-green-600 hover:text-green-700"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
