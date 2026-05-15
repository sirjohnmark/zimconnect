"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/useAuth";
import {
  changePassword,
  get2FAStatus,
  setup2FA,
  confirm2FA,
  disable2FA,
  regenerateBackupCodes,
  type TwoFAStatus,
  type TwoFASetupData,
} from "@/lib/api/auth";
import { BackButton } from "@/components/ui/BackButton";
import {
  getStoredPreferences,
  savePreferences,
  type UserPreferences,
} from "@/lib/auth/auth";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

// ─── Shared UI ────────────────────────────────────────────────────────────────

const INPUT_CLASS = cn(
  "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900",
  "placeholder:text-gray-400 shadow-sm",
  "focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-apple-blue transition-colors duration-150",
  "disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed",
);

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-gray-100 px-6 py-4">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
      </div>
      <div className="px-6 py-5 space-y-5">{children}</div>
    </div>
  );
}

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="shrink-0 sm:w-48">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-gray-400 leading-snug">{hint}</p>}
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple-blue focus-visible:ring-offset-2",
          checked ? "bg-apple-blue" : "bg-gray-200",
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200",
            checked ? "translate-x-6" : "translate-x-1",
          )}
        />
      </button>
    </label>
  );
}

function SaveRow({ saving, saved, error, onSave }: { saving: boolean; saved: boolean; error?: string | null; onSave?: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100">
      <button
        type={onSave ? "button" : "submit"}
        onClick={onSave}
        disabled={saving}
        className="rounded-lg bg-apple-blue px-5 py-2 text-sm font-semibold text-white hover:bg-apple-blue active:scale-[0.97] disabled:opacity-60 transition-all duration-75"
      >
        {saving ? "Saving…" : "Save Changes"}
      </button>
      {saved && (
        <span className="flex items-center gap-1.5 text-sm font-medium text-apple-blue">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
          </svg>
          Saved
        </span>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

// ─── Two-Factor Authentication section ───────────────────────────────────────

type TwoFAView =
  | "status"
  | "setup-qr"
  | "setup-confirm"
  | "backup-display"
  | "disable"
  | "regen-confirm";

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded px-2.5 py-1 text-xs font-medium text-apple-blue border border-apple-blue/30 hover:bg-apple-blue/5 transition-colors"
    >
      {copied ? "Copied!" : label}
    </button>
  );
}

function TwoFASection() {
  const { user, setUser } = useAuth();
  const [view, setView]           = useState<TwoFAView>("status");
  const [status2fa, setStatus2fa] = useState<TwoFAStatus | null>(null);
  const [setupData, setSetupData] = useState<TwoFASetupData | null>(null);
  const [backupCodes, setBackupCodes]   = useState<string[]>([]);
  const [confirmCode, setConfirmCode]   = useState("");
  const [password, setPassword]         = useState("");
  const [disableCode, setDisableCode]   = useState("");
  const [regenCode, setRegenCode]       = useState("");
  const [regenPassword, setRegenPassword] = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const s = await get2FAStatus();
      setStatus2fa(s);
    } catch {
      // non-critical — silently ignore
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  function clearError() { setError(null); }

  async function handleStartSetup() {
    clearError();
    setLoading(true);
    try {
      const data = await setup2FA();
      setSetupData(data);
      setConfirmCode("");
      setView("setup-qr");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not start setup. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmSetup(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    if (confirmCode.length !== 6) { setError("Enter the 6-digit code from your authenticator app."); return; }
    setLoading(true);
    try {
      const res = await confirm2FA(confirmCode);
      setBackupCodes(res.backup_codes);
      await loadStatus();
      if (user) setUser({ ...user, totp_enabled: true });
      setView("backup-display");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    if (!password) { setError("Enter your account password."); return; }
    if (disableCode.length < 6) { setError("Enter a valid authenticator or backup code."); return; }
    setLoading(true);
    try {
      await disable2FA(password, disableCode);
      await loadStatus();
      if (user) setUser({ ...user, totp_enabled: false });
      setPassword("");
      setDisableCode("");
      setView("status");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not disable 2FA. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegenCodes(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    if (!regenPassword) { setError("Enter your account password."); return; }
    if (regenCode.length !== 6) { setError("Enter the 6-digit code from your authenticator app."); return; }
    setLoading(true);
    try {
      const res = await regenerateBackupCodes(regenPassword, regenCode);
      setBackupCodes(res.backup_codes);
      await loadStatus();
      setRegenPassword("");
      setRegenCode("");
      setView("backup-display");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not regenerate codes. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const INPUT_CLS = cn(
    "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm",
    "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-apple-blue transition-colors",
    "disabled:bg-gray-50 disabled:cursor-not-allowed",
  );

  const isEnabled = status2fa?.is_enabled ?? user?.totp_enabled ?? false;

  return (
    <SectionCard
      title="Two-Factor Authentication"
      description="Two-factor authentication adds an extra layer of protection to your account."
    >
      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3.5a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4.5zm0 6.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z" />
          </svg>
          {error}
        </div>
      )}

      {/* ── Status view ─────────────────────────────────────────────── */}
      {view === "status" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full",
                isEnabled ? "bg-green-100" : "bg-gray-100",
              )}>
                {isEnabled ? (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-green-600">
                    <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-gray-400">
                    <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
                  </svg>
                )}
              </span>
              <div>
                <p className="text-sm font-medium text-gray-800">
                  Authenticator app
                </p>
                <p className={cn("text-xs", isEnabled ? "text-green-600 font-medium" : "text-gray-400")}>
                  {isEnabled ? "Enabled" : "Not enabled"}
                </p>
              </div>
            </div>
            {isEnabled ? (
              <button
                type="button"
                onClick={() => { clearError(); setPassword(""); setDisableCode(""); setView("disable"); }}
                className="rounded-lg border border-gray-200 px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Disable
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartSetup}
                disabled={loading}
                className="rounded-lg bg-apple-blue px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-apple-blue disabled:opacity-60 transition-colors"
              >
                {loading ? "Loading…" : "Enable"}
              </button>
            )}
          </div>

          {isEnabled && status2fa && (
            <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600 space-y-1">
              <p>{status2fa.backup_codes_remaining} backup code{status2fa.backup_codes_remaining !== 1 ? "s" : ""} remaining.</p>
              <button
                type="button"
                onClick={() => { clearError(); setRegenPassword(""); setRegenCode(""); setView("regen-confirm"); }}
                className="text-xs text-apple-blue hover:underline"
              >
                Regenerate backup codes
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Setup: QR code view ──────────────────────────────────────── */}
      {view === "setup-qr" && setupData && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Scan this QR code with your authenticator app (Google Authenticator, Authy, 1Password, Microsoft Authenticator, etc.).
          </p>
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={setupData.qr_code} alt="Scan this QR code with your authenticator app" className="h-48 w-48 rounded-lg border border-gray-200" />
          </div>
          <details className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
            <summary className="cursor-pointer text-xs font-medium text-gray-600">
              Can&apos;t scan the QR code? Enter key manually
            </summary>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 rounded bg-white border border-gray-200 px-2.5 py-1.5 text-xs font-mono text-gray-700 break-all">
                {setupData.secret}
              </code>
              <CopyButton text={setupData.secret} label="Copy key" />
            </div>
          </details>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => { clearError(); setView("status"); }}
              className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => { clearError(); setConfirmCode(""); setView("setup-confirm"); }}
              className="flex-1 rounded-lg bg-apple-blue py-2 text-sm font-semibold text-white hover:bg-apple-blue transition-colors"
            >
              Next — enter code
            </button>
          </div>
        </div>
      )}

      {/* ── Setup: confirm code ──────────────────────────────────────── */}
      {view === "setup-confirm" && (
        <form onSubmit={handleConfirmSetup} noValidate className="space-y-4">
          <p className="text-sm text-gray-600">
            Enter the 6-digit code from your authenticator app to complete setup.
          </p>
          <div className="space-y-1.5">
            <label htmlFor="2fa-confirm-code" className="text-sm font-medium text-gray-700">
              Verification code
            </label>
            <input
              id="2fa-confirm-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              value={confirmCode}
              onChange={(e) => setConfirmCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              maxLength={6}
              className={cn(INPUT_CLS, "text-center text-xl font-mono tracking-[0.4em]")}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { clearError(); setView("setup-qr"); }}
              className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading || confirmCode.length !== 6}
              className="flex-1 rounded-lg bg-apple-blue py-2 text-sm font-semibold text-white hover:bg-apple-blue disabled:opacity-60 transition-colors"
            >
              {loading ? "Verifying…" : "Activate 2FA"}
            </button>
          </div>
        </form>
      )}

      {/* ── Backup codes display ─────────────────────────────────────── */}
      {view === "backup-display" && backupCodes.length > 0 && (
        <div className="space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-semibold text-amber-800">Save these backup codes somewhere safe.</p>
            <p className="mt-0.5 text-xs text-amber-700">
              You will only see them once. Each code can be used once to access your account if you lose your authenticator.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {backupCodes.map((code) => (
              <code key={code} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-center text-sm font-mono text-gray-700">
                {code}
              </code>
            ))}
          </div>
          <div className="flex gap-2">
            <CopyButton text={backupCodes.join("\n")} label="Copy all codes" />
            <button
              type="button"
              onClick={() => {
                const blob = new Blob([backupCodes.join("\n")], { type: "text/plain" });
                const url  = URL.createObjectURL(blob);
                const a    = document.createElement("a");
                a.href     = url;
                a.download = "sanganai-backup-codes.txt";
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="rounded px-2.5 py-1 text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Download
            </button>
          </div>
          <button
            type="button"
            onClick={() => { setBackupCodes([]); setView("status"); }}
            className="w-full rounded-lg bg-apple-blue py-2 text-sm font-semibold text-white hover:bg-apple-blue transition-colors"
          >
            Done — I&apos;ve saved my codes
          </button>
        </div>
      )}

      {/* ── Disable 2FA ──────────────────────────────────────────────── */}
      {view === "disable" && (
        <form onSubmit={handleDisable} noValidate className="space-y-4">
          <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3">
            <p className="text-sm font-semibold text-red-700">Disable two-factor authentication?</p>
            <p className="mt-0.5 text-xs text-red-600">
              Your account will be less secure. Enter your password and a valid code to confirm.
            </p>
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Account password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" className={INPUT_CLS} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Authenticator or backup code</label>
              <input
                type="text"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value)}
                placeholder="123456 or backup code"
                autoComplete="one-time-code"
                className={INPUT_CLS}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => { clearError(); setView("status"); }} className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors">
              {loading ? "Disabling…" : "Disable 2FA"}
            </button>
          </div>
        </form>
      )}

      {/* ── Regenerate backup codes ───────────────────────────────────── */}
      {view === "regen-confirm" && (
        <form onSubmit={handleRegenCodes} noValidate className="space-y-4">
          <p className="text-sm text-gray-600">
            Enter your password and a 6-digit authenticator code to generate new backup codes.
            All existing backup codes will be invalidated.
          </p>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Account password</label>
              <input type="password" value={regenPassword} onChange={(e) => setRegenPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" className={INPUT_CLS} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Authenticator code</label>
              <input
                type="text"
                inputMode="numeric"
                value={regenCode}
                onChange={(e) => setRegenCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                className={cn(INPUT_CLS, "text-center font-mono tracking-[0.3em]")}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => { clearError(); setView("status"); }} className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 rounded-lg bg-apple-blue py-2 text-sm font-semibold text-white hover:bg-apple-blue disabled:opacity-60 transition-colors">
              {loading ? "Generating…" : "Generate new codes"}
            </button>
          </div>
        </form>
      )}
    </SectionCard>
  );
}

// ─── Password section ─────────────────────────────────────────────────────────

function PasswordSection() {
  const { user } = useAuth();
  const [current, setCurrent]   = useState("");
  const [next, setNext]         = useState("");
  const [confirm, setConfirm]   = useState("");
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [show, setShow]         = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!current) { setError("Enter your current password."); return; }
    if (next.length < 8) { setError("New password must be at least 8 characters."); return; }
    if (next !== confirm) { setError("Passwords do not match."); return; }
    if (next === current) { setError("New password must differ from current password."); return; }
    if (!user) return;

    setSaving(true);
    try {
      await changePassword(current, next);
      setCurrent(""); setNext(""); setConfirm("");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  const inputType = show ? "text" : "password";

  return (
    <SectionCard title="Password" description="Use a strong password you don't use elsewhere.">
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <FieldRow label="Current Password">
          <div className="relative">
            <input
              type={inputType}
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className={INPUT_CLASS}
            />
          </div>
        </FieldRow>

        <FieldRow label="New Password" hint="Minimum 8 characters.">
          <input
            type={inputType}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            className={INPUT_CLASS}
          />
        </FieldRow>

        <FieldRow label="Confirm New Password">
          <input
            type={inputType}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            className={INPUT_CLASS}
          />
        </FieldRow>

        <div className="flex items-center gap-2">
          <input
            id="show-pw"
            type="checkbox"
            checked={show}
            onChange={(e) => setShow(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-apple-blue focus:ring-apple-blue"
          />
          <label htmlFor="show-pw" className="text-xs text-gray-500 cursor-pointer select-none">Show passwords</label>
        </div>

        <SaveRow saving={saving} saved={saved} error={error} />
      </form>
    </SectionCard>
  );
}

// ─── Notifications section ────────────────────────────────────────────────────

function NotificationsSection({ prefs, onChange }: { prefs: UserPreferences; onChange: (p: UserPreferences) => void }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  function set<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) {
    onChange({ ...prefs, [key]: value });
  }

  function handleSave() {
    setSaving(true);
    savePreferences(prefs);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 300);
  }

  return (
    <SectionCard title="Notifications" description="Choose what you want to be notified about.">
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Email</p>
        <Toggle label="Email notifications" checked={prefs.emailNotifications} onChange={(v) => set("emailNotifications", v)} />
        <Toggle label="New message alerts" checked={prefs.newMessageAlert} onChange={(v) => set("newMessageAlert", v)} />
        <Toggle label="Listing view alerts" checked={prefs.listingViewAlert} onChange={(v) => set("listingViewAlert", v)} />
        <Toggle label="Marketing & promotions" checked={prefs.marketingEmails} onChange={(v) => set("marketingEmails", v)} />
      </div>
      <div className="space-y-4 pt-2 border-t border-gray-50">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">SMS</p>
        <Toggle label="SMS notifications" checked={prefs.smsNotifications} onChange={(v) => set("smsNotifications", v)} />
      </div>
      <SaveRow saving={saving} saved={saved} onSave={handleSave} />
    </SectionCard>
  );
}

// ─── Privacy section ──────────────────────────────────────────────────────────

function PrivacySection({ prefs, onChange }: { prefs: UserPreferences; onChange: (p: UserPreferences) => void }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  function set<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) {
    onChange({ ...prefs, [key]: value });
  }

  function handleSave() {
    setSaving(true);
    savePreferences(prefs);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 300);
  }

  return (
    <SectionCard title="Privacy" description="Control who can see your information.">
      <FieldRow label="Profile visibility" hint="Public profiles appear in buyer searches.">
        <select
          value={prefs.profileVisibility}
          onChange={(e) => set("profileVisibility", e.target.value as UserPreferences["profileVisibility"])}
          className={INPUT_CLASS}
        >
          <option value="public">Public — visible to all buyers</option>
          <option value="private">Private — visible only to you</option>
        </select>
      </FieldRow>
      <Toggle label="Show phone number on listings" checked={prefs.showPhone} onChange={(v) => set("showPhone", v)} />
      <SaveRow saving={saving} saved={saved} onSave={handleSave} />
    </SectionCard>
  );
}

