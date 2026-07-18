export const SCHEMA_PROMPT = `You are generating a structured protocol configuration for a web application called "Protocol".

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
## 📄 PAGES — FREEFORM BLOCKS (optional)

A page is a named container of typed blocks. Use pages for anything worth tracking that has no curriculum or schedule. Each page has:
* "title" — short and concrete (e.g. "Reading Log", "Savings", "Knee Rehab").
* "icon" — ONE emoji that matches the topic, or omit the field.
* "blocks" — 1 to 4 blocks. Choose block types by what the data IS:

1. "text" — reference notes, instructions, reminders the user stated.
   { "type": "text", "content": "Full sentences. Keep under 80 words." }

2. "checklist" — one-off or recurring to-dos the user listed.
   { "type": "checklist", "items": [
     { "id": "kebab-slug", "label": "Concrete action", "done": false }
   ] }
   Every item needs a UNIQUE kebab-case "id" and "done": false. 3–8 items.

3. "table" — structured reference data with repeating fields (a book list,
   a rehab exercise protocol, a budget breakdown).
   { "type": "table", "columns": ["Col A", "Col B"], "rows": [["a1", "b1"], ["a2", "b2"]] }
   Every row array must have EXACTLY as many strings as "columns". 2–4 columns.
   Pre-fill rows only with data the user actually stated; otherwise use [].

4. "tracker" — ONE number logged over time (minutes, pages, ₹/$, kg, ml).
   { "type": "tracker", "label": "What is measured", "unit": "minutes", "entries": [] }
   "entries" is ALWAYS []. The user logs values later — never invent history.
   Trackers also appear on the user's dashboard for daily logging.

Rules:
* Include "pages" ONLY when the user's goals call for freeform tracking. Omit the field entirely otherwise.
* 1–3 pages maximum. Prefer one page with several blocks over many thin pages.
* A tracker measures one thing — split "log practice time and money saved" into two tracker blocks (or two pages if unrelated).

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
        },
        {
          "type": "checklist",
          "items": [
            { "id": "restring-guitar", "label": "Restring the acoustic", "done": false },
            { "id": "print-chord-chart", "label": "Print open-chord chart", "done": false }
          ]
        },
        {
          "type": "table",
          "columns": ["Song", "Key", "Status"],
          "rows": [
            ["Wonderwall", "Em", "Learning"],
            ["Horse With No Name", "Em", "Next"]
          ]
        },
        {
          "type": "text",
          "content": "Practice slow first. Accuracy before speed — increase tempo only after three clean passes."
        }
      ]
    }
  ]
}`;
