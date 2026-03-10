import { CarFront, Home, Laptop, Shirt, Sofa, Briefcase } from "lucide-react";

export default function Categories() {
    const categories = [
        { name: "Vehicles", icon: CarFront, color: "bg-blue-100 text-blue-600", count: "2,543" },
        { name: "Property", icon: Home, color: "bg-emerald-100 text-emerald-600", count: "1,200" },
        { name: "Electronics", icon: Laptop, color: "bg-purple-100 text-purple-600", count: "5,432" },
        { name: "Fashion", icon: Shirt, color: "bg-pink-100 text-pink-600", count: "8,211" },
        { name: "Home & Furniture", icon: Sofa, color: "bg-amber-100 text-amber-600", count: "3,110" },
        { name: "Jobs / Services", icon: Briefcase, color: "bg-indigo-100 text-indigo-600", count: "1,894" },
    ];

    return (
        <section id="categories" className="py-20 sm:py-24 bg-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Popular Categories</h2>
                        <p className="mt-4 text-lg text-slate-600">Explore top categories to find exactly what you're looking for.</p>
                    </div>
                    <a href="/categories" className="hidden sm:block text-brand-600 font-semibold hover:text-brand-700 hover:underline">
                        View all categories &rarr;
                    </a>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 lg:gap-6">
                    {categories.map((category) => (
                        <a key={category.name} href={`/category/${category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="group flex flex-col items-center justify-center rounded-3xl border border-slate-100 bg-slate-50 p-6 text-center shadow-sm hover:shadow-md hover:bg-white transition-all hover:-translate-y-1">
                            <div className={`mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl ${category.color} transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                                <category.icon size={28} />
                            </div>
                            <h3 className="text-base font-semibold text-slate-900 mb-1">{category.name}</h3>
                            <p className="text-xs text-slate-500 font-medium">{category.count} listings</p>
                        </a>
                    ))}
                </div>

                <div className="mt-8 text-center sm:hidden">
                    <a href="/categories" className="inline-block text-brand-600 font-semibold hover:text-brand-700">
                        View all categories &rarr;
                    </a>
                </div>
            </div>
        </section>
    );
}
