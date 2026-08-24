import React from "react";
import { AbsoluteFill, Img } from "remotion";
import {
  FONT,
  GOLD,
  INK,
  SERIF,
  useFadeIn,
  useFadeOut,
  useScalePop,
  useSlideLeft,
  useSlideUp,
  useStripSlideIn,
  useWidthGrow,
} from "../anim";
import type { OutroProps } from "../types";

function BgPhoto({ src, opacity = 1 }: { src: string | null; opacity?: number }) {
  if (!src) return <AbsoluteFill style={{ backgroundColor: "#111" }} />;
  return (
    <Img
      src={src}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        opacity,
      }}
    />
  );
}

function DarkStrip({ children, left }: { children: React.ReactNode; left: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left,
        top: "50%",
        transform: "translateY(-50%)",
        width: 1920,
        height: 580,
        backgroundColor: "rgba(0,0,0,0.6)",
        zIndex: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </div>
  );
}

function EndFade() {
  const black = useFadeIn(4000, 1500);
  return (
    <AbsoluteFill
      style={{ backgroundColor: "#000", opacity: black.opacity, zIndex: 10 }}
    />
  );
}

export const Template1: React.FC<OutroProps> = (p) => {
  const strip = useStripSlideIn(0, 800);
  const bgOut = useFadeOut(4000, 1500);
  const e0 = useSlideUp(800, 700);
  const gl = useWidthGrow(1200, 500, 100);
  const e1 = useSlideUp(1500, 600);
  const e2 = useSlideUp(1800, 600);
  const e3 = useSlideUp(2100, 600);
  const e4 = useSlideUp(2400, 600);
  return (
    <AbsoluteFill style={{ fontFamily: FONT, backgroundColor: "#000" }}>
      <BgPhoto src={p.backgroundSrc} opacity={bgOut.opacity} />
      <DarkStrip left={strip.left}>
        <div style={{ textAlign: "center", zIndex: 5 }}>
          <div style={{ ...e0, fontSize: 48, fontWeight: 700, letterSpacing: 3, color: "#fff" }}>{p.heading}</div>
          <div style={{ height: 3, backgroundColor: GOLD, margin: "28px auto", width: gl.width }} />
          <div style={{ ...e1, fontSize: 30, fontWeight: 400, color: "rgba(255,255,255,0.9)", letterSpacing: 2 }}>{p.agentName}</div>
          <div style={{ ...e2, fontSize: 26, color: "rgba(255,255,255,0.7)", marginTop: 14 }}>{p.propertyName}</div>
          {p.agentPhone ? <div style={{ ...e3, fontSize: 26, color: "rgba(255,255,255,0.7)", marginTop: 14 }}>PHONE: {p.agentPhone}</div> : null}
          {p.agentEmail ? <div style={{ ...e4, fontSize: 26, color: "rgba(255,255,255,0.7)", marginTop: 14 }}>{p.agentEmail}</div> : null}
        </div>
      </DarkStrip>
      <EndFade />
    </AbsoluteFill>
  );
};

export const Template2: React.FC<OutroProps> = (p) => {
  const strip = useStripSlideIn(0, 800);
  const bgOut = useFadeOut(4000, 1500);
  const e0 = useScalePop(800, 600);
  const e1 = useScalePop(1200, 500);
  const e2 = useSlideUp(1700, 600);
  const e3 = useSlideUp(2200, 600);
  const contact = [p.propertyName, p.agentPhone, p.agentEmail].filter(Boolean).join(" • ");
  return (
    <AbsoluteFill style={{ fontFamily: FONT, backgroundColor: "#000" }}>
      <BgPhoto src={p.backgroundSrc} opacity={bgOut.opacity} />
      <DarkStrip left={strip.left}>
        <div style={{ textAlign: "center" }}>
          <div style={{ ...e0, fontSize: 52, fontWeight: 800, letterSpacing: 4, color: "#fff" }}>{p.heading}</div>
          <div style={{ ...e1, fontSize: 28, fontWeight: 300, letterSpacing: 8, color: GOLD, marginTop: 6 }}>TODAY</div>
          <div style={{ ...e2, fontSize: 22, color: "rgba(255,255,255,0.7)", letterSpacing: 2, marginTop: 30 }}>{p.agentName}</div>
          <div style={{ ...e3, fontSize: 20, color: "rgba(255,255,255,0.5)", marginTop: 14 }}>{contact}</div>
        </div>
      </DarkStrip>
      <EndFade />
    </AbsoluteFill>
  );
};

