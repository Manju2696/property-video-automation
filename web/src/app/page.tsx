"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { statusLabel } from "@/lib/format";

type ProjectCard = {
  id: number;
  name: string;
  status: string;
  beds: number | null;
  baths: number | null;
  listingPrice: number | null;
  photos: { url: string }[];
  updatedAt: string;
};

const FILTERS = ["all", "processing", "review", "done"] as const;

export default function DashboardPage() {
  const [projects, setProjects] = useState<ProjectCard[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const qs = filter === "all" ? "" : `?status=${filter}`;
      const res = await fetch(`/api/projects${qs}`);
      const data = await res.json();
      if (!cancelled) {
        setProjects(data.projects || []);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [filter]);

  return (
    <AppShell
      title="Projects"
      action={
        <Link
          href="/projects/new"
          className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white"
        >
          New Project
        </Link>
      }
    >
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-2 text-sm font-medium capitalize ${
              filter === f
                ? "bg-[var(--ink)] text-white"
                : "bg-[var(--card)] text-[var(--muted)] border border-[var(--line)]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-[var(--muted)]">Loading projects…</p>
      ) : projects.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--line)] bg-[var(--card)] px-8 py-16 text-center">
          <h2 className="brand-serif text-3xl">No projects yet</h2>
          <p className="mt-3 text-[var(--muted)]">
            Upload listing photos and generate a tour video in minutes.
          </p>
          <Link
            href="/projects/new"
            className="mt-6 inline-flex rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Create your first project
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const thumb = project.photos[0]?.url;
            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--card)] transition hover:-translate-y-0.5"
              >
                <div
                  className="aspect-[16/10] bg-cover bg-center"
                  style={{
                    backgroundImage: thumb
                      ? `url(${thumb})`
                      : "linear-gradient(135deg,#1f4d3a,#b08d4a)",
                  }}
                />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-semibold leading-snug group-hover:text-[var(--accent)]">
                      {project.name}
                    </h2>
                    <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--accent)]">
                      {statusLabel(project.status)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {[
                      project.beds != null ? `${project.beds} bed` : null,
                      project.baths != null ? `${project.baths} bath` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Details pending"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
