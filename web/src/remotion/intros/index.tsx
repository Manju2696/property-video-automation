import React from "react";
import { AbsoluteFill, Img } from "remotion";
import {
  FONT,
  GOLD,
  INK,
  SERIF,
  useFadeIn,
  useScalePop,
  useSlideLeft,
  useSlideRight,
  useSlideUp,
  useWidthGrow,
} from "../anim";
import type { IntroProps } from "../types";

function IconImg({
  src,
  size,
  filter,
}: {
  src: string;
  size: number;
  filter?: string;
}) {
  return (
    <Img
      src={src}
      style={{ width: size, height: size, objectFit: "contain", filter }}
    />
  );
}

function PhotoOrPlaceholder({
  src,
  style,
}: {
  src?: string;
  style?: React.CSSProperties;
}) {
  if (src) {
    return <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", ...style }} />;
  }
  return <div style={{ width: "100%", height: "100%", background: "#ccc", ...style }} />;
}

export const TemplateA: React.FC<IntroProps> = (p) => {
  const photo1 = useSlideUp(0, 800, 120);
  const photo2 = useSlideUp(200, 800, 120);
  const addr = useSlideUp(500, 800);
  const sub = useSlideUp(1200, 700);
  const icons = useSlideUp(1400, 700);
  const price = useSlideUp(2200, 700);
  const stats = [
    { icon: p.bedIcon, label: `${p.beds} BEDS` },
    { icon: p.bathIcon, label: `${p.baths} BATHS` },
    { icon: p.sqftIcon, label: `${p.sqftLabel || "—"} SQ FT` },
  ];
  const photoTop = p.photos[0] || "";
  const photoBottom = p.photos[1] || p.photos[0] || "";

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#fff",
        fontFamily: FONT,
        display: "flex",
        flexDirection: "row",
        width: "100%",
        height: "100%",
      }}
    >
      {/* Left: copy */}
      <div
        style={{
          width: "50%",
          height: "100%",
          backgroundColor: "#fff",
          padding: "0 72px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          boxSizing: "border-box",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            ...addr,
            fontWeight: 700,
            fontSize: 56,
            color: INK,
            lineHeight: 1.15,
            maxWidth: 820,
          }}
        >
          {p.propertyName}
        </div>
        <div
          style={{
            ...sub,
            fontSize: 18,
            color: "#aaa",
            letterSpacing: 5,
            fontWeight: 400,
            marginTop: 56,
          }}
        >
          {p.kicker ?? "PROPERTY DETAILS"}
        </div>
        <div style={{ ...icons, display: "flex", gap: 56, marginTop: 32 }}>
          {stats.map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 110,
                  height: 110,
                  border: "2.5px solid #ccc",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px",
                  overflow: "hidden",
                }}
              >
                <IconImg src={s.icon} size={78} />
              </div>
              <div
                style={{
                  fontSize: 20,
                  color: "#555",
                  fontWeight: 500,
                  letterSpacing: 1.5,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            ...price,
            marginTop: 56,
            display: "flex",
            gap: 16,
            alignItems: "baseline",
          }}
        >
          <span
            style={{
              fontWeight: 700,
              fontSize: 22,
              color: INK,
              letterSpacing: 1.5,
            }}
          >
            LIST PRICE:
          </span>
          <span style={{ fontWeight: 600, fontSize: 54, color: INK }}>
            {p.priceLabel}
          </span>
        </div>
      </div>

      {/* Right: two photos stacked up / down — slide up into place */}
      <div
        style={{
          width: "50%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "50%",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              opacity: photo1.opacity,
              transform: photo1.transform,
            }}
          >
            <PhotoOrPlaceholder src={photoTop} />
          </div>
        </div>
        <div
          style={{
            width: "100%",
            height: "50%",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              opacity: photo2.opacity,
              transform: photo2.transform,
            }}
          >
            <PhotoOrPlaceholder src={photoBottom} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const TemplateB: React.FC<IntroProps> = (p) => {
  const bg = useFadeIn(0, 800);
  const e0 = useFadeIn(400, 600);
  const e1 = useSlideUp(700, 700);
  const e2 = useSlideUp(1400, 700);
  const e3 = useSlideUp(2200, 700);
  const e4 = useFadeIn(2600, 500);
  const stats = [
    { icon: p.bedIcon, value: p.beds, label: "BEDS" },
    { icon: p.bathIcon, value: p.baths, label: "BATHS" },
    { icon: p.sqftIcon, value: p.sqftLabel || "—", label: "SQ FT" },
  ];
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", fontFamily: FONT }}>
      {p.photos[0] && <Img src={p.photos[0]} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: bg.opacity }} />}
      <AbsoluteFill style={{ backgroundColor: "rgba(0,0,0,0.55)" }} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ ...e0, width: 60, height: 3, backgroundColor: GOLD }} />
        <div style={{ ...e1, marginTop: 24, fontSize: 48, fontWeight: 700, color: "#fff", letterSpacing: 2 }}>{p.propertyName}</div>
        <div style={{ ...e2, display: "flex", gap: 36, marginTop: 30, alignItems: "center" }}>
          {stats.map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <div style={{ width: 1, height: 60, background: "rgba(255,255,255,0.2)" }} />}
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 64, height: 64, border: "2px solid rgba(255,255,255,0.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
                  <IconImg src={s.icon} size={30} />
                </div>
                <div style={{ fontSize: 24, fontWeight: 600, color: "#fff" }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: 2 }}>{s.label}</div>
              </div>
            </React.Fragment>
          ))}
        </div>
        <div style={{ ...e3, marginTop: 30, fontSize: 46, fontWeight: 700, color: GOLD }}>{p.priceLabel}</div>
        <div style={{ ...e4, width: 60, height: 3, backgroundColor: GOLD, marginTop: 24 }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const TemplateC: React.FC<IntroProps> = (p) => {
  const bg = useFadeIn(0, 800);
  const e0 = useSlideLeft(400, 600);
  const e1 = useSlideLeft(700, 700);
  const line = useWidthGrow(1200, 600, 70);
  const e3 = useSlideLeft(1600, 700);
  const e4 = useSlideLeft(2300, 700);
  const stats = [
    { icon: p.bedIcon, value: p.beds, label: "Beds" },
    { icon: p.bathIcon, value: p.baths, label: "Baths" },
    { icon: p.sqftIcon, value: p.sqftLabel || "—", label: "Sq Ft" },
  ];
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", fontFamily: FONT }}>
      {p.photos[0] && <Img src={p.photos[0]} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: bg.opacity }} />}
      <AbsoluteFill style={{ background: "linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 40%, transparent 75%)" }} />
      <div style={{ position: "absolute", left: 100, top: "50%", transform: "translateY(-50%)", maxWidth: 750 }}>
        <div style={{ ...e0, fontSize: 16, color: GOLD, letterSpacing: 5 }}>{p.kicker ?? "PROPERTY DETAILS"}</div>
        <div style={{ ...e1, marginTop: 14, fontSize: 48, fontWeight: 700, color: "#fff", lineHeight: 1.15 }}>{p.propertyName}</div>
        <div style={{ height: 3, backgroundColor: GOLD, margin: "24px 0", width: line.width }} />
        <div style={{ ...e3, display: "flex", gap: 28 }}>
          {stats.map((s) => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <IconImg src={s.icon} size={28} />
              <span style={{ fontSize: 18, color: "rgba(255,255,255,0.8)" }}>
                <b style={{ fontSize: 26, color: "#fff" }}>{s.value}</b> {s.label}
              </span>
            </div>
          ))}
        </div>
        <div style={{ ...e4, marginTop: 28, fontSize: 42, fontWeight: 700, color: "#fff" }}>{p.priceLabel}</div>
      </div>
    </AbsoluteFill>
  );
};

