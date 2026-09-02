"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (!res || res.error) {
        setError("Email ou mot de passe incorrect.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Une erreur est survenue. Réessaie.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    if (googleLoading) return;

    setGoogleLoading(true);
    setError("");

    try {
      await signIn("google", {
        callbackUrl: "/",
      });
    } catch {
      setError("Impossible de continuer avec Google.");
      setGoogleLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm pt-12">
      <Card className="p-8">
        <h1 className="text-center font-serif text-2xl italic text-ink">
          Connexion
        </h1>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-ink-soft"
            >
              Email
            </label>

            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-ink-soft"
            >
              Mot de passe
            </label>

            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && (
            <p
              role="alert"
              className="text-sm text-signal-warn"
            >
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading || googleLoading}
          >
            {loading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>

        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-paper-border" />

          <span className="text-xs text-ink-faint">
            ou
          </span>

          <div className="h-px flex-1 bg-paper-border" />
        </div>

        <Button
          type="button"
          variant="outline"
          className="mt-6 w-full"
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
        >
          {googleLoading
            ? "Connexion..."
            : "Continuer avec Google"}
        </Button>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Pas de compte ?{" "}
          <Link
            href="/register"
            className="text-accent hover:underline"
          >
            S&apos;inscrire
          </Link>
        </p>
      </Card>
    </div>
  );
}
