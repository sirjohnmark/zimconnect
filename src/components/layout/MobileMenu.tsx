"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

interface MobileMenuProps {
  isAuthenticated: boolean;
  username: string | null;
}

export default function MobileMenu({ isAuthenticated, username }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="p-2 rounded-md text-slate-600 hover:text-brand-600 hover:bg-brand-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full bg-white border-b border-slate-200 shadow-lg z-40">
          <nav className="flex flex-col px-4 py-3 space-y-1">
            <Link
              href="/search"
              onClick={close}
              className="px-3 py-3 rounded-xl text-base font-medium text-slate-700 hover:text-brand-600 hover:bg-brand-50 transition-colors"
            >
              Browse listings
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={close}
                  className="px-3 py-3 rounded-xl text-base font-medium text-slate-700 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                >
                  Dashboard {username ? `(${username})` : ""}
                </Link>
                <div className="h-px bg-slate-100 my-1" />
                <Link
                  href="/sell"
                  onClick={close}
                  className="mt-1 w-full text-center rounded-xl bg-brand-600 px-4 py-3 text-base font-semibold text-white hover:bg-brand-700 transition-colors"
                >
                  Post a listing
                </Link>
              </>
            ) : (
              <>
                <div className="h-px bg-slate-100 my-1" />
                <Link
                  href="/login"
                  onClick={close}
                  className="px-3 py-3 rounded-xl text-base font-medium text-slate-700 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={close}
                  className="mt-1 w-full text-center rounded-xl bg-brand-600 px-4 py-3 text-base font-semibold text-white hover:bg-brand-700 transition-colors"
                >
                  Sign up free
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
