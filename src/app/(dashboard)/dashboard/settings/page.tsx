"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/useAuth";
import { changePassword } from "@/lib/api/auth";
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
  "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-colors duration-150",
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
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
          checked ? "bg-emerald-500" : "bg-gray-200",
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
        className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-[0.97] disabled:opacity-60 transition-all duration-75"
      >
        {saving ? "Saving…" : "Save Changes"}
      </button>
      {saved && (
        <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
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
            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
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
                : "bg-emerald-600 text-white hover:bg-emerald-700",
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
                  {current && <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">This device</span>}
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
