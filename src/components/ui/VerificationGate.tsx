import Link from "next/link";

export function VerificationGate({ action }: { action: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-100 bg-amber-50 py-16 px-6 text-center gap-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 text-amber-600">
          <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900">Verification required</p>
        <p className="mt-1 text-xs text-gray-500 max-w-xs mx-auto">
          You must verify your email or phone before you can {action}.
        </p>
      </div>
      <Link
        href="/verify-email?trigger=1"
        className="rounded-lg bg-apple-blue px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
      >
        Verify Email
      </Link>
    </div>
  );
}
