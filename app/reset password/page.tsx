"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [checkingSession, setCheckingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Clicking the reset link redirects here with a recovery token in the
    // URL; the Supabase client picks it up automatically and fires this
    // event once the temporary session is ready to use.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setHasValidSession(true);
        setCheckingSession(false);
      }
    });

    // In case the event already fired before this component mounted,
    // fall back to checking for an active session directly.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setHasValidSession(true);
      }
      setCheckingSession(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) {
        throw new Error(updateError.message);
      }
      setSuccess(true);
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not update your password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAF7F1] px-4 text-gray-900">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#22214F] font-display text-xl font-bold text-white">
            O
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">ORDERLY</h1>
          <p className="mt-1 text-sm text-gray-500">Business Manager</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          {checkingSession ? (
            <div className="py-6 text-center text-sm text-gray-500">
              Checking your reset link...
            </div>
          ) : !hasValidSession ? (
            <>
              <h2 className="text-lg font-bold">Link expired</h2>
              <p className="mt-2 text-sm text-gray-500">
                This password reset link is invalid or has expired. Request a
                new one from the sign-in page.
              </p>
              <button
                onClick={() => router.push("/login")}
                className="mt-6 w-full rounded-xl bg-[#22214F] px-5 py-3 text-sm font-semibold text-white"
              >
                Back to Sign In
              </button>
            </>
          ) : success ? (
            <>
              <h2 className="text-lg font-bold">Password updated</h2>
              <p className="mt-2 text-sm text-gray-500">
                Your password has been changed. Taking you to your dashboard...
              </p>
            </>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-bold">Set a new password</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Choose a new password for your account.
                </p>
              </div>

              {error && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    New password
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#22214F]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Confirm new password
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#22214F]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[#22214F] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {loading ? "Updating..." : "Update Password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}