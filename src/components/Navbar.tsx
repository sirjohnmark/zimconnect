'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center gap-2">
                        <Link href="/" className="text-2xl font-black tracking-tight text-brand-600">
                            ZimConnect<span className="text-accent-500">.</span>
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link href="/" className="text-slate-600 hover:text-brand-600 font-medium transition-colors">Home</Link>
                        <Link href="#categories" className="text-slate-600 hover:text-brand-600 font-medium transition-colors">Categories</Link>
                        <Link href="#how-it-works" className="text-slate-600 hover:text-brand-600 font-medium transition-colors">How It Works</Link>
                        <Link href="#contact" className="text-slate-600 hover:text-brand-600 font-medium transition-colors">Contact</Link>
                    </div>

                    <div className="hidden md:flex items-center space-x-4">
                        <Link href="/login" className="text-slate-600 font-medium hover:text-brand-600 transition-colors">Log In</Link>
                        <Link href="/sell" className="bg-brand-600 text-white px-5 py-2.5 rounded-full font-medium hover:bg-brand-700 shadow-sm shadow-brand-500/20 transition-all hover:shadow-md hover:-translate-y-0.5">
                            Start Selling
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-slate-600 hover:text-brand-600 focus:outline-none p-2 rounded-md transition-colors"
                            aria-label="Toggle menu"
                        >
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isOpen && (
                <div className="md:hidden bg-white border-b border-slate-200 absolute w-full left-0 shadow-xl shadow-slate-900/5">
                    <div className="px-4 py-4 space-y-2 flex flex-col items-start bg-white">
                        <Link onClick={() => setIsOpen(false)} href="/" className="block px-3 py-3 text-base font-medium text-slate-800 hover:text-brand-600 hover:bg-brand-50 w-full rounded-xl transition-colors">Home</Link>
                        <Link onClick={() => setIsOpen(false)} href="#categories" className="block px-3 py-3 text-base font-medium text-slate-800 hover:text-brand-600 hover:bg-brand-50 w-full rounded-xl transition-colors">Categories</Link>
                        <Link onClick={() => setIsOpen(false)} href="#how-it-works" className="block px-3 py-3 text-base font-medium text-slate-800 hover:text-brand-600 hover:bg-brand-50 w-full rounded-xl transition-colors">How It Works</Link>
                        <Link onClick={() => setIsOpen(false)} href="#contact" className="block px-3 py-3 text-base font-medium text-slate-800 hover:text-brand-600 hover:bg-brand-50 w-full rounded-xl transition-colors">Contact</Link>

                        <div className="h-px bg-slate-100 w-full my-4"></div>

                        <Link onClick={() => setIsOpen(false)} href="/login" className="block px-3 py-3 text-base font-medium text-slate-600 hover:text-brand-600 w-full rounded-xl">Log In</Link>
                        <Link onClick={() => setIsOpen(false)} href="/sell" className="mt-2 w-full text-center bg-brand-600 text-white px-5 py-3.5 rounded-xl font-semibold hover:bg-brand-700 shadow-md transition-all">
                            Start Selling
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
}
