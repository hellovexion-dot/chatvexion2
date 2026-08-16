import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { VexionLogo } from "@/components/vexion/VexionLogo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Masuk — Vexion AI" },
      {
        name: "description",
        content: "Masuk ke Vexion AI dengan akun Google untuk mulai percakapan tersimpan.",
      },
      { property: "og:title", content: "Masuk — Vexion AI" },
      { property: "og:description", content: "Masuk dengan Google untuk mulai memakai Vexion AI." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Tangkap token dari callback OAuth custom (hash fragment).
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (accessToken && refreshToken) {
      supabase.auth
        .setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        .then(({ error }) => {
          if (!error) {
            window.location.hash = "";
            navigate({ to: "/chat", replace: true });
          } else {
            setLoading(false);
            toast.error("Gagal menyimpan sesi. Coba lagi.");
          }
        });
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/chat" });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: "/chat" });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  function signIn() {
    setLoading(true);
    // OAuth Google langsung memakai ClientID/ClientSecret dari env Vercel.
    window.location.href = `${window.location.origin}/api/public/auth/google`;
  }

  return (
    <main className="vex-page flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="animate-fade-up vex-card w-full max-w-sm p-8 text-center">
        <div className="flex justify-center">
          <VexionLogo size={72} glow priority />
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight">Masuk ke Vexion AI</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Gunakan akun Google untuk menyimpan riwayat percakapanmu.
        </p>

        <Button
          onClick={signIn}
          disabled={loading}
          className="mt-7 h-12 w-full rounded-full bg-white text-[oklch(0.2_0.03_265)] hover:bg-white/90"
        >
          <GoogleMark />
          {loading ? "Menghubungkan…" : "Lanjut dengan Google"}
        </Button>

        <p className="mt-5 text-xs text-muted-foreground">
          Dengan melanjutkan kamu setuju percakapanmu disimpan di akunmu.
        </p>
      </div>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2.5 24 .5 14.6.5 6.5 5.8 2.6 13.6l7.8 6C12.3 13.5 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.2-.4-4.7H24v9h12.7c-.6 3-2.3 5.6-4.9 7.3l7.6 5.9c4.4-4.1 7.1-10.2 7.1-17.5z" />
      <path fill="#FBBC05" d="M10.4 28.4a14.5 14.5 0 0 1 0-8.8l-7.8-6a23.5 23.5 0 0 0 0 20.8l7.8-6z" />
      <path fill="#34A853" d="M24 47.5c6.2 0 11.5-2 15.4-5.5l-7.6-5.9c-2.1 1.4-4.8 2.3-7.8 2.3-6.3 0-11.7-4-13.6-9.9l-7.8 6C6.5 42.2 14.6 47.5 24 47.5z" />
    </svg>
  );
}