export const Template3: React.FC<OutroProps> = (p) => {
  const grad = useFadeIn(0, 800);
  const bgOut = useFadeOut(4000, 1500);
  const e0 = useSlideLeft(600, 600);
  const gl = useWidthGrow(1000, 600, 70);
  const e1 = useSlideLeft(1300, 600);
  const e2 = useSlideLeft(1700, 600);
  const e3 = useSlideLeft(2000, 600);
  const e4 = useSlideLeft(2300, 600);
  return (
    <AbsoluteFill style={{ fontFamily: FONT, backgroundColor: "#000" }}>
      <BgPhoto src={p.backgroundSrc} opacity={bgOut.opacity} />
      <AbsoluteFill
        style={{
          opacity: grad.opacity,
          background: "linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 35%, rgba(0,0,0,0.1) 60%, transparent 80%)",
        }}
      />
      <div style={{ position: "absolute", left: 100, top: 0, bottom: 0, maxWidth: 800, display: "flex", flexDirection: "column", justifyContent: "center", zIndex: 5 }}>
        <div style={{ ...e0, fontSize: 16, color: GOLD, letterSpacing: 5 }}>{p.heading}</div>
        <div style={{ height: 3, backgroundColor: GOLD, margin: "20px 0", width: gl.width }} />
        <div style={{ ...e1, fontSize: 40, fontWeight: 700, color: "#fff" }}>{p.agentName}</div>
        <div style={{ ...e2, fontSize: 22, color: "rgba(255,255,255,0.6)", marginTop: 14 }}>{p.propertyName}</div>
        {p.agentPhone ? <div style={{ ...e3, fontSize: 22, color: "rgba(255,255,255,0.6)", marginTop: 10 }}>{p.agentPhone}</div> : null}
        {p.agentEmail ? <div style={{ ...e4, fontSize: 22, color: "rgba(255,255,255,0.6)", marginTop: 8 }}>{p.agentEmail}</div> : null}
      </div>
      <EndFade />
    </AbsoluteFill>
  );
};

export const Template4: React.FC<OutroProps> = (p) => {
  const strip = useStripSlideIn(0, 800);
  const bgOut = useFadeOut(4000, 1500);
  const e0 = useSlideUp(800, 700);
  const gl = useWidthGrow(1300, 600, 120);
  const e1 = useSlideUp(1700, 600);
  const e2 = useSlideUp(2300, 600);
  const contact = [p.propertyName, p.agentPhone, p.agentEmail].filter(Boolean).join(" | ");
  return (
    <AbsoluteFill style={{ fontFamily: FONT, backgroundColor: "#000" }}>
      <BgPhoto src={p.backgroundSrc} opacity={bgOut.opacity} />
      <DarkStrip left={strip.left}>
        <div style={{ textAlign: "center" }}>
          <div style={{ ...e0, fontFamily: SERIF, fontSize: 46, fontWeight: 700, fontStyle: "italic", color: "#fff" }}>{p.heading}</div>
          <div style={{ height: 2, backgroundColor: "rgba(255,255,255,0.3)", margin: "28px auto", width: gl.width }} />
          <div style={{ ...e1, fontSize: 28, fontWeight: 600, color: "#fff", letterSpacing: 2 }}>{p.agentName}</div>
          <div style={{ ...e2, fontSize: 20, color: "rgba(255,255,255,0.5)", letterSpacing: 2, marginTop: 14 }}>{contact}</div>
        </div>
      </DarkStrip>
      <EndFade />
    </AbsoluteFill>
  );
};

export const Template5: React.FC<OutroProps> = (p) => {
  const strip = useStripSlideIn(0, 800);
  const bgOut = useFadeOut(4000, 1500);
  const e0 = useSlideUp(800, 600);
  const e1 = useSlideUp(1400, 600);
  const e2 = useSlideUp(2000, 700);
  const pills = [p.propertyName, p.agentPhone, p.agentEmail].filter(Boolean);
  return (
    <AbsoluteFill style={{ fontFamily: FONT, backgroundColor: "#000" }}>
      <BgPhoto src={p.backgroundSrc} opacity={bgOut.opacity} />
      <DarkStrip left={strip.left}>
        <div style={{ textAlign: "center" }}>
          <div style={{ ...e0, display: "inline-block", background: "rgba(200,164,94,0.9)", padding: "14px 40px", fontSize: 18, fontWeight: 700, color: INK, letterSpacing: 4 }}>
            {p.heading}
          </div>
          <div style={{ ...e1, fontSize: 36, fontWeight: 700, color: "#fff", marginTop: 24 }}>{p.agentName}</div>
          <div style={{ ...e2, display: "flex", gap: 16, justifyContent: "center", marginTop: 20, flexWrap: "wrap" }}>
            {pills.map((pill) => (
              <div key={pill} style={{ background: "rgba(255,255,255,0.1)", padding: "10px 22px", borderRadius: 6, fontSize: 17, color: "rgba(255,255,255,0.8)" }}>
                {pill}
              </div>
            ))}
          </div>
        </div>
      </DarkStrip>
      <EndFade />
    </AbsoluteFill>
  );
};

