"use client";

import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";

const TECH_PLATFORMS = [
  { label: "Salesforce", abbr: "SF", color: "#00A1E0", bg: "#E8F7FD" },
  { label: "ServiceNow", abbr: "SN", color: "#62D84E", bg: "#EDF9EB" },
  { label: "Pega", abbr: "PG", color: "#F37021", bg: "#FEF0E7" },
  { label: "Zoho", abbr: "ZO", color: "#E42527", bg: "#FEECEC" },
  { label: "HubSpot", abbr: "HS", color: "#FF7A59", bg: "#FFF0EC" },
  { label: "SAP", abbr: "SAP", color: "#0070F2", bg: "#E5F0FE" },
  { label: "Oracle", abbr: "ORC", color: "#C74634", bg: "#FAEBE8" },
  { label: "Dynamics", abbr: "D365", color: "#0078D4", bg: "#E5F1FB" },
  { label: "Zendesk", abbr: "ZD", color: "#03363D", bg: "#E6F5F6" },
  { label: "Freshdesk", abbr: "FD", color: "#25C16F", bg: "#E9FAF1" },
  { label: "Workday", abbr: "WD", color: "#F5820D", bg: "#FEF1E5" },
  { label: "Veeva", abbr: "VV", color: "#F26522", bg: "#FEF0E8" },
];

// Stable orbital positions (angle in degrees, radius percent)
const ORBIT_SLOTS = [
  { angle: 0,   r: 42 },
  { angle: 30,  r: 42 },
  { angle: 60,  r: 42 },
  { angle: 90,  r: 42 },
  { angle: 120, r: 42 },
  { angle: 150, r: 42 },
  { angle: 180, r: 42 },
  { angle: 210, r: 42 },
  { angle: 240, r: 42 },
  { angle: 270, r: 42 },
  { angle: 300, r: 42 },
  { angle: 330, r: 42 },
];

interface TechLoadingScreenProps {
  progressStep: number;
  totalSteps: number;
  stepText: string;
  stepSub: string;
  pct: number;
  steps: { icon: string; text: string; sub: string }[];
}

export function TechLoadingScreen({
  progressStep,
  totalSteps,
  stepText,
  stepSub,
  pct,
  steps,
}: TechLoadingScreenProps) {
  const [rotation, setRotation] = useState(0);
  const [pulse, setPulse] = useState(false);

  // Slowly rotate the orbit ring
  useEffect(() => {
    const id = setInterval(() => {
      setRotation((r) => (r + 0.3) % 360);
    }, 16);
    return () => clearInterval(id);
  }, []);

  // Pulse the center icon on step change
  useEffect(() => {
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 600);
    return () => clearTimeout(t);
  }, [progressStep]);

  const currentStep = steps[Math.min(progressStep, steps.length - 1)];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 space-y-8 select-none">
      {/* Orbital rig */}
      <div className="relative" style={{ width: 280, height: 280 }}>
        {/* Orbit ring */}
        <div
          className="absolute inset-0 rounded-full border border-slate-700/40"
          style={{ top: "8%", left: "8%", right: "8%", bottom: "8%", position: "absolute" }}
        />

        {/* Tech icon badges on the ring */}
        {TECH_PLATFORMS.map((tech, i) => {
          const slot = ORBIT_SLOTS[i % ORBIT_SLOTS.length];
          const deg = (slot.angle + rotation) % 360;
          const rad = (deg * Math.PI) / 180;
          const cx = 140; // center x
          const cy = 140; // center y
          const orbitRadius = 108;
          const x = cx + orbitRadius * Math.cos(rad);
          const y = cy + orbitRadius * Math.sin(rad);

          // Depth effect: icons at the "back" are smaller/dimmer
          const sinVal = Math.sin(rad); // -1 (top) to +1 (bottom)
          const scale = 0.72 + 0.28 * ((sinVal + 1) / 2);
          const opacity = 0.45 + 0.55 * ((sinVal + 1) / 2);

          return (
            <div
              key={tech.label}
              className="absolute flex flex-col items-center pointer-events-none"
              style={{
                left: x,
                top: y,
                transform: `translate(-50%, -50%) scale(${scale})`,
                opacity,
                transition: "opacity 0.1s",
                zIndex: Math.round(sinVal * 10 + 10),
              }}
            >
              <div
                className="rounded-xl flex items-center justify-center font-bold text-xs shadow-md"
                style={{
                  width: 44,
                  height: 44,
                  background: tech.bg,
                  color: tech.color,
                  border: `2px solid ${tech.color}33`,
                  fontSize: tech.abbr.length > 2 ? "9px" : "11px",
                  letterSpacing: "-0.3px",
                }}
              >
                {tech.abbr}
              </div>
              <span
                className="mt-1 font-medium"
                style={{ fontSize: "9px", color: tech.color, opacity: 0.9 }}
              >
                {tech.label}
              </span>
            </div>
          );
        })}

        {/* Center badge */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ zIndex: 20 }}
        >
          <div
            className="rounded-2xl flex flex-col items-center justify-center shadow-lg transition-all duration-500"
            style={{
              width: 88,
              height: 88,
              background: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)",
              border: "2px solid #3b82f655",
              transform: pulse ? "scale(1.12)" : "scale(1)",
            }}
          >
            <span className="text-3xl leading-none">{currentStep.icon}</span>
            <span className="text-blue-400 text-xs mt-1 font-semibold tracking-wide">
              Building
            </span>
          </div>
        </div>

        {/* Subtle glow behind center */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 110,
            height: 110,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "radial-gradient(circle, #3b82f622 0%, transparent 70%)",
            zIndex: 18,
          }}
        />
      </div>

      {/* Step label */}
      <div className="text-center space-y-1 max-w-xs">
        <p className="text-slate-100 text-base font-semibold">{currentStep.text}</p>
        <p className="text-slate-400 text-sm">{currentStep.sub}</p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs space-y-1.5">
        <Progress value={pct} className="h-1.5" />
        <div className="flex justify-between text-xs text-slate-500">
          <span>Analysing your requirements</span>
          <span>{pct}%</span>
        </div>
      </div>

      {/* Step dots */}
      <div className="flex justify-center gap-1.5">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-500 ${
              i < progressStep
                ? "w-1.5 h-1.5 bg-blue-500"
                : i === progressStep
                ? "w-3 h-1.5 bg-blue-400"
                : "w-1.5 h-1.5 bg-slate-700"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
