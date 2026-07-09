"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { usePages, useInvalidatePages } from "@/hooks/usePages";
import { createPage, deletePage, reorderPages } from "@/actions/pageActions";
import AppTopNav from "@/components/navigation/AppTopNav";
import { ArmDelete } from "@/components/pages/blockUi";
import { T } from "@/lib/tokens";
import type { Block } from "@/types/schema";

const TYPE_LABELS: Record<Block["type"], [string, string]> = {
  text: ["text", "texts"],
  checklist: ["checklist", "checklists"],
  table: ["table", "tables"],
  tracker: ["tracker", "trackers"],
};

function blockSummary(blocks: Block[]): string {
  if (blocks.length === 0) return "Empty";
  const counts = new Map<Block["type"], number>();
  for (const b of blocks) counts.set(b.type, (counts.get(b.type) ?? 0) + 1);
  return [...counts.entries()]
    .map(([type, n]) => `${n} ${TYPE_LABELS[type][n === 1 ? 0 : 1]}`)
    .join(" · ");
}

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
      style={{ display: "flex", gap: 8, marginBottom: 40 }}
    >
      <input
        value={icon}
        onChange={(e) => setIcon(e.target.value)}
        placeholder="🎸"
        aria-label="Page icon (optional)"
        maxLength={4}
        className="pg-input"
        style={{
          width: 46,
          padding: "9px 0",
          fontFamily: T.mono,
          fontSize: 14,
          textAlign: "center",
        }}
      />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="New page title…"
        aria-label="New page title"
        className="pg-input"
        style={{
          flex: 1,
          padding: "9px 12px",
          fontFamily: T.sans,
          fontSize: 13,
        }}
      />
      <button
        type="submit"
        disabled={!title.trim()}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "9px 18px",
          background: title.trim() ? T.ink : "transparent",
          color: title.trim() ? T.surface : T.stone,
          border: `1px solid ${title.trim() ? T.ink : T.rule}`,
          cursor: title.trim() ? "pointer" : "default",
          fontFamily: T.mono,
          fontSize: 10,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          transition: "background 0.12s ease-out, color 0.12s ease-out",
        }}
      >
        <Plus style={{ width: 12, height: 12 }} />
        Add
      </button>
    </form>
  );
}

function ListSkeleton() {
  return (
    <div aria-hidden>
      {[0.9, 0.65, 0.45].map((opacity, i) => (
        <div
          key={i}
          style={{
            height: 60,
            background: T.tint,
            marginBottom: 8,
            opacity,
          }}
        />
      ))}
    </div>
  );
}

export default function PagesListView() {
  const { user, session } = useAuth();
  const { data: pages = [], isLoading } = usePages(
    user?.id ?? "",
    session?.access_token ?? "",
  );
  const invalidate = useInvalidatePages();

  async function handleCreate(title: string, icon: string) {
    if (!user || !session) return;
    try {
      await createPage(user.id, session.access_token, {
        title,
        icon: icon || undefined,
      });
      invalidate(user.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create page");
    }
  }

  async function handleDelete(pageId: string) {
    if (!user || !session) return;
    try {
      await deletePage(pageId, user.id, session.access_token);
      invalidate(user.id);
      toast.success("Page deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function handleMove(index: number, direction: -1 | 1) {
    if (!user || !session) return;
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
        session.access_token,
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
          maxWidth: 720,
          margin: "0 auto",
          padding: "112px 24px 64px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 16,
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
          {pages.length > 0 && (
            <span
              style={{
                fontFamily: T.mono,
                fontSize: 10.5,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: T.stone,
              }}
            >
              {pages.length} page{pages.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <p
          style={{
            fontFamily: T.sans,
            fontSize: 13,
            color: T.stone,
            marginTop: 8,
            marginBottom: 28,
            maxWidth: "60ch",
          }}
        >
          Freeform tracking for anything that doesn&apos;t fit a structured
          module.
        </p>
        <div style={{ height: 1, background: T.ruleDark, marginBottom: 28 }} />

        <NewPageForm onCreate={handleCreate} />

        {isLoading ? (
          <ListSkeleton />
        ) : pages.length === 0 ? (
          <div style={{ padding: "8px 0 24px" }}>
            <p
              style={{
                fontFamily: T.serifD,
                fontSize: 17,
                fontStyle: "italic",
                color: T.stone,
                margin: 0,
              }}
            >
              No pages yet.
            </p>
            <p
              style={{
                fontFamily: T.sans,
                fontSize: 12.5,
                color: T.stone,
                marginTop: 8,
                maxWidth: "52ch",
                lineHeight: 1.6,
              }}
            >
              A page holds any mix of blocks — notes, checklists, tables, and
              numeric trackers. Name one above to start; trackers you add will
              also surface on the dashboard for daily logging.
            </p>
          </div>
        ) : (
          <div>
            {pages.map((page, i) => (
              <div
                key={page.id}
                className="pg-row pg-hoverable"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "6px 8px 6px 4px",
                  borderBottom: `1px solid ${T.rule}`,
                }}
              >
                <span
                  className="pg-reveal"
                  style={{ display: "flex", flexDirection: "column" }}
                >
                  <button
                    type="button"
                    onClick={() => handleMove(i, -1)}
                    disabled={i === 0}
                    aria-label={`Move ${page.title} up`}
                    className="pg-iconbtn"
                    style={{ height: 18 }}
                  >
                    <ChevronUp style={{ width: 13, height: 13 }} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(i, 1)}
                    disabled={i === pages.length - 1}
                    aria-label={`Move ${page.title} down`}
                    className="pg-iconbtn"
                    style={{ height: 18 }}
                  >
                    <ChevronDown style={{ width: 13, height: 13 }} />
                  </button>
                </span>

                <span
                  aria-hidden
                  style={{
                    fontSize: 17,
                    width: 28,
                    textAlign: "center",
                    flexShrink: 0,
                    fontFamily: T.mono,
                    color: T.stone,
                  }}
                >
                  {page.icon || "·"}
                </span>

                <Link
                  href={`/pages/${page.id}`}
                  style={{
                    flex: 1,
                    textDecoration: "none",
                    color: "inherit",
                    padding: "12px 0",
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      fontFamily: T.serifD,
                      fontSize: 17,
                      color: T.ink,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {page.title}
                  </div>
                  <div
                    style={{
                      fontFamily: T.mono,
                      fontSize: 10,
                      color: T.stone,
                      marginTop: 3,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    {blockSummary(page.blocks)}
                  </div>
                </Link>

                <span className="pg-reveal">
                  <ArmDelete
                    onDelete={() => handleDelete(page.id)}
                    what={page.title}
                  />
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
