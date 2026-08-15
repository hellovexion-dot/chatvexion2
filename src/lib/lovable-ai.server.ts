import type { GeminiTurn } from "./gemini.server";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

const SYSTEM =
  "Kamu adalah Vexion AI, asisten AI yang ramah, cerdas, dan menjawab dengan bahasa yang sama dengan pengguna (default Bahasa Indonesia). Jawab ringkas namun lengkap, gunakan markdown bila membantu.";

export async function generateWithLovable(contents: GeminiTurn[]) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("LOVABLE_API_KEY tidak tersedia.");

  const messages = [
    { role: "system", content: SYSTEM },
    ...contents.map((turn) => ({
      role: turn.role === "model" ? "assistant" : "user",
      content: turn.parts.map((p) =>
        "text" in p
          ? { type: "text", text: p.text }
          : {
              type: "image_url",
              image_url: { url: `data:${p.inline_data.mime_type};base64,${p.inline_data.data}` },
            },
      ),
    })),
  ];

  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: MODEL, messages }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Lovable AI ${res.status}: ${body.slice(0, 300)}`);
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return json.choices?.[0]?.message?.content ?? "";
}
