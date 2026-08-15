export type GeminiPart =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } };

export type GeminiTurn = { role: "user" | "model"; parts: GeminiPart[] };

const MODEL = "gemini-2.5-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export class QuotaExhaustedError extends Error {}

function isQuotaError(status: number) {
  return status === 429 || status === 403;
}

async function callOnce(key: string, contents: GeminiTurn[]) {
  const res = await fetch(`${ENDPOINT}?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents,
      systemInstruction: {
        parts: [
          {
            text: "Kamu adalah Vexion AI, asisten AI yang ramah, cerdas, dan menjawab dengan bahasa yang sama dengan pengguna (default Bahasa Indonesia). Jawab ringkas namun lengkap, gunakan markdown bila membantu.",
          },
        ],
      },
      generationConfig: { temperature: 0.8 },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { ok: false as const, status: res.status, body };
  }

  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text =
    json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  return { ok: true as const, text };
}

/**
 * Tries each key in order, rotating to the next one whenever the active key is
 * rate limited or out of quota.
 */
export async function generateWithRotation(keys: string[], contents: GeminiTurn[]) {
  const usable = keys.map((k) => k.trim()).filter(Boolean);
  if (usable.length === 0) throw new Error("Tidak ada API key yang tersedia.");

  let lastError = "";
  for (const key of usable) {
    try {
      const result = await callOnce(key, contents);
      if (result.ok) return result.text;
      lastError = `${result.status}: ${result.body.slice(0, 300)}`;
      if (!isQuotaError(result.status) && result.status < 500) {
        // Invalid key / bad request — still try the next key.
        continue;
      }
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
    }
  }
  throw new QuotaExhaustedError(
    `Semua API key gagal dipakai. Detail terakhir: ${lastError}`,
  );
}

export function defaultKeys(): string[] {
  return (process.env["VEXION_GEMINI_KEYS"] ?? "")
    .split(/[,\s]+/)
    .map((k) => k.trim())
    .filter(Boolean);
}