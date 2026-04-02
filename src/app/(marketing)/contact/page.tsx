"use client";

import type { Metadata } from "next";
import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ─── Contact channels ─────────────────────────────────────────────────────────

const CHANNELS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
      </svg>
    ),
    label: "Email Us",
    value: "hello@zimconnect.co.zw",
    href: "mailto:hello@zimconnect.co.zw",
    color: "bg-blue-50 text-blue-600",
    description: "We reply within 24 hours on business days.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
      </svg>
    ),
    label: "WhatsApp",
    value: "+263 77 123 4567",
    href: "https://wa.me/263771234567?text=Hi%20ZimConnect%2C%20I%20need%20help%20with...",
    color: "bg-green-50 text-green-600",
    description: "Chat with us directly. Mon–Sat, 8am–6pm.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
      </svg>
    ),
    label: "Phone",
    value: "+263 24 2 123 456",
    href: "tel:+26324123456",
    color: "bg-purple-50 text-purple-600",
    description: "Office line. Mon–Fri, 8am–5pm.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
      </svg>
    ),
    label: "Visit Us",
    value: "4th Floor, Joina City, Harare CBD",
    href: "https://maps.google.com/?q=Joina+City+Harare",
    color: "bg-amber-50 text-amber-600",
    description: "Walk-in support. Mon–Fri, 9am–4pm.",
  },
];

const FAQS = [
  {
    q: "How do I list an item for sale?",
    a: "Create a free account, then click 'Post a Listing' from your dashboard. Add photos, a description, and your price — it takes less than 2 minutes.",
  },
  {
    q: "Is it free to list on ZimConnect?",
    a: "Yes, listing is completely free. We may introduce premium features in the future, but basic listings will always be free.",
  },
  {
    q: "How do I contact a seller?",
    a: "Every listing has a Call and WhatsApp button so you can reach the seller directly. You can also send messages through our in-app inbox.",
  },
  {
    q: "How do I report a suspicious listing?",
    a: "Use the 'Report' button on any listing page or email us at safety@zimconnect.co.zw. We investigate all reports within 24 hours.",
  },
  {
    q: "Which cities do you cover?",
    a: "ZimConnect is available nationwide — Harare, Bulawayo, Mutare, Gweru, Kwekwe, Masvingo, and more. Any Zimbabwean can list or buy.",
  },
  {
    q: "Can businesses list on ZimConnect?",
    a: "Absolutely. We welcome both individual sellers and registered businesses. Business accounts get a verified badge on their listings.",
  },
];

// ─── Contact form ─────────────────────────────────────────────────────────────

const SUBJECTS = [
  "General enquiry",
  "Report a listing",
  "Account help",
  "Partnership / advertising",
  "Press & media",
  "Other",
];

const INPUT_CLASS = cn(
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900",
  "placeholder:text-gray-400 shadow-sm",
  "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-colors",
);

function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    // Simulate network delay
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 800);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-8 w-8 text-emerald-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </span>
        <h3 className="text-lg font-bold text-gray-900">Message sent!</h3>
        <p className="mt-2 text-sm text-gray-500 max-w-xs">
          Thanks for reaching out, {form.name.split(" ")[0]}. We&apos;ll get back to you at <span className="font-medium text-gray-700">{form.email}</span> within 24 hours.
        </p>
        <button
          onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
          className="mt-6 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-gray-700">Full Name <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Your name"
            required
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-gray-700">Email Address <span className="text-red-500">*</span></label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="you@example.com"
            required
            className={INPUT_CLASS}
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-gray-700">Subject</label>
        <select
          value={form.subject}
          onChange={(e) => set("subject", e.target.value)}
          className={INPUT_CLASS}
        >
          <option value="">Select a subject…</option>
          {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-gray-700">Message <span className="text-red-500">*</span></label>
        <textarea
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
          placeholder="Tell us how we can help…"
          required
          rows={5}
          className={cn(INPUT_CLASS, "resize-none")}
        />
      </div>

      <button
        type="submit"
        disabled={submitting || !form.name || !form.email || !form.message}
        className="w-full rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 transition-all duration-75 shadow-sm"
      >
        {submitting ? "Sending…" : "Send Message"}
      </button>

      <p className="text-center text-xs text-gray-400">
        We typically respond within 24 hours on business days.
      </p>
    </form>
  );
}

// ─── FAQ accordion ────────────────────────────────────────────────────────────

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
      >
        <span className="text-sm font-semibold text-gray-900">{q}</span>
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className={cn("h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200", open && "rotate-180")}
        >
          <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
      </button>
      {open && (
        <p className="pb-4 text-sm text-gray-500 leading-relaxed">{a}</p>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContactPage() {
  return (
    <div className="bg-white">

      {/* ── Hero ── */}
      <section className="bg-gradient-to-b from-emerald-50 to-white py-14 sm:py-20 text-center">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-700 mb-5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            We&apos;re online right now
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            We&apos;d love to hear from you
          </h1>
          <p className="mt-4 text-gray-500 leading-relaxed">
            Got a question, issue, or idea? Reach us on any channel below or fill in the form and we&apos;ll get back to you fast.
          </p>
        </div>
      </section>

      {/* ── Channels ── */}
      <section className="py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CHANNELS.map(({ icon, label, value, href, color, description }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <span className={cn("flex h-11 w-11 items-center justify-center rounded-xl", color)}>
                  {icon}
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{label}</p>
                  <p className="text-sm font-medium text-emerald-600 mt-0.5">{value}</p>
                  <p className="text-xs text-gray-400 mt-1 leading-snug">{description}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Form + FAQ ── */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2">

            {/* Contact form */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-2">Send a message</p>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Get in touch</h2>
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <ContactForm />
              </div>
            </div>

            {/* FAQ */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-2">Quick answers</p>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Frequently asked questions</h2>
              <div className="rounded-2xl border border-gray-100 bg-white px-6 shadow-sm">
                {FAQS.map(({ q, a }) => <FAQ key={q} q={q} a={a} />)}
              </div>
              <p className="mt-4 text-sm text-gray-500">
                Still stuck?{" "}
                <a href="mailto:hello@zimconnect.co.zw" className="font-semibold text-emerald-600 hover:underline">
                  Email us directly
                </a>{" "}
                and we&apos;ll sort it out.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Map-style office block ── */}
      <section className="pb-16 sm:pb-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
            {/* Fake map banner */}
            <div className="h-40 bg-gradient-to-br from-emerald-100 via-teal-50 to-blue-50 flex items-center justify-center relative overflow-hidden">
              <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_right,#d1fae5_1px,transparent_1px),linear-gradient(to_bottom,#d1fae5_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-60" />
              <span className="relative flex flex-col items-center gap-1">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-emerald-600 drop-shadow">
                  <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-semibold text-emerald-700 bg-white/80 rounded-full px-3 py-0.5 shadow-sm">Joina City, Harare</span>
              </span>
            </div>
            {/* Office details */}
            <div className="bg-white px-6 py-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">ZimConnect Head Office</p>
                <p className="text-sm text-gray-500">4th Floor, Joina City, Corner Jason Moyo Ave & 1st St, Harare, Zimbabwe</p>
              </div>
              <a
                href="https://maps.google.com/?q=Joina+City+Harare"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 sm:mt-0 shrink-0 rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Open in Maps
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
