"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { TrackerBlockData } from "@/types/schema";
import { T } from "@/lib/tokens";

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
    <div
      style={{ border: `1px solid ${T.rule}`, padding: 16, marginBottom: 12 }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontFamily: T.mono,
            fontSize: 9,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: T.stone,
          }}
        >
          Tracker
        </span>
        <button
          onClick={onDelete}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: T.stone,
          }}
        >
          <Trash2 style={{ width: 12, height: 12 }} />
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          value={block.label}
          onChange={(e) => onChange({ ...block, label: e.target.value })}
          placeholder="Label (e.g. Practice time)"
          style={{
            flex: 2,
            background: T.tint,
            border: `1px solid ${T.rule}`,
            outline: "none",
            padding: "6px 10px",
            fontFamily: T.sans,
            fontSize: 12,
            color: T.ink,
            boxSizing: "border-box",
          }}
        />
        <input
          value={block.unit}
          onChange={(e) => onChange({ ...block, unit: e.target.value })}
          placeholder="Unit (e.g. minutes)"
          style={{
            flex: 1,
            background: T.tint,
            border: `1px solid ${T.rule}`,
            outline: "none",
            padding: "6px 10px",
            fontFamily: T.sans,
            fontSize: 12,
            color: T.ink,
            boxSizing: "border-box",
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{
            background: T.tint,
            border: `1px solid ${T.rule}`,
            outline: "none",
            padding: "6px 10px",
            fontFamily: T.mono,
            fontSize: 11,
            color: T.ink,
          }}
        />
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={block.unit || "value"}
          style={{
            width: 100,
            background: T.tint,
            border: `1px solid ${T.rule}`,
            outline: "none",
            padding: "6px 10px",
            fontFamily: T.mono,
            fontSize: 11,
            color: T.ink,
            boxSizing: "border-box",
          }}
        />
        <button
          onClick={addEntry}
          style={{
            background: "none",
            border: `1px solid ${T.rule}`,
            cursor: "pointer",
            color: T.stone,
            padding: "0 14px",
            fontFamily: T.mono,
            fontSize: 10,
            textTransform: "uppercase",
          }}
        >
          Log
        </button>
      </div>

      {sortedEntries.length === 0 ? (
        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.stone }}>
          No entries yet.
        </div>
      ) : (
        <div>
          {sortedEntries.slice(0, 10).map((entry) => (
            <div
              key={entry.date}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "4px 0",
                borderBottom: `1px solid ${T.rule}`,
              }}
            >
              <span
                style={{ fontFamily: T.mono, fontSize: 11, color: T.stone }}
              >
                {entry.date}
              </span>
              <span style={{ fontFamily: T.mono, fontSize: 12, color: T.ink }}>
                {entry.value} {block.unit}
              </span>
              <button
                onClick={() => removeEntry(entry.date)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: T.stone,
                  fontSize: 11,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
