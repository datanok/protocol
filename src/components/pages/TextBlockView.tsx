"use client";

import type { TextBlock } from "@/types/schema";
import { T } from "@/lib/tokens";
import { BlockShell } from "./blockUi";

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
    <BlockShell label="Text" onDelete={onDelete}>
      <textarea
        defaultValue={block.content}
        onBlur={(e) => onChange({ ...block, content: e.target.value })}
        placeholder="Write something…"
        aria-label="Text block content"
        rows={4}
        className="pg-input"
        style={{
          width: "100%",
          background: T.surface,
          padding: "10px 12px",
          fontFamily: T.sans,
          fontSize: 13.5,
          lineHeight: 1.6,
          resize: "vertical",
          maxWidth: "72ch",
          display: "block",
        }}
      />
    </BlockShell>
  );
}