export const Template6: React.FC<OutroProps> = (p) => {
  const strip = useStripSlideIn(0, 800);
  const bgOut = useFadeOut(4000, 1500);
  const gl1 = useWidthGrow(700, 600, 70);
  const e0 = useSlideUp(1000, 600);
  const e1 = useSlideUp(1400, 600);
  const e2 = useSlideUp(1800, 600);
  const e3 = useSlideUp(2100, 600);
  const gl2 = useWidthGrow(2500, 600, 70);
  const contact = [p.agentPhone, p.agentEmail].filter(Boolean).join(" • ");
  return (
    <AbsoluteFill style={{ fontFamily: FONT, backgroundColor: "#000" }}>
      <BgPhoto src={p.backgroundSrc} opacity={bgOut.opacity} />
      <DarkStrip left={strip.left}>
        <div style={{ textAlign: "center" }}>
          <div style={{ height: 3, backgroundColor: GOLD, margin: "0 auto", width: gl1.width }} />
          <div style={{ ...e0, fontSize: 18, color: GOLD, letterSpacing: 5, marginTop: 20 }}>{p.heading}</div>
          <div style={{ ...e1, fontSize: 40, fontWeight: 700, color: "#fff", marginTop: 20 }}>{p.agentName}</div>
          <div style={{ ...e2, fontSize: 22, color: "rgba(255,255,255,0.5)", marginTop: 12 }}>{p.propertyName}</div>
          <div style={{ ...e3, fontSize: 22, color: "rgba(255,255,255,0.7)", marginTop: 18 }}>{contact}</div>
          <div style={{ height: 3, backgroundColor: GOLD, margin: "20px auto 0", width: gl2.width }} />
        </div>
      </DarkStrip>
      <EndFade />
    </AbsoluteFill>
  );
};

export const Template7: React.FC<OutroProps> = (p) => {
  const strip = useStripSlideIn(0, 800);
  const bgOut = useFadeOut(4000, 1500);
  const e0 = useSlideUp(800, 600);
  const e1 = useSlideUp(1100, 700);
  const e2 = useSlideUp(1800, 600);
  const e3 = useSlideUp(2300, 600);
  const contact = [p.propertyName, p.agentPhone, p.agentEmail].filter(Boolean).join(" • ");
  return (
    <AbsoluteFill style={{ fontFamily: FONT, backgroundColor: "#000" }}>
      <BgPhoto src={p.backgroundSrc} opacity={bgOut.opacity} />
      <DarkStrip left={strip.left}>
        <div style={{ textAlign: "center" }}>
          <div style={{ ...e0, fontSize: 18, letterSpacing: 8, color: "rgba(255,255,255,0.5)" }}>{p.heading}</div>
          <div style={{ ...e1, fontSize: 80, fontWeight: 800, lineHeight: 1, color: "#fff", marginTop: 4 }}>TODAY</div>
          <div style={{ ...e2, fontSize: 26, fontWeight: 500, color: "rgba(255,255,255,0.9)", marginTop: 30 }}>{p.agentName}</div>
          <div style={{ ...e3, fontSize: 18, color: "rgba(255,255,255,0.5)", marginTop: 12 }}>{contact}</div>
        </div>
      </DarkStrip>
      <EndFade />
    </AbsoluteFill>
  );
};

export const Template8: React.FC<OutroProps> = (p) => {
  const grad = useFadeIn(0, 800);
  const bgOut = useFadeOut(4000, 1500);
  const e0 = useSlideUp(800, 600);
  const gl = useWidthGrow(1200, 800, 1760);
  const e1 = useSlideUp(1700, 600);
  return (
    <AbsoluteFill style={{ fontFamily: FONT, backgroundColor: "#000" }}>
      <BgPhoto src={p.backgroundSrc} opacity={bgOut.opacity} />
      <AbsoluteFill
        style={{
          opacity: grad.opacity,
          background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 30%, rgba(0,0,0,0.1) 50%, transparent 65%)",
        }}
      />
      <div style={{ position: "absolute", left: 80, right: 80, bottom: 50, zIndex: 5 }}>
        <div style={{ ...e0, fontSize: 16, color: GOLD, letterSpacing: 4 }}>{p.heading}</div>
        <div style={{ height: 2, backgroundColor: "rgba(255,255,255,0.2)", margin: "16px 0", width: gl.width }} />
        <div style={{ ...e1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 30, fontWeight: 700, color: "#fff" }}>{p.agentName}</div>
          <div style={{ textAlign: "right", fontSize: 18, color: "rgba(255,255,255,0.6)" }}>
            <div>{[p.propertyName, p.agentPhone].filter(Boolean).join(" • ")}</div>
            {p.agentEmail ? <div>{p.agentEmail}</div> : null}
          </div>
        </div>
      </div>
      <EndFade />
    </AbsoluteFill>
  );
};

