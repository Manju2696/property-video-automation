import fs from "fs/promises";
import path from "path";
import { ROOM_TYPES, SEQUENCE_PRIORITY } from "./constants";

const PROMPT = `You are an expert real estate photo classifier. Analyze this property photo carefully and determine exactly what room, area, or view it shows.

CLASSIFICATION RULES:
- Front View: ONLY a wide exterior shot showing most/all of the house facade from the street, driveway, or front yard (garage, roof line, landscaping visible). Do NOT use Front View for porch/door close-ups or partial entry details.
- Living Room: sofas, TV area, fireplace, open seating area (not dining)
- Living Kitchen: open-concept space combining living/seating with kitchen, or a kitchenette adjacent to living area
- Kitchen: countertops, cabinets, stove, oven, refrigerator, sink, island (kitchen-only room)
- Kitchen Dining: kitchen open to dining table / eat-in kitchen
- Dining Room: dining table with chairs, formal or casual eating area
- Primary Bedroom: largest bedroom, usually with ensuite bathroom access or walk-in closet
- Bedroom: any bedroom that is not the primary
- Bathroom: toilet, shower, bathtub, vanity, sink, mirrors
- Office: desk, bookshelves, computer setup, study area
- Laundry: washer, dryer, laundry sink, utility room
- Hallway: corridors, staircases, foyer, covered porch, front door close-ups, entryway details that do not show the full house
- Backyard: rear exterior, patio, deck, garden, outdoor seating
- Pool: swimming pool, hot tub, pool area
- Garage: garage door, cars, storage, workshop (interior or close-up of garage only — full house with garage still visible = Front View)
- Aerial View: drone shot, bird's eye view of the property
- Other: anything that does not clearly fit the above categories

RESPONSE FORMAT:
Return ONLY a valid JSON object with no other text:
{"room_type": "exact room type from the list above", "confidence": 0.95}`;

const VALID = new Set<string>(ROOM_TYPES);
const CLASSIFY_TIMEOUT_MS = 25_000;

function mimeFor(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}

function normalizeRoomType(roomType: string) {
  const cleaned = roomType.trim();
  if (VALID.has(cleaned)) return cleaned;
  const match = ROOM_TYPES.find(
    (r) => r.toLowerCase() === cleaned.toLowerCase(),
  );
  return match ?? "Other";
}

function parseResult(text: string): { room_type: string; confidence: number } {
  const match = text.match(
    /\{\s*"room_type"\s*:\s*"([^"]+)"\s*,\s*"confidence"\s*:\s*([0-9.]+)\s*\}/i,
  );
  if (match) {
    return {
      room_type: normalizeRoomType(match[1]),
      confidence: Math.min(1, Math.max(0, Number(match[2]) || 0)),
    };
  }
  try {
    const json = JSON.parse(text);
    return {
      room_type: normalizeRoomType(String(json.room_type || "Other")),
      confidence: Math.min(1, Math.max(0, Number(json.confidence) || 0)),
    };
  } catch {
    return { room_type: "Other", confidence: 0 };
  }
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = CLASSIFY_TIMEOUT_MS,
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

const GEMINI_MODELS = [
  "gemini-3.6-flash",
  "gemini-2.5-flash",
  "gemini-1.5-flash",
];

async function readImageBytes(imagePath: string) {
  if (/^https?:\/\//i.test(imagePath)) {
    const res = await fetch(imagePath);
    if (!res.ok) throw new Error(`Failed to fetch image ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const mime =
      res.headers.get("content-type") ||
      mimeFor(imagePath.split("?")[0] || imagePath);
    return { bytes: buf, mime };
  }
  const bytes = await fs.readFile(imagePath);
  return { bytes, mime: mimeFor(imagePath) };
}

async function classifyWithGemini(imagePath: string) {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) return null;

  try {
    const { bytes, mime } = await readImageBytes(imagePath);
    const b64 = bytes.toString("base64");

    for (const model of GEMINI_MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const res = await fetchWithTimeout(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: PROMPT },
                { inline_data: { mime_type: mime, data: b64 } },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`Gemini classify failed (${model})`, errText.slice(0, 300));
        // Try next model on 404/not found
        if (res.status === 404) continue;
        return null;
      }

      const data = await res.json();
      const text =
        data?.candidates?.[0]?.content?.parts
          ?.map((p: { text?: string }) => p.text)
          .join("") || "";
      if (!text) continue;
      return parseResult(text);
    }
    return null;
  } catch (error) {
    console.error("Gemini classify error", error);
    return null;
  }
}

async function classifyWithAnthropic(imagePath: string) {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return null;

  try {
    const { bytes, mime } = await readImageBytes(imagePath);
    const b64 = bytes.toString("base64");

    const res = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 200,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mime, data: b64 },
              },
              { type: "text", text: PROMPT },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      console.error("Anthropic classify failed", await res.text());
      return null;
    }

    const data = await res.json();
    const text =
      data?.content?.map((c: { text?: string }) => c.text || "").join("") || "";
    return parseResult(text);
  } catch (error) {
    console.error("Anthropic classify error", error);
    return null;
  }
}

export async function classifyImage(imagePath: string) {
  const gemini = await classifyWithGemini(imagePath);
  if (gemini) return gemini;
  const anthropic = await classifyWithAnthropic(imagePath);
  if (anthropic) return anthropic;
  return { room_type: "Other", confidence: 0 };
}

/** Classify many photos with limited concurrency */
export async function classifyImages(
  imagePaths: string[],
  concurrency = 3,
): Promise<{ room_type: string; confidence: number }[]> {
  const results: { room_type: string; confidence: number }[] = new Array(
    imagePaths.length,
  );
  let next = 0;

  async function worker() {
    while (next < imagePaths.length) {
      const index = next++;
      results[index] = await classifyImage(imagePaths[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, imagePaths.length) }, () =>
      worker(),
    ),
  );
  return results;
}

export function sequencePriority(roomType: string | null | undefined) {
  return SEQUENCE_PRIORITY[roomType || "Other"] ?? 99;
}
