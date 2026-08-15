import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp,
  Menu,
  Mic,
  MicOff,
  Paperclip,
  Plus,
  Search,
  Settings,
  SquarePen,
  Trash2,
  X,
  LogOut,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { VexionLogo, TypingDots } from "@/components/vexion/VexionLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { sendMessage } from "@/lib/vexion.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({
    meta: [
      { title: "Chat — Vexion AI" },
      {
        name: "description",
        content: "Ruang percakapan Vexion AI dengan riwayat tersimpan otomatis.",
      },
      { property: "og:title", content: "Chat — Vexion AI" },
      { property: "og:description", content: "Tanya apa saja ke Vexion AI." },
    ],
  }),
  component: ChatPage,
});

type Msg = {
  id: string;
  role: string;
  content: string;
  attachments: { name: string; mime: string }[];
};

type Pending = { name: string; mime: string; data: string; size: number };

const MAX_FILES = 5;

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ChatPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const send = useServerFn(sendMessage);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<Pending[]>([]);
  const [thinking, setThinking] = useState(false);
  const [listening, setListening] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<any>(null);

  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, email, avatar_url")
        .eq("id", auth.user.id)
        .maybeSingle();
      return (
        data ?? {
          full_name: auth.user.email?.split("@")[0] ?? "Teman",
          email: auth.user.email ?? "",
          avatar_url: null as string | null,
        }
      );
    },
  });

  const conversations = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const { data } = await supabase
        .from("conversations")
        .select("id, title, updated_at")
        .order("updated_at", { ascending: false });
      return data ?? [];
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const firstName = useMemo(
    () => (profile.data?.full_name ?? "Teman").split(" ")[0],
    [profile.data],
  );

  async function openConversation(id: string) {
    setConversationId(id);
    setSidebarOpen(false);
    const { data } = await supabase
      .from("messages")
      .select("id, role, content, attachments")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });
    setMessages((data ?? []) as unknown as Msg[]);
  }

  function newChat() {
    setConversationId(null);
    setMessages([]);
    setFiles([]);
    setInput("");
    setSidebarOpen(false);
  }

  async function deleteConversation(id: string) {
    const { error } = await supabase.from("conversations").delete().eq("id", id);
    if (error) return toast.error("Gagal menghapus percakapan.");
    if (id === conversationId) newChat();
    qc.invalidateQueries({ queryKey: ["conversations"] });
    toast.success("Percakapan dihapus.");
  }

  async function pickFiles(list: FileList | null) {
    if (!list) return;
    const room = MAX_FILES - files.length;
    if (room <= 0) return toast.error(`Maksimal ${MAX_FILES} file sekaligus.`);
    const chosen = Array.from(list).slice(0, room);
    if (list.length > room) toast.error(`Maksimal ${MAX_FILES} file sekaligus.`);
    const encoded: Pending[] = [];
    for (const f of chosen) {
      if (f.size > 6 * 1024 * 1024) {
        toast.error(`${f.name} terlalu besar (maks 6MB).`);
        continue;
      }
      encoded.push({
        name: f.name,
        mime: f.type || "application/octet-stream",
        data: await fileToBase64(f),
        size: f.size,
      });
    }
    setFiles((p) => [...p, ...encoded]);
  }

  function toggleMic() {
    const SR =
      (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) return toast.error("Perangkat ini tidak mendukung input suara.");
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new SR();
    rec.lang = "id-ID";
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript as string;
      setInput((p) => (p ? `${p} ${text}` : text));
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }

  async function submit() {
    if (thinking) return;
    const text = input.trim();
    if (!text && files.length === 0) return;

    const attachments = files.map((f) => ({ name: f.name, mime: f.mime }));
    setMessages((p) => [
      ...p,
      { id: `local-${Date.now()}`, role: "user", content: text, attachments },
    ]);
    const payloadFiles = files;
    setInput("");
    setFiles([]);
    setThinking(true);

    try {
      const res = await send({
        data: {
          conversationId,
          content: text,
          attachments: payloadFiles.map((f) => ({
            name: f.name,
            mime: f.mime,
            data: f.data,
          })),
        },
      });
      setConversationId(res.conversationId);
      const reply = res.messages.find((m: any) => m.role === "assistant");
      if (reply) {
        setMessages((p) => [
          ...p,
          {
            id: reply.id,
            role: "assistant",
            content: reply.content,
            attachments: [],
          },
        ]);
      }
      qc.invalidateQueries({ queryKey: ["conversations"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal mengirim pesan.");
      setMessages((p) => p.slice(0, -1));
      setInput(text);
      setFiles(payloadFiles);
    } finally {
      setThinking(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  const filtered = (conversations.data ?? []).filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="vex-page flex h-dvh flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border/60 px-3 py-2.5 backdrop-blur-sm">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} aria-label="Buka menu">
          <Menu className="size-5" />
        </Button>
        <span className="text-sm font-semibold tracking-tight">Vexion AI</span>
        <Button variant="ghost" size="icon" onClick={newChat} aria-label="Percakapan baru">
          <SquarePen className="size-5" />
        </Button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 && !thinking ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <VexionLogo size={86} glow pulsing={thinking} priority />
            <h1 className="mt-6 text-xl font-semibold tracking-tight">
              Halo {firstName}, ada yang bisa dibantu?
            </h1>
            <p className="mt-2 max-w-xs text-balance text-sm text-muted-foreground">
              Tanya apa saja — semua percakapan otomatis tersimpan di akunmu.
            </p>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "animate-fade-up flex",
                  m.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-3xl px-4 py-3 text-sm leading-relaxed",
                    m.role === "user"
                      ? "vex-gradient-bg rounded-br-lg text-primary-foreground"
                      : "rounded-bl-lg bg-card/80 text-card-foreground",
                  )}
                >
                  {m.attachments?.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {m.attachments.map((a) => (
                        <span
                          key={a.name}
                          className="flex items-center gap-1 rounded-lg bg-black/25 px-2 py-1 text-[11px]"
                        >
                          <FileText className="size-3" />
                          {a.name}
                        </span>
                      ))}
                    </div>
                  )}
                  {m.content}
                </div>
              </div>
            ))}
            {thinking && (
              <div className="animate-fade-up flex items-center gap-3">
                <VexionLogo size={32} pulsing />
                <div className="rounded-3xl rounded-bl-lg bg-card/80 px-4 py-3">
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="border-t border-border/60 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3">
        <div className="mx-auto w-full max-w-2xl">
          {files.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {files.map((f, i) => (
                <div
                  key={`${f.name}-${i}`}
                  className="animate-fade-up relative flex items-center gap-2 rounded-xl border border-border bg-card/80 py-1.5 pl-2 pr-7 text-xs"
                >
                  {f.mime.startsWith("image/") ? (
                    <img
                      src={`data:${f.mime};base64,${f.data}`}
                      alt={f.name}
                      width={28}
                      height={28}
                      loading="lazy"
                      className="size-7 rounded-md object-cover"
                    />
                  ) : (
                    <FileText className="size-4 text-primary" />
                  )}
                  <span className="max-w-28 truncate">{f.name}</span>
                  <button
                    type="button"
                    aria-label={`Hapus ${f.name}`}
                    onClick={() => setFiles((p) => p.filter((_, idx) => idx !== i))}
                    className="absolute right-1 top-1 rounded-full p-0.5 text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-1.5 rounded-3xl border border-border bg-card/70 p-1.5 backdrop-blur">
            <input
              ref={fileRef}
              type="file"
              multiple
              hidden
              onChange={(e) => {
                void pickFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => fileRef.current?.click()}
              aria-label="Lampirkan file"
            >
              <Paperclip className="size-5" />
            </Button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void submit();
                }
              }}
              rows={1}
              placeholder="Tanya Vexion AI"
              className="max-h-32 flex-1 resize-none bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground"
            />
            <Button
              variant="ghost"
              size="icon"
              className={cn("rounded-full", listening && "text-primary")}
              onClick={toggleMic}
              aria-label="Input suara"
            >
              {listening ? <MicOff className="size-5" /> : <Mic className="size-5" />}
            </Button>
            <Button
              size="icon"
              onClick={() => void submit()}
              disabled={thinking || (!input.trim() && files.length === 0)}
              className="vex-gradient-bg size-10 shrink-0 rounded-full disabled:opacity-40"
              aria-label="Kirim pesan"
            >
              <ArrowUp className="size-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent
          side="left"
          className="flex w-[86vw] max-w-xs flex-col gap-0 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
        >
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-2.5">
              <VexionLogo size={34} />
              <span className="text-sm font-semibold">Vexion AI</span>
            </div>
          </div>

          <div className="px-3">
            <button
              onClick={newChat}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-sidebar-accent"
            >
              <Plus className="size-4.5 text-primary" /> Percakapan baru
            </button>
            <button
              onClick={() => setSearching((s) => !s)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-sidebar-accent"
            >
              <Search className="size-4.5 text-primary" /> Telusuri percakapan
            </button>
            {searching && (
              <Input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari judul percakapan…"
                className="animate-fade-up mt-1 h-9 rounded-xl bg-sidebar-accent text-sm"
              />
            )}
          </div>

          <div className="mt-4 flex-1 overflow-y-auto px-3">
            <p className="px-3 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Terbaru
            </p>
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">Belum ada percakapan.</p>
            ) : (
              <ul className="flex flex-col gap-0.5">
                {filtered.map((c) => (
                  <li key={c.id} className="group flex items-center">
                    <button
                      onClick={() => void openConversation(c.id)}
                      className={cn(
                        "flex-1 truncate rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-sidebar-accent",
                        c.id === conversationId && "bg-sidebar-accent",
                      )}
                    >
                      {c.title}
                    </button>
                    <button
                      onClick={() => void deleteConversation(c.id)}
                      aria-label={`Hapus ${c.title}`}
                      className="rounded-lg p-2 text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center gap-3 border-t border-sidebar-border px-4 py-3">
            {profile.data?.avatar_url ? (
              <img
                src={profile.data.avatar_url}
                alt=""
                width={36}
                height={36}
                loading="lazy"
                className="size-9 rounded-full object-cover"
              />
            ) : (
              <span className="vex-gradient-bg flex size-9 items-center justify-center rounded-full text-sm font-semibold text-primary-foreground">
                {firstName.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{profile.data?.full_name}</p>
              <p className="truncate text-xs text-muted-foreground">{profile.data?.email}</p>
            </div>
            <button
              onClick={() => {
                setSidebarOpen(false);
                navigate({ to: "/settings" });
              }}
              aria-label="Pengaturan"
              className="rounded-lg p-2 text-muted-foreground hover:text-foreground"
            >
              <Settings className="size-4.5" />
            </button>
            <button
              onClick={() => void signOut()}
              aria-label="Keluar"
              className="rounded-lg p-2 text-muted-foreground hover:text-destructive"
            >
              <LogOut className="size-4.5" />
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
