"use server";

import { createPlan } from "./planActions";
import { createPagesFromAI } from "./pageActions";

const SCHEMA_PROMPT = `You are generating a structured protocol configuration for a web application called "Protocol".

Your task is to convert the user's goals into a STRICT JSON object that follows the exact schema defined below.

---
## ⚠️ CRITICAL RULES
* Output ONLY valid JSON. No markdown, no code blocks, no extra text.
* All fields must be present except "pages", which is optional — omit it entirely if not needed. Do NOT omit any other keys.
* Use consistent kebab-case IDs (e.g. "barre-chords", "squat-form", "chapter-1").
* Keep values realistic, specific, and actionable.
* module "order" values start at 1 and increment by 1. Never use 0.
* For workout splits: each item in a day's array must be a SINGLE EXERCISE with its prescription (e.g. "Pull-ups — 4×8, rest 90s"). NEVER put session titles, durations, or day descriptions as the first array item — those go in "dayFocus" instead.
* Rest days and active recovery days must have an EMPTY array [] in "split". Use "dayFocus" to label them (e.g. "Active Recovery", "Full Rest").
* "focus" must be 1–2 sentences max. No bullet points, no multi-paragraph text.
* If the plan includes a skill module (guitar, coding, language, etc.), do NOT add that skill as an exercise or activity inside the workout split. The skill module and any related habit handle it — duplicating it in the split creates conflicts.
* Habits track DAILY behaviours. Do not add a habit for something already fully tracked by a module (e.g. no "practice guitar" habit if there is a skill module for guitar — unless the user explicitly wants a daily checkbox separate from session logging).
* If the user describes something they want to track freeform (a running log of practice time, pages read, money saved — with no structured curriculum), add a "pages" entry for it instead of a skill/study module. If they describe wanting a structured curriculum or progression (lessons, techniques, milestones to unlock), use a skill or study module as already documented. Do not create both a page and a module for the same thing.

---
## 📦 REQUIRED JSON SCHEMA

{
  "metadata": {
    "title": "short plan name, 2-4 words, e.g. 'Summer Shred', 'Year of Guitar'",
    "goal": "one-sentence primary goal",
    "level": "beginner | intermediate | advanced",
    "version": 2,
    "planType": "describe the plan type, e.g. workout+skill, study-only, full-stack"
  },
  "habits": [
    {
      "id": "unique-slug",
      "name": "Habit Name",
      "category": "fitness | skill | lifestyle | study | health"
    }
  ],
  "modules": [
    {
      "id": "workout-main",
      "type": "workout",
      "title": "Training Protocol",
      "order": 1,
      "data": {
        "focus": "One or two sentences describing the overall training approach and goal.",
        "dayFocus": {
          "Monday": "PULL — 35 min",
          "Tuesday": "PUSH — 35 min",
          "Wednesday": "LEGS + CORE — 40 min",
          "Thursday": "Active Recovery",
          "Friday": "UPPER — 50 min",
          "Saturday": "Full Rest",
          "Sunday": ""
        },
        "split": {
          "Monday": ["Exercise Name — sets×reps, rest Xs", "Exercise Name — sets×reps, rest Xs"],
          "Tuesday": [],
          "Wednesday": ["Exercise Name — sets×reps, rest Xs"],
          "Thursday": [],
          "Friday": ["Exercise Name — sets×reps, rest Xs", "Exercise Name — sets×reps, rest Xs"],
          "Saturday": [],
          "Sunday": []
        }
      }
    },
    {
      "id": "skill-main",
      "type": "skill",
      "title": "Skill Development",
      "order": 2,
      "data": {
        "subject": "Subject name",
        "nodes": [
          { "id": "node-slug", "title": "Node title", "type": "milestone", "metric": { "type": "none" } }
        ]
      }
    }
  ],
  "pages": [
    {
      "title": "Guitar Practice",
      "icon": "🎸",
      "blocks": [
        {
          "type": "tracker",
          "label": "Practice time",
          "unit": "minutes",
          "entries": []
        }
      ]
    }
  ]
}`;

export async function generatePlan(
  userId: string,
  userInput: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey)
      return { ok: false, error: "AI generation is not configured." };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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
      return {
        ok: false,
        error: "AI generation failed. Check your API key or try again.",
      };
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!raw) return { ok: false, error: "AI returned no content. Try again." };

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
    } catch {
      return {
        ok: false,
        error: "Could not parse the generated plan. Try rephrasing your goals.",
      };
    }

    await createPlan(userId, parsed);

    if (Array.isArray(parsed.pages) && parsed.pages.length > 0) {
      await createPagesFromAI(
        userId,
        parsed.pages as Parameters<typeof createPagesFromAI>[1],
      ).catch(() => {
        // Best-effort — a pages-creation failure should not fail plan generation.
      });
    }

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return { ok: false, error: message };
  }
}
