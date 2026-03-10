import { MapPin, ShieldCheck, Zap, Smartphone } from "lucide-react";

export default function Features() {
    const features = [
        {
            name: "Local Connections",
            description: "Find buyers and sellers in your city or neighborhood quickly and easily.",
            icon: MapPin,
        },
        {
            name: "Safe & Trustworthy",
            description: "Verified profiles and secure messaging to keep your marketplace experience safe.",
            icon: ShieldCheck,
        },
        {
            name: "Fast Listings",
            description: "Snap a photo, add a price, and post your item in less than 60 seconds.",
            icon: Zap,
        },
        {
            name: "Mobile Friendly",
            description: "Browse, chat, and deal on the go with our fully optimized mobile experience.",
            icon: Smartphone,
        },
    ];

    return (
        <section className="py-20 bg-slate-50 sm:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-2xl lg:text-center">
                    <h2 className="text-base font-semibold leading-7 text-brand-600">Why choose ZimConnect</h2>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                        Everything you need for successful deals
                    </p>
                    <p className="mt-6 text-lg leading-8 text-slate-600">
                        We've built ZimConnect to modernize local commerce in Zimbabwe, giving you the fastest and most reliable platform to trade.
                    </p>
                </div>

                <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:max-w-none">
                    <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4">
                        {features.map((feature) => (
                            <div key={feature.name} className="flex flex-col bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                <dt className="flex items-center gap-x-3 text-lg font-semibold leading-7 text-slate-900 mb-4">
                                    <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                                        <feature.icon className="h-6 w-6" aria-hidden="true" />
                                    </div>
                                    {feature.name}
                                </dt>
                                <dd className="flex flex-auto flex-col text-base leading-7 text-slate-600">
                                    <p className="flex-auto">{feature.description}</p>
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </div>
        </section>
    );
}
