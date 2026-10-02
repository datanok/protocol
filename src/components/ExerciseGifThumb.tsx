"use client";

import { useEffect, useState } from "react";
import { useExerciseGif } from "@/lib/exerciseGifs";
import { T } from "@/lib/tokens";

function AnimatedFrames({
  frames,
  style,
}: {
  frames: [string, string];
  style: React.CSSProperties;
}) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v === 0 ? 1 : 0)), 650);
    return () => clearInterval(id);
  }, []);
  return <img src={frames[i]} alt="" style={style} />;
}

export function ExerciseGifThumb({ label }: { label: string }) {
  const [expanded, setExpanded] = useState(false);
  const match = useExerciseGif(label);
  if (!match) return null;

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
          background: `var(--protocol-tint) url(${match.frames[0]}) center/cover`,
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
            <AnimatedFrames
              frames={match.frames}
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
                {match.matchedName.toLowerCase() !== label.toLowerCase() && (
                  <>
                    {" "}
                    <span style={{ color: T.accent }}>
                      — closest match: {match.matchedName}
                    </span>
                  </>
                )}
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
                  flexShrink: 0,
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
