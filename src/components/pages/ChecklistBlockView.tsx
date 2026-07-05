"use client";

import { useState } from "react";
import { Trash2, Plus, X } from "lucide-react";
import type { ChecklistBlock } from "@/types/schema";
import { T } from "@/lib/tokens";

export default function ChecklistBlockView({
  block,
  onChange,
  onDelete,
}: {
  block: ChecklistBlock;
  onChange: (next: ChecklistBlock) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState("");

  function addItem() {
    const label = draft.trim();
    if (!label) return;
    onChange({
      ...block,
      items: [...block.items, { id: crypto.randomUUID(), label, done: false }],
    });
    setDraft("");
  }

  function toggleItem(id: string) {
    onChange({
      ...block,
      items: block.items.map((i) =>
        i.id === id ? { ...i, done: !i.done } : i,
      ),
    });
  }

  function removeItem(id: string) {
    onChange({ ...block, items: block.items.filter((i) => i.id !== id) });
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
          Checklist
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

      {block.items.map((item) => (
        <div
          key={item.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "6px 0",
          }}
        >
          <input
            type="checkbox"
            checked={item.done}
            onChange={() => toggleItem(item.id)}
            style={{ width: 14, height: 14, flexShrink: 0 }}
          />
          <span
            style={{
              flex: 1,
              fontFamily: T.sans,
              fontSize: 13,
              color: item.done ? T.stone : T.ink,
              textDecoration: item.done ? "line-through" : "none",
            }}
          >
            {item.label}
          </span>
          <button
            onClick={() => removeItem(item.id)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: T.stone,
            }}
          >
            <X style={{ width: 12, height: 12 }} />
          </button>
        </div>
      ))}

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addItem();
          }}
          placeholder="Add item…"
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
        <button
          onClick={addItem}
          style={{
            background: "none",
            border: `1px solid ${T.rule}`,
            cursor: "pointer",
            color: T.stone,
            padding: "0 10px",
          }}
        >
          <Plus style={{ width: 12, height: 12 }} />
        </button>
      </div>
    </div>
  );
}
