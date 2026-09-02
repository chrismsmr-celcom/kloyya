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
const supabase = useSupabase();
await supabase.auth.signInWithPassword({ email, password });
// ou
await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${location.origin}/auth/callback` }});

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) setError("Email ou mot de passe incorrect");
    else router.push("/");
  }

  return (
    <div className="mx-auto max-w-sm pt-12">
      <Card className="p-8">
        <h1 className="text-center font-serif text-2xl italic text-ink">Connexion</h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-soft">Email</label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-soft">Mot de passe</label>
            <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <p className="text-sm text-signal-warn">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>

        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-paper-border" />
          <span className="text-xs text-ink-faint">ou</span>
          <div className="h-px flex-1 bg-paper-border" />
        </div>

        <Button
          variant="outline"
          className="mt-6 w-full"
          onClick={() => signIn("google", { callbackUrl: "/" })}
        >
          Continuer avec Google
        </Button>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Pas de compte ?{" "}
          <Link href="/register" className="text-accent hover:underline">
            S'inscrire
          </Link>
        </p>
      </Card>
    </div>
  );
}