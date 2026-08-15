import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const DAILY_MESSAGE_LIMIT = 20;
export const DAILY_FILE_LIMIT = 5;

const AttachmentSchema = z.object({
  name: z.string().min(1),
  mime: z.string().min(1),
  data: z.string().min(1),
});

const SendSchema = z.object({
  conversationId: z.string().uuid().nullable().optional(),
  content: z.string().max(20000),
  attachments: z.array(AttachmentSchema).max(5).default([]),
});

const SettingsSchema = z.object({
  api_mode: z.enum(["default", "custom"]),
  primary_key: z.string().nullable(),
  backup_keys: z.array(z.string()).max(5),
});

export const getUsage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await context.supabase
      .from("daily_usage")
      .select("messages_used, files_used")
      .eq("user_id", context.userId)
      .eq("usage_date", today)
      .maybeSingle();
    return {
      messagesUsed: data?.messages_used ?? 0,
      filesUsed: data?.files_used ?? 0,
      messageLimit: DAILY_MESSAGE_LIMIT,
      fileLimit: DAILY_FILE_LIMIT,
    };
  });

export const getSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_settings")
      .select("api_mode, primary_key, backup_keys")
      .eq("user_id", context.userId)
      .maybeSingle();
    return {
      api_mode: (data?.api_mode ?? "default") as "default" | "custom",
      primary_key: (data?.primary_key ?? "") as string,
      backup_keys: ((data?.backup_keys as string[] | null) ?? []) as string[],
    };
  });

export const saveSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SettingsSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("user_settings").upsert(
      {
        user_id: context.userId,
        api_mode: data.api_mode,
        primary_key: data.primary_key,
        backup_keys: data.backup_keys.filter((k) => k.trim().length > 0),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SendSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { generateWithRotation, defaultKeys, QuotaExhaustedError } = await import(
      "./gemini.server"
    );
    const { generateWithLovable } = await import("./lovable-ai.server");

    if (!data.content.trim() && data.attachments.length === 0) {
      throw new Error("Pesan kosong.");
    }

    const { data: settings } = await supabase
      .from("user_settings")
      .select("api_mode, primary_key, backup_keys")
      .eq("user_id", userId)
      .maybeSingle();

    const mode = settings?.api_mode ?? "default";
    const today = new Date().toISOString().slice(0, 10);

    let usage = { messages_used: 0, files_used: 0 };
    if (mode === "default") {
      const { data: row } = await supabase
        .from("daily_usage")
        .select("messages_used, files_used")
        .eq("user_id", userId)
        .eq("usage_date", today)
        .maybeSingle();
      usage = row ?? usage;
      if (usage.messages_used >= DAILY_MESSAGE_LIMIT) {
        throw new Error(
          "Kuota harian pesan (20) sudah habis. Coba lagi besok atau pakai API key sendiri di Pengaturan.",
        );
      }
      if (usage.files_used + data.attachments.length > DAILY_FILE_LIMIT) {
        throw new Error(
          "Kuota harian file (5) sudah habis. Coba lagi besok atau pakai API key sendiri di Pengaturan.",
        );
      }
    }

    // Resolve conversation
    let conversationId = data.conversationId ?? null;
    if (!conversationId) {
      const title =
        (data.content.trim() || data.attachments[0]?.name || "Percakapan baru").slice(0, 60);
      const { data: conv, error } = await supabase
        .from("conversations")
        .insert({ user_id: userId, title })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      conversationId = conv.id;
    }

    // History
    const { data: history } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(40);

    const contents = (history ?? []).map((m) => ({
      role: m.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: m.content }],
    }));

    const parts: Array<
      { text: string } | { inline_data: { mime_type: string; data: string } }
    > = [];
    for (const att of data.attachments) {
      parts.push({ inline_data: { mime_type: att.mime, data: att.data } });
    }
    if (data.content.trim()) parts.push({ text: data.content });
    if (parts.length === 0) parts.push({ text: "Tolong jelaskan file terlampir." });
    contents.push({ role: "user", parts } as (typeof contents)[number]);

    const keys =
      mode === "custom"
        ? [settings?.primary_key ?? "", ...(((settings?.backup_keys as string[]) ?? []))]
        : defaultKeys();

    let reply: string;
    try {
      const usable = keys.filter(Boolean);
      if (mode === "custom" && usable.length > 0) {
        try {
          reply = await generateWithRotation(usable, contents);
        } catch (err) {
          if (!(err instanceof QuotaExhaustedError)) throw err;
          reply = await generateWithLovable(contents);
        }
      } else {
        try {
          reply = await generateWithLovable(contents);
        } catch (err) {
          if (usable.length === 0) throw err;
          reply = await generateWithRotation(usable, contents);
        }
      }
    } catch (e) {
      if (e instanceof QuotaExhaustedError) {
        throw new Error(
          mode === "custom"
            ? "Semua API key kamu sedang kena limit. Tambahkan key cadangan di Pengaturan."
            : "Layanan sedang sibuk. Coba lagi sebentar lagi.",
        );
      }
      throw e;
    }

    const attachmentMeta = data.attachments.map((a) => ({ name: a.name, mime: a.mime }));

    const { data: inserted, error: insErr } = await supabase
      .from("messages")
      .insert([
        {
          conversation_id: conversationId,
          user_id: userId,
          role: "user",
          content: data.content,
          attachments: attachmentMeta,
        },
        {
          conversation_id: conversationId,
          user_id: userId,
          role: "assistant",
          content: reply,
          attachments: [],
        },
      ])
      .select("id, role, content, attachments, created_at");
    if (insErr) throw new Error(insErr.message);

    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);

    if (mode === "default") {
      await supabase.from("daily_usage").upsert(
        {
          user_id: userId,
          usage_date: today,
          messages_used: usage.messages_used + 1,
          files_used: usage.files_used + data.attachments.length,
        },
        { onConflict: "user_id,usage_date" },
      );
    }

    return { conversationId, messages: inserted ?? [] };
  });
