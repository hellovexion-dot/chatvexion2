import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { VexionLogo } from "@/components/vexion/VexionLogo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Menyelesaikan Masuk — Vexion AI" },
      {
        name: "description",
        content: "Menyelesaikan proses masuk Google ke Vexion AI dan mengarahkanmu ke chat.",
      },
      { property: "og:title", content: "Menyelesaikan Masuk — Vexion AI" },
      {
        property: "og:description",
        content: "Tunggu sebentar, sesi Vexion AI sedang disiapkan.",
      },
    ],
  }),
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let done = false;
    const go = (to: "/chat" | "/auth") => {
      if (done) return;
      done = true;
      navigate({ to, replace: true });
    };

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) go("/chat");
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) go("/chat");
    });

    const timeout = setTimeout(() => go("/auth"), 6000);
    return () => {
      clearTimeout(timeout);
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <main className="vex-page flex min-h-dvh flex-col items-center justify-center gap-6">
      <VexionLogo size={88} pulsing priority />
      <p className="text-sm text-muted-foreground">Menyelesaikan proses masuk…</p>
    </main>
  );
}