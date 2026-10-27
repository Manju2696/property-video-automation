"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AppShell } from "@/components/AppShell";
import { TemplatePicker } from "@/components/TemplatePicker";
import { VideoPlayer } from "@/components/VideoPlayer";
import { ROOM_TYPES } from "@/lib/constants";
import { agentInitials, formatPrice, formatSqft } from "@/lib/format";
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

function IntroField({
  label,
  shown,
  onChange,
  children,
}: {
  label: string;
  shown: boolean;
  onChange: (show: boolean) => void;
  children: ReactNode;
}) {
  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm">{label}</span>
        <span className="flex gap-1">
          <button
            type="button"
            className={`chip text-xs ${shown ? "chip-active" : ""}`}
            onClick={() => onChange(true)}
          >
            Show
          </button>
          <button
            type="button"
            className={`chip text-xs ${shown ? "" : "chip-active"}`}
            onClick={() => onChange(false)}
          >
            Hide
          </button>
        </span>
      </div>
      {children}
    </div>
  );
}

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
  introKicker: string;
  outroHeading: string;
  outroBrand: string;
  showIntro: boolean;
  showOutro: boolean;
  showRoomLabels: boolean;
  showIntroAddress: boolean;
  showIntroKicker: boolean;
  showIntroBeds: boolean;
  showIntroBaths: boolean;
  showIntroSqft: boolean;
  showIntroPrice: boolean;
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
  const pendingRef = useRef<Record<string, unknown>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      const body = pendingRef.current;
      pendingRef.current = {};
      if (Object.keys(body).length === 0) return;
      void fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        keepalive: true,
      });
    };
  }, [id]);

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
      agentInitials: agentInitials(project.agent?.name || "Agent"),
      heading: project.outroHeading || "SCHEDULE A SHOWING TODAY",
      bedIcon: "/icons/bed.png",
      bathIcon: "/icons/bath.png",
      sqftIcon: "/icons/sqft.png",
      musicUrl: project.musicTrack
        ? `/api/media/music/${project.musicTrack}`
        : null,
      musicVolume: project.musicVolume,
      introKicker: project.introKicker ?? "PROPERTY DETAILS",
      outroHeading: project.outroHeading || "SCHEDULE A SHOWING TODAY",
      outroBrand:
        project.outroBrand ?? "Better Homes and Gardens Real Estate",
      showIntro: project.showIntro !== false,
      showOutro: project.showOutro !== false,
      showRoomLabels: project.showRoomLabels !== false,
      showIntroAddress: project.showIntroAddress !== false,
      showIntroKicker: project.showIntroKicker !== false,
      showIntroBeds: project.showIntroBeds !== false,
      showIntroBaths: project.showIntroBaths !== false,
      showIntroSqft: project.showIntroSqft !== false,
      showIntroPrice: project.showIntroPrice !== false,
    };
  }, [project]);

  const persist = useCallback(
    async (body: Record<string, unknown>) => {
      setSaving(true);
      try {
        const res = await fetch(`/api/projects/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) setMessage("Could not save changes.");
      } finally {
        setSaving(false);
      }
    },
    [id],
  );

  const patchProject = useCallback(
    async (patch: Record<string, unknown>, delay = 0) => {
      setProject((prev) => (prev ? ({ ...prev, ...patch } as Project) : prev));
      if (delay > 0) {
        pendingRef.current = { ...pendingRef.current, ...patch };
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          const body = pendingRef.current;
          pendingRef.current = {};
          void persist(body);
        }, delay);
        return;
      }
      if (timerRef.current) clearTimeout(timerRef.current);
      const body = { ...pendingRef.current, ...patch };
      pendingRef.current = {};
      await persist(body);
    },
    [persist],
  );

  const mergeServer = useCallback((server: Project) => {
    setProject((prev) => {
      if (!prev) return server;
      const pending = pendingRef.current;
      return {
        ...prev,
        status: server.status,
        photos: server.photos,
        ...pending,
        agent: (pending.agent as Project["agent"]) || prev.agent,
      };
    });
  }, []);

  async function patchPhoto(photoId: number, patch: Record<string, unknown>) {
    setSaving(true);
    const res = await fetch(`/api/projects/${id}/photos`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoId, patch }),
    });
    const data = await res.json();
    if (res.ok) mergeServer(data.project);
    setSaving(false);
  }

  async function removePhoto(photoId: number) {
    if (!window.confirm("Remove this photo from the video?")) return;
    setSaving(true);
    const res = await fetch(`/api/projects/${id}/photos?photoId=${photoId}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (res.ok) mergeServer(data.project);
    else setMessage(data.error || "Could not remove photo.");
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
    if (res.ok) mergeServer(data.project);
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
        mergeServer(data.project);
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
  const introOn = project.showIntro !== false;
  const outroOn = project.showOutro !== false;
  const labelsOn = project.showRoomLabels !== false;
  const allOn = introOn && outroOn && labelsOn;
  const allOff = !introOn && !outroOn && !labelsOn;

  function setAllVisible(show: boolean) {
    patchProject({
      showIntro: show,
      showOutro: show,
      showRoomLabels: show,
    });
  }
  const volumePct = Math.round(
    Math.min(1, Math.max(0, project.musicVolume ?? 0.5)) * 100,
  );
  const visiblePhotos = sortedPhotos.filter((p) => p.isVisible);
  const templatePreview = {
    propertyName: project.name,
    beds: project.beds ?? 0,
    baths: project.baths ?? 0,
    sqftLabel: formatSqft(project.sqft),
    priceLabel: formatPrice(project.listingPrice),
    photos: visiblePhotos.map((p) => p.url),
    photoItems: visiblePhotos.map((p) => ({
      src: p.url,
      roomType: p.roomType || "Other",
    })),
    agentName: project.agent?.name,
    agentPhone: project.agent?.phone || undefined,
    agentEmail: project.agent?.email || undefined,
    agentInitials: agentInitials(project.agent?.name || "Agent"),
    kicker: project.introKicker ?? "PROPERTY DETAILS",
    showAddress: project.showIntroAddress !== false,
    showKicker: project.showIntroKicker !== false,
    showBeds: project.showIntroBeds !== false,
    showBaths: project.showIntroBaths !== false,
    showSqft: project.showIntroSqft !== false,
    showPrice: project.showIntroPrice !== false,
    heading: project.outroHeading || "SCHEDULE A SHOWING TODAY",
    brand: project.outroBrand ?? "Better Homes and Gardens Real Estate",
  };

  const listing = project;
  function editAgent(partial: {
    name?: string;
    phone?: string | null;
    email?: string | null;
  }) {
    const name = partial.name ?? listing.agent?.name ?? "";
    patchProject(
      {
        agent: {
          id: listing.agent?.id ?? 0,
          name,
          phone:
            partial.phone !== undefined
              ? partial.phone
              : (listing.agent?.phone ?? ""),
          email:
            partial.email !== undefined
              ? partial.email
              : (listing.agent?.email ?? ""),
          initials: agentInitials(name || "Agent"),
        },
      },
      400,
    );
  }

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
            <h2 className="font-semibold">Show or hide</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Show or hide the intro, outro, and room labels on their own, or all three together.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className={`chip text-xs ${allOn ? "chip-active" : ""}`}
                onClick={() => setAllVisible(true)}
              >
                Show all
              </button>
              <button
                type="button"
                className={`chip text-xs ${allOff ? "chip-active" : ""}`}
                onClick={() => setAllVisible(false)}
              >
                Hide all
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {(
                [
                  ["Intro", introOn, { showIntro: true }, { showIntro: false }],
                  ["Outro", outroOn, { showOutro: true }, { showOutro: false }],
                  [
                    "Room labels",
                    labelsOn,
                    { showRoomLabels: true },
                    { showRoomLabels: false },
                  ],
                ] as const
              ).map(([label, on, showPatch, hidePatch]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-white px-3 py-2"
                >
                  <span className="text-sm font-medium">{label}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={`chip text-xs ${on ? "chip-active" : ""}`}
                      onClick={() => patchProject({ ...showPatch })}
                    >
                      Show
                    </button>
                    <button
                      type="button"
                      className={`chip text-xs ${on ? "" : "chip-active"}`}
                      onClick={() => patchProject({ ...hidePatch })}
                    >
                      Hide
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--line)] bg-[var(--card)] p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">Intro text</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`chip text-xs ${introOn ? "chip-active" : ""}`}
                  onClick={() => patchProject({ showIntro: true })}
                >
                  Show
                </button>
                <button
                  type="button"
                  className={`chip text-xs ${introOn ? "" : "chip-active"}`}
                  onClick={() => patchProject({ showIntro: false })}
                >
                  Hide
                </button>
              </div>
            </div>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Hide a section to leave it off the opening card. The value stays
              saved if you turn it back on.
            </p>
            <IntroField
              label="Address / title"
              shown={project.showIntroAddress !== false}
              onChange={(show) => patchProject({ showIntroAddress: show })}
            >
              <input
                className="field"
                value={project.name}
                onChange={(e) => patchProject({ name: e.target.value }, 400)}
              />
            </IntroField>
            <IntroField
              label="Small label"
              shown={project.showIntroKicker !== false}
              onChange={(show) => patchProject({ showIntroKicker: show })}
            >
              <input
                className="field"
                value={project.introKicker ?? "PROPERTY DETAILS"}
                onChange={(e) =>
                  patchProject({ introKicker: e.target.value }, 400)
                }
              />
            </IntroField>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <IntroField
                label="Beds"
                shown={project.showIntroBeds !== false}
                onChange={(show) => patchProject({ showIntroBeds: show })}
              >
                <input
                  className="field"
                  type="number"
                  min={0}
                  value={project.beds ?? 0}
                  onChange={(e) =>
                    patchProject({ beds: Number(e.target.value) }, 400)
                  }
                />
              </IntroField>
              <IntroField
                label="Baths"
                shown={project.showIntroBaths !== false}
                onChange={(show) => patchProject({ showIntroBaths: show })}
              >
                <input
                  className="field"
                  type="number"
                  min={0}
                  value={project.baths ?? 0}
                  onChange={(e) =>
                    patchProject({ baths: Number(e.target.value) }, 400)
                  }
                />
              </IntroField>
              <IntroField
                label="Sq ft"
                shown={project.showIntroSqft !== false}
                onChange={(show) => patchProject({ showIntroSqft: show })}
              >
                <input
                  className="field"
                  type="number"
                  min={0}
                  value={project.sqft ?? 0}
                  onChange={(e) =>
                    patchProject({ sqft: Number(e.target.value) }, 400)
                  }
                />
              </IntroField>
              <IntroField
                label="List price"
                shown={project.showIntroPrice !== false}
                onChange={(show) => patchProject({ showIntroPrice: show })}
              >
                <input
                  className="field"
                  type="number"
                  min={0}
                  value={project.listingPrice ?? 0}
                  onChange={(e) =>
                    patchProject({ listingPrice: Number(e.target.value) }, 400)
                  }
                />
              </IntroField>
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--line)] bg-[var(--card)] p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">Outro text</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`chip text-xs ${outroOn ? "chip-active" : ""}`}
                  onClick={() => patchProject({ showOutro: true })}
                >
                  Show
                </button>
                <button
                  type="button"
                  className={`chip text-xs ${outroOn ? "" : "chip-active"}`}
                  onClick={() => patchProject({ showOutro: false })}
                >
                  Hide
                </button>
              </div>
            </div>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Headline and contact card at the end of the video.
            </p>
            <label className="mt-4 block">
              <span className="mb-2 block text-sm">Headline</span>
              <input
                className="field"
                value={project.outroHeading || "SCHEDULE A SHOWING TODAY"}
                onChange={(e) =>
                  patchProject({ outroHeading: e.target.value }, 400)
                }
              />
            </label>
            <label className="mt-4 block">
              <span className="mb-2 block text-sm">Brokerage or second line</span>
              <input
                className="field"
                value={
                  project.outroBrand ?? "Better Homes and Gardens Real Estate"
                }
                onChange={(e) =>
                  patchProject({ outroBrand: e.target.value }, 400)
                }
              />
            </label>
            <label className="mt-4 block">
              <span className="mb-2 block text-sm">Agent name</span>
              <input
                className="field"
                value={project.agent?.name || ""}
                onChange={(e) => editAgent({ name: e.target.value })}
              />
            </label>
            <div className="mt-4 grid grid-cols-1 gap-3">
              <label>
                <span className="mb-2 block text-sm">Phone</span>
                <input
                  className="field"
                  value={project.agent?.phone || ""}
                  onChange={(e) => editAgent({ phone: e.target.value })}
                />
              </label>
              <label>
                <span className="mb-2 block text-sm">Email</span>
                <input
                  className="field"
                  value={project.agent?.email || ""}
                  onChange={(e) => editAgent({ email: e.target.value })}
                />
              </label>
            </div>
            <p className="mt-3 text-xs text-[var(--muted)]">
              Agent contact is shared with every video that uses this agent.
            </p>
          </section>

          <section className="rounded-3xl border border-[var(--line)] bg-[var(--card)] p-5">
            <h2 className="font-semibold">Video options</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Turn pieces on or off, or change timing, zoom, and music. The preview updates as you edit.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className={`chip text-xs ${project.musicTrack ? "chip-active" : ""}`}
                onClick={() =>
                  patchProject({
                    musicTrack: project.musicTrack
                      ? null
                      : musicTracks.find((t) => t !== "None") || null,
                  })
                }
              >
                Music {project.musicTrack ? "on" : "off"}
              </button>
            </div>
            <label className="mt-4 block">
              <span className="mb-2 block text-sm">Photo duration ({project.photoDuration}s)</span>
              <input
                type="range"
                min={2}
                max={8}
                step={0.5}
                value={project.photoDuration}
                onChange={(e) =>
                  patchProject({ photoDuration: Number(e.target.value) }, 200)
                }
                className="w-full"
              />
            </label>
            <label className="mt-4 block">
              <span className="mb-2 block text-sm">
                Zoom ({project.zoomIntensity <= 0 ? "off" : project.zoomIntensity})
              </span>
              <input
                type="range"
                min={0}
                max={3}
                step={0.1}
                value={project.zoomIntensity}
                onChange={(e) =>
                  patchProject({ zoomIntensity: Number(e.target.value) }, 200)
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
                    {track === "None" ? "None — remove music" : track}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-4 block">
              <span className="mb-2 block text-sm">Music volume ({volumePct}%)</span>
              <input
                type="range"
                min={0}
                max={100}
                value={volumePct}
                disabled={!project.musicTrack}
                onChange={(e) =>
                  patchProject(
                    { musicVolume: Number(e.target.value) / 100 },
                    200,
                  )
                }
                className="w-full disabled:opacity-40"
              />
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
                      <button
                        type="button"
                        className="chip text-xs"
                        onClick={() => removePhoto(photo.id)}
                      >
                        Remove
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
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Intro template</h2>
            <button
              type="button"
              className={`chip text-xs ${introOn ? "chip-active" : ""}`}
              onClick={() => patchProject({ showIntro: !introOn })}
            >
              {introOn ? "Hide intro" : "Show intro"}
            </button>
          </div>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {introOn
              ? "Pick a different opening. Text edits above show up here."
              : "Intro is hidden. Show it to use a template."}
          </p>
          <div className={`mt-4 ${introOn ? "" : "pointer-events-none opacity-40"}`}>
            <TemplatePicker
              kind="intro"
              value={project.introTemplate}
              onChange={(introTemplate) => patchProject({ introTemplate })}
              preview={templatePreview}
            />
          </div>
        </section>
        <section className="rounded-3xl border border-[var(--line)] bg-[var(--card)] p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Outro template</h2>
            <button
              type="button"
              className={`chip text-xs ${outroOn ? "chip-active" : ""}`}
              onClick={() => patchProject({ showOutro: !outroOn })}
            >
              {outroOn ? "Hide outro" : "Show outro"}
            </button>
          </div>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {outroOn
              ? "Pick a different ending. Headline and contact edits show up here."
              : "Outro is hidden. Show it to use a template."}
          </p>
          <div className={`mt-4 ${outroOn ? "" : "pointer-events-none opacity-40"}`}>
            <TemplatePicker
              kind="outro"
              value={project.outroTemplate}
              onChange={(outroTemplate) => patchProject({ outroTemplate })}
              preview={templatePreview}
            />
          </div>
        </section>
      </div>
    </AppShell>
  );
}
