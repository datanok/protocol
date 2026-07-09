"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check as CheckIcon, Trash2 } from "lucide-react";
import { T } from "@/lib/tokens";

/**
 * Brutalist checkbox — square, 0px radius, ink-filled when checked.
 * Same on/off vocabulary as the dashboard habit pills.
 */
export function Check({
  checked,
  onToggle,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onToggle}
      className="pg-check"
    >
      <CheckIcon style={{ width: 12, height: 12 }} strokeWidth={3} />
    </button>
  );
}

/**
 * Two-step delete: first click arms ("Delete?"), second confirms.
 * Disarms itself after 2.5s. No modal — friction without interruption.
 */
export function ArmDelete({
  onDelete,
  what,
}: {
  onDelete: () => void;
  what: string;
}) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function handleClick() {
    if (armed) {
      if (timer.current) clearTimeout(timer.current);
      onDelete();
      return;
    }
    setArmed(true);
    timer.current = setTimeout(() => setArmed(false), 2500);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={armed ? `Confirm delete ${what}` : `Delete ${what}`}
      className={armed ? undefined : "pg-iconbtn pg-iconbtn-danger"}
      style={
        armed
          ? {
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "transparent",
              border: `1px solid ${T.negative}`,
              cursor: "pointer",
              color: T.negative,
              fontFamily: T.mono,
              fontSize: 9,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "3px 8px",
            }
          : undefined
      }
    >
      {armed ? "Delete?" : <Trash2 style={{ width: 13, height: 13 }} />}
    </button>
  );
}

/**
 * Shared block chrome: tonal panel, mono type label, hover-revealed actions.
 */
export function BlockShell({
  label,
  meta,
  onDelete,
  children,
}: {
  label: string;
  meta?: string;
  onDelete: () => void;
  children: ReactNode;
}) {
  return (
    <section
      className="pg-hoverable"
      style={{
        background: T.tint,
        padding: "14px 18px 18px",
        marginBottom: 14,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontFamily: T.mono,
            fontSize: 9.5,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: T.stone,
          }}
        >
          {label}
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          {meta && (
            <span
              style={{
                fontFamily: T.mono,
                fontSize: 10,
                letterSpacing: "0.06em",
                color: T.stone,
              }}
            >
              {meta}
            </span>
          )}
          <span className="pg-reveal">
            <ArmDelete onDelete={onDelete} what={`${label} block`} />
          </span>
        </span>
      </div>
      {children}
    </section>
  );
}