// ─── Preferences section ──────────────────────────────────────────────────────

function PreferencesSection({ prefs, onChange }: { prefs: UserPreferences; onChange: (p: UserPreferences) => void }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  function set<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) {
    onChange({ ...prefs, [key]: value });
  }

  function handleSave() {
    setSaving(true);
    savePreferences(prefs);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 300);
  }

  return (
    <SectionCard title="Preferences" description="Personalise your Sanganai experience.">
      <FieldRow label="Currency" hint="Used to display listing prices.">
        <select
          value={prefs.currency}
          onChange={(e) => set("currency", e.target.value as UserPreferences["currency"])}
          className={INPUT_CLASS}
        >
          <option value="USD">USD — US Dollar</option>
          <option value="ZWL">ZWL — Zimbabwe Gold</option>
        </select>
      </FieldRow>
      <FieldRow label="Language">
        <select
          value={prefs.language}
          onChange={(e) => set("language", e.target.value as UserPreferences["language"])}
          className={INPUT_CLASS}
        >
          <option value="en">English</option>
        </select>
      </FieldRow>
      <SaveRow saving={saving} saved={saved} onSave={handleSave} />
    </SectionCard>
  );
}

// ─── Linked accounts section ──────────────────────────────────────────────────

function LinkedAccountsSection() {
  return (
    <SectionCard title="Linked Accounts" description="Connect third-party accounts for faster sign-in.">
      {[
        { name: "Google",   icon: "G", color: "bg-red-100 text-red-600",    connected: false },
        { name: "Facebook", icon: "f", color: "bg-blue-100 text-blue-600",  connected: false },
        { name: "WhatsApp", icon: "W", color: "bg-green-100 text-green-600", connected: true  },
      ].map(({ name, icon, color, connected }) => (
        <div key={name} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={cn("flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold", color)}>
              {icon}
            </span>
            <div>
              <p className="text-sm font-medium text-gray-800">{name}</p>
              <p className="text-xs text-gray-400">{connected ? "Connected" : "Not connected"}</p>
            </div>
          </div>
          <button
            type="button"
            className={cn(
              "rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors",
              connected
                ? "border border-gray-200 text-gray-600 hover:bg-gray-50"
                : "bg-apple-blue text-white hover:bg-apple-blue",
            )}
          >
            {connected ? "Disconnect" : "Connect"}
          </button>
        </div>
      ))}
    </SectionCard>
  );
}

