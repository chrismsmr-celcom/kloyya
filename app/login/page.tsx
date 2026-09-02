"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
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
    <div className="min-h-[calc(100vh-4rem)] w-full py-6 lg:py-10">
      <div className="mx-auto grid min-h-[680px] w-full max-w-6xl overflow-hidden rounded-3xl border border-paper-border bg-paper shadow-[0_24px_80px_rgba(0,0,0,0.08)] lg:grid-cols-2">
        
        {/* =========================================================
            LEFT — LOGIN
        ========================================================== */}
        <section className="flex items-center justify-center bg-paper px-6 py-12 sm:px-10 lg:px-14">
          <div className="w-full max-w-md">

            {/* Logo */}
            <Link
              href="/"
              className="mb-12 inline-flex items-center gap-2"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-sm font-bold text-white shadow-sm">
                K
              </span>

              <span className="font-serif text-2xl italic tracking-tight text-ink">
                Kloyya
              </span>
            </Link>

            {/* Heading */}
            <div className="mb-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                Bon retour
              </p>

              <h1 className="font-serif text-4xl leading-tight tracking-tight text-ink sm:text-5xl">
                Connectez-vous
                <br />
                à votre espace.
              </h1>

              <p className="mt-4 max-w-sm text-sm leading-6 text-ink-muted">
                Retrouvez vos outcomes, vos outils connectés et les
                automatisations de votre équipe.
              </p>
            </div>

            {/* Google */}
            <Button
              type="button"
              variant="outline"
              className="h-12 w-full rounded-xl border-paper-border bg-white text-sm font-medium shadow-none hover:bg-paper-sunken"
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
            >
              <span className="mr-3 flex h-5 w-5 items-center justify-center text-sm font-bold">
                G
              </span>

              {googleLoading
                ? "Connexion..."
                : "Continuer avec Google"}
            </Button>

            {/* Divider */}
            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-paper-border" />

              <span className="text-xs text-ink-faint">
                ou avec votre email
              </span>

              <div className="h-px flex-1 bg-paper-border" />
            </div>

            {/* Form */}
            <form onSubmit={onSubmit} className="space-y-5">
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
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="h-12 rounded-xl border-paper-border bg-white px-4 shadow-none focus-visible:ring-1"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-ink"
                  >
                    Mot de passe
                  </label>

                  <button
                    type="button"
                    className="text-xs font-medium text-accent hover:underline"
                    onClick={() =>
                      setError(
                        "La récupération du mot de passe sera disponible prochainement."
                      )
                    }
                  >
                    Mot de passe oublié ?
                  </button>
                </div>

                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="h-12 rounded-xl border-paper-border bg-white px-4 shadow-none focus-visible:ring-1"
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  role="alert"
                >
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                className="h-12 w-full rounded-xl bg-ink text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-ink/90"
                disabled={loading || googleLoading}
              >
                {loading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>

            {/* Register */}
            <p className="mt-8 text-center text-sm text-ink-muted">
              Vous n'avez pas encore de compte ?{" "}
              <Link
                href="/register"
                className="font-semibold text-accent hover:underline"
              >
                Créer un compte
              </Link>
            </p>

            <p className="mt-8 text-center text-[11px] leading-5 text-ink-faint">
              En continuant, vous acceptez les conditions d'utilisation
              et la politique de confidentialité de Kloyya.
            </p>
          </div>
        </section>

        {/* =========================================================
            RIGHT — VISUAL / ANIMATION
        ========================================================== */}
        <section className="relative hidden overflow-hidden bg-ink lg:block">
          
          {/* Background grid */}
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)",
              backgroundSize: "42px 42px",
            }}
          />

          {/* Ambient circles */}
          <motion.div
            className="absolute -right-32 -top-32 h-96 w-96 rounded-full border border-white/10"
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <motion.div
            className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full border border-white/10"
            animate={{
              scale: [1, 1.12, 1],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">

            {/* Top */}
            <div>
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Kloyya Agent
                <span className="text-white/30">•</span>
                Online
              </div>

              <h2 className="max-w-lg font-serif text-4xl leading-tight tracking-tight text-white xl:text-5xl">
                Ne demandez plus
                <br />
                une réponse.
                <br />
                <span className="text-white/45">
                  Demandez un outcome.
                </span>
              </h2>

              <p className="mt-6 max-w-md text-sm leading-7 text-white/50">
                Kloyya connecte vos outils, comprend votre objectif et
                orchestre les actions nécessaires pour obtenir le résultat.
              </p>
            </div>

            {/* Animated workflow */}
            <div className="relative mx-auto w-full max-w-md py-8">

              {/* Connection line */}
              <div className="absolute left-8 top-12 bottom-12 w-px bg-white/10" />

              {/* Step 1 */}
              <motion.div
                className="relative mb-5 flex items-center gap-4"
                animate={{ x: [0, 5, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 shadow-2xl backdrop-blur-xl">
                  <span className="text-lg">✦</span>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 backdrop-blur-xl">
                  <p className="text-[10px] uppercase tracking-widest text-white/35">
                    Outcome
                  </p>

                  <p className="mt-1 text-sm font-medium text-white">
                    Comprendre votre objectif
                  </p>
                </div>
              </motion.div>

              {/* Step 2 */}
              <motion.div
                className="relative mb-5 flex items-center gap-4"
                animate={{ x: [5, 0, 5] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
              >
                <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 shadow-2xl backdrop-blur-xl">
                  <span className="text-sm">◎</span>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 backdrop-blur-xl">
                  <p className="text-[10px] uppercase tracking-widest text-white/35">
                    Tools
                  </p>

                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded-md bg-white/10 px-2 py-1 text-[10px] text-white/70">
                      Gmail
                    </span>

                    <span className="rounded-md bg-white/10 px-2 py-1 text-[10px] text-white/70">
                      Notion
                    </span>

                    <span className="rounded-md bg-white/10 px-2 py-1 text-[10px] text-white/70">
                      CRM
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Step 3 */}
              <motion.div
                className="relative flex items-center gap-4"
                animate={{ x: [0, 5, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1,
                }}
              >
                <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white shadow-2xl">
                  <span className="text-lg text-ink">✓</span>
                </div>

                <div className="rounded-2xl border border-white/20 bg-white px-5 py-4 shadow-2xl">
                  <p className="text-[10px] uppercase tracking-widest text-ink-faint">
                    Result
                  </p>

                  <p className="mt-1 text-sm font-semibold text-ink">
                    Outcome terminé
                  </p>
                </div>
              </motion.div>

              {/* Floating pulse */}
              <motion.div
                className="absolute left-[25px] top-[30px] h-7 w-7 rounded-full border border-white/20"
                animate={{
                  scale: [1, 2.8],
                  opacity: [0.7, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />
            </div>

            {/* Bottom quote */}
            <div className="border-t border-white/10 pt-6">
              <p className="max-w-md text-sm leading-6 text-white/45">
                « Les outils changent. L'objectif reste.
                Kloyya s'occupe du chemin. »
              </p>

              <div className="mt-4 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-white/10" />

                <div>
                  <p className="text-xs font-medium text-white/70">
                    Kloyya
                  </p>

                  <p className="text-[10px] text-white/30">
                    Outcome automation
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>
      </div>
    </div>
  );
}
