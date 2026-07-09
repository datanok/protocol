"use server";

import { createAuthedClient } from "@/lib/supabase";
import type { Page, Block } from "@/types/schema";

function dbErr(label: string, e: { message?: string; code?: string }): never {
  const msg = e?.message ?? "Unknown DB error";
  const code = e?.code ? ` (code: ${e.code})` : "";
  throw new Error(`${label}: ${msg}${code}`);
}

function toPage(row: {
  id: string;
  title: string;
  icon: string | null;
  blocks: unknown;
  order_idx: number;
}): Page {
  return {
    id: row.id,
    title: row.title,
    icon: row.icon ?? undefined,
    blocks: (row.blocks as Block[]) ?? [],
    order: row.order_idx,
  };
}

// ─── read ───────────────────────────────────────────────────────────────────

export async function getUserPages(
  userId: string,
  accessToken: string,
): Promise<Page[]> {
  const supabase = createAuthedClient(accessToken);
  const { data, error } = await supabase
    .from("pages")
    .select("id, title, icon, blocks, order_idx")
    .eq("user_id", userId)
    .order("order_idx", { ascending: true });

  if (error) dbErr("Failed to fetch pages", error);

  return (data ?? []).map(toPage);
}

// ─── create ─────────────────────────────────────────────────────────────────

async function nextOrderIdx(
  userId: string,
  accessToken: string,
): Promise<number> {
  const supabase = createAuthedClient(accessToken);
  const { data, error } = await supabase
    .from("pages")
    .select("order_idx")
    .eq("user_id", userId)
    .order("order_idx", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) dbErr("Failed to determine page order", error);

  return data ? (data.order_idx as number) + 1 : 0;
}

export async function createPage(
  userId: string,
  accessToken: string,
  input: { title: string; icon?: string },
): Promise<Page> {
  const order = await nextOrderIdx(userId, accessToken);
  const supabase = createAuthedClient(accessToken);

  const { data, error } = await supabase
    .from("pages")
    .insert({
      user_id: userId,
      title: input.title,
      icon: input.icon ?? null,
      blocks: [],
      order_idx: order,
    })
    .select("id, title, icon, blocks, order_idx")
    .single();

  if (error) dbErr("Failed to create page", error);

  return toPage(data!);
}

// ─── update ─────────────────────────────────────────────────────────────────

export async function updatePageTitle(
  pageId: string,
  userId: string,
  accessToken: string,
  input: { title: string; icon?: string },
): Promise<void> {
  const supabase = createAuthedClient(accessToken);
  const { error } = await supabase
    .from("pages")
    .update({ title: input.title, icon: input.icon ?? null })
    .eq("id", pageId)
    .eq("user_id", userId);

  if (error) dbErr("Failed to update page title", error);
}

export async function updatePage(
  pageId: string,
  userId: string,
  accessToken: string,
  blocks: Block[],
): Promise<void> {
  const supabase = createAuthedClient(accessToken);
  const { error } = await supabase
    .from("pages")
    .update({ blocks })
    .eq("id", pageId)
    .eq("user_id", userId);

  if (error) dbErr("Failed to update page", error);
}

// ─── delete ─────────────────────────────────────────────────────────────────

export async function deletePage(
  pageId: string,
  userId: string,
  accessToken: string,
): Promise<void> {
  const supabase = createAuthedClient(accessToken);
  const { error } = await supabase
    .from("pages")
    .delete()
    .eq("id", pageId)
    .eq("user_id", userId);

  if (error) dbErr("Failed to delete page", error);
}

// ─── reorder ────────────────────────────────────────────────────────────────

export async function reorderPages(
  userId: string,
  accessToken: string,
  orderedIds: string[],
): Promise<void> {
  const supabase = createAuthedClient(accessToken);
  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from("pages")
        .update({ order_idx: index })
        .eq("id", id)
        .eq("user_id", userId),
    ),
  );

  const failed = results.find((r) => r.error);
  if (failed?.error) dbErr("Failed to reorder pages", failed.error);
}

// ─── tracker logging ──────────────────────────────────────────────────────────

export async function logTrackerEntry(
  pageId: string,
  userId: string,
  accessToken: string,
  blockId: string,
  value: number,
  date: string,
): Promise<void> {
  const supabase = createAuthedClient(accessToken);
  const { data, error } = await supabase
    .from("pages")
    .select("blocks")
    .eq("id", pageId)
    .eq("user_id", userId)
    .single();

  if (error) dbErr("Failed to load page for tracker log", error);

  const blocks = ((data!.blocks as Block[]) ?? []).map((block) => {
    if (block.id !== blockId || block.type !== "tracker") return block;
    const entries = block.entries.filter((e) => e.date !== date);
    entries.push({ date, value });
    return { ...block, entries };
  });

  const { error: updateErr } = await supabase
    .from("pages")
    .update({ blocks })
    .eq("id", pageId)
    .eq("user_id", userId);

  if (updateErr) dbErr("Failed to log tracker entry", updateErr);
}

// ─── AI generation ────────────────────────────────────────────────────────────

export async function createPagesFromAI(
  userId: string,
  accessToken: string,
  pages: Array<{
    title: string;
    icon?: string;
    blocks?: Array<Omit<Block, "id">>;
  }>,
): Promise<void> {
  let order = await nextOrderIdx(userId, accessToken);
  const supabase = createAuthedClient(accessToken);

  for (const page of pages) {
    // AI output is untrusted: assign block/item ids, square table rows to the
    // column count, and never accept invented tracker history.
    const blocks: Block[] = (page.blocks ?? []).map((b) => {
      const block = { ...b, id: crypto.randomUUID() } as Block;
      if (block.type === "checklist") {
        block.items = (block.items ?? []).map((item) => ({
          id: item?.id || crypto.randomUUID(),
          label: String(item?.label ?? ""),
          done: false,
        }));
      } else if (block.type === "table") {
        const columns = (block.columns ?? []).map(String);
        block.columns = columns.length > 0 ? columns : ["Column 1"];
        block.rows = (block.rows ?? []).map((row) =>
          block.columns.map((_, c) => String(row?.[c] ?? "")),
        );
      } else if (block.type === "tracker") {
        block.entries = [];
      }
      return block;
    });

    const { error } = await supabase.from("pages").insert({
      user_id: userId,
      title: page.title,
      icon: page.icon ?? null,
      blocks,
      order_idx: order,
    });

    if (error) dbErr("Failed to create AI-generated page", error);
    order += 1;
  }
}
