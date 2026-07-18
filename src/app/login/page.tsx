"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const T = {
  surface: "var(--protocol-surface)",
  tint: "var(--protocol-tint)",
  ink: "var(--protocol-ink)",
  stone: "var(--protocol-stone)",
  rule: "var(--protocol-rule)",
  accent: "var(--protocol-accent)",
  mono: "var(--font-mono)",
  serifD: "var(--font-serif-display)",
};

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Welcome back.");
        router.push("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success("Account created. Please verify your email.");
        setIsLogin(true);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.surface,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: T.mono,
      }}
    >
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo / wordmark */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div
            style={{
              fontFamily: T.serifD,
              fontSize: 36,
              color: T.ink,
              lineHeight: 1,
              letterSpacing: "-0.5px",
              marginBottom: 8,
            }}
          >
            Protocol
          </div>
          <div
            style={{
              fontFamily: T.mono,
              fontSize: 10,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: T.stone,
            }}
          >
            Personal life OS
          </div>
        </div>

        {/* Form card */}
        <div style={{ border: `1px solid ${T.rule}`, background: T.surface }}>
          {/* Tab strip */}
          <div style={{ display: "flex", borderBottom: `1px solid ${T.rule}` }}>
            {(["Sign In", "Sign Up"] as const).map((label, i) => {
              const active = (i === 0) === isLogin;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setIsLogin(i === 0)}
                  style={{
                    flex: 1,
                    padding: "12px 0",
                    fontFamily: T.mono,
                    fontSize: 10,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: active ? T.ink : T.stone,
                    background: "none",
                    border: "none",
                    borderBottom: active
                      ? `2px solid ${T.accent}`
                      : "2px solid transparent",
                    cursor: "pointer",
                    transition: "color 0.1s",
                    marginBottom: -1,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleAuth} style={{ padding: "28px 32px 32px" }}>
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: "block",
                  fontFamily: T.mono,
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: T.stone,
                  marginBottom: 6,
                }}
              >
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  width: "100%",
                  background: T.tint,
                  border: `1px solid ${T.rule}`,
                  outline: "none",
                  padding: "10px 12px",
                  fontFamily: T.mono,
                  fontSize: 12,
                  color: T.ink,
                  boxSizing: "border-box",
                  transition: "border-color 0.1s",
                }}
                onFocus={(e) => (e.target.style.borderColor = T.accent)}
                onBlur={(e) => (e.target.style.borderColor = T.rule)}
              />
            </div>

            <div style={{ marginBottom: 28 }}>
              <label
                style={{
                  display: "block",
                  fontFamily: T.mono,
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: T.stone,
                  marginBottom: 6,
                }}
              >
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  background: T.tint,
                  border: `1px solid ${T.rule}`,
                  outline: "none",
                  padding: "10px 12px",
                  fontFamily: T.mono,
                  fontSize: 12,
                  color: T.ink,
                  boxSizing: "border-box",
                  transition: "border-color 0.1s",
                }}
                onFocus={(e) => (e.target.style.borderColor = T.accent)}
                onBlur={(e) => (e.target.style.borderColor = T.rule)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px 0",
                background: T.ink,
                color: T.surface,
                fontFamily: T.mono,
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "opacity 0.1s",
              }}
            >
              {loading ? (
                <Loader2
                  style={{
                    width: 14,
                    height: 14,
                    animation: "spin 1s linear infinite",
                  }}
                />
              ) : isLogin ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>
          </form>
        </div>

        {/* Toggle link */}
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button
            type="button"
            onClick={() => setIsLogin((v) => !v)}
            style={{
              background: "none",
              border: "none",
              fontFamily: T.mono,
              fontSize: 10,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: T.stone,
              cursor: "pointer",
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            {isLogin
              ? "Need an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
