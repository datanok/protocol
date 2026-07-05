"use server";

import { supabase } from "@/lib/supabase";
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

export async function getUserPages(userId: string): Promise<Page[]> {
  const { data, error } = await supabase
    .from("pages")
    .select("id, title, icon, blocks, order_idx")
    .eq("user_id", userId)
    .order("order_idx", { ascending: true });

  if (error) dbErr("Failed to fetch pages", error);

  return (data ?? []).map(toPage);
}

// ─── create ─────────────────────────────────────────────────────────────────

async function nextOrderIdx(userId: string): Promise<number> {
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
  input: { title: string; icon?: string },
): Promise<Page> {
  const order = await nextOrderIdx(userId);

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
  input: { title: string; icon?: string },
): Promise<void> {
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
  blocks: Block[],
): Promise<void> {
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
): Promise<void> {
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
  orderedIds: string[],
): Promise<void> {
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
  blockId: string,
  value: number,
): Promise<void> {
  const { data, error } = await supabase
    .from("pages")
    .select("blocks")
    .eq("id", pageId)
    .eq("user_id", userId)
    .single();

  if (error) dbErr("Failed to load page for tracker log", error);

  const blocks = ((data!.blocks as Block[]) ?? []).map((block) => {
    if (block.id !== blockId || block.type !== "tracker") return block;
    const today = new Date().toISOString().slice(0, 10);
    const entries = block.entries.filter((e) => e.date !== today);
    entries.push({ date: today, value });
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
  pages: Array<{
    title: string;
    icon?: string;
    blocks?: Array<Omit<Block, "id">>;
  }>,
): Promise<void> {
  let order = await nextOrderIdx(userId);

  for (const page of pages) {
    const blocks: Block[] = (page.blocks ?? []).map((b) => ({
      ...b,
      id: crypto.randomUUID(),
    })) as Block[];

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
