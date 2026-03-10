import Link from "next/link";

export default function CTA() {
    return (
        <section className="bg-white py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="relative isolate overflow-hidden bg-brand-600 px-6 py-24 text-center shadow-2xl rounded-[2.5rem] sm:px-16">
                    <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        Ready to turn your unused items into cash?
                    </h2>
                    <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-brand-100">
                        Join thousands of Zimbabweans who are buying and selling locally every day. It's safe, fast, and completely free to join.
                    </p>
                    <div className="mt-10 flex items-center justify-center gap-x-6">
                        <Link
                            href="/sell"
                            className="rounded-xl bg-white px-8 py-4 text-sm font-semibold text-brand-600 shadow-sm hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-all hover:-translate-y-1"
                        >
                            Start Selling Today
                        </Link>
                        <Link href="/register" className="text-sm font-semibold leading-6 text-white group">
                            Create an Account <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">→</span>
                        </Link>
                    </div>

                    {/* Decorative SVG elements */}
                    <svg viewBox="0 0 1024 1024" className="absolute left-1/2 top-1/2 -z-10 h-[64rem] w-[64rem] -translate-x-1/2 [mask-image:radial-gradient(closest-side,white,transparent)]" aria-hidden="true">
                        <circle cx="512" cy="512" r="512" fill="url(#gradient)" fillOpacity="0.7" />
                        <defs>
                            <radialGradient id="gradient">
                                <stop stopColor="#fbbf24" />
                                <stop offset="1" stopColor="#fbbf24" />
                            </radialGradient>
                        </defs>
                    </svg>
                </div>
            </div>
        </section>
    );
}
