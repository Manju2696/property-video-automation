"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { TemplatePicker } from "@/components/TemplatePicker";
import { VideoPlayer } from "@/components/VideoPlayer";
import { ROOM_TYPES } from "@/lib/constants";
import { formatPrice, formatSqft } from "@/lib/format";
import type { PropertyVideoProps } from "@/remotion/types";

type Photo = {
  id: number;
  url: string;
  roomType: string | null;
  zoomDirection: string;
  isVisible: boolean;
  sequenceOrder: number | null;
  confidence: number | null;
};

type Project = {
  id: number;
  name: string;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  listingPrice: number | null;
  status: string;
  introTemplate: string;
  outroTemplate: string;
  musicTrack: string | null;
  musicVolume: number;
  photoDuration: number;
  zoomIntensity: number;
  photos: Photo[];
  agent: {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    initials: string;
  } | null;
};

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const [project, setProject] = useState<Project | null>(null);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [musicTracks, setMusicTracks] = useState<string[]>(["None"]);
  const [classifying, setClassifying] = useState(false);

  const load = useCallback(async () => {
    setLoadError("");
    const res = await fetch(`/api/projects/${id}`);
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.project) {
      setProject(data.project);
      return;
    }
    setProject(null);
    setLoadError(
      data.error ||
        (res.status === 404
          ? "Project not found. On Vercel, data must use Postgres — SQLite in /tmp is lost between requests."
          : `Failed to load project (HTTP ${res.status})`),
    );
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetch("/api/music")
      .then((r) => r.json())
      .then((d) => setMusicTracks(d.tracks || ["None"]));
  }, []);

  const videoProps: PropertyVideoProps | null = useMemo(() => {
    if (!project) return null;
    const photos = project.photos
      .filter((p) => p.isVisible)
      .sort((a, b) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0))
      .map((p) => ({
        src: p.url,
        roomType: p.roomType || "Other",
        zoomDirection: (p.zoomDirection === "out" ? "out" : "in") as "in" | "out",
      }));

    return {
      propertyName: project.name,
      beds: project.beds ?? 0,
      baths: project.baths ?? 0,
      sqftLabel: formatSqft(project.sqft),
      priceLabel: formatPrice(project.listingPrice),
      introTemplate: project.introTemplate,
      outroTemplate: project.outroTemplate,
      photoDurationSec: project.photoDuration,
      zoomIntensity: project.zoomIntensity,
      photos,
      agentName: project.agent?.name || "Your Agent",
      agentPhone: project.agent?.phone || "",
      agentEmail: project.agent?.email || "",
      agentInitials: project.agent?.initials || "AG",
      heading: "SCHEDULE A SHOWING TODAY",
      bedIcon: "/icons/bed.png",
      bathIcon: "/icons/bath.png",
      sqftIcon: "/icons/sqft.png",
      musicUrl: project.musicTrack
        ? `/api/media/music/${project.musicTrack}`
        : null,
      musicVolume: project.musicVolume,
    };
  }, [project]);

  async function patchProject(patch: Record<string, unknown>) {
    if (!project) return;
    setProject({ ...project, ...patch } as Project);
    setSaving(true);
    await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setSaving(false);
  }

  async function patchPhoto(photoId: number, patch: Record<string, unknown>) {
    setSaving(true);
    const res = await fetch(`/api/projects/${id}/photos`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoId, patch }),
    });
    const data = await res.json();
    if (res.ok) setProject(data.project);
    setSaving(false);
  }

  async function movePhoto(photoId: number, direction: -1 | 1) {
    if (!project) return;
    const sorted = [...project.photos].sort(
      (a, b) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0),
    );
    const index = sorted.findIndex((p) => p.id === photoId);
    const next = index + direction;
    if (next < 0 || next >= sorted.length) return;
    const reordered = [...sorted];
    const [item] = reordered.splice(index, 1);
    reordered.splice(next, 0, item);
    setSaving(true);
    const res = await fetch(`/api/projects/${id}/photos`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: reordered.map((p) => p.id) }),
    });
    const data = await res.json();
    if (res.ok) setProject(data.project);
    setSaving(false);
  }

  async function approve() {
    await patchProject({ status: "approved" });
    setMessage("Approved — ready to export.");
    router.push(`/projects/${id}/export`);
  }

  async function classifyRooms() {
    setClassifying(true);
    setMessage("Classifying rooms with AI…");
    try {
      const res = await fetch(`/api/projects/${id}/classify`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.project) {
        setProject(data.project);
        setMessage(
          data.warning || "Rooms classified and photos reordered.",
        );
      } else {
        setMessage(data.error || "Classification failed.");
      }
    } catch {
      setMessage("Classification failed. Try again.");
    } finally {
      setClassifying(false);
    }
  }

  if (!project || !videoProps) {
    return (
      <AppShell title="Review">
        {loadError ? (
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-8">
            <p className="text-[var(--danger)]">{loadError}</p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => load()}
                className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold"
              >
                Retry
              </button>
              <Link
                href="/"
                className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
              >
                Back to dashboard
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-[var(--muted)]">Loading project…</p>
        )}
      </AppShell>
    );
  }

  const sortedPhotos = [...project.photos].sort(
    (a, b) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0),
  );

  return (
    <AppShell
      title={project.name}
      action={
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={classifyRooms}
            disabled={classifying}
            className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {classifying ? "Classifying…" : "Classify rooms"}
          </button>
          <Link
            href={`/projects/${id}/export`}
            className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold"
          >
            Export
          </Link>
          <button
            type="button"
            onClick={approve}
            className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
          >
            Approve & Export
          </button>
        </div>
      }
    >
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <VideoPlayer props={videoProps} />
          <p className="mt-3 text-sm text-[var(--muted)]">
            Live Remotion preview · {saving ? "Saving…" : "All changes autosave"}
            {message ? ` · ${message}` : ""}
          </p>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-[var(--line)] bg-[var(--card)] p-5">
            <h2 className="font-semibold">Video settings</h2>
            <label className="mt-4 block">
              <span className="mb-2 block text-sm">Photo duration ({project.photoDuration}s)</span>
              <input
                type="range"
                min={2}
                max={8}
                step={0.5}
                value={project.photoDuration}
                onChange={(e) =>
                  patchProject({ photoDuration: Number(e.target.value) })
                }
                className="w-full"
              />
            </label>
            <label className="mt-4 block">
              <span className="mb-2 block text-sm">
                Zoom intensity ({project.zoomIntensity})
              </span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={project.zoomIntensity}
                onChange={(e) =>
                  patchProject({ zoomIntensity: Number(e.target.value) })
                }
                className="w-full"
              />
            </label>
            <label className="mt-4 block">
              <span className="mb-2 block text-sm">Music</span>
              <select
                className="field"
                value={project.musicTrack || "None"}
                onChange={(e) =>
                  patchProject({
                    musicTrack:
                      e.target.value === "None" ? null : e.target.value,
                  })
                }
              >
                {musicTracks.map((track) => (
                  <option key={track} value={track}>
                    {track}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="rounded-3xl border border-[var(--line)] bg-[var(--card)] p-5">
            <h2 className="font-semibold">Photos</h2>
            <div className="mt-4 space-y-3">
              {sortedPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className={`flex gap-3 rounded-2xl border border-[var(--line)] p-3 ${
                    photo.isVisible ? "bg-white" : "opacity-50"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt=""
                    className="h-20 w-24 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1 space-y-2">
                    <select
                      className="field py-2 text-sm"
                      value={photo.roomType || "Other"}
                      onChange={(e) =>
                        patchPhoto(photo.id, { roomType: e.target.value })
                      }
                    >
                      {ROOM_TYPES.map((room) => (
                        <option key={room} value={room}>
                          {room}
                        </option>
                      ))}
                    </select>
                    <div className="flex flex-wrap gap-2">
                      <select
                        className="field w-auto py-1.5 text-xs"
                        value={photo.zoomDirection}
                        onChange={(e) =>
                          patchPhoto(photo.id, {
                            zoomDirection: e.target.value,
                          })
                        }
                      >
                        <option value="in">Zoom in</option>
                        <option value="out">Zoom out</option>
                      </select>
                      <button
                        type="button"
                        className="chip text-xs"
                        onClick={() =>
                          patchPhoto(photo.id, { isVisible: !photo.isVisible })
                        }
                      >
                        {photo.isVisible ? "Hide" : "Show"}
                      </button>
                      <button
                        type="button"
                        className="chip text-xs"
                        onClick={() => movePhoto(photo.id, -1)}
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        className="chip text-xs"
                        onClick={() => movePhoto(photo.id, 1)}
                      >
                        Down
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section className="rounded-3xl border border-[var(--line)] bg-[var(--card)] p-6">
          <h2 className="text-lg font-semibold">Intro template</h2>
          <div className="mt-4">
            <TemplatePicker
              kind="intro"
              value={project.introTemplate}
              onChange={(introTemplate) => patchProject({ introTemplate })}
              preview={{
                propertyName: project.name,
                beds: project.beds ?? 0,
                baths: project.baths ?? 0,
                sqftLabel: formatSqft(project.sqft),
                priceLabel: formatPrice(project.listingPrice),
                photos: sortedPhotos.filter((p) => p.isVisible).map((p) => p.url),
                photoItems: sortedPhotos
                  .filter((p) => p.isVisible)
                  .map((p) => ({
                    src: p.url,
                    roomType: p.roomType || "Other",
                  })),
                agentName: project.agent?.name,
                agentPhone: project.agent?.phone || undefined,
                agentEmail: project.agent?.email || undefined,
                agentInitials: project.agent?.initials,
              }}
            />
          </div>
        </section>
        <section className="rounded-3xl border border-[var(--line)] bg-[var(--card)] p-6">
          <h2 className="text-lg font-semibold">Outro template</h2>
          <div className="mt-4">
            <TemplatePicker
              kind="outro"
              value={project.outroTemplate}
              onChange={(outroTemplate) => patchProject({ outroTemplate })}
              preview={{
                propertyName: project.name,
                beds: project.beds ?? 0,
                baths: project.baths ?? 0,
                sqftLabel: formatSqft(project.sqft),
                priceLabel: formatPrice(project.listingPrice),
                photos: sortedPhotos.filter((p) => p.isVisible).map((p) => p.url),
                photoItems: sortedPhotos
                  .filter((p) => p.isVisible)
                  .map((p) => ({
                    src: p.url,
                    roomType: p.roomType || "Other",
                  })),
                agentName: project.agent?.name,
                agentPhone: project.agent?.phone || undefined,
                agentEmail: project.agent?.email || undefined,
                agentInitials: project.agent?.initials,
              }}
            />
          </div>
        </section>
      </div>
    </AppShell>
  );
}
