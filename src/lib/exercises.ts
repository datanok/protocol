"use client";

import { useEffect, useState } from "react";
import type { ExerciseEntry } from "@/types/schema";

// Exercise catalog metadata (name/bodyPart/equipment/target) is vendored from
// hasaneyldrm/exercises-dataset (MIT), itself a redistribution of ExerciseDB v1
// text metadata, at public/data/exercises.json. No images/GIFs are included —
// those are (c) Gym visual and require separate licensing from the upstream
// project; only the MIT-licensed text fields are used here.

export type ExerciseCatalogEntry = {
  id: string;
  name: string;
  bodyPart: string;
  equipment: string;
  target: string;
};

export function exerciseName(entry: ExerciseEntry): string {
  return typeof entry === "string" ? entry : entry.name;
}

let catalogCache: ExerciseCatalogEntry[] | null = null;
let catalogInflight: Promise<ExerciseCatalogEntry[]> | null = null;

export function fetchExerciseCatalog(): Promise<ExerciseCatalogEntry[]> {
  if (catalogCache) return Promise.resolve(catalogCache);
  if (!catalogInflight) {
    catalogInflight = fetch("/data/exercises.json")
      .then((res) => {
        if (!res.ok)
          throw new Error(`Failed to load exercise catalog: ${res.status}`);
        return res.json() as Promise<ExerciseCatalogEntry[]>;
      })
      .then((data) => {
        catalogCache = data;
        return data;
      })
      .catch((err) => {
        catalogInflight = null; // allow retry on next call
        throw err;
      });
  }
  return catalogInflight;
}

export function useExerciseCatalog(): ExerciseCatalogEntry[] {
  const [catalog, setCatalog] = useState<ExerciseCatalogEntry[]>(
    catalogCache ?? [],
  );
  useEffect(() => {
    let cancelled = false;
    fetchExerciseCatalog()
      .then((data) => {
        if (!cancelled) setCatalog(data);
      })
      .catch(() => {
        if (!cancelled) setCatalog([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return catalog;
}

export function searchExercises(
  catalog: ExerciseCatalogEntry[],
  query: string,
  limit = 8,
): ExerciseCatalogEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return catalog
    .filter((e) => e.name.toLowerCase().includes(q))
    .slice(0, limit);
}