// ─── Sessions section ─────────────────────────────────────────────────────────

function SessionsSection() {
  const { logout } = useAuth();
  const [revoking, setRevoking] = useState(false);

  const SESSIONS = [
    { id: "s1", device: "Chrome on Windows 10", location: "Harare, ZW", current: true,  lastSeen: "Now" },
    { id: "s2", device: "Chrome on Android",    location: "Harare, ZW", current: false, lastSeen: "2 hrs ago" },
  ];

  async function revokeAll() {
    setRevoking(true);
    setTimeout(() => logout(), 500);
  }

  return (
    <SectionCard title="Active Sessions" description="Devices currently signed into your account.">
      <div className="space-y-3">
        {SESSIONS.map(({ id, device, location, current, lastSeen }) => (
          <div key={id} className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M2 4.25A2.25 2.25 0 0 1 4.25 2h11.5A2.25 2.25 0 0 1 18 4.25v8.5A2.25 2.25 0 0 1 15.75 15h-3.105a3.501 3.501 0 0 1 1.1 1.677A.75.75 0 0 1 13 17.5h-6a.75.75 0 0 1-.745-.823A3.501 3.501 0 0 1 7.355 15H4.25A2.25 2.25 0 0 1 2 12.75v-8.5Zm1.5 0a.75.75 0 0 1 .75-.75h11.5a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-.75.75H4.25a.75.75 0 0 1-.75-.75v-7.5Z" clipRule="evenodd" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {device}
                  {current && <span className="ml-2 rounded-full bg-apple-blue/10 px-2 py-0.5 text-xs font-semibold text-apple-blue">This device</span>}
                </p>
                <p className="text-xs text-gray-400">{location} · {lastSeen}</p>
              </div>
            </div>
            {!current && (
              <button type="button" className="shrink-0 text-xs font-medium text-red-500 hover:text-red-700 transition-colors">
                Revoke
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={revokeAll}
          disabled={revoking}
          className="text-sm font-semibold text-red-600 hover:text-red-700 disabled:opacity-50 transition-colors"
        >
          {revoking ? "Signing out…" : "Sign out of all devices"}
        </button>
      </div>
    </SectionCard>
  );
}

// ─── Danger zone ──────────────────────────────────────────────────────────────

function DangerZone() {
  const { logout } = useAuth();
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="rounded-2xl border border-red-100 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-red-100 px-6 py-4">
        <h2 className="text-sm font-semibold text-red-600">Danger Zone</h2>
        <p className="mt-0.5 text-xs text-gray-500">Irreversible actions. Proceed with caution.</p>
      </div>
      <div className="px-6 py-5 space-y-4">
        {/* Deactivate */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-800">Deactivate Account</p>
            <p className="text-xs text-gray-400">Hide your profile and listings. You can reactivate anytime.</p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Deactivate
          </button>
        </div>

        <div className="border-t border-gray-100" />

        {/* Delete */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-red-600">Delete Account</p>
            <p className="text-xs text-gray-400">Permanently delete your account, listings, and all data.</p>
          </div>
          {!confirm ? (
            <button
              type="button"
              onClick={() => setConfirm(true)}
              className="shrink-0 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
            >
              Delete Account
            </button>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => { localStorage.clear(); logout(); }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
              >
                Yes, delete
              </button>
              <button
                type="button"
                onClick={() => setConfirm(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);

  useEffect(() => {
    setPrefs(getStoredPreferences());
  }, []);

  if (!prefs) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="h-8 w-40 animate-pulse rounded-md bg-gray-200" />
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-48 animate-pulse rounded-2xl bg-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <BackButton href="/dashboard" label="Dashboard" className="-ml-1 mb-2" />
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your account security, notifications, and preferences.</p>
      </div>

      <TwoFASection />
      <PasswordSection />
      <NotificationsSection prefs={prefs} onChange={setPrefs} />
      <PrivacySection prefs={prefs} onChange={setPrefs} />
      <PreferencesSection prefs={prefs} onChange={setPrefs} />
      <LinkedAccountsSection />
      <SessionsSection />
      <DangerZone />
    </div>
  );
}
