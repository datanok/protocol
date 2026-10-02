"use client";

import { useState } from "react";
import { getExerciseGif } from "@/lib/exerciseGifs";
import { T } from "@/lib/tokens";

export function ExerciseGifThumb({ label }: { label: string }) {
  const [expanded, setExpanded] = useState(false);
  const src = getExerciseGif(label);
  if (!src) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setExpanded(true)}
        title="View form"
        style={{
          flexShrink: 0,
          width: 28,
          height: 28,
          padding: 0,
          border: `1px solid ${T.rule}`,
          background: `var(--protocol-tint) url(${src}) center/cover`,
          cursor: "pointer",
        }}
      />
      {expanded && (
        <div
          onClick={() => setExpanded(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: T.surface,
              border: `1px solid ${T.rule}`,
              maxWidth: 420,
              width: "100%",
            }}
          >
            <img
              src={src}
              alt={label}
              style={{ width: "100%", display: "block" }}
            />
            <div
              style={{
                padding: "10px 14px",
                borderTop: `1px solid ${T.rule}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <span
                style={{
                  fontFamily: T.mono,
                  fontSize: 10,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: T.stone,
                }}
              >
                {label}
              </span>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: T.mono,
                  fontSize: 10,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: T.stone,
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
