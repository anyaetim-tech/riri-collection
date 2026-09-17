"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (mode === "signup") {
        if (!name.trim()) throw new Error("Full name required");
        if (password.length < 6) throw new Error("Password must be at least 6 characters");
        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: { data: { full_name: name.trim() } }
        });
        if (error) throw error;
        if (data.session) {
          // Email confirmation disabled - logged in immediately
          router.push("/");
          return;
        }
        if (data.user) {
          setSuccess("Account created for " + email + "! If email confirmation is ON, check email. If OFF, you can Sign In now.");
          setMode("signin");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (error) throw error;
        if (data.session) {
          router.push("/");
          setTimeout(() => { window.location.href = "/"; }, 300);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF7F1] p-4">
      <div className="w-full max-w-md bg-white rounded-[24px] border border-gray-200 shadow-xl p-8">
        <div className="text-center mb-6">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-[#6B21A8] flex items-center justify-center text-white text-2xl font-bold">R</div>
          <h1 className="mt-3 text-2xl font-bold text-gray-900">Riri Collection</h1>
          <p className="text-sm text-gray-500">Owner & Staff Login</p>
        </div>

        <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
          <button type="button" onClick={() => { setMode("signin"); setError(null); setSuccess(null); }} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition ${mode==="signin" ? "bg-white shadow text-[#6B21A8]" : "text-gray-500"}`}>Sign In</button>
          <button type="button" onClick={() => { setMode("signup"); setError(null); setSuccess(null); }} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition ${mode==="signup" ? "bg-white shadow text-[#6B21A8]" : "text-gray-500"}`}>Create Account</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Full Name (e.g. Ada Staff)" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#6B21A8]" />
          )}
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" required className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#6B21A8]" />
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password (min 6 chars)" required minLength={6} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#6B21A8]" />
          
          {error && <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700 break-words">{error}</div>}
          {success && <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-sm text-green-700 break-words">{success}</div>}

          <button disabled={loading} className="w-full rounded-xl bg-[#6B21A8] py-3 text-sm font-bold text-white hover:bg-[#4a1575] disabled:opacity-50">
            {loading ? "Please wait..." : mode === "signin" ? "Sign In →" : "Create Account →"}
          </button>
        </form>

        <p className="mt-6 text-center text-[11px] text-gray-400">This will NOT break your anyaetim@gmail.com login. Sign In still works exactly as before.</p>
      </div>
    </div>
  );
}