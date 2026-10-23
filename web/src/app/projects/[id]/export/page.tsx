"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";

export default function ExportPage() {
  const params = useParams();
  const id = String(params.id);
  const [format, setFormat] = useState<"landscape" | "vertical" | "both">(
    "landscape",
  );
  const [busy, setBusy] = useState(false);
  const [statusLabel, setStatusLabel] = useState("");
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [outputs, setOutputs] = useState<Record<string, string>>({});
  const [projectName, setProjectName] = useState("Project");

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.project?.name) setProjectName(d.project.name);
      });
  }, [id]);

  async function render() {
    setBusy(true);
    setError("");
    setWarning("");
    setOutputs({});
    setStatusLabel("Starting the render");
    const started = Date.now();
    try {
      const res = await fetch(`/api/projects/${id}/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Render failed");
      }

      while (Date.now() - started < 45 * 60 * 1000) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const statusRes = await fetch(`/api/projects/${id}/render`);
        const status = await statusRes.json().catch(() => ({}));
        if (!statusRes.ok) {
          throw new Error(status.error || "Lost contact with the renderer");
        }
        if (status.status === "failed") {
          throw new Error(status.error || "Render failed");
        }
        const progress =
          typeof status.progress === "number" ? status.progress : 0;
        setStatusLabel(
          progress > 0
            ? `${status.label || "Rendering"} · ${progress}%`
            : status.label || "Preparing the video",
        );
        if (status.status === "done") {
          setOutputs(status.outputs || {});
          setWarning(status.warning || "");
          return;
        }
      }
      throw new Error("The render is still running. Refresh this page in a few minutes and check again.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Render failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell
      title="Export"
      action={
        <Link
          href={`/projects/${id}`}
          className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold"
        >
          Back to review
        </Link>
      }
    >
      <div className="mx-auto max-w-2xl rounded-3xl border border-[var(--line)] bg-[var(--card)] p-8">
        <p className="text-sm uppercase tracking-[0.18em] text-[var(--gold)]">
          Remotion render
        </p>
        <h2 className="brand-serif mt-2 text-3xl">{projectName}</h2>
        <p className="mt-3 text-[var(--muted)]">
          Landscape is 1920×1080, vertical is 1080×1920. A full photo set can
          take several minutes. Keep this page open until the download appears.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          {(
            [
              ["landscape", "Landscape 16:9"],
              ["vertical", "Vertical 9:16"],
              ["both", "Both formats"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFormat(value)}
              className={`chip ${format === value ? "chip-active" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={render}
          disabled={busy}
          className="mt-8 w-full rounded-xl bg-[var(--accent)] px-4 py-3 font-semibold text-white disabled:opacity-60"
        >
          {busy ? statusLabel || "Rendering…" : "Render video"}
        </button>

        {error ? <p className="mt-4 text-[var(--danger)]">{error}</p> : null}
        {warning ? <p className="mt-4 text-[var(--muted)]">{warning}</p> : null}

        {Object.keys(outputs).length > 0 && (
          <div className="mt-8 space-y-3">
            <h3 className="font-semibold">Downloads</h3>
            {Object.entries(outputs).map(([key, url]) => (
              <a
                key={key}
                href={url}
                download
                className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-white px-4 py-3 font-medium hover:border-[var(--accent)]"
              >
                <span className="capitalize">{key}.mp4</span>
                <span className="text-[var(--accent)]">Download</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
