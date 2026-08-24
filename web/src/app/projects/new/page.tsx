"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { TemplatePicker } from "@/components/TemplatePicker";
import { ANIMATION_STYLES } from "@/lib/constants";

type Agent = { id: number; name: string; phone: string | null; email: string | null };

export default function NewProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [beds, setBeds] = useState(3);
  const [baths, setBaths] = useState(2);
  const [sqft, setSqft] = useState(2000);
  const [listingPrice, setListingPrice] = useState(750000);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentMode, setAgentMode] = useState<"existing" | "new">("new");
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [agentName, setAgentName] = useState("");
  const [agentPhone, setAgentPhone] = useState("");
  const [agentEmail, setAgentEmail] = useState("");
  const [introTemplate, setIntroTemplate] = useState("A");
  const [outroTemplate, setOutroTemplate] = useState("1");
  const [animationStyle, setAnimationStyle] = useState("fade_in");
  const [musicTracks, setMusicTracks] = useState<string[]>(["None"]);
  const [musicTrack, setMusicTrack] = useState("SPV01.mp3");
  const [musicVolume, setMusicVolume] = useState(50);
  const [photoDuration, setPhotoDuration] = useState(4);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.json())
      .then((d) => {
        setAgents(d.agents || []);
        if (d.agents?.length) {
          setAgentMode("existing");
          setSelectedAgentId(String(d.agents[0].id));
        }
      });
    fetch("/api/music")
      .then((r) => r.json())
      .then((d) => {
        const tracks: string[] = d.tracks || ["None"];
        setMusicTracks(tracks);
        if (tracks.includes("SPV01.mp3")) {
          setMusicTrack("SPV01.mp3");
        }
      });
  }, []);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const canContinue = useMemo(() => {
    if (step === 1) return files.length > 0;
    if (step === 2) {
      if (!name.trim()) return false;
      if (agentMode === "existing") return Boolean(selectedAgentId);
      return Boolean(agentName.trim());
    }
    return true;
  }, [step, files, name, agentMode, selectedAgentId, agentName]);

  async function createProject() {
    setBusy(true);
    setError("");
    try {
      // 1) Create project without photos (avoids Vercel ~4.5MB body limit)
      const form = new FormData();
      form.set("name", name);
      form.set("beds", String(beds));
      form.set("baths", String(baths));
      form.set("sqft", String(sqft));
      form.set("listingPrice", String(listingPrice));
      form.set("introTemplate", introTemplate);
      form.set("outroTemplate", outroTemplate);
      form.set("animationStyle", animationStyle);
      form.set("musicTrack", musicTrack);
      form.set("musicVolume", String(musicVolume));
      form.set("photoDuration", String(photoDuration));
      if (agentMode === "existing") {
        form.set("agentId", selectedAgentId);
      } else {
        form.set("agentName", agentName);
        form.set("agentPhone", agentPhone);
        form.set("agentEmail", agentEmail);
      }

      const res = await fetch("/api/projects", { method: "POST", body: form });
      let data: { project?: { id: number }; error?: string } = {};
      try {
        data = await res.json();
      } catch {
        setError(
          `Create failed (HTTP ${res.status}). Check that env vars are set, then redeploy.`,
        );
        return;
      }
      if (!res.ok || !data.project?.id) {
        setError(data.error || "Failed to create project");
        return;
      }

      const projectId = data.project.id;

      // 2) Upload photos one-by-one (each request stays under Vercel body limit)
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 4_000_000) {
          setError(
            `"${file.name}" is over 4MB. Compress it or use the local app for large originals.`,
          );
          return;
        }
        const photoForm = new FormData();
        photoForm.set("startOrder", String(i));
        photoForm.append("photos", file);
        const up = await fetch(`/api/projects/${projectId}/photos`, {
          method: "POST",
          body: photoForm,
        });
        if (!up.ok) {
          let msg = `Photo ${i + 1}/${files.length} failed (HTTP ${up.status})`;
          try {
            const errBody = await up.json();
            if (errBody.error) msg = errBody.error;
          } catch {
            /* ignore */
          }
          setError(msg);
          return;
        }
      }

      // Classification can take a while; never block forever on it
      try {
        const classifyRes = await fetch(`/api/projects/${projectId}/classify`, {
          method: "POST",
        });
        if (!classifyRes.ok) {
          console.warn("Classify returned", classifyRes.status);
        }
      } catch (err) {
        console.warn("Classify request failed", err);
      }
      router.push(`/projects/${projectId}`);
    } catch (err) {
      console.error(err);
      setError("Something went wrong creating the project. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title="New Project">
      <div className="mb-8 flex gap-2">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className={`h-2 flex-1 rounded-full ${
              step >= n ? "bg-[var(--accent)]" : "bg-[var(--line)]"
            }`}
          />
        ))}
      </div>

      {step === 1 && (
        <section className="rounded-3xl border border-[var(--line)] bg-[var(--card)] p-8">
          <h2 className="text-xl font-semibold">Upload listing photos</h2>
          <p className="mt-2 text-[var(--muted)]">
            JPG, PNG, or WebP. AI will classify rooms after you create the project.
          </p>
          <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--line)] bg-white px-6 py-16">
            <span className="font-semibold text-[var(--accent)]">Choose photos</span>
            <span className="mt-2 text-sm text-[var(--muted)]">
              {files.length ? `${files.length} selected` : "Drop or browse files"}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
            />
          </label>
          {previews.length > 0 && (
            <div className="mt-6 grid grid-cols-3 gap-3 md:grid-cols-5">
              {previews.map((src) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={src} src={src} alt="" className="aspect-square rounded-xl object-cover" />
              ))}
            </div>
          )}
        </section>
      )}

      {step === 2 && (
        <section className="space-y-6 rounded-3xl border border-[var(--line)] bg-[var(--card)] p-8">
          <h2 className="text-xl font-semibold">Property & agent</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="md:col-span-2">
              <span className="mb-2 block text-sm font-medium">Property name / address</span>
              <input className="field" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium">Beds</span>
              <input className="field" type="number" value={beds} onChange={(e) => setBeds(Number(e.target.value))} />
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium">Baths</span>
              <input className="field" type="number" value={baths} onChange={(e) => setBaths(Number(e.target.value))} />
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium">Sq ft</span>
              <input className="field" type="number" value={sqft} onChange={(e) => setSqft(Number(e.target.value))} />
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium">List price</span>
              <input className="field" type="number" value={listingPrice} onChange={(e) => setListingPrice(Number(e.target.value))} />
            </label>
          </div>

          <div className="flex gap-3">
            <button type="button" className={`chip ${agentMode === "existing" ? "chip-active" : ""}`} onClick={() => setAgentMode("existing")}>
              Existing agent
            </button>
            <button type="button" className={`chip ${agentMode === "new" ? "chip-active" : ""}`} onClick={() => setAgentMode("new")}>
              New agent
            </button>
          </div>

          {agentMode === "existing" ? (
            <select className="field" value={selectedAgentId} onChange={(e) => setSelectedAgentId(e.target.value)}>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <input className="field" placeholder="Agent name" value={agentName} onChange={(e) => setAgentName(e.target.value)} />
              <input className="field" placeholder="Phone" value={agentPhone} onChange={(e) => setAgentPhone(e.target.value)} />
              <input className="field" placeholder="Email" value={agentEmail} onChange={(e) => setAgentEmail(e.target.value)} />
            </div>
          )}
        </section>
      )}

      {step === 3 && (
        <section className="space-y-8 rounded-3xl border border-[var(--line)] bg-[var(--card)] p-8">
          <div>
            <h2 className="text-xl font-semibold">Intro template</h2>
            <div className="mt-4">
              <TemplatePicker
                kind="intro"
                value={introTemplate}
                onChange={setIntroTemplate}
                preview={{
                  propertyName: name || "123 Maple Street",
                  beds,
                  baths,
                  sqftLabel: sqft.toLocaleString("en-US"),
                  priceLabel: new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  }).format(listingPrice),
                  photos: previews,
                  agentName: agentMode === "new" ? agentName : agents.find((a) => String(a.id) === selectedAgentId)?.name,
                  agentPhone: agentMode === "new" ? agentPhone : agents.find((a) => String(a.id) === selectedAgentId)?.phone || undefined,
                  agentEmail: agentMode === "new" ? agentEmail : agents.find((a) => String(a.id) === selectedAgentId)?.email || undefined,
                }}
              />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold">Outro template</h2>
            <div className="mt-4">
              <TemplatePicker
                kind="outro"
                value={outroTemplate}
                onChange={setOutroTemplate}
                preview={{
                  propertyName: name || "123 Maple Street",
                  beds,
                  baths,
                  sqftLabel: sqft.toLocaleString("en-US"),
                  priceLabel: new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  }).format(listingPrice),
                  photos: previews,
                  agentName: agentMode === "new" ? agentName : agents.find((a) => String(a.id) === selectedAgentId)?.name,
                  agentPhone: agentMode === "new" ? agentPhone : agents.find((a) => String(a.id) === selectedAgentId)?.phone || undefined,
                  agentEmail: agentMode === "new" ? agentEmail : agents.find((a) => String(a.id) === selectedAgentId)?.email || undefined,
                }}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-medium">Animation style</span>
              <select className="field" value={animationStyle} onChange={(e) => setAnimationStyle(e.target.value)}>
                {ANIMATION_STYLES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium">Music</span>
              <select className="field" value={musicTrack} onChange={(e) => setMusicTrack(e.target.value)}>
                {musicTracks.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium">Music volume ({musicVolume}%)</span>
              <input type="range" min={0} max={100} value={musicVolume} onChange={(e) => setMusicVolume(Number(e.target.value))} className="w-full" />
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium">Photo duration ({photoDuration}s)</span>
              <input type="range" min={2} max={8} step={0.5} value={photoDuration} onChange={(e) => setPhotoDuration(Number(e.target.value))} className="w-full" />
            </label>
          </div>
        </section>
      )}

      {error ? <p className="mt-4 text-[var(--danger)]">{error}</p> : null}

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          className="rounded-full border border-[var(--line)] bg-white px-5 py-2.5 text-sm font-semibold disabled:opacity-40"
          disabled={step === 1 || busy}
          onClick={() => setStep((s) => Math.max(1, s - 1))}
        >
          Back
        </button>
        {step < 3 ? (
          <button
            type="button"
            className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            disabled={!canContinue}
            onClick={() => setStep((s) => s + 1)}
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            disabled={busy}
            onClick={createProject}
          >
            {busy ? "Creating & classifying…" : "Create project"}
          </button>
        )}
      </div>

      </AppShell>
  );
}
