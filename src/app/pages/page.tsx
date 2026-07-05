"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { usePages, useInvalidatePages } from "@/hooks/usePages";
import { createPage, deletePage, reorderPages } from "@/actions/pageActions";
import AppTopNav from "@/components/navigation/AppTopNav";
import { T } from "@/lib/tokens";

function NewPageForm({
  onCreate,
}: {
  onCreate: (title: string, icon: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        onCreate(title.trim(), icon.trim());
        setTitle("");
        setIcon("");
      }}
      style={{ display: "flex", gap: 8, marginBottom: 32 }}
    >
      <input
        value={icon}
        onChange={(e) => setIcon(e.target.value)}
        placeholder="🎸"
        maxLength={4}
        style={{
          width: 48,
          background: T.tint,
          border: `1px solid ${T.rule}`,
          outline: "none",
          padding: "8px 10px",
          fontFamily: T.mono,
          fontSize: 14,
          color: T.ink,
          textAlign: "center",
          boxSizing: "border-box",
        }}
      />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="New page title…"
        style={{
          flex: 1,
          background: T.tint,
          border: `1px solid ${T.rule}`,
          outline: "none",
          padding: "8px 10px",
          fontFamily: T.mono,
          fontSize: 12,
          color: T.ink,
          boxSizing: "border-box",
        }}
      />
      <button
        type="submit"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 16px",
          background: T.ink,
          color: T.surface,
          border: "none",
          cursor: "pointer",
          fontFamily: T.mono,
          fontSize: 10,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        <Plus style={{ width: 12, height: 12 }} />
        Add
      </button>
    </form>
  );
}

export default function PagesListView() {
  const { user } = useAuth();
  const { data: pages = [], isLoading } = usePages(user?.id ?? "");
  const invalidate = useInvalidatePages();
  const [busy, setBusy] = useState<string | null>(null);

  async function handleCreate(title: string, icon: string) {
    if (!user) return;
    try {
      await createPage(user.id, { title, icon: icon || undefined });
      invalidate(user.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create page");
    }
  }

  async function handleDelete(pageId: string) {
    if (!user) return;
    setBusy(pageId);
    try {
      await deletePage(pageId, user.id);
      invalidate(user.id);
      toast.success("Page deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(null);
    }
  }

  async function handleMove(index: number, direction: -1 | 1) {
    if (!user) return;
    const target = index + direction;
    if (target < 0 || target >= pages.length) return;
    const reordered = [...pages];
    [reordered[index], reordered[target]] = [
      reordered[target],
      reordered[index],
    ];
    try {
      await reorderPages(
        user.id,
        reordered.map((p) => p.id),
      );
      invalidate(user.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reorder failed");
    }
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
        <h1
          style={{
            fontFamily: T.serifD,
            fontSize: 32,
            fontWeight: 400,
            color: T.ink,
            margin: 0,
          }}
        >
          Pages
        </h1>
        <p
          style={{
            fontFamily: T.sans,
            fontSize: 13,
            color: T.stone,
            marginTop: 8,
            marginBottom: 32,
          }}
        >
          Freeform tracking for anything that doesn&apos;t fit a structured
          module.
        </p>

        <NewPageForm onCreate={handleCreate} />

        {isLoading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: T.stone,
            }}
          >
            <Loader2
              style={{
                width: 14,
                height: 14,
                animation: "spin 1s linear infinite",
              }}
            />
            <span style={{ fontFamily: T.mono, fontSize: 11 }}>Loading…</span>
          </div>
        ) : pages.length === 0 ? (
          <div
            style={{
              fontFamily: T.serifD,
              fontSize: 16,
              fontStyle: "italic",
              color: T.stone,
              padding: "24px 0",
            }}
          >
            No pages yet — add one above.
          </div>
        ) : (
          <div>
            {pages.map((page, i) => (
              <div
                key={page.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "16px 0",
                  borderBottom:
                    i < pages.length - 1 ? `1px solid ${T.rule}` : "none",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <button
                    onClick={() => handleMove(i, -1)}
                    disabled={i === 0}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: i === 0 ? "default" : "pointer",
                      color: T.stone,
                      opacity: i === 0 ? 0.3 : 1,
                      padding: 2,
                    }}
                  >
                    <ChevronUp style={{ width: 12, height: 12 }} />
                  </button>
                  <button
                    onClick={() => handleMove(i, 1)}
                    disabled={i === pages.length - 1}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: i === pages.length - 1 ? "default" : "pointer",
                      color: T.stone,
                      opacity: i === pages.length - 1 ? 0.3 : 1,
                      padding: 2,
                    }}
                  >
                    <ChevronDown style={{ width: 12, height: 12 }} />
                  </button>
                </div>

                <span
                  style={{
                    fontSize: 18,
                    width: 24,
                    textAlign: "center",
                    flexShrink: 0,
                  }}
                >
                  {page.icon || "·"}
                </span>

                <Link
                  href={`/pages/${page.id}`}
                  style={{ flex: 1, textDecoration: "none", color: "inherit" }}
                >
                  <div
                    style={{ fontFamily: T.serifD, fontSize: 17, color: T.ink }}
                  >
                    {page.title}
                  </div>
                  <div
                    style={{
                      fontFamily: T.mono,
                      fontSize: 10,
                      color: T.stone,
                      marginTop: 2,
                      letterSpacing: "0.06em",
                    }}
                  >
                    {page.blocks.length} block
                    {page.blocks.length !== 1 ? "s" : ""}
                  </div>
                </Link>

                <button
                  onClick={() => handleDelete(page.id)}
                  disabled={busy === page.id}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: T.stone,
                    opacity: busy === page.id ? 0.5 : 1,
                  }}
                >
                  {busy === page.id ? (
                    <Loader2
                      style={{
                        width: 13,
                        height: 13,
                        animation: "spin 1s linear infinite",
                      }}
                    />
                  ) : (
                    <Trash2 style={{ width: 13, height: 13 }} />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
