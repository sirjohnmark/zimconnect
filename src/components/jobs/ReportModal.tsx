"use client";

import { useState } from "react";
import { submitReport, type Report } from "@/lib/mock/jobs";
import { cn } from "@/lib/utils";

const REASONS = [
  "Fraudulent / scam posting",
  "Misleading job description",
  "Discriminatory content",
  "Fake company / employer",
  "Suspicious CV / applicant",
  "Harassment or inappropriate content",
  "Other",
];

interface ReportModalProps {
  targetId: string;
  targetType: Report["targetType"];
  reporterRole: Report["reporterRole"];
  label?: string;
  className?: string;
}

export function ReportModal({ targetId, targetType, reporterRole, label = "Report", className }: ReportModalProps) {
  const [open, setOpen]       = useState(false);
  const [reason, setReason]   = useState("");
  const [details, setDetails] = useState("");
  const [done, setDone]       = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) return;
    submitReport({ reporterId: "me", reporterRole, targetId, targetType, reason, details: details.trim() || undefined });
    setDone(true);
    setTimeout(() => { setOpen(false); setDone(false); setReason(""); setDetails(""); }, 2000);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium",
          "text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors",
          className,
        )}
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
          <path fillRule="evenodd" d="M3 6a3 3 0 0 1 3-3h10a1 1 0 0 1 .79 1.61L14.12 8l2.67 3.39A1 1 0 0 1 16 13H6a1 1 0 0 0-1 1v3a1 1 0 1 1-2 0V6Z" clipRule="evenodd" />
        </svg>
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-gray-900">Report {targetType === "job" ? "Job Listing" : targetType === "cv" ? "CV / Profile" : "User"}</h2>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>

            {done ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10 px-5">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                  </svg>
                </span>
                <p className="text-sm font-semibold text-gray-900">Report submitted</p>
                <p className="text-xs text-gray-500 text-center">Our team will review your report within 24 hours. Thank you for keeping Sanganai safe.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {/* Disclaimer */}
                <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2.5 text-xs text-amber-700">
                  False reports may result in account restrictions. Only report genuine violations.
                </div>

                {/* Reason */}
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-gray-700">Reason *</p>
                  <div className="space-y-1.5">
                    {REASONS.map((r) => (
                      <label key={r} className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="radio"
                          name="reason"
                          value={r}
                          checked={reason === r}
                          onChange={() => setReason(r)}
                          className="accent-red-500"
                        />
                        <span className="text-sm text-gray-700">{r}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700" htmlFor="report-details">Additional details (optional)</label>
                  <textarea
                    id="report-details"
                    rows={3}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Describe the issue in more detail…"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setOpen(false)} className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!reason}
                    className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-40 transition-colors"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
