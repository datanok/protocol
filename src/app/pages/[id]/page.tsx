"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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

const BLOCK_TYPES: Array<{
  type: Block["type"];
  label: string;
  hint: string;
}> = [
  { type: "text", label: "Text", hint: "Freeform notes" },
  { type: "checklist", label: "Checklist", hint: "Items with checkboxes" },
  { type: "table", label: "Table", hint: "Sortable rows and columns" },
  { type: "tracker", label: "Tracker", hint: "A number logged over time" },
];

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

function EditorSkeleton() {
  return (
    <div aria-hidden>
      <div
        style={{ height: 40, background: T.tint, width: "55%", opacity: 0.9 }}
      />
      <div
        style={{
          height: 120,
          background: T.tint,
          marginTop: 32,
          opacity: 0.6,
        }}
      />
      <div
        style={{ height: 80, background: T.tint, marginTop: 14, opacity: 0.4 }}
      />
    </div>
  );
}

export default function PageEditorView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, session } = useAuth();
  const { data: pages = [], isLoading } = usePages(
    user?.id ?? "",
    session?.access_token ?? "",
  );
  const invalidate = useInvalidatePages();

  const page = useMemo(() => pages.find((p) => p.id === id), [pages, id]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [loadedPageId, setLoadedPageId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Sync local editing state once per page id, during render — an effect here
  // would also re-fire on every post-save refetch and clobber in-flight edits.
  if (page && page.id !== loadedPageId) {
    setLoadedPageId(page.id);
    setBlocks(page.blocks);
    setTitle(page.title);
    setIcon(page.icon ?? "");
  }

  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [menuOpen]);

  async function persist(next: Block[]) {
    if (!user || !session || !page) return;
    setBlocks(next);
    try {
      await updatePage(page.id, user.id, session.access_token, next);
      invalidate(user.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
  }

  async function persistTitle() {
    if (!user || !session || !page) return;
    try {
      await updatePageTitle(page.id, user.id, session.access_token, {
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

  const shell = (children: React.ReactNode) => (
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
          maxWidth: 720,
          margin: "0 auto",
          padding: "104px 24px 64px",
        }}
      >
        {children}
      </main>
    </div>
  );

  if (isLoading) return shell(<EditorSkeleton />);

  if (!page) {
    return shell(
      <div style={{ paddingTop: 24, textAlign: "center" }}>
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
          type="button"
          onClick={() => router.push("/pages")}
          style={{
            background: "none",
            border: "none",
            color: T.accent,
            cursor: "pointer",
            fontFamily: T.mono,
            fontSize: 11,
            letterSpacing: "0.08em",
          }}
        >
          ← Back to Pages
        </button>
      </div>,
    );
  }

  return shell(
    <>
      <Link
        href="/pages"
        style={{
          fontFamily: T.mono,
          fontSize: 10,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: T.stone,
          textDecoration: "none",
        }}
      >
        ← Pages
      </Link>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginTop: 20,
        }}
      >
        <input
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          onBlur={persistTitle}
          maxLength={4}
          aria-label="Page icon"
          className="pg-input"
          style={{
            width: 46,
            padding: "8px 0",
            fontFamily: T.mono,
            fontSize: 18,
            textAlign: "center",
          }}
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={persistTitle}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          aria-label="Page title"
          placeholder="Untitled"
          style={{
            flex: 1,
            background: "none",
            border: "none",
            outline: "none",
            fontFamily: T.serifD,
            fontSize: 28,
            color: T.ink,
            padding: "4px 0",
            minWidth: 0,
          }}
        />
      </div>
      <div
        style={{
          height: 1,
          background: T.ruleDark,
          marginTop: 12,
          marginBottom: 28,
        }}
      />

      {blocks.length === 0 && (
        <p
          style={{
            fontFamily: T.serifD,
            fontSize: 15,
            fontStyle: "italic",
            color: T.stone,
            margin: "0 0 20px",
          }}
        >
          An empty page — add the first block below.
        </p>
      )}

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

      <div ref={menuRef} style={{ position: "relative", marginTop: 16 }}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          className="pg-ghostbtn"
          style={{
            width: "100%",
            justifyContent: "center",
            padding: "11px 16px",
            borderStyle: "dashed",
          }}
        >
          <Plus style={{ width: 12, height: 12 }} />
          Add Block
        </button>

        {menuOpen && (
          <div
            role="menu"
            style={{
              position: "absolute",
              bottom: "calc(100% + 4px)",
              left: 0,
              right: 0,
              background: T.surface,
              border: `1px solid ${T.ruleDark}`,
              zIndex: 10,
              boxShadow: "0 12px 32px rgba(0, 0, 0, 0.35)",
            }}
          >
            {BLOCK_TYPES.map(({ type, label, hint }) => (
              <button
                key={type}
                type="button"
                role="menuitem"
                onClick={() => addBlock(type)}
                className="pg-menuopt"
              >
                <span
                  style={{
                    fontFamily: T.mono,
                    fontSize: 11,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: T.ink,
                    display: "block",
                  }}
                >
                  {label}
                </span>
                <span
                  style={{
                    fontFamily: T.sans,
                    fontSize: 11.5,
                    color: T.stone,
                    display: "block",
                    marginTop: 2,
                  }}
                >
                  {hint}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </>,
  );
}
