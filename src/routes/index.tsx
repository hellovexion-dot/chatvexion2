import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { VexionLogo } from "@/components/vexion/VexionLogo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vexion AI — Asisten AI Percakapan Bahasa Indonesia" },
      {
        name: "description",
        content:
          "Mulai ngobrol dengan Vexion AI: asisten AI cepat bertema gelap, dukungan lampiran file, dan riwayat percakapan tersimpan otomatis.",
      },
      { property: "og:title", content: "Vexion AI — Asisten AI Percakapan" },
      {
        property: "og:description",
        content: "Tanya apa saja. Semua percakapan otomatis tersimpan di akunmu.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [splash, setSplash] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setSplash(false), 1600);
    return () => clearTimeout(t);
  }, []);

  // Kembali dari Google OAuth: kalau sesi sudah ada, langsung ke chat.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/chat", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: "/chat", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  if (splash) {
    return (
      <main className="vex-page flex min-h-dvh flex-col items-center justify-center gap-6">
        <VexionLogo size={96} pulsing priority />
        <p className="vex-gradient-text text-2xl font-semibold tracking-tight">Vexion AI</p>
      </main>
    );
  }

  return (
    <main className="vex-page flex min-h-dvh flex-col items-center justify-center px-6 py-14">
      <div className="animate-fade-up flex w-full max-w-md flex-col items-center text-center">
        <VexionLogo size={104} glow priority />
        <h1 className="vex-gradient-text mt-7 text-4xl font-bold tracking-tight sm:text-5xl">
          Vexion AI
        </h1>
        <p className="mt-3 text-balance text-base text-muted-foreground">
          Asisten AI pribadimu — tanya apa saja, kapan saja. Semua percakapan tersimpan
          otomatis di akunmu.
        </p>

        <Button
          size="lg"
          className="vex-gradient-bg mt-8 h-12 w-full rounded-full text-base font-semibold shadow-[var(--vex-glow)] transition-transform active:scale-[0.98]"
          onClick={() => navigate({ to: "/auth" })}
        >
          Mulai
          <ArrowRight className="ml-1 size-5" />
        </Button>

        <ul className="mt-10 grid w-full gap-3 text-left">
          {[
            { icon: Zap, title: "Respons cepat", desc: "Jawaban mengalir dalam hitungan detik." },
            { icon: Sparkles, title: "Lampirkan file", desc: "Kirim hingga 5 file sekaligus." },
            { icon: ShieldCheck, title: "Privat", desc: "Riwayat hanya bisa diakses olehmu." },
          ].map(({ icon: Icon, title, desc }) => (
            <li
              key={title}
              className="vex-card flex items-start gap-3 p-4 hover:-translate-y-0.5 hover:shadow-[var(--vex-glow)]"
            >
              <span className="vex-gradient-bg mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl">
                <Icon className="size-4.5 text-primary-foreground" />
              </span>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