export const TemplateD: React.FC<IntroProps> = (p) => {
  const photo = useScalePop(0, 800);
  const e0 = useFadeIn(400, 500);
  const e1 = useSlideUp(700, 700);
  const line = useWidthGrow(1200, 600, 80);
  const e3 = useSlideUp(1600, 700);
  const e4 = useSlideUp(2300, 700);
  const stats = [
    { icon: p.bedIcon, value: p.beds, label: "BEDS" },
    { icon: p.bathIcon, value: p.baths, label: "BATHS" },
    { icon: p.sqftIcon, value: p.sqftLabel || "—", label: "SQ FT" },
  ];
  return (
    <AbsoluteFill style={{ backgroundColor: "#1a1a1a", fontFamily: FONT, display: "flex" }}>
      <div style={{ width: 1060, padding: "80px 90px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ ...e0, fontSize: 14, color: GOLD, letterSpacing: 5 }}>{p.kicker ?? "PROPERTY DETAILS"}</div>
        <div style={{ ...e1, marginTop: 16, fontSize: 46, fontWeight: 700, color: "#fff", lineHeight: 1.15 }}>{p.propertyName}</div>
        <div style={{ height: 2, backgroundColor: GOLD, margin: "30px 0", width: line.width }} />
        <div style={{ ...e3, display: "flex", gap: 18 }}>
          {stats.map((s) => (
            <div key={s.label} style={{ border: "1.5px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: "16px 24px", textAlign: "center" }}>
              <IconImg src={s.icon} size={30} />
              <div style={{ fontSize: 28, fontWeight: 600, color: "#fff", marginTop: 8 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: 2, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ ...e4, marginTop: 30, fontSize: 44, fontWeight: 700, color: GOLD }}>{p.priceLabel}</div>
      </div>
      <div style={{ width: 860, position: "relative" }}>
        <div style={{ ...photo, position: "absolute", inset: 50, borderRadius: 14, overflow: "hidden" }}>
          <PhotoOrPlaceholder src={p.photos[0]} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const TemplateE: React.FC<IntroProps> = (p) => {
  const photo = useSlideLeft(0, 800);
  const e1 = useSlideUp(500, 600);
  const e2 = useSlideUp(800, 700);
  const line = useWidthGrow(1300, 600, 50);
  const e4 = useSlideUp(1700, 700);
  const e5 = useSlideUp(2300, 700);
  const stats = [
    { icon: p.bedIcon, value: p.beds, label: "Beds" },
    { icon: p.bathIcon, value: p.baths, label: "Baths" },
    { icon: p.sqftIcon, value: p.sqftLabel || "—", label: "Sq Ft" },
  ];
  return (
    <AbsoluteFill style={{ backgroundColor: "#f5f0eb", fontFamily: FONT, display: "flex" }}>
      <div style={{ width: 1120, position: "relative" }}>
        <div style={{ ...photo, position: "absolute", inset: "50px 0 50px 50px", borderRadius: 10, overflow: "hidden" }}>
          <PhotoOrPlaceholder src={p.photos[0]} />
        </div>
      </div>
      <div style={{ width: 800, padding: "80px 60px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ ...e1, fontFamily: SERIF, fontSize: 13, color: "#999", letterSpacing: 4 }}>{p.kicker ?? "PROPERTY DETAILS"}</div>
        <div style={{ ...e2, marginTop: 16, fontFamily: SERIF, fontSize: 40, fontWeight: 700, color: INK, lineHeight: 1.2 }}>{p.propertyName}</div>
        <div style={{ height: 2, backgroundColor: INK, margin: "24px 0", width: line.width }} />
        <div style={{ ...e4, display: "flex", gap: 24 }}>
          {stats.map((s) => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <IconImg src={s.icon} size={24} />
              <span style={{ fontSize: 16, color: "#666" }}>
                <b style={{ color: INK }}>{s.value}</b> {s.label}
              </span>
            </div>
          ))}
        </div>
        <div style={{ ...e5, marginTop: 24, fontFamily: SERIF, fontSize: 40, fontWeight: 700, color: INK }}>{p.priceLabel}</div>
      </div>
    </AbsoluteFill>
  );
};

export const TemplateF: React.FC<IntroProps> = (p) => {
  const photo = useSlideRight(0, 800);
  const e0 = useSlideUp(500, 700);
  const e1 = useSlideUp(1300, 700);
  const e2 = useSlideUp(2100, 700);
  const chips = [
    { icon: p.bedIcon, label: `${p.beds} BD` },
    { icon: p.bathIcon, label: `${p.baths} BA` },
    { icon: p.sqftIcon, label: `${p.sqftLabel || "—"} SF` },
  ];
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", fontFamily: FONT, display: "flex" }}>
      <div style={{ width: 960, backgroundColor: "#1a1a1a", padding: 80, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ ...e0, fontSize: 52, fontWeight: 800, color: "#fff", lineHeight: 1.05, letterSpacing: -1 }}>{p.propertyName}</div>
        <div style={{ ...e1, marginTop: 24, display: "flex", gap: 12 }}>
          {chips.map((c) => (
            <div key={c.label} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 8, padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
              <IconImg src={c.icon} size={22} />
              <span style={{ fontSize: 16, color: "#fff", fontWeight: 600 }}>{c.label}</span>
            </div>
          ))}
        </div>
        <div style={{ ...e2, marginTop: 28, fontSize: 48, fontWeight: 800, color: "#fff" }}>{p.priceLabel}</div>
      </div>
      <div style={{ ...photo, width: 960, overflow: "hidden" }}>
        <PhotoOrPlaceholder src={p.photos[0]} />
      </div>
    </AbsoluteFill>
  );
};

export const TemplateG: React.FC<IntroProps> = (p) => {
  const thumbs = useScalePop(200, 600);
  const e1 = useSlideUp(600, 700);
  const line = useWidthGrow(1100, 600, 100);
  const e3 = useSlideUp(1500, 700);
  const e4 = useSlideUp(2200, 700);
  const stats = [
    { icon: p.bedIcon, label: `${p.beds} BEDS` },
    { icon: p.bathIcon, label: `${p.baths} BATHS` },
    { icon: p.sqftIcon, label: `${p.sqftLabel || "—"} SQ FT` },
  ];
  return (
    <AbsoluteFill style={{ backgroundColor: "#fff", fontFamily: FONT, justifyContent: "center", alignItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ ...thumbs, display: "flex", gap: 8, justifyContent: "center" }}>
          {[p.photos[0], p.photos[1] || p.photos[0]].map((src, i) => (
            <div key={i} style={{ width: 120, height: 75, borderRadius: 8, overflow: "hidden" }}>
              <PhotoOrPlaceholder src={src} />
            </div>
          ))}
        </div>
        <div style={{ ...e1, marginTop: 24, fontSize: 44, fontWeight: 700, color: INK }}>{p.propertyName}</div>
        <div style={{ height: 1.5, backgroundColor: "#ddd", margin: "24px auto", width: line.width }} />
        <div style={{ ...e3, display: "flex", gap: 48, justifyContent: "center" }}>
          {stats.map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ width: 74, height: 74, border: "2px solid #ccc", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                <IconImg src={s.icon} size={34} />
              </div>
              <div style={{ fontSize: 15, color: "#777", fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ ...e4, marginTop: 24, fontSize: 42, fontWeight: 600, color: INK }}>{p.priceLabel}</div>
      </div>
    </AbsoluteFill>
  );
};

export const TemplateH: React.FC<IntroProps> = (p) => {
  const g0 = useFadeIn(0, 500);
  const g1 = useFadeIn(150, 500);
  const g2 = useFadeIn(300, 500);
  const g3 = useFadeIn(450, 500);
  const e0 = useSlideUp(700, 700);
  const e1 = useSlideUp(1400, 700);
  const e2 = useSlideUp(2200, 700);
  const grid = [p.photos[0], p.photos[1], p.photos[2], p.photos[3]];
  const opacities = [g0.opacity, g1.opacity, g2.opacity, g3.opacity];
  const stats = [
    { icon: p.bedIcon, label: `${p.beds} Beds` },
    { icon: p.bathIcon, label: `${p.baths} Baths` },
    { icon: p.sqftIcon, label: `${p.sqftLabel || "—"} Sq Ft` },
  ];
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", fontFamily: FONT }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", width: "100%", height: "100%" }}>
        {grid.map((src, i) => (
          <div key={i} style={{ overflow: "hidden", opacity: opacities[i] }}>
            <PhotoOrPlaceholder src={src || p.photos[0]} style={{ filter: i > 1 ? "brightness(0.9)" : undefined }} />
          </div>
        ))}
      </div>
      <AbsoluteFill style={{ backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" }}>
        <div style={{ ...e0, fontSize: 46, fontWeight: 700, color: "#fff" }}>{p.propertyName}</div>
        <div style={{ ...e1, display: "flex", gap: 24, marginTop: 24, alignItems: "center" }}>
          {stats.map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 20 }}>|</div>}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <IconImg src={s.icon} size={24} />
                <span style={{ fontSize: 18, color: "rgba(255,255,255,0.9)" }}>{s.label}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
        <div style={{ ...e2, marginTop: 24, fontSize: 44, fontWeight: 700, color: GOLD }}>{p.priceLabel}</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const TemplateI: React.FC<IntroProps> = (p) => {
  const strip = useWidthGrow(100, 600, Math.round(1920 * 0.02));
  const photo = useFadeIn(300, 700);
  const e0 = useSlideLeft(600, 600);
  const e1 = useSlideLeft(900, 700);
  const e2 = useSlideLeft(1500, 700);
  const e3 = useSlideLeft(2200, 700);
  const rows = [
    { icon: p.bedIcon, label: `${p.beds} Bedrooms` },
    { icon: p.bathIcon, label: `${p.baths} Bathrooms` },
    { icon: p.sqftIcon, label: `${p.sqftLabel || "—"} Sq Ft` },
  ];
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", fontFamily: FONT, display: "flex" }}>
      <div style={{ width: strip.width, backgroundColor: GOLD, flexShrink: 0 }} />
      <div style={{ width: 920, backgroundColor: "#1a1a1a", padding: "80px 70px", display: "flex", flexDirection: "column", justifyContent: "center", flexShrink: 0 }}>
        <div style={{ ...e0, fontSize: 14, color: GOLD, letterSpacing: 4 }}>{p.kicker ?? "PROPERTY DETAILS"}</div>
        <div style={{ ...e1, marginTop: 14, fontSize: 44, fontWeight: 700, color: "#fff", lineHeight: 1.15 }}>{p.propertyName}</div>
        <div style={{ ...e2, marginTop: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          {rows.map((r) => (
            <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <IconImg src={r.icon} size={26} />
              <span style={{ fontSize: 17, color: "rgba(255,255,255,0.7)" }}>{r.label}</span>
            </div>
          ))}
        </div>
        <div style={{ ...e3, marginTop: 28, fontSize: 42, fontWeight: 700, color: GOLD }}>{p.priceLabel}</div>
      </div>
      <div style={{ ...photo, flex: 1, overflow: "hidden" }}>
        <PhotoOrPlaceholder src={p.photos[0]} />
      </div>
    </AbsoluteFill>
  );
};

export const TemplateJ: React.FC<IntroProps> = (p) => {
  const bg = useFadeIn(0, 800);
  const e0 = useSlideUp(500, 700);
  const line = useWidthGrow(1100, 800, 1760);
  const e2 = useSlideUp(1600, 700);
  const stats = [
    { icon: p.bedIcon, label: `${p.beds} Beds` },
    { icon: p.bathIcon, label: `${p.baths} Baths` },
    { icon: p.sqftIcon, label: `${p.sqftLabel || "—"} Sq Ft` },
  ];
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", fontFamily: FONT }}>
      {p.photos[0] && <Img src={p.photos[0]} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: bg.opacity }} />}
      <AbsoluteFill style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 35%, transparent 65%)" }} />
      <div style={{ position: "absolute", left: 80, right: 80, bottom: 50 }}>
        <div style={{ ...e0, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ fontSize: 42, fontWeight: 700, color: "#fff", lineHeight: 1.15, maxWidth: 1200 }}>{p.propertyName}</div>
          <div style={{ fontSize: 44, fontWeight: 700, color: GOLD }}>{p.priceLabel}</div>
        </div>
        <div style={{ height: 1.5, backgroundColor: "rgba(255,255,255,0.2)", margin: "20px 0", width: line.width }} />
        <div style={{ ...e2, display: "flex", gap: 32 }}>
          {stats.map((s) => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <IconImg src={s.icon} size={24} />
              <span style={{ fontSize: 17, color: "rgba(255,255,255,0.8)" }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const INTRO_COMPONENTS: Record<string, React.FC<IntroProps>> = {
  A: TemplateA,
  B: TemplateB,
  C: TemplateC,
  D: TemplateD,
  E: TemplateE,
  F: TemplateF,
  G: TemplateG,
  H: TemplateH,
  I: TemplateI,
  J: TemplateJ,
};
