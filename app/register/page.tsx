"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const text = await res.text();

      let data: {
        error?: string;
        success?: boolean;
      } = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (!res.ok) {
        setError(
          data.error ||
            `Erreur serveur (${res.status}).`
        );
        return;
      }

      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("[REGISTER_CLIENT_ERROR]", error);

      setError(
        "Impossible de contacter le serveur."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm pt-12">
      <Card className="p-8">
        <h1 className="text-center font-serif text-2xl italic text-ink">
          Créer un compte
        </h1>

        <form
          onSubmit={onSubmit}
          className="mt-6 space-y-4"
        >
          <div>
            <label
              htmlFor="name"
              className="mb-1 block text-sm font-medium text-ink-soft"
            >
              Nom
            </label>

            <Input
              id="name"
              name="name"
              autoComplete="name"
              required
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
            />
          </div>

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
              onChange={(e) =>
                setEmail(e.target.value)
              }
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
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
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
            disabled={loading}
          >
            {loading
              ? "Création..."
              : "S'inscrire"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Déjà inscrit ?{" "}
          <Link
            href="/login"
            className="text-accent hover:underline"
          >
            Se connecter
          </Link>
        </p>
      </Card>
    </div>
  );
}
