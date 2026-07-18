"use server";

import { createPlan } from "./planActions";
import { createPagesFromAI } from "./pageActions";
import { SCHEMA_PROMPT } from "@/lib/schemaPrompt";

type ProviderResult = { ok: true; text: string } | { ok: false; error: string };

async function callGemini(userInput: string): Promise<ProviderResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey)
    return { ok: false, error: "Gemini generation is not configured." };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SCHEMA_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: userInput }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
      }),
    },
  );

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    return {
      ok: false,
      error:
        body?.error?.message ??
        "AI generation failed. Check your API key or try again.",
    };
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) return { ok: false, error: "AI returned no content. Try again." };
  return { ok: true, text: raw };
}

async function callClaude(userInput: string): Promise<ProviderResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey)
    return { ok: false, error: "Claude generation is not configured." };

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      temperature: 0.7,
      system: SCHEMA_PROMPT,
      messages: [{ role: "user", content: userInput }],
    }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    return {
      ok: false,
      error:
        body?.error?.message ??
        "AI generation failed. Check your API key or try again.",
    };
  }

  const data = (await response.json()) as {
    content?: Array<{ text?: string }>;
  };
  const raw = data?.content?.[0]?.text;
  if (!raw) return { ok: false, error: "AI returned no content. Try again." };
  return { ok: true, text: raw };
}

async function persistPlanFromRaw(
  userId: string,
  raw: string,
  accessToken: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  // Strip markdown fences and trim to last closing brace
  let cleaned = raw.trim();
  if (cleaned.startsWith("```json"))
    cleaned = cleaned.replace(/^```json\n?/, "");
  if (cleaned.startsWith("```")) cleaned = cleaned.replace(/^```\n?/, "");
  if (cleaned.endsWith("```")) cleaned = cleaned.replace(/```$/, "");
  cleaned = cleaned.replace(/\s*[\\\s]+$/, "").trim();
  const lastBrace = cleaned.lastIndexOf("}");
  if (lastBrace !== -1) cleaned = cleaned.slice(0, lastBrace + 1);

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned);
  } catch (parseErr) {
    console.log(
      `[generatePlan] JSON.parse failed: ${parseErr instanceof Error ? parseErr.message : parseErr}\n` +
        `[generatePlan] cleaned tail (last 300 chars):\n${cleaned.slice(-300)}`,
    );
    return {
      ok: false,
      error: "Could not parse the generated plan. Try rephrasing your goals.",
    };
  }

  await createPlan(userId, parsed);

  if (Array.isArray(parsed.pages) && parsed.pages.length > 0) {
    await createPagesFromAI(
      userId,
      accessToken,
      parsed.pages as Parameters<typeof createPagesFromAI>[2],
    ).catch(() => {
      // Best-effort — a pages-creation failure should not fail plan generation.
    });
  }

  return { ok: true };
}

export async function generatePlan(
  userId: string,
  userInput: string,
  accessToken: string,
  provider: "gemini" | "claude" = "gemini",
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const result =
      provider === "claude"
        ? await callClaude(userInput)
        : await callGemini(userInput);
    if (!result.ok) return result;
    console.log(
      `[generatePlan] ${provider} raw output (${result.text.length} chars):\n${result.text}`,
    );
    return await persistPlanFromRaw(userId, result.text, accessToken);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return { ok: false, error: message };
  }
}

export async function importPlan(
  userId: string,
  rawText: string,
  accessToken: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    return await persistPlanFromRaw(userId, rawText, accessToken);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return { ok: false, error: message };
  }
}
