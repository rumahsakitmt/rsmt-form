"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/server/better-auth/client";

export function LoginPageClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await authClient.signIn.email({
        email,
        password,
        callbackURL: "/",
      });
      // if success, better-auth handles redirection based on callbackURL
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Invalid email or password.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="text-academic-black flex min-h-dvh w-full overflow-hidden font-mono text-xs">
      <div className="bg-academic-white flex flex-1 flex-col overflow-hidden">
        <div className="border-academic-black bg-academic-green flex items-center justify-between border-b px-4 py-3 text-[10px] font-bold tracking-[0.3em] uppercase md:px-8">
          <Link href="/" className="transition-opacity hover:opacity-70">
            RSMT.DOCX
          </Link>
          <span className="text-academic-black/70 hidden md:inline">
            Secure Access Portal
          </span>
        </div>

        <div className="relative flex-1 overflow-y-auto bg-white p-4 font-sans text-sm md:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(17,17,17,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(17,17,17,0.06)_1px,transparent_1px)] bg-[size:32px_32px]" />

          <div className="border-academic-black bg-academic-white relative mx-auto flex w-full max-w-5xl flex-col border md:min-h-[680px] md:flex-row">
            <section className="border-academic-black flex flex-col justify-between border-b bg-[linear-gradient(135deg,rgba(72,199,150,0.18),rgba(72,199,150,0.04)_45%,rgba(255,255,255,1)_46%)] p-6 md:w-[44%] md:border-r md:border-b-0 md:p-10">
              <div className="space-y-6">
                <div className="space-y-4">
                  <p className="text-academic-black/60 text-[10px] font-bold tracking-[0.35em] uppercase">
                    RSUD MAMUJU TENGAH
                  </p>
                  <h1 className="text-academic-black max-w-sm text-4xl font-bold tracking-[0.12em] uppercase md:text-5xl">
                    Buat Dokumen dengan Mudah
                  </h1>
                  <p className="text-academic-black/70 max-w-md text-sm leading-6">
                    Isi formnya, simpan, download dan akses dengan mudah.
                  </p>
                </div>
              </div>
            </section>

            <section className="flex flex-1 flex-col justify-center bg-white p-6 md:p-10">
              <div className="border-academic-black mb-8 flex items-center justify-between border-b pb-4">
                <div>
                  <p className="text-academic-black/60 text-[10px] font-bold tracking-[0.3em] uppercase">
                    Authentication
                  </p>
                  <p className="text-academic-black/70 mt-2 text-sm">
                    Masuk dengan email yang terdaftar.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                <div className="grid gap-6">
                  <div>
                    <label
                      htmlFor="email"
                      className="bg-academic-black/5 text-academic-black/60 mb-2 inline-block px-2 py-1 text-[10px] font-bold tracking-[0.3em] uppercase"
                    >
                      Email Address
                    </label>
                    <input
                      id="email"
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-academic-black text-academic-black placeholder:text-academic-black/35 focus:border-academic-green w-full border-b-2 bg-transparent px-0 py-3 font-sans text-base transition-colors outline-none"
                      placeholder="admin@example.com"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="bg-academic-black/5 text-academic-black/60 mb-2 inline-block px-2 py-1 text-[10px] font-bold tracking-[0.3em] uppercase"
                    >
                      Password
                    </label>
                    <input
                      id="password"
                      required
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border-academic-black text-academic-black placeholder:text-academic-black/35 focus:border-academic-green w-full border-b-2 bg-transparent px-0 py-3 font-sans text-base transition-colors outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {error && (
                  <div className="border border-red-500 bg-red-50 px-4 py-3 text-[10px] font-bold tracking-[0.25em] text-red-700 uppercase">
                    {error}
                  </div>
                )}

                <button
                  disabled={loading}
                  type="submit"
                  className="border-academic-black bg-academic-green text-academic-black w-full border px-6 py-4 text-[10px] font-bold tracking-[0.35em] uppercase shadow-[4px_4px_0px_#111111] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#111111] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_#111111]"
                >
                  {loading ? "Authenticating..." : "Sign In"}
                </button>
              </form>

              <div className="border-academic-black text-academic-black/60 mt-8 border-t pt-6 text-[10px] font-bold tracking-[0.3em] uppercase">
                Don&apos;t have an account?
                <Link
                  href="/signup"
                  className="text-academic-black hover:text-academic-green ml-3 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
