"use client";

import { useState } from "react";
import type { ExerciseEntry } from "@/types/schema";
import {
  exerciseName,
  useExerciseCatalog,
  searchExercises,
} from "@/lib/exercises";
import { T } from "@/lib/tokens";

export function ExerciseComboInput({
  value,
  onChange,
}: {
  value: ExerciseEntry;
  onChange: (v: ExerciseEntry) => void;
}) {
  const catalog = useExerciseCatalog();
  const [open, setOpen] = useState(false);
  const text = exerciseName(value);
  const matches = open ? searchExercises(catalog, text) : [];

  return (
    <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
      <input
        value={text}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 100)}
        placeholder="Exercise…"
        style={{
          width: "100%",
          background: "transparent",
          border: `1px solid ${T.rule}`,
          outline: "none",
          padding: "3px 6px",
          fontFamily: T.mono,
          fontSize: 9,
          color: T.ink,
          boxSizing: "border-box",
        }}
        onFocusCapture={(e) =>
          ((e.target as HTMLInputElement).style.borderColor = T.accent)
        }
        onBlurCapture={(e) =>
          ((e.target as HTMLInputElement).style.borderColor = T.rule)
        }
      />
      {open && matches.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: "auto",
            minWidth: 220,
            zIndex: 10,
            background: T.surface,
            border: `1px solid ${T.rule}`,
            maxHeight: 160,
            overflowY: "auto",
          }}
        >
          {matches.map((m) => (
            <div
              key={m.id}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange({
                  name: m.name,
                  bodyPart: m.bodyPart,
                  equipment: m.equipment,
                  exerciseId: m.id,
                });
                setOpen(false);
              }}
              style={{
                padding: "4px 6px",
                cursor: "pointer",
                fontFamily: T.mono,
                fontSize: 9,
                color: T.ink,
                display: "flex",
                justifyContent: "space-between",
                gap: 6,
              }}
            >
              <span>{m.name}</span>
              <span style={{ color: T.stone, textTransform: "uppercase" }}>
                {m.bodyPart}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