export const Template9: React.FC<OutroProps> = (p) => {
  const strip = useStripSlideIn(0, 800);
  const bgOut = useFadeOut(4000, 1500);
  const e0 = useSlideLeft(800, 700);
  const gl = useWidthGrow(1200, 600, 80);
  const e1 = useSlideLeft(1500, 700);
  const e2 = useSlideLeft(2000, 600);
  const e3 = useSlideLeft(2300, 600);
  const locPhone = [p.propertyName, p.agentPhone].filter(Boolean).join(" • ");
  return (
    <AbsoluteFill style={{ fontFamily: FONT, backgroundColor: "#000" }}>
      <BgPhoto src={p.backgroundSrc} opacity={bgOut.opacity} />
      <DarkStrip left={strip.left}>
        <div style={{ textAlign: "center" }}>
          <div style={{ ...e0, fontSize: 18, color: GOLD, letterSpacing: 5 }}>{p.heading}</div>
          <div style={{ height: 3, backgroundColor: GOLD, margin: "22px auto", width: gl.width }} />
          <div style={{ ...e1, fontSize: 38, fontWeight: 700, color: "#fff" }}>{p.agentName}</div>
          <div style={{ ...e2, fontSize: 22, color: "rgba(255,255,255,0.6)", marginTop: 14 }}>{locPhone}</div>
          {p.agentEmail ? <div style={{ ...e3, fontSize: 22, color: "rgba(255,255,255,0.6)", marginTop: 8 }}>{p.agentEmail}</div> : null}
        </div>
      </DarkStrip>
      <EndFade />
    </AbsoluteFill>
  );
};

export const Template10: React.FC<OutroProps> = (p) => {
  const strip = useStripSlideIn(0, 800);
  const bgOut = useFadeOut(4000, 1500);
  const e0 = useSlideUp(800, 700);
  const e1 = useScalePop(1200, 500);
  const e2 = useSlideUp(1500, 600);
  const e3 = useSlideUp(1800, 600);
  const gl = useWidthGrow(2100, 500, 80);
  const e4 = useSlideUp(2400, 600);
  const contact = [p.agentPhone, p.agentEmail].filter(Boolean).join(" • ");
  return (
    <AbsoluteFill style={{ fontFamily: FONT, backgroundColor: "#000" }}>
      <BgPhoto src={p.backgroundSrc} opacity={bgOut.opacity} />
      <DarkStrip left={strip.left}>
        <div style={{ textAlign: "center" }}>
          <div style={{ ...e0, fontSize: 38, fontWeight: 700, fontStyle: "italic", letterSpacing: 2, color: "#fff" }}>{p.heading}</div>
          <div
            style={{
              ...e1,
              width: 50,
              height: 50,
              border: `2px solid ${GOLD}`,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 700,
              color: GOLD,
              margin: "24px auto 0",
            }}
          >
            {p.agentInitials}
          </div>
          <div style={{ ...e2, fontSize: 30, fontWeight: 700, letterSpacing: 2, color: "#fff", marginTop: 16 }}>{p.agentName}</div>
          <div style={{ ...e3, fontSize: 18, color: "rgba(255,255,255,0.5)", letterSpacing: 2, marginTop: 10 }}>{p.propertyName}</div>
          <div style={{ height: 2, backgroundColor: "rgba(255,255,255,0.2)", margin: "18px auto", width: gl.width }} />
          <div style={{ ...e4, fontSize: 20, color: "rgba(255,255,255,0.6)" }}>{contact}</div>
        </div>
      </DarkStrip>
      <EndFade />
    </AbsoluteFill>
  );
};

export const OUTRO_COMPONENTS: Record<string, React.FC<OutroProps>> = {
  "1": Template1,
  "2": Template2,
  "3": Template3,
  "4": Template4,
  "5": Template5,
  "6": Template6,
  "7": Template7,
  "8": Template8,
  "9": Template9,
  "10": Template10,
};
