"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { TrackerBlockData } from "@/types/schema";
import { T } from "@/lib/tokens";
import { BlockShell } from "./blockUi";

function toYmd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function TrackerBlockView({
  block,
  onChange,
  onDelete,
}: {
  block: TrackerBlockData;
  onChange: (next: TrackerBlockData) => void;
  onDelete: () => void;
}) {
  const [date, setDate] = useState(toYmd(new Date()));
  const [value, setValue] = useState("");

  const sortedEntries = [...block.entries].sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  function addEntry() {
    const num = parseFloat(value);
    if (Number.isNaN(num)) return;
    const entries = block.entries.filter((e) => e.date !== date);
    entries.push({ date, value: num });
    onChange({ ...block, entries });
    setValue("");
  }

  function removeEntry(entryDate: string) {
    onChange({
      ...block,
      entries: block.entries.filter((e) => e.date !== entryDate),
    });
  }

  return (
    <BlockShell
      label="Tracker"
      meta={
        block.entries.length > 0
          ? `${block.entries.length} ${block.entries.length === 1 ? "entry" : "entries"}`
          : undefined
      }
      onDelete={onDelete}
    >
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <input
          value={block.label}
          onChange={(e) => onChange({ ...block, label: e.target.value })}
          placeholder="Label (e.g. Practice time)"
          aria-label="Tracker label"
          className="pg-input"
          style={{
            flex: 2,
            background: T.surface,
            padding: "7px 10px",
            fontFamily: T.sans,
            fontSize: 12.5,
          }}
        />
        <input
          value={block.unit}
          onChange={(e) => onChange({ ...block, unit: e.target.value })}
          placeholder="Unit (e.g. minutes)"
          aria-label="Tracker unit"
          className="pg-input"
          style={{
            flex: 1,
            background: T.surface,
            padding: "7px 10px",
            fontFamily: T.sans,
            fontSize: 12.5,
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          aria-label="Entry date"
          className="pg-input"
          style={{
            background: T.surface,
            padding: "7px 10px",
            fontFamily: T.mono,
            fontSize: 11,
          }}
        />
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addEntry();
            }
          }}
          placeholder={block.unit || "value"}
          aria-label="Entry value"
          className="pg-input"
          style={{
            width: 100,
            background: T.surface,
            padding: "7px 10px",
            fontFamily: T.mono,
            fontSize: 11,
          }}
        />
        <button
          type="button"
          onClick={addEntry}
          disabled={value.trim() === ""}
          style={{
            padding: "0 16px",
            background: value.trim() !== "" ? T.ink : "transparent",
            color: value.trim() !== "" ? T.surface : T.stone,
            border: `1px solid ${value.trim() !== "" ? T.ink : T.rule}`,
            cursor: value.trim() !== "" ? "pointer" : "default",
            fontFamily: T.mono,
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            transition: "background 0.12s ease-out, color 0.12s ease-out",
          }}
        >
          Log
        </button>
      </div>

      {sortedEntries.length === 0 ? (
        <div
          style={{
            fontFamily: T.serifD,
            fontSize: 14,
            fontStyle: "italic",
            color: T.stone,
          }}
        >
          No entries yet — log the first one above.
        </div>
      ) : (
        <div>
          {sortedEntries.slice(0, 10).map((entry) => (
            <div
              key={entry.date}
              className="pg-hoverable"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "6px 0",
                borderBottom: `1px solid ${T.rule}`,
              }}
            >
              <span
                style={{
                  fontFamily: T.mono,
                  fontSize: 11,
                  color: T.stone,
                  width: 90,
                  flexShrink: 0,
                }}
              >
                {entry.date}
              </span>
              <span
                style={{
                  flex: 1,
                  fontFamily: T.mono,
                  fontSize: 12.5,
                  color: T.ink,
                  textAlign: "right",
                }}
              >
                {entry.value}
                {block.unit && (
                  <span style={{ color: T.stone }}> {block.unit}</span>
                )}
              </span>
              <span className="pg-reveal">
                <button
                  type="button"
                  onClick={() => removeEntry(entry.date)}
                  aria-label={`Remove entry for ${entry.date}`}
                  className="pg-iconbtn pg-iconbtn-danger"
                >
                  <X style={{ width: 12, height: 12 }} />
                </button>
              </span>
            </div>
          ))}
          {sortedEntries.length > 10 && (
            <div
              style={{
                fontFamily: T.mono,
                fontSize: 10,
                color: T.stone,
                paddingTop: 8,
                letterSpacing: "0.06em",
              }}
            >
              + {sortedEntries.length - 10} older{" "}
              {sortedEntries.length - 10 === 1 ? "entry" : "entries"}
            </div>
          )}
        </div>
      )}
    </BlockShell>
  );
}
