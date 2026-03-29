"use client";

import { useState, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { BlueprintDashboard } from "@/components/BlueprintDashboard";
import { BlueprintResult } from "@orgblueprint/core";
import { useSpeechInput } from "@/hooks/useSpeechInput";
import { Mic, MicOff, Brain, ShieldCheck, BarChart3, ChevronRight } from "lucide-react";
import { TechLoadingScreen } from "@/components/TechLoadingScreen";

const CRM_PLATFORMS = [
  { key: "salesforce", label: "Salesforce", icon: "☁️", available: true },
  { key: "hubspot",    label: "HubSpot",    icon: "🟠", available: false },
  { key: "dynamics",   label: "Dynamics 365", icon: "🔷", available: false },
  { key: "zoho",       label: "Zoho CRM",   icon: "🟣", available: false },
] as const;

type CrmPlatform = (typeof CRM_PLATFORMS)[number]["key"];

const EXAMPLE_PROMPTS = [
  {
    label: "B2B Sales Team",
    text: "B2B company with 50 sales reps. We manage leads in spreadsheets and need proper pipeline management, opportunity tracking, and sales forecasting.",
  },
  {
    label: "Customer Portal & Support",
    text: "Need a customer self-service portal and support automation. We handle 500 cases per month and want to reduce manual routing and automate follow-ups.",
  },
  {
    label: "Complex Pricing Approvals",
    text: "We have complex pricing with discounts requiring multi-level approvals. We need CPQ to configure quotes, manage approval workflows, and generate contracts automatically.",
  },
  {
    label: "ERP Integration",
    text: "We need to integrate Salesforce with our ERP system to sync accounts, orders, and invoices in real time. We have 200 users across sales and operations.",
  },
];

type Stage = "describe" | "generating" | "results";

export function ConversationChat() {
  const [stage, setStage] = useState<Stage>("describe");
  const [needText, setNeedText] = useState("");
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [progressStep, setProgressStep] = useState(0);
  const progressIntervalRef = useRef<number | null>(null);
  const [crmPlatform, setCrmPlatform] = useState<CrmPlatform>("salesforce");
  const [result, setResult] = useState<BlueprintResult | null>(null);
  const [blueprintSlug, setBlueprintSlug] = useState<string | null>(null);
  const [aiPowered, setAiPowered] = useState(false);

  const { isListening, isSupported, startListening, stopListening } = useSpeechInput(
    (transcript) => setNeedText((prev) => (prev ? prev + " " + transcript : transcript))
  );

  async function generate() {
    if (!needText.trim()) return;
    setGenerateError(null);
    setProgressStep(0);
    setStage("generating");

    progressIntervalRef.current = window.setInterval(() => {
      setProgressStep((s) => s + 1);
    }, 3000);

    try {
      const res = await fetch("/api/blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: needText }),
      });
      const data = await res.json();

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      setResult(data.result);
      setBlueprintSlug(data.slug ?? null);
      setAiPowered(data.aiPowered ?? false);
      setStage("results");
    } catch {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setGenerateError("Something went wrong. Please try again.");
      setStage("describe");
    }
  }

  if (stage === "results" && result) {
    return (
      <BlueprintDashboard
        result={result}
        slug={blueprintSlug}
        isOwner={!!blueprintSlug}
        aiPowered={aiPowered}
        needText={needText}
        savedAnswers={{}}
        onReset={() => {
          setStage("describe");
          setNeedText("");
          setResult(null);
          setBlueprintSlug(null);
          setGenerateError(null);
        }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="text-center py-10">
        <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-xs font-semibold tracking-wide">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
          Powered by Orb — AI Solution Architect
        </div>
        <h1 className="text-5xl font-extrabold text-slate-900 mb-3 tracking-tight leading-none">OrgBlueprint</h1>
        <p className="text-slate-500 text-lg max-w-md mx-auto">
          Describe your business needs. Orb analyses them and builds your Salesforce blueprint instantly.
        </p>
      </div>

      {/* Describe stage */}
      {stage === "describe" && (
        <div className="space-y-4">
          {/* Platform pill row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {CRM_PLATFORMS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  disabled={!p.available}
                  onClick={() => p.available && setCrmPlatform(p.key)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150 ${
                    p.key === crmPlatform
                      ? "bg-blue-600 text-white shadow-sm"
                      : p.available
                      ? "bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600"
                      : "bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed"
                  }`}
                  title={!p.available ? "Coming soon" : undefined}
                >
                  <span>{p.icon}</span>
                  <span>{p.label}</span>
                  {!p.available && <span className="text-[9px] opacity-50">soon</span>}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Brain className="h-3 w-3 text-indigo-400" /> AI-powered recommendations
            </span>
          </div>

          {/* Main input card */}
          <div className="relative rounded-2xl border border-slate-200 bg-white shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
            {/* Example prompt chips */}
            <div className="flex gap-2 overflow-x-auto px-4 pt-4 pb-2 scrollbar-none">
              {EXAMPLE_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setNeedText(p.text)}
                  className="whitespace-nowrap text-xs px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-slate-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors shrink-0"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="relative px-4 pb-1">
              <Textarea
                placeholder="E.g. We're a 200-person healthcare company. We need to manage patient referrals, track our sales pipeline, integrate with our EHR system, and automate appointment reminders. We also want a patient portal."
                className="min-h-44 text-base pr-12 resize-none border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent p-0"
                value={needText}
                onChange={(e) => setNeedText(e.target.value)}
              />
              {isSupported && (
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`absolute bottom-3 right-3 p-2 rounded-full transition-all duration-200 ${
                    isListening
                      ? "bg-red-500 text-white shadow-lg shadow-red-200 scale-110"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                  }`}
                  title={isListening ? "Stop recording" : "Speak your needs"}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
              )}
            </div>

            {isListening && (
              <div className="flex items-center gap-2 text-red-500 text-xs px-4 pb-2">
                <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                Listening… speak now
              </div>
            )}

            {generateError && (
              <div className="mx-4 mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {generateError}
              </div>
            )}

            {/* Bottom action bar */}
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><BarChart3 className="h-3.5 w-3.5 text-indigo-400" /> Architecture-grade</span>
                <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-green-400" /> No credentials needed</span>
              </div>
              <button
                type="button"
                onClick={generate}
                disabled={!needText.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
              >
                Generate Blueprint
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400">
            Orb reads your description and builds a full AI-recommended Salesforce blueprint
          </p>
        </div>
      )}

      {/* Trust signals footer */}
      {stage === "describe" && (
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-400 pt-2 pb-4">
          <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> No Salesforce credentials required</span>
          <span className="flex items-center gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Directional estimates only</span>
          <span className="flex items-center gap-1.5"><Brain className="h-3.5 w-3.5" /> Orb-powered recommendations</span>
        </div>
      )}

      {/* Generating stage */}
      {stage === "generating" && (() => {
        const steps = [
          { icon: "🔍", text: "Reading your requirements…",            sub: "Parsing business context and signals" },
          { icon: "🧠", text: "Evaluating Salesforce product families…", sub: "Matching 21 clouds to your use case" },
          { icon: "🏗️", text: "Designing architecture…",               sub: "OOTB vs custom, integrations, AppExchange" },
          { icon: "🗄️", text: "Mapping your data model…",              sub: "Objects, relationships, automations" },
          { icon: "💰", text: "Estimating costs and roadmap…",          sub: "License tiers and phased delivery plan" },
          { icon: "✨", text: "Finalising your blueprint…",             sub: "Almost ready" },
        ];
        const pct = Math.min(Math.round(((progressStep + 1) / steps.length) * 100), 95);
        return (
          <Card className="shadow-sm border-slate-800 bg-slate-900/80">
            <CardContent className="p-0">
              <TechLoadingScreen
                progressStep={progressStep}
                totalSteps={steps.length}
                stepText={steps[Math.min(progressStep, steps.length - 1)].text}
                stepSub={steps[Math.min(progressStep, steps.length - 1)].sub}
                pct={pct}
                steps={steps}
              />
            </CardContent>
          </Card>
        );
      })()}
    </div>
  );
}
