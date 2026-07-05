"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { usePages, useInvalidatePages } from "@/hooks/usePages";
import { updatePage, updatePageTitle } from "@/actions/pageActions";
import AppTopNav from "@/components/navigation/AppTopNav";
import TextBlockView from "@/components/pages/TextBlockView";
import ChecklistBlockView from "@/components/pages/ChecklistBlockView";
import TableBlockView from "@/components/pages/TableBlockView";
import TrackerBlockView from "@/components/pages/TrackerBlockView";
import { T } from "@/lib/tokens";
import type { Block } from "@/types/schema";

const BLOCK_LABELS: Record<Block["type"], string> = {
  text: "Text",
  checklist: "Checklist",
  table: "Table",
  tracker: "Tracker",
};

function newBlock(type: Block["type"]): Block {
  const id = crypto.randomUUID();
  switch (type) {
    case "text":
      return { id, type, content: "" };
    case "checklist":
      return { id, type, items: [] };
    case "table":
      return { id, type, columns: ["Column 1"], rows: [] };
    case "tracker":
      return { id, type, label: "Tracker", unit: "", entries: [] };
  }
}

export default function PageEditorView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { data: pages = [], isLoading } = usePages(user?.id ?? "");
  const invalidate = useInvalidatePages();

  const page = useMemo(() => pages.find((p) => p.id === id), [pages, id]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (page) {
      setBlocks(page.blocks);
      setTitle(page.title);
      setIcon(page.icon ?? "");
    }
  }, [page]);

  async function persist(next: Block[]) {
    if (!user || !page) return;
    setBlocks(next);
    try {
      await updatePage(page.id, user.id, next);
      invalidate(user.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
  }

  async function persistTitle() {
    if (!user || !page) return;
    try {
      await updatePageTitle(page.id, user.id, {
        title: title.trim() || "Untitled",
        icon: icon.trim() || undefined,
      });
      invalidate(user.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save title");
    }
  }

  function addBlock(type: Block["type"]) {
    persist([...blocks, newBlock(type)]);
    setMenuOpen(false);
  }

  function updateBlock(blockId: string, next: Block) {
    persist(blocks.map((b) => (b.id === blockId ? next : b)));
  }

  function deleteBlock(blockId: string) {
    persist(blocks.filter((b) => b.id !== blockId));
  }

  if (!isLoading && !page) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: T.surface,
          color: T.ink,
          fontFamily: T.sans,
        }}
      >
        <div
          style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50 }}
        >
          <AppTopNav />
        </div>
        <main style={{ paddingTop: 120, textAlign: "center" }}>
          <p
            style={{
              fontFamily: T.serifD,
              fontSize: 18,
              fontStyle: "italic",
              color: T.stone,
            }}
          >
            Page not found.
          </p>
          <button
            onClick={() => router.push("/pages")}
            style={{
              background: "none",
              border: "none",
              color: T.accent,
              cursor: "pointer",
              fontFamily: T.mono,
              fontSize: 11,
            }}
          >
            ← Back to Pages
          </button>
        </main>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.surface,
        color: T.ink,
        fontFamily: T.sans,
      }}
    >
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50 }}>
        <AppTopNav />
      </div>

      <main
        style={{
          paddingTop: 56,
          maxWidth: 720,
          margin: "0 auto",
          padding: "96px 24px 64px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 32,
          }}
        >
          <input
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            onBlur={persistTitle}
            maxLength={4}
            style={{
              width: 48,
              background: T.tint,
              border: `1px solid ${T.rule}`,
              outline: "none",
              padding: "8px 10px",
              fontFamily: T.mono,
              fontSize: 18,
              color: T.ink,
              textAlign: "center",
              boxSizing: "border-box",
            }}
          />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={persistTitle}
            style={{
              flex: 1,
              background: "none",
              border: "none",
              outline: "none",
              fontFamily: T.serifD,
              fontSize: 28,
              color: T.ink,
              padding: "4px 0",
            }}
          />
        </div>

        {blocks.map((block) => {
          switch (block.type) {
            case "text":
              return (
                <TextBlockView
                  key={block.id}
                  block={block}
                  onChange={(n) => updateBlock(block.id, n)}
                  onDelete={() => deleteBlock(block.id)}
                />
              );
            case "checklist":
              return (
                <ChecklistBlockView
                  key={block.id}
                  block={block}
                  onChange={(n) => updateBlock(block.id, n)}
                  onDelete={() => deleteBlock(block.id)}
                />
              );
            case "table":
              return (
                <TableBlockView
                  key={block.id}
                  block={block}
                  onChange={(n) => updateBlock(block.id, n)}
                  onDelete={() => deleteBlock(block.id)}
                />
              );
            case "tracker":
              return (
                <TrackerBlockView
                  key={block.id}
                  block={block}
                  onChange={(n) => updateBlock(block.id, n)}
                  onDelete={() => deleteBlock(block.id)}
                />
              );
          }
        })}

        <div style={{ position: "relative", marginTop: 16 }}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
              background: "none",
              border: `1px dashed ${T.rule}`,
              cursor: "pointer",
              color: T.stone,
              fontFamily: T.mono,
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              width: "100%",
              justifyContent: "center",
            }}
          >
            <Plus style={{ width: 12, height: 12 }} />
            Add Block
          </button>

          {menuOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                right: 0,
                background: T.surface,
                border: `1px solid ${T.rule}`,
                zIndex: 10,
              }}
            >
              {(Object.keys(BLOCK_LABELS) as Block["type"][]).map((type) => (
                <button
                  key={type}
                  onClick={() => addBlock(type)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 16px",
                    background: "none",
                    border: "none",
                    borderBottom: `1px solid ${T.rule}`,
                    cursor: "pointer",
                    color: T.ink,
                    fontFamily: T.mono,
                    fontSize: 11,
                  }}
                >
                  {BLOCK_LABELS[type]}
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
