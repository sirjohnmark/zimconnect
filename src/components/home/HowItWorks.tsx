import { Camera, MessageCircle, Handshake } from "lucide-react";
import type { ElementType } from "react";

interface Step {
  number: string;
  icon: ElementType;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    number: "01",
    icon: Camera,
    title: "Post a Listing",
    description:
      "Sign up free, snap a few photos of your item, write a short description, and set your price — done in under a minute.",
  },
  {
    number: "02",
    icon: MessageCircle,
    title: "Get Contacted",
    description:
      "Interested buyers reach out directly via WhatsApp or phone. No middleman, no delays — just real conversations.",
  },
  {
    number: "03",
    icon: Handshake,
    title: "Close the Deal",
    description:
      "Meet up safely in your city, hand over the item, and get paid. Simple, local, and completely free.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden bg-slate-900 py-20 sm:py-28"
    >
      {/* Subtle gradient overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-brand-700/20 to-slate-900/60"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center mb-16 sm:mb-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-400 mb-3">
            Simple process
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            How ZimConnect Works
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-400">
            Three easy steps to buy or sell anything across Zimbabwe.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3 lg:gap-8">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="relative flex flex-col items-center text-center">
                {/* Connector line between steps (desktop only) */}
                {idx < STEPS.length - 1 && (
                  <div
                    className="hidden lg:block absolute top-10 left-[calc(50%+3rem)] w-[calc(100%-6rem)] h-px bg-gradient-to-r from-brand-500/40 to-transparent"
                    aria-hidden="true"
                  />
                )}

                {/* Icon circle */}
                <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-slate-800 border-2 border-slate-700 shadow-xl shadow-brand-500/10 mb-6">
                  <Icon className="h-8 w-8 text-brand-400" aria-hidden="true" />
                  {/* Step number badge */}
                  <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-[11px] font-black text-white shadow">
                    {idx + 1}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-base leading-7 text-slate-400 max-w-xs">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
