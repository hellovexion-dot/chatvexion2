import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Play, Plus, Trash2, KeyRound, ShieldCheck, Youtube } from "lucide-react";
import { toast } from "sonner";
import { VexionLogo } from "@/components/vexion/VexionLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { getSettings, saveSettings, getUsage } from "@/lib/vexion.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Pengaturan API — Vexion AI" },
      {
        name: "description",
        content:
          "Atur mode API Vexion AI: pakai kuota bawaan atau API key Gemini milikmu dengan rotasi otomatis.",
      },
      { property: "og:title", content: "Pengaturan API — Vexion AI" },
      { property: "og:description", content: "Kelola kuota harian dan API key Gemini kamu." },
    ],
  }),
  component: SettingsPage,
});

const YT_SEARCH =
  "https://www.youtube.com/results?search_query=cara+membuat+gemini+api+key";

function SettingsPage() {
  const navigate = useNavigate();
  const fetchSettings = useServerFn(getSettings);
  const persist = useServerFn(saveSettings);
  const fetchUsage = useServerFn(getUsage);

  const [mode, setMode] = useState<"default" | "custom">("default");
  const [primary, setPrimary] = useState("");
  const [backups, setBackups] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const settings = useQuery({ queryKey: ["settings"], queryFn: () => fetchSettings({}) });
  const usage = useQuery({ queryKey: ["usage"], queryFn: () => fetchUsage({}) });

  useEffect(() => {
    if (!settings.data) return;
    setMode(settings.data.api_mode);
    setPrimary(settings.data.primary_key ?? "");
    setBackups(settings.data.backup_keys ?? []);
  }, [settings.data]);

  async function save(nextMode?: "default" | "custom") {
    const m = nextMode ?? mode;
    setSaving(true);
    try {
      await persist({
        data: {
          api_mode: m,
          primary_key: primary.trim() || null,
          backup_keys: backups.map((b) => b.trim()).filter(Boolean),
        },
      });
      toast.success("Pengaturan tersimpan.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  }

  const msgLeft = Math.max(0, (usage.data?.messageLimit ?? 20) - (usage.data?.messagesUsed ?? 0));
  const fileLeft = Math.max(0, (usage.data?.fileLimit ?? 5) - (usage.data?.filesUsed ?? 0));

  return (
    <main className="vex-page min-h-dvh pb-16">
      <header className="flex items-center gap-2 border-b border-border/60 px-3 py-2.5">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/chat" })} aria-label="Kembali">
          <ArrowLeft className="size-5" />
        </Button>
        <span className="text-sm font-semibold">Pengaturan</span>
      </header>

      <div className="mx-auto flex w-full max-w-xl flex-col gap-5 px-4 py-6">
        <div className="flex items-center gap-3">
          <VexionLogo size={44} glow priority />
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Konfigurasi API Key</h1>
            <p className="text-xs text-muted-foreground">
              Pilih memakai kuota bawaan Vexion atau API key Gemini milikmu.
            </p>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="vex-card grid grid-cols-2 gap-1 p-1.5">
          {(
            [
              ["default", "API Key Vexion"],
              ["custom", "API Key Sendiri"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => {
                setMode(value);
                void save(value);
              }}
              className={cn(
                "rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-300",
                mode === value
                  ? "vex-gradient-bg text-primary-foreground shadow-[var(--vex-glow)]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
              <span className="block text-[10px] font-normal opacity-80">
                {value === "default" ? "Default" : "Custom"}
              </span>
            </button>
          ))}
        </div>

        {mode === "default" ? (
          <section className="animate-fade-up vex-card space-y-5 p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4.5 text-primary" />
              <h2 className="text-sm font-semibold">Kuota harian</h2>
            </div>

            <div>
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="text-muted-foreground">Pesan</span>
                <span className="font-medium">{msgLeft}/{usage.data?.messageLimit ?? 20} pesan tersisa</span>
              </div>
              <Progress value={(msgLeft / (usage.data?.messageLimit ?? 20)) * 100} className="h-2" />
            </div>

            <div>
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="text-muted-foreground">File</span>
                <span className="font-medium">{fileLeft}/{usage.data?.fileLimit ?? 5} file tersisa hari ini</span>
              </div>
              <Progress value={(fileLeft / (usage.data?.fileLimit ?? 5)) * 100} className="h-2" />
            </div>

            <p className="text-xs text-muted-foreground">
              Kuota otomatis direset setiap hari pukul 00:00.
            </p>
          </section>
        ) : (
          <section className="animate-fade-up space-y-5">
            <div className="vex-card space-y-4 p-5">
              <div className="flex items-center gap-2">
                <KeyRound className="size-4.5 text-primary" />
                <h2 className="text-sm font-semibold">API Key Utama</h2>
              </div>
              <Input
                value={primary}
                onChange={(e) => setPrimary(e.target.value)}
                type="password"
                placeholder="Tempel Gemini API Key kamu"
                className="h-11 rounded-xl bg-background/60"
              />
            </div>

            <div className="vex-card space-y-3 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Backup API Keys</h2>
                <span className="text-xs text-muted-foreground">{backups.length}/5</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Kalau key aktif kena limit, Vexion otomatis berpindah ke key berikutnya.
              </p>
              {backups.map((b, i) => (
                <div key={i} className="animate-fade-up flex items-center gap-2">
                  <Input
                    value={b}
                    type="password"
                    placeholder={`Backup key #${i + 1}`}
                    onChange={(e) =>
                      setBackups((p) => p.map((v, idx) => (idx === i ? e.target.value : v)))
                    }
                    className="h-11 rounded-xl bg-background/60"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Hapus backup key ${i + 1}`}
                    onClick={() => setBackups((p) => p.filter((_, idx) => idx !== i))}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              {backups.length < 5 && (
                <Button
                  variant="outline"
                  onClick={() => setBackups((p) => [...p, ""])}
                  className="h-10 w-full rounded-xl border-dashed"
                >
                  <Plus className="size-4" /> Tambah backup key
                </Button>
              )}
            </div>

            <Button
              onClick={() => void save()}
              disabled={saving}
              className="vex-gradient-bg h-12 w-full rounded-full font-semibold"
            >
              {saving ? "Menyimpan…" : "Simpan pengaturan"}
            </Button>
          </section>
        )}

        {/* Tutorial card */}
        <section className="vex-card overflow-hidden p-0 transition-transform hover:-translate-y-0.5 hover:shadow-[var(--vex-glow)]">
          <a
            href={YT_SEARCH}
            target="_blank"
            rel="noopener noreferrer"
            className="relative block aspect-video w-full"
          >
            <span className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_0%,oklch(0.35_0.12_262),oklch(0.12_0.03_265))]" />
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <span className="vex-gradient-bg flex size-14 items-center justify-center rounded-full shadow-[var(--vex-glow)] transition-transform hover:scale-110">
                <Play className="size-6 fill-primary-foreground text-primary-foreground" />
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Youtube className="size-4" /> Tonton di YouTube
              </span>
            </span>
          </a>
          <div className="space-y-3 p-5">
            <h2 className="text-sm font-semibold">Cara membuat Gemini API Key</h2>
            <ol className="list-decimal space-y-1.5 pl-4 text-xs text-muted-foreground">
              <li>Buka Google AI Studio lalu masuk dengan akun Google.</li>
              <li>Pilih menu <span className="text-foreground">Get API key</span>.</li>
              <li>Klik <span className="text-foreground">Create API key</span> dan pilih project.</li>
              <li>Salin key yang muncul (hanya ditampilkan sekali).</li>
              <li>Tempel ke kolom API Key Utama di atas, lalu simpan.</li>
              <li>Ulangi untuk membuat hingga 5 key cadangan.</li>
            </ol>
          </div>
        </section>
      </div>
    </main>
  );
}
