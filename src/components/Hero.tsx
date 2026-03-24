import Link from "next/link";
import { Search, MapPin } from "lucide-react";

export default function Hero() {
    return (
        <section className="relative overflow-hidden bg-white pb-16 pt-24 sm:pb-24 sm:pt-32 lg:pb-32 lg:pt-40">
            {/* Background Decorative Blobs */}
            <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
                <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-brand-200 to-accent-200 opacity-60 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-600 text-sm font-medium mb-6 border border-brand-100">
                        <span className="flex h-2 w-2 rounded-full bg-brand-600"></span>
                        Zimbabwe&apos;s fastest growing marketplace
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-6xl mb-6">
                        Buy and sell locally, <br className="hidden sm:block" />
                        <span className="text-brand-600">simpler and safer.</span>
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-slate-600 max-w-2xl mx-auto">
                        Discover thousands of items for sale in your neighborhood. From vehicles and real estate to electronics and services, connect directly with buyers and sellers across Zimbabwe.
                    </p>

                    {/* Quick Search Bar */}
                    <div className="mt-10 bg-white p-2 sm:p-3 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto">
                        <div className="relative flex-grow flex items-center">
                            <Search className="absolute left-4 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="What are you looking for?"
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500 rounded-xl outline-none transition-all placeholder:text-slate-400"
                            />
                        </div>
                        <div className="relative sm:w-1/3 flex items-center">
                            <MapPin className="absolute left-4 text-slate-400" size={20} />
                            <select className="w-full pl-12 pr-8 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500 rounded-xl outline-none transition-all text-slate-700 appearance-none bg-no-repeat bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%20%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_1rem_center]">
                                <option value="">All Locations</option>
                                <option value="harare">Harare</option>
                                <option value="bulawayo">Bulawayo</option>
                                <option value="mutare">Mutare</option>
                            </select>
                        </div>
                        <button className="bg-brand-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-brand-700 shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2 w-full sm:w-auto">
                            Search
                        </button>
                    </div>

                    <div className="mt-10 flex items-center justify-center gap-x-6">
                        <Link href="/sell" className="rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 transition-all hover:-translate-y-0.5">
                            Post an Item
                        </Link>
                        <Link href="#categories" className="text-sm font-semibold leading-6 text-slate-900 group">
                            Browse Categories <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">→</span>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
