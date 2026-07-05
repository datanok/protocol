"use client";

import { Trash2 } from "lucide-react";
import type { TextBlock } from "@/types/schema";
import { T } from "@/lib/tokens";

export default function TextBlockView({
  block,
  onChange,
  onDelete,
}: {
  block: TextBlock;
  onChange: (next: TextBlock) => void;
  onDelete: () => void;
}) {
  return (
    <div
      style={{
        border: `1px solid ${T.rule}`,
        padding: 16,
        marginBottom: 12,
        position: "relative",
      }}
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
          Text
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
      <textarea
        defaultValue={block.content}
        onBlur={(e) => onChange({ ...block, content: e.target.value })}
        placeholder="Write something…"
        rows={4}
        style={{
          width: "100%",
          background: T.tint,
          border: `1px solid ${T.rule}`,
          outline: "none",
          padding: "10px 12px",
          fontFamily: T.sans,
          fontSize: 13,
          color: T.ink,
          resize: "vertical",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}
