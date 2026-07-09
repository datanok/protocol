"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import type { ChecklistBlock } from "@/types/schema";
import { T } from "@/lib/tokens";
import { Check, BlockShell } from "./blockUi";

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
  const done = block.items.filter((i) => i.done).length;
  const total = block.items.length;

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
    <BlockShell
      label="Checklist"
      meta={total > 0 ? `${done} / ${total}` : undefined}
      onDelete={onDelete}
    >
      {total > 0 && (
        <div
          role="progressbar"
          aria-valuenow={done}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label="Checklist progress"
          style={{ height: 2, background: T.rule, marginBottom: 14 }}
        >
          <div
            style={{
              height: "100%",
              background: T.ink,
              transform: `scaleX(${done / total})`,
              transformOrigin: "left",
              transition: "transform 0.2s ease-out",
            }}
          />
        </div>
      )}

      {block.items.map((item) => (
        <div
          key={item.id}
          className="pg-hoverable"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "7px 0",
          }}
        >
          <Check
            checked={item.done}
            onToggle={() => toggleItem(item.id)}
            label={item.label}
          />
          <span
            onClick={() => toggleItem(item.id)}
            style={{
              flex: 1,
              fontFamily: T.sans,
              fontSize: 13.5,
              lineHeight: 1.45,
              color: item.done ? T.stone : T.ink,
              textDecoration: item.done ? "line-through" : "none",
              textDecorationColor: T.stone,
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            {item.label}
          </span>
          <span className="pg-reveal">
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              aria-label={`Remove ${item.label}`}
              className="pg-iconbtn pg-iconbtn-danger"
            >
              <X style={{ width: 13, height: 13 }} />
            </button>
          </span>
        </div>
      ))}

      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: total > 0 ? 10 : 0,
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem();
            }
          }}
          placeholder="Add item…"
          aria-label="New checklist item"
          className="pg-input"
          style={{
            flex: 1,
            padding: "7px 10px",
            fontFamily: T.sans,
            fontSize: 12.5,
          }}
        />
        <button
          type="button"
          onClick={addItem}
          aria-label="Add item"
          className="pg-ghostbtn"
        >
          <Plus style={{ width: 11, height: 11 }} />
        </button>
      </div>
    </BlockShell>
  );
}
