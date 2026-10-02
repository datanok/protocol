"use client";

import { useEffect, useState, useMemo } from "react";

// Exercise form-demo images, fetched at runtime from yuhonas/free-exercise-db
// (Unlicense / public domain) via jsdelivr — https://github.com/yuhonas/free-exercise-db.
// Unlike the ExerciseDB catalog in exercises.ts, this dataset's images are public
// domain, so they can be shown directly without vendoring/licensing concerns.
// Each exercise has two still frames (start/end position); the UI animates
// between them. Matching a plan's free-text exercise label against this
// dataset is fuzzy, so matches are confidence-gated and the matched exercise's
// real name is shown alongside the plan's label — if it looks wrong, it is.

const DATASET_URL =
  "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/dist/exercises.json";
const IMAGE_BASE =
  "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/";

export type FreeExercise = {
  id: string;
  name: string;
  images: string[];
};

let cache: FreeExercise[] | null = null;
let inflight: Promise<FreeExercise[]> | null = null;

function fetchDataset(): Promise<FreeExercise[]> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = fetch(DATASET_URL)
      .then((res) => {
        if (!res.ok)
          throw new Error(`Failed to load exercise dataset: ${res.status}`);
        return res.json() as Promise<FreeExercise[]>;
      })
      .then((data) => {
        cache = data;
        return data;
      })
      .catch((err) => {
        inflight = null;
        throw err;
      });
  }
  return inflight;
}

function useFreeExerciseDataset(): FreeExercise[] {
  const [data, setData] = useState<FreeExercise[]>(cache ?? []);
  useEffect(() => {
    let cancelled = false;
    fetchDataset()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setData([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return data;
}

// ─── matching ───────────────────────────────────────────────────────────────

const STOPWORDS = new Set([
  "or",
  "a",
  "an",
  "the",
  "to",
  "of",
  "with",
  "off",
  "on",
  "and",
  "bench",
  "angled",
]);

// Collapse the dataset's inconsistent "push-ups" / "push ups" / "pushups"
// spellings to one canonical form before tokenizing, for this whole family.
const UP_FAMILY = /\b(push|pull|sit|step|chin|dip)[\s-]*up(s)?\b/gi;

function canonicalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ") // strip parenthetical asides
    .replace(UP_FAMILY, (_m, verb, plural) => `${verb}up${plural ?? ""}`)
    .replace(/[_-]/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(s: string): string[] {
  return canonicalize(s)
    .split(" ")
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

/**
 * Exercise labels in a workout split carry their prescription, e.g.
 * "Flat Dumbbell Bench Press — 4×12-15, rest 60s". Strip that off first.
 */
export function baseExerciseName(label: string): string {
  return label.split(/[—–-]\s*\d/)[0].trim();
}

const MIN_COVERAGE = 0.75; // fraction of query tokens that must appear in the candidate
const EXTRA_TOKEN_PENALTY = 0.08; // per unmatched candidate token, tie-break toward tighter matches

function findBestMatch(
  label: string,
  dataset: FreeExercise[],
): FreeExercise | null {
  const queryTokens = tokenize(baseExerciseName(label));
  if (queryTokens.length === 0 || dataset.length === 0) return null;

  let best: FreeExercise | null = null;
  let bestScore = 0;

  for (const entry of dataset) {
    if (!entry.images || entry.images.length < 2) continue;
    const candidateTokens = tokenize(entry.name);
    const candidateSet = new Set(candidateTokens);
    const matched = queryTokens.filter((t) => candidateSet.has(t)).length;
    const coverage = matched / queryTokens.length;
    if (coverage < MIN_COVERAGE) continue;

    const extra = candidateTokens.length - matched;
    const score = coverage - extra * EXTRA_TOKEN_PENALTY;
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  return best;
}

export type ExerciseGifMatch = {
  matchedName: string;
  frames: [string, string];
};

export function useExerciseGif(label: string): ExerciseGifMatch | null {
  const dataset = useFreeExerciseDataset();
  return useMemo(() => {
    const match = findBestMatch(label, dataset);
    if (!match) return null;
    return {
      matchedName: match.name,
      frames: [IMAGE_BASE + match.images[0], IMAGE_BASE + match.images[1]],
    };
  }, [label, dataset]);
}
