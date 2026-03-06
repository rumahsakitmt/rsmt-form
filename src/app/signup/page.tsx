"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/server/better-auth/client";

export default function SignupPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const { error } = await authClient.signUp.email({
                email,
                password,
                name,
            });

            if (error) {
                setError(error.message ?? "Failed to create account.");
                return;
            }

            // Immediately clear errors and redirect to login
            router.push("/login");

        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to create account.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-black p-4 font-sans relative">
            <Link href="/" className="absolute top-8 left-8 text-white hover:text-gray-300 font-bold uppercase tracking-wider text-[11px] flex items-center gap-2">
                <span className="text-lg leading-none mb-[2px]">←</span>
                <span>BACK TO HOME</span>
            </Link>

            <div className="w-full max-w-md bg-[#1A1A1A] p-8 rounded-xl border border-[#333]">
                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-bold text-white uppercase tracking-wider mb-2">Create Account</h1>
                    <p className="text-gray-400 uppercase tracking-wider text-[11px] font-bold">Join to manage templates</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Full Name</label>
                        <input
                            required
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-black border border-gray-700 rounded p-4 text-white focus:border-white outline-none placeholder-gray-600 transition-colors"
                            placeholder="John Doe"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Email Address</label>
                        <input
                            required
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black border border-gray-700 rounded p-4 text-white focus:border-white outline-none placeholder-gray-600 transition-colors"
                            placeholder="account@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Password</label>
                        <input
                            required
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black border border-gray-700 rounded p-4 text-white focus:border-white outline-none placeholder-gray-600 transition-colors"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-900/50 border border-red-500 rounded p-3 text-red-200 text-xs font-bold uppercase tracking-wider text-center">
                            {error}
                        </div>
                    )}

                    <button
                        disabled={loading}
                        type="submit"
                        className="mt-6 w-full bg-white text-black font-bold uppercase tracking-widest py-4 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Creating Account..." : "Sign Up"}
                    </button>
                </form>

                <div className="mt-8 text-center border-t border-gray-800 pt-6">
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                        Already have an account?{" "}
                        <Link href="/login" className="text-white hover:underline ml-2">
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
}
