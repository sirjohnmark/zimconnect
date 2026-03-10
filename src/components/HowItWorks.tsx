export default function HowItWorks() {
    const steps = [
        {
            id: 1,
            title: "Create a Listing",
            description: "Sign up for free, take a few photos of your item, write a description, and set your price.",
        },
        {
            id: 2,
            title: "Connect with Locals",
            description: "Interested buyers will message or call you directly through our secure platform.",
        },
        {
            id: 3,
            title: "Close the Deal",
            description: "Meet up safely in your area to complete the exchange and get paid instantly.",
        },
    ];

    return (
        <section id="how-it-works" className="bg-slate-900 py-20 sm:py-32 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-900/50 to-slate-900/50"></div>

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-base font-semibold leading-7 text-brand-400">Simple process</h2>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        How ZimConnect Works
                    </p>
                    <p className="mt-6 text-lg leading-8 text-slate-300">
                        Selling your items or finding great deals is simpler than ever. Just follow these three easy steps.
                    </p>
                </div>

                <div className="mx-auto mt-16 max-w-5xl sm:mt-24">
                    <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-8">
                        {steps.map((step, stepIdx) => (
                            <div key={step.id} className="relative flex flex-col items-center text-center">
                                {stepIdx !== steps.length - 1 && (
                                    <div className="hidden lg:block absolute top-12 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-brand-500 to-transparent opacity-30"></div>
                                )}
                                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-800 border-4 border-slate-700 shadow-xl shadow-brand-500/10 mb-8 relative z-10">
                                    <span className="text-4xl font-black text-brand-400">{step.id}</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-4">{step.title}</h3>
                                <p className="text-base leading-7 text-slate-400">
                                    {step.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
