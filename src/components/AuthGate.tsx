import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { LogIn } from "lucide-react";
import { env } from "../config/env";
import { supabase } from "../lib/supabase";
import { signInWithGoogle, signInWithPassword } from "../services/auth";

interface Props {
  children: ReactNode;
}

export default function AuthGate({ children }: Props) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(env.authRequired);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!env.authRequired) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  if (!env.authRequired) return <>{children}</>;
  if (loading) return <main className="gate-page"><div className="spinner" /></main>;
  if (session) return <>{children}</>;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      await signInWithPassword(email, password);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sign in failed.");
    }
  }

  return (
    <main className="gate-page auth-page">
      <section className="gate-card auth-card">
        <div className="gate-logo">CHOPS</div>
        <LogIn size={30} />
        <h1>Sign in to ChangeOps</h1>
        <p>Use your organization account to continue.</p>
        <button className="google-auth" type="button" onClick={() => void signInWithGoogle()}>
          Continue with Google
        </button>
        <div className="auth-divider"><span>or</span></div>
        <form className="gate-form" onSubmit={handleSubmit}>
          <input type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <input type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} />
          {error && <p className="form-error">{error}</p>}
          <button type="submit">Sign In</button>
        </form>
      </section>
    </main>
  );
}
