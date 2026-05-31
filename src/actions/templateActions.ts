'use server';

import { supabase } from '@/lib/supabase';
import { migrateIfNeeded } from '@/lib/planMigration';
import { createPlan } from '@/actions/planActions';
import type { AestheticOSPlan } from '@/types/schema';

// ─── types ───────────────────────────────────────────────────────────────────

export type PublicProfile = {
  user_id:      string;
  username:     string;
  bio:          string | null;
  avatar_url:   string | null;
  accent_color: string | null;
};

export type TemplateCard = {
  id:              string;
  slug:            string;
  title:           string;
  description:     string | null;
  fork_count:      number;
  created_at:      string;
  author_id:       string;
  author_username: string | null;
  author_accent:   string | null;
  plan:            AestheticOSPlan;
};

export type TemplateDetail = TemplateCard & {
  is_public: boolean;
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function dbErr(label: string, e: { message?: string; code?: string }): never {
  const msg  = e?.message ?? 'Unknown DB error';
  const code = e?.code ? ` (code: ${e.code})` : '';
  throw new Error(`${label}: ${msg}${code}`);
}

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 44)
    .replace(/-+$/, '');
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

type AuthorInfo = { username: string | null; accent: string | null };

async function attachAuthors(rows: Array<{ author_id: string } & object>): Promise<Map<string, AuthorInfo>> {
  const ids = [...new Set(rows.map(r => r.author_id))];
  if (!ids.length) return new Map();

  const { data } = await supabase
    .from('profiles')
    .select('user_id, username, accent_color')
    .in('user_id', ids);

  return new Map(
    (data ?? []).map(p => [
      p.user_id as string,
      { username: p.username as string | null, accent: p.accent_color as string | null },
    ])
  );
}

// ─── profile ─────────────────────────────────────────────────────────────────

/** Ensure the user has a profile; returns the current username. */
export async function ensureProfile(
  userId: string,
  desiredUsername: string,
): Promise<PublicProfile> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      { user_id: userId, username: desiredUsername },
      { onConflict: 'user_id', ignoreDuplicates: false },
    )
    .select()
    .single();

  if (error) dbErr('Failed to save profile', error);
  return data as PublicProfile;
}

/** Get a profile by username (public). */
export async function getProfile(username: string): Promise<PublicProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, username, bio, avatar_url, accent_color')
    .eq('username', username)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as PublicProfile | null;
}

/** Get the calling user's own profile. */
export async function getMyProfile(userId: string): Promise<PublicProfile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('user_id, username, bio, avatar_url, accent_color')
    .eq('user_id', userId)
    .maybeSingle();
  return data as PublicProfile | null;
}

// ─── publish ─────────────────────────────────────────────────────────────────

export async function publishTemplate(
  userId: string,
  planJson: AestheticOSPlan,
  opts: { title: string; description?: string; username: string },
): Promise<{ slug: string }> {
  // 1. Ensure profile
  await ensureProfile(userId, opts.username);

  // 2. Insert template
  const slug = generateSlug(opts.title);
  const { error } = await supabase
    .from('templates')
    .insert({
      author_id:   userId,
      slug,
      title:       opts.title,
      description: opts.description ?? null,
      plan_json:   planJson,
    });

  if (error) dbErr('Failed to publish template', error);
  return { slug };
}

// ─── gallery ─────────────────────────────────────────────────────────────────

export async function getPublicTemplates(opts?: {
  sort?:  'popular' | 'newest';
  limit?: number;
  offset?: number;
}): Promise<TemplateCard[]> {
  const sort   = opts?.sort   ?? 'newest';
  const limit  = opts?.limit  ?? 24;
  const offset = opts?.offset ?? 0;

  let query = supabase
    .from('templates')
    .select('id, slug, title, description, fork_count, created_at, author_id, plan_json')
    .eq('is_public', true)
    .range(offset, offset + limit - 1);

  query = sort === 'popular'
    ? query.order('fork_count', { ascending: false })
    : query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const authorMap = await attachAuthors(data ?? []);

  return (data ?? []).map(t => ({
    id:              t.id as string,
    slug:            t.slug as string,
    title:           t.title as string,
    description:     t.description as string | null,
    fork_count:      t.fork_count as number,
    created_at:      t.created_at as string,
    author_id:       t.author_id as string,
    author_username: authorMap.get(t.author_id as string)?.username ?? null,
    author_accent:   authorMap.get(t.author_id as string)?.accent   ?? null,
    plan:            migrateIfNeeded(t.plan_json) as AestheticOSPlan,
  }));
}

/** Templates published by a specific user (public profile page). */
export async function getTemplatesByUser(userId: string): Promise<TemplateCard[]> {
  const { data, error } = await supabase
    .from('templates')
    .select('id, slug, title, description, fork_count, created_at, author_id, plan_json')
    .eq('author_id', userId)
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  const authorMap = await attachAuthors(data ?? []);

  return (data ?? []).map(t => ({
    id:              t.id as string,
    slug:            t.slug as string,
    title:           t.title as string,
    description:     t.description as string | null,
    fork_count:      t.fork_count as number,
    created_at:      t.created_at as string,
    author_id:       t.author_id as string,
    author_username: authorMap.get(t.author_id as string)?.username ?? null,
    author_accent:   authorMap.get(t.author_id as string)?.accent   ?? null,
    plan:            migrateIfNeeded(t.plan_json) as AestheticOSPlan,
  }));
}

// ─── detail ──────────────────────────────────────────────────────────────────

export async function getTemplate(slug: string): Promise<TemplateDetail | null> {
  const { data, error } = await supabase
    .from('templates')
    .select('id, slug, title, description, fork_count, is_public, created_at, author_id, plan_json')
    .eq('slug', slug)
    .eq('is_public', true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const authorMap = await attachAuthors([data]);

  return {
    id:              data.id as string,
    slug:            data.slug as string,
    title:           data.title as string,
    description:     data.description as string | null,
    fork_count:      data.fork_count as number,
    is_public:       data.is_public as boolean,
    created_at:      data.created_at as string,
    author_id:       data.author_id as string,
    author_username: authorMap.get(data.author_id as string)?.username ?? null,
    author_accent:   authorMap.get(data.author_id as string)?.accent   ?? null,
    plan:            migrateIfNeeded(data.plan_json) as AestheticOSPlan,
  };
}

// ─── fork ────────────────────────────────────────────────────────────────────

/**
 * Creates a copy of the template as a new plan for the user, then activates it.
 * Increments fork_count atomically via DB function.
 */
export async function forkTemplate(
  templateSlug: string,
  userId: string,
): Promise<{ planId: string }> {
  const template = await getTemplate(templateSlug);
  if (!template) throw new Error('Template not found');

  // Create + activate the plan
  const { id } = await createPlan(userId, template.plan);

  // Increment fork count (fire-and-forget atomically)
  await supabase.rpc('increment_fork_count', { p_template_id: template.id });

  return { planId: id };
}
