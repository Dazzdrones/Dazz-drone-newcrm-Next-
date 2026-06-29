"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const profileError = searchParams.get("error") === "no_profile";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    profileError
      ? "Your account is not set up as a CRM user. Contact a super admin."
      : null
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createBrowserSupabaseClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <Image
            src="/logo.webp"
            alt="Dazz Drones"
            width={200}
            height={56}
            className="mx-auto h-12 w-auto object-contain"
            priority
          />
          <h1 className="mt-6 text-2xl font-bold text-gray-900">CRM Sign In</h1>
          <p className="mt-2 text-sm text-gray-500">
            Sign in with your staff account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Email
            </span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#34AADC] focus:outline-none focus:ring-1 focus:ring-[#34AADC]"
              placeholder="you@dazzdrones.com"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Password
            </span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#34AADC] focus:outline-none focus:ring-1 focus:ring-[#34AADC]"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#34AADC] py-2.5 text-sm font-semibold text-white hover:bg-[#2B94C5] disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
