import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <Link href="/home" className="mb-8 text-2xl font-bold text-blue-600">
        ZimConnect
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
