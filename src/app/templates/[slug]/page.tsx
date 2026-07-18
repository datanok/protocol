"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { GitFork, Loader2, ArrowLeft } from "lucide-react";
import PublicNav from "@/components/navigation/PublicNav";
import { getTemplate, forkTemplate } from "@/actions/templateActions";
import { useAuth } from "@/contexts/AuthContext";
import { useInvalidatePlans } from "@/hooks/useUserPlans";
import type {
  PlanModule,
  WorkoutModuleData,
  SkillModuleData,
  StudyModuleData,
  NutritionModuleData,
} from "@/types/schema";

const T = {
  surface: "var(--protocol-surface)",
  tint: "var(--protocol-tint)",
  ink: "var(--protocol-ink)",
  stone: "var(--protocol-stone)",
  rule: "var(--protocol-rule)",
  accent: "var(--protocol-accent)",
  positive: "var(--protocol-positive)",
  mono: "var(--font-mono)",
  serifD: "var(--font-serif-display)",
  serifT: "var(--font-serif-display)",
};

const TYPE_ACCENTS: Record<string, string> = {
  workout: T.accent,
  skill: "#5B7FA6",
  study: "#7A5C8A",
  nutrition: "#2E7D32",
};

function ModulePreview({ mod }: { mod: PlanModule }) {
  const accentColor = TYPE_ACCENTS[mod.type] ?? T.stone;

  let summary: string | null = null;
  if (mod.type === "workout") {
    const d = mod.data as WorkoutModuleData;
    const activeDays = Object.values(d.split).filter(
      (ex) => ex.length > 0,
    ).length;
    summary = `${d.focus} · ${activeDays}/7 training days`;
  } else if (mod.type === "skill") {
    const d = mod.data as SkillModuleData;
    summary = `${d.subject} · ${d.nodes.length} nodes`;
  } else if (mod.type === "study") {
    const d = mod.data as StudyModuleData;
    summary = `${d.subject} · ${d.dailyGoalMin}min/day`;
  } else if (mod.type === "nutrition") {
    const d = mod.data as NutritionModuleData;
    summary = d.notes
      ? d.notes.slice(0, 80) + (d.notes.length > 80 ? "…" : "")
      : "Custom nutrition protocol";
  }

  return (
    <div
      style={{
        border: `1px solid ${T.rule}`,
        position: "relative",
        display: "flex",
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: accentColor,
        }}
      />
      <div style={{ padding: "14px 16px 14px 20px", flex: 1 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: summary ? 6 : 0,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              background: accentColor,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: T.mono,
              fontSize: 10,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: T.stone,
            }}
          >
            {mod.type}
          </span>
          <span
            style={{
              fontFamily: T.serifT,
              fontSize: 14,
              color: T.ink,
              fontStyle: "italic",
            }}
          >
            {mod.title}
          </span>
        </div>
        {summary && (
          <div
            style={{
              fontFamily: T.mono,
              fontSize: 10,
              color: T.stone,
              paddingLeft: 14,
              lineHeight: 1.5,
            }}
          >
            {summary}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TemplateDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const invalidate = useInvalidatePlans();
  const [forking, setForking] = useState(false);

  const {
    data: template,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["template", slug],
    queryFn: () => getTemplate(slug),
  });

  const handleFork = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setForking(true);
    try {
      await forkTemplate(slug, user.id);
      invalidate(user.id);
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setForking(false);
    }
  };

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: T.surface,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Loader2
          style={{
            width: 18,
            height: 18,
            color: T.stone,
            animation: "spin 1s linear infinite",
          }}
        />
      </div>
    );
  }

  if (error || !template) {
    return (
      <div style={{ minHeight: "100vh", background: T.surface }}>
        <PublicNav />
        <div
          style={{
            paddingTop: 56,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            gap: 16,
          }}
        >
          <span
            style={{
              fontFamily: T.mono,
              fontSize: 11,
              color: T.stone,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Template not found
          </span>
          <Link
            href="/templates"
            style={{
              fontFamily: T.mono,
              fontSize: 10,
              color: T.accent,
              textDecoration: "underline",
              textUnderlineOffset: 3,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            ← Back to gallery
          </Link>
        </div>
      </div>
    );
  }

  const sortedModules = [...template.plan.modules].sort(
    (a, b) => a.order - b.order,
  );

  return (
    <div style={{ minHeight: "100vh", background: T.surface, color: T.ink }}>
      <PublicNav />

      <main
        style={{
          paddingTop: 56,
          maxWidth: 800,
          margin: "0 auto",
          padding: "56px 48px 80px",
        }}
      >
        {/* Back */}
        <div style={{ paddingTop: 28, paddingBottom: 8 }}>
          <Link
            href="/templates"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontFamily: T.mono,
              fontSize: 9,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: T.stone,
              textDecoration: "none",
            }}
          >
            <ArrowLeft style={{ width: 12, height: 12 }} />
            Templates
          </Link>
        </div>

        {/* Header */}
        <div
          style={{
            paddingTop: 16,
            paddingBottom: 28,
            borderBottom: `1px solid ${T.rule}`,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 24,
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontFamily: T.mono,
                  fontSize: 9,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: T.stone,
                  marginBottom: 10,
                }}
              >
                {template.plan.metadata.level} ·{" "}
                {template.plan.metadata.planType}
              </div>
              <h1
                style={{
                  fontFamily: T.serifD,
                  fontSize: 36,
                  color: T.ink,
                  margin: 0,
                  lineHeight: 1.05,
                  letterSpacing: "-0.3px",
                }}
              >
                {template.plan.metadata.goal}
              </h1>
              {template.description && (
                <p
                  style={{
                    fontFamily: T.mono,
                    fontSize: 11,
                    color: T.stone,
                    marginTop: 12,
                    lineHeight: 1.6,
                    maxWidth: 480,
                  }}
                >
                  {template.description}
                </p>
              )}
              {template.author_username && (
                <div
                  style={{
                    marginTop: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {template.author_accent && (
                    <div
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: template.author_accent,
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <Link
                    href={`/u/${template.author_username}`}
                    style={{
                      fontFamily: T.mono,
                      fontSize: 9,
                      color: T.stone,
                      textDecoration: "underline",
                      textUnderlineOffset: 3,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                  >
                    @{template.author_username}
                  </Link>
                </div>
              )}
            </div>

            {/* Fork CTA */}
            <div
              style={{
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 8,
              }}
            >
              <button
                onClick={handleFork}
                disabled={forking}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 20px",
                  background: T.ink,
                  color: T.surface,
                  border: "none",
                  cursor: forking ? "not-allowed" : "pointer",
                  fontFamily: T.mono,
                  fontSize: 10,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  opacity: forking ? 0.6 : 1,
                }}
              >
                {forking ? (
                  <>
                    <Loader2
                      style={{
                        width: 12,
                        height: 12,
                        animation: "spin 1s linear infinite",
                      }}
                    />{" "}
                    Forking…
                  </>
                ) : (
                  <>
                    <GitFork style={{ width: 12, height: 12 }} /> Use Template
                  </>
                )}
              </button>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  color: T.stone,
                }}
              >
                <GitFork style={{ width: 11, height: 11 }} />
                <span
                  style={{ fontFamily: T.mono, fontSize: 9, color: T.stone }}
                >
                  {template.fork_count} forks
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modules */}
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              fontFamily: T.mono,
              fontSize: 9,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: T.stone,
              marginBottom: 12,
            }}
          >
            {sortedModules.length} Module{sortedModules.length !== 1 ? "s" : ""}
          </div>
          <div style={{ height: 1, background: T.rule, marginBottom: 0 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {sortedModules.map((mod) => (
              <ModulePreview key={mod.id} mod={mod} />
            ))}
          </div>
        </div>

        {/* Habits */}
        {template.plan.habits.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div
              style={{
                fontFamily: T.mono,
                fontSize: 9,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: T.stone,
                marginBottom: 12,
              }}
            >
              {template.plan.habits.length} Habits
            </div>
            <div style={{ height: 1, background: T.rule, marginBottom: 12 }} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {template.plan.habits.map((h) => (
                <span
                  key={h.id}
                  style={{
                    fontFamily: T.mono,
                    fontSize: 9,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    padding: "4px 10px",
                    border: `1px solid ${T.rule}`,
                    color: T.stone,
                  }}
                >
                  {h.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div
          style={{
            marginTop: 40,
            paddingTop: 24,
            borderTop: `1px solid ${T.rule}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: T.serifT,
                fontSize: 15,
                color: T.ink,
                fontStyle: "italic",
              }}
            >
              Use this template
            </div>
            <div
              style={{
                fontFamily: T.mono,
                fontSize: 10,
                color: T.stone,
                marginTop: 4,
              }}
            >
              Forks into your account and activates immediately
            </div>
          </div>
          <button
            onClick={handleFork}
            disabled={forking}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              background: T.ink,
              color: T.surface,
              border: "none",
              cursor: forking ? "not-allowed" : "pointer",
              fontFamily: T.mono,
              fontSize: 10,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              opacity: forking ? 0.6 : 1,
            }}
          >
            {forking ? (
              <>
                <Loader2
                  style={{
                    width: 12,
                    height: 12,
                    animation: "spin 1s linear infinite",
                  }}
                />{" "}
                Forking…
              </>
            ) : (
              <>
                <GitFork style={{ width: 12, height: 12 }} /> Use Template
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
