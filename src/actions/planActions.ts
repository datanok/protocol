'use server';

import { supabase } from '@/lib/supabase';
import { migrateIfNeeded } from '@/lib/planMigration';
import type { AestheticOSPlan } from '@/types/schema';

// ─── helpers ────────────────────────────────────────────────────────────────

function unwrap(raw: unknown): unknown {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const keys = Object.keys(raw as object);
    if (keys.length === 1) return (raw as Record<string, unknown>)[keys[0]];
  }
  return raw;
}

function parsePlan(raw: unknown): AestheticOSPlan {
  const plan = migrateIfNeeded(unwrap(raw));
  if (
    !plan.metadata ||
    !Array.isArray(plan.habits) ||
    !Array.isArray(plan.modules) ||
    plan.modules.length === 0
  ) {
    throw new Error('Invalid plan schema. Expected { metadata, habits, modules[] }.');
  }
  (plan.metadata as Record<string, unknown>).version = 2;
  return plan;
}

function dbErr(label: string, e: { message?: string; code?: string }) {
  const msg = e?.message ?? 'Unknown DB error';
  const code = e?.code ? ` (code: ${e.code})` : '';
  throw new Error(`${label}: ${msg}${code}`);
}

// ─── create ─────────────────────────────────────────────────────────────────

/**
 * Creates a new plan for the user and immediately activates it.
 * The DB trigger deactivates any previously active plan.
 */
export async function createPlan(
  userId: string,
  planJson: unknown,
): Promise<{ id: string; plan: AestheticOSPlan }> {
  const plan = parsePlan(planJson);

  const { data, error } = await supabase
    .from('plans')
    .insert({ user_id: userId, plan_json: plan, is_active: false })
    .select('id')
    .single();

  if (error) dbErr('Failed to create plan', error);

  // Activate — trigger deactivates previous active plan
  const { error: activateErr } = await supabase
    .from('plans')
    .update({ is_active: true })
    .eq('id', data!.id)
    .eq('user_id', userId);

  if (activateErr) dbErr('Failed to activate plan', activateErr);

  return { id: data!.id, plan };
}

// ─── update ─────────────────────────────────────────────────────────────────

/**
 * Updates plan_json for a specific plan (identified by planId).
 * Does NOT change is_active.
 */
export async function updatePlan(
  planId: string,
  userId: string,
  planJson: unknown,
): Promise<AestheticOSPlan> {
  const plan = parsePlan(planJson);

  const { error } = await supabase
    .from('plans')
    .update({ plan_json: plan })
    .eq('id', planId)
    .eq('user_id', userId);

  if (error) dbErr('Failed to update plan', error);
  return plan;
}

// ─── activate ───────────────────────────────────────────────────────────────

/**
 * Sets is_active = true for the given plan.
 * The DB trigger flips all other plans for this user to is_active = false.
 */
export async function activatePlan(planId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('plans')
    .update({ is_active: true })
    .eq('id', planId)
    .eq('user_id', userId);

  if (error) dbErr('Failed to activate plan', error);
}

// ─── delete ─────────────────────────────────────────────────────────────────

/**
 * Deletes a plan. If it was active, activates the most-recently-updated
 * remaining plan (if any).
 */
export async function deletePlan(planId: string, userId: string): Promise<void> {
  // Check if this plan is currently active
  const { data: target } = await supabase
    .from('plans')
    .select('is_active')
    .eq('id', planId)
    .eq('user_id', userId)
    .single();

  const { error } = await supabase
    .from('plans')
    .delete()
    .eq('id', planId)
    .eq('user_id', userId);

  if (error) dbErr('Failed to delete plan', error);

  // Re-activate the most recent remaining plan if we deleted the active one
  if (target?.is_active) {
    const { data: next } = await supabase
      .from('plans')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (next) {
      const { error: reactivateErr } = await supabase
        .from('plans')
        .update({ is_active: true })
        .eq('id', next.id)
        .eq('user_id', userId);
      if (reactivateErr) dbErr('Failed to reactivate plan after delete', reactivateErr);
    }
  }
}

// ─── list ────────────────────────────────────────────────────────────────────

export type PlanSummary = {
  id: string;
  is_active: boolean;
  created_at: string;
  plan: AestheticOSPlan;
};

/**
 * Returns all plans for the user, active plan first, then by created_at desc.
 */
export async function getUserPlans(userId: string): Promise<PlanSummary[]> {
  const { data, error } = await supabase
    .from('plans')
    .select('id, is_active, created_at, plan_json')
    .eq('user_id', userId)
    .order('is_active', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) dbErr('Failed to fetch plans', error);

  return (data ?? []).map(row => ({
    id:         row.id as string,
    is_active:  row.is_active as boolean,
    created_at: row.created_at as string,
    plan:       migrateIfNeeded(row.plan_json),
  }));
}
