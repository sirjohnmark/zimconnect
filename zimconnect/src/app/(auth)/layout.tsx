import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <Link href="/home" className="mb-8 flex items-center gap-2.5" aria-label="Sanganai home">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-apple-blue shadow-sm">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
            <path d="M3 13l3-3h2l2 2h4l2-2h2l3 3" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 10V8l2-2h1" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M17 10V8l-2-2h-1" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 12l1 2 2-2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 13l2 4h14l2-4" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
        <span className="text-xl font-semibold tracking-tight text-near-black">Sanganai</span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
