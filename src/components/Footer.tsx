import Link from 'next/link';
import { Facebook, Twitter, Instagram } from 'lucide-react';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-white border-t border-slate-200" aria-labelledby="footer-heading">
            <h2 id="footer-heading" className="sr-only">Footer</h2>
            <div className="mx-auto max-w-7xl px-4 pb-8 pt-16 sm:px-6 lg:px-8 lg:pt-24">
                <div className="xl:grid xl:grid-cols-3 xl:gap-8">
                    <div className="space-y-8">
                        <Link href="/" className="text-2xl font-black tracking-tight text-brand-600">
                            ZimConnect<span className="text-accent-500">.</span>
                        </Link>
                        <p className="text-sm leading-6 text-slate-600 max-w-xs">
                            Zimbabwe's smart local commerce platform. Buy, sell, and discover amazing deals right in your neighborhood effortlessly.
                        </p>
                        <div className="flex space-x-6">
                            <a href="#" className="text-slate-400 hover:text-brand-600 transition-colors">
                                <span className="sr-only">Facebook</span>
                                <Facebook size={24} />
                            </a>
                            <a href="#" className="text-slate-400 hover:text-brand-600 transition-colors">
                                <span className="sr-only">Instagram</span>
                                <Instagram size={24} />
                            </a>
                            <a href="#" className="text-slate-400 hover:text-brand-600 transition-colors">
                                <span className="sr-only">X / Twitter</span>
                                <Twitter size={24} />
                            </a>
                        </div>
                    </div>
                    <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
                        <div className="md:grid md:grid-cols-2 md:gap-8">
                            <div>
                                <h3 className="text-sm font-semibold leading-6 text-slate-900">Marketplace</h3>
                                <ul role="list" className="mt-6 space-y-4">
                                    <li><Link href="#" className="text-sm leading-6 text-slate-600 hover:text-brand-600 transition-colors">All Categories</Link></li>
                                    <li><Link href="#" className="text-sm leading-6 text-slate-600 hover:text-brand-600 transition-colors">Vehicles</Link></li>
                                    <li><Link href="#" className="text-sm leading-6 text-slate-600 hover:text-brand-600 transition-colors">Property</Link></li>
                                    <li><Link href="#" className="text-sm leading-6 text-slate-600 hover:text-brand-600 transition-colors">Electronics</Link></li>
                                </ul>
                            </div>
                            <div className="mt-10 md:mt-0">
                                <h3 className="text-sm font-semibold leading-6 text-slate-900">Support</h3>
                                <ul role="list" className="mt-6 space-y-4">
                                    <li><Link href="#" className="text-sm leading-6 text-slate-600 hover:text-brand-600 transition-colors">Help Center</Link></li>
                                    <li><Link href="#" className="text-sm leading-6 text-slate-600 hover:text-brand-600 transition-colors">Trust & Safety</Link></li>
                                    <li><Link href="#" className="text-sm leading-6 text-slate-600 hover:text-brand-600 transition-colors">Selling Tips</Link></li>
                                    <li><Link href="#" className="text-sm leading-6 text-slate-600 hover:text-brand-600 transition-colors">Contact Us</Link></li>
                                </ul>
                            </div>
                        </div>
                        <div className="md:grid md:grid-cols-2 md:gap-8">
                            <div>
                                <h3 className="text-sm font-semibold leading-6 text-slate-900">Company</h3>
                                <ul role="list" className="mt-6 space-y-4">
                                    <li><Link href="#" className="text-sm leading-6 text-slate-600 hover:text-brand-600 transition-colors">About Us</Link></li>
                                    <li><Link href="#" className="text-sm leading-6 text-slate-600 hover:text-brand-600 transition-colors">Careers</Link></li>
                                    <li><Link href="#" className="text-sm leading-6 text-slate-600 hover:text-brand-600 transition-colors">Blog</Link></li>
                                </ul>
                            </div>
                            <div className="mt-10 md:mt-0">
                                <h3 className="text-sm font-semibold leading-6 text-slate-900">Legal</h3>
                                <ul role="list" className="mt-6 space-y-4">
                                    <li><Link href="#" className="text-sm leading-6 text-slate-600 hover:text-brand-600 transition-colors">Terms of Service</Link></li>
                                    <li><Link href="#" className="text-sm leading-6 text-slate-600 hover:text-brand-600 transition-colors">Privacy Policy</Link></li>
                                    <li><Link href="#" className="text-sm leading-6 text-slate-600 hover:text-brand-600 transition-colors">Cookie Policy</Link></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-16 border-t border-slate-200 pt-8 sm:mt-20 lg:mt-24">
                    <p className="text-xs leading-5 text-slate-500 text-center">
                        &copy; {currentYear} ZimConnect Ltd. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
