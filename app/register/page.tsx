"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";

import { createClient } from "@/lib/supabase/client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");

    if (password.length < 8) {
      setError(
        "Le mot de passe doit contenir au moins 8 caractères."
      );
      setLoading(false);
      return;
    }

    const { data, error } =
      await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: name.trim(),
          },
          emailRedirectTo:
            `${window.location.origin}/auth/callback`,
        },
      });

    if (error) {
      if (
        error.message
          .toLowerCase()
          .includes("already registered")
      ) {
        setError(
          "Un compte existe déjà avec cet email."
        );
      } else {
        setError(error.message);
      }

      setLoading(false);
      return;
    }

    if (data.session) {
      router.push("/");
      router.refresh();
      return;
    }

    setError(
      "Compte créé. Vérifiez votre email pour confirmer votre adresse."
    );

    setLoading(false);
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full py-8">
      <div className="mx-auto grid min-h-[680px] max-w-6xl overflow-hidden rounded-3xl border border-paper-border bg-paper shadow-[0_24px_80px_rgba(0,0,0,0.08)] lg:grid-cols-2">

        <section className="flex items-center justify-center px-6 py-12 sm:px-10 lg:px-14">
          <div className="w-full max-w-md">

            <Link
              href="/"
              className="mb-10 inline-flex items-center gap-2"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-sm font-bold text-white">
                K
              </span>

              <span className="font-serif text-2xl italic text-ink">
                Kloyya
              </span>
            </Link>

            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Commencer
            </p>

            <h1 className="font-serif text-4xl leading-tight text-ink sm:text-5xl">
              Créez votre
              <br />
              espace Kloyya.
            </h1>

            <p className="mt-4 text-sm leading-6 text-ink-muted">
              Connectez vos outils et laissez Kloyya
              transformer vos demandes en outcomes.
            </p>

            <form
              onSubmit={onSubmit}
              className="mt-8 space-y-5"
            >
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-ink"
                >
                  Nom
                </label>

                <Input
                  id="name"
                  name="name"
                  autoComplete="name"
                  placeholder="Christopher Dikesa"
                  required
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  disabled={loading}
                  className="h-12 rounded-xl bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-ink"
                >
                  Adresse email
                </label>

                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="vous@entreprise.com"
                  required
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  disabled={loading}
                  className="h-12 rounded-xl bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-ink"
                >
                  Mot de passe
                </label>

                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  disabled={loading}
                  className="h-12 rounded-xl bg-white"
                />
              </div>

              {error && (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: -4,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  role="alert"
                >
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                className="h-12 w-full rounded-xl bg-ink font-semibold text-white hover:bg-ink/90"
                disabled={loading}
              >
                {loading
                  ? "Création..."
                  : "Créer mon compte"}
              </Button>
            </form>

            <p className="mt-8 text-center text-sm text-ink-muted">
              Vous avez déjà un compte ?{" "}
              <Link
                href="/login"
                className="font-semibold text-accent hover:underline"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </section>

        <section className="relative hidden overflow-hidden bg-ink lg:block">
          <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:42px_42px]" />

          <div className="relative flex h-full flex-col justify-center p-16">

            <motion.div
              animate={{
                y: [0, -10, 0],
                rotate: [0, 1, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.06] p-8 shadow-2xl backdrop-blur-xl"
            >
              <div className="mb-8 flex items-center justify-between">
                <span className="text-sm font-medium text-white/70">
                  Kloyya Agent
                </span>

                <span className="flex items-center gap-2 text-xs text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Ready
                </span>
              </div>

              <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                Votre objectif
              </p>

              <p className="mt-3 text-xl font-medium text-white">
                Obtenir un résultat,
                pas simplement une réponse.
              </p>

              <div className="my-8 h-px bg-white/10" />

              <div className="space-y-4">

                {[
                  "Comprendre",
                  "Connecter les outils",
                  "Exécuter",
                  "Livrer le résultat",
                ].map((step, index) => (
                  <motion.div
                    key={step}
                    animate={{
                      opacity: [0.45, 1, 0.45],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: index * 0.5,
                    }}
                    className="flex items-center gap-3"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-xs text-white">
                      {index + 1}
                    </span>

                    <span className="text-sm text-white/60">
                      {step}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <p className="mx-auto mt-10 max-w-md text-center text-sm leading-6 text-white/40">
              Un espace unique pour transformer
              vos intentions en actions concrètes.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
