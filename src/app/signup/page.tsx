"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validatePassword = (value: string) => {
    const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    return pattern.test(value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill out all fields.");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    if (!validatePassword(password)) {
      setError("Password must be 8+ chars, include uppercase, lowercase, number, and special character.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.message || "Signup failed");
        setIsLoading(false);
        return;
      }
      setMessage("Signup successful — redirecting...");
      setTimeout(() => router.push("/login"), 800);
    } catch (err) {
      setError("Signup request failed. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur-lg">
        <div className="px-8 py-10">
          <h1 className="text-3xl font-semibold text-slate-900">Create an account</h1>
          <p className="mt-2 text-sm text-slate-600">Sign up with strong password and optional captcha.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Full name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} required type="text" placeholder="Your name" className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 focus:border-brand-500 focus:ring-2 focus:ring-brand-200" />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" placeholder="you@example.com" className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 focus:border-brand-500 focus:ring-2 focus:ring-brand-200" />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Password</span>
              <input id="password" value={password} onChange={(e) => setPassword(e.target.value)} required type="password" placeholder="••••••••" className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 focus:border-brand-500 focus:ring-2 focus:ring-brand-200" />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Confirm password</span>
              <input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required type="password" placeholder="••••••••" className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 focus:border-brand-500 focus:ring-2 focus:ring-brand-200" />
            </label>

            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              <p className="font-semibold text-slate-700">Password requirements:</p>
              <ul className="mt-1 list-disc pl-4">
                <li>At least 8 characters</li>
                <li>Uppercase letter</li>
                <li>Lowercase letter</li>
                <li>Number</li>
                <li>Special character (@$!%*?&)</li>
              </ul>
            </div>

            <div className="mt-2">
              <p className="text-sm font-medium text-slate-700">reCAPTCHA (placeholder)</p>
              <div className="mt-2">
                <div className="g-recaptcha" data-sitekey="YOUR_SITE_KEY"></div>
                <script src="https://www.google.com/recaptcha/api.js" async defer></script>
              </div>
            </div>

            {error && <p id="message" className="text-sm text-red-600">{error}</p>}
            {message && <p className="text-sm text-green-600">{message}</p>}

            <button type="submit" disabled={isLoading} className="w-full rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
              {isLoading ? "Creating account…" : "Sign up"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">Already have an account?{' '}<a href="/login" className="font-medium text-brand-600 hover:text-brand-700">Log in</a></p>
        </div>
      </div>
    </div>
  );
}
