"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BlueprintDashboard } from "@/components/BlueprintDashboard";
import { BlueprintResult } from "@orgblueprint/core";
import { useSpeechInput } from "@/hooks/useSpeechInput";
import { Mic, MicOff, Send, Sparkles, ArrowRight, ShieldCheck, BarChart3, AlertCircle } from "lucide-react";
import { TechLoadingScreen } from "@/components/TechLoadingScreen";

const CRM_PLATFORMS = [
  { key: "salesforce", label: "Salesforce", icon: "SF", available: true },
  { key: "hubspot", label: "HubSpot", icon: "HS", available: false },
  { key: "dynamics", label: "Dynamics 365", icon: "D365", available: false },
  { key: "zoho", label: "Zoho CRM", icon: "ZOHO", available: false },
] as const;

type CrmPlatform = (typeof CRM_PLATFORMS)[number]["key"];

const EXAMPLE_PROMPTS = [
  {
    label: "B2B Sales Team",
    text: "We're a B2B SaaS company with 80 Account Executives, 20 Sales Development Reps, and 5 sales managers — 105 users total. Our current stack is a mix of spreadsheets, sticky notes, and a shared Google Sheet that nobody trusts anymore. The biggest problems: the same prospect gets contacted by 3 different reps because there's no deduplication or lead assignment logic. Managers have zero pipeline visibility until end of quarter when reps scramble to update the sheet. Follow-ups are missed constantly because there's no task management. We can't forecast — our last two quarters missed plan by 30%+ because deals we thought were closing slipped. We have around 1,200 active opportunities at any time. Average deal size is $25k, cycle is 45 days. We need proper lead routing and deduplication, a full opportunity pipeline with stage tracking, activity logging (calls, emails, meetings) ideally without manual entry, sales forecasting with commit/upside categories, and manager dashboards by rep and region. We also want to automate SDR-to-AE handoff when a lead qualifies.",
  },
  {
    label: "Customer Service",
    text: "We're a B2C SaaS company with a 40-person support team split across three tiers — Tier 1 handles general queries, Tier 2 handles technical issues, Tier 3 is engineering escalation. We process about 2,000 tickets per month across email, live chat, and an in-app widget. The biggest pain: 60% of Tier 1 cases are the same 15 questions that agents look up manually in a Google Doc every single time. There are no SLA rules — a premium customer paying $500/month waits the same queue as a free user. Escalation happens by Slack DM which means cases get lost. We have no CSAT survey, no knowledge base for customers to self-serve, and no reporting on which product areas drive the most support volume. We want automated case routing by priority and customer tier, SLA entitlements with breach alerts, a customer self-service portal with a searchable knowledge base, automated CSAT surveys after closure, and a real-time agent productivity dashboard for our support manager.",
  },
  {
    label: "Quoting & CPQ",
    text: "We're a mid-market manufacturer with 120 sales and finance users, selling configurable industrial equipment with over 500 SKUs. Pricing has three layers: base list price, volume tier discounts (5–25%), and customer-specific negotiated rates stored in a master Excel file that only 2 people have access to. Every quote goes through a 3-level approval chain: sales rep submits, regional sales director approves discounts up to 15%, CFO approves anything over $100k or 15%+ discount. The whole process takes 3–5 business days per quote and we're losing deals to competitors who turn quotes around in 4 hours. Pricing errors happen 2–3 times per month because reps use outdated spreadsheets. Signed contracts are filed in a shared drive with no version control. We need CPQ that enforces live pricing rules, automates the approval chain with email notifications and mobile approval, generates a branded PDF proposal, e-signature integration, and feeds the signed order directly into our ERP (NetSuite) without manual re-entry.",
  },
  {
    label: "Field Service Ops",
    text: "We run a national facilities management company with 150 field technicians spread across 5 cities (London, Manchester, Birmingham, Leeds, Bristol). We handle planned maintenance contracts and reactive callouts for commercial clients — hospitals, retail chains, and office parks. Right now dispatch happens via phone calls and a physical whiteboard in each city office. Technicians get their jobs texted to them every morning and have no way to update job status except calling the office. Problems: we're missing SLA deadlines on 12% of our reactive callouts because dispatch doesn't know which tech is closest. Clients have no visibility into when a tech will arrive. Parts needed for a job aren't pre-ordered so techs arrive without the right equipment. We spend 4 hours a day per office on admin. We need intelligent job scheduling and dispatch with territory and skill-based routing, a mobile app for techs to accept jobs, update status, capture signatures, and log parts used, SLA tracking per client contract with automated breach alerts, customer notification SMS when a tech is en route, and a management dashboard showing utilisation, first-time fix rate, and SLA performance by client.",
  },
  {
    label: "ERP Integration",
    text: "We're a $50M wholesale distributor of industrial parts with 200 users across sales, operations, warehouse, and finance. We use Salesforce for CRM and SAP S/4HANA as our ERP — but they're completely disconnected. The workflow right now: a sales rep creates an opportunity and closes a deal in Salesforce, then emails the order details to the operations team, who manually re-enter the order into SAP. This re-keying takes 2–4 hours and introduces errors in 8% of orders — wrong SKUs, wrong quantities, wrong delivery addresses. Sales reps can't see live inventory levels or stock availability when talking to a customer, so they promise delivery dates they can't keep. Finance can't see deal status in Salesforce when chasing invoice payments. We also have 3 other systems: a warehouse management system, a logistics portal, and a product catalogue. We need real-time bi-directional sync between Salesforce and SAP (orders, invoices, inventory, credit limits), a unified account 360 view for reps showing open orders, invoices, and credit status, automated order creation in SAP when an opportunity is marked Closed Won, and a roadmap for integrating the warehouse and logistics systems in a second phase.",
  },
];

type Stage = "describe" | "conversation" | "confirm" | "generating" | "results";
type GenerationMode = "demo" | "ai";

interface ConversationEntry {
  question: string;
  answer: string;
}

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function buildCorpus(needText: string, answered: Record<string, string>): string {
  return normalizeText(
    [
      needText,
      ...Object.entries(answered).flatMap(([question, answer]) => [question, answer]),
    ].join(" ")
  );
}

function nextOrbQuestion(
  needText: string,
  answered: Record<string, string>,
  asked: string[]
): string | null {
  if (asked.length >= 5) return null;

  const corpus = buildCorpus(needText, answered);
  const askedSet = new Set(asked.map(normalizeText));

  const candidates = [
    {
      when: !/(health|healthcare|medical|clinic|hospital|pharma|finance|financial|bank|insurance|manufacturing|education|school|nonprofit|retail|saas|software|real estate|logistics|construction|consulting)/.test(corpus),
      question: "What industry vertical does your company operate in?",
    },
    {
      when: !/(user|users|rep|reps|agent|agents|team|teams|seat|seats|employee|employees|people|headcount)/.test(corpus),
      question: "Roughly how many users need access, and which teams will use the CRM first?",
    },
    {
      when: !/(integrat|erp|ehr|emr|sap|netsuite|workday|api|sync|database|data warehouse|billing system|website|portal)/.test(corpus),
      question: "Do you have existing systems that need to integrate with the CRM?",
    },
    {
      when: !/(manual|spreadsheet|excel|slow|bottleneck|pain|problem|issue|duplicate|visibility|forecast|report|reporting|approval|routing|handoff|follow-up)/.test(corpus),
      question: "What is the biggest manual process or reporting bottleneck you want Orb to eliminate first?",
    },
    {
      when: !/(month|months|quarter|q[1-4]|timeline|go live|golive|deadline|target|outcome|goal|improve|reduce|increase|kpi|metric|budget|cost|price|pricing)/.test(corpus),
      question: "What is the main business outcome you want this CRM project to improve first?",
    },
  ];

  for (const candidate of candidates) {
    const normalized = normalizeText(candidate.question);
    if (candidate.when && !askedSet.has(normalized)) {
      return candidate.question;
    }
  }

  const fallbackQuestion =
    "Is there anything business-critical we have not covered yet, such as approvals, portal access, quoting, service SLAs, or analytics?";

  return askedSet.has(normalizeText(fallbackQuestion)) ? null : fallbackQuestion;
}

export function ConversationChat() {
  const [stage, setStage] = useState<Stage>("describe");
  const [needText, setNeedText] = useState("");
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const [askedQuestions, setAskedQuestions] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [progressStep, setProgressStep] = useState(0);
  const progressIntervalRef = useRef<number | null>(null);
  const [aiKeyMissing, setAiKeyMissing] = useState(false);
  const [generationMode, setGenerationMode] = useState<GenerationMode>("demo");
  const [crmPlatform, setCrmPlatform] = useState<CrmPlatform>("salesforce");
  const [result, setResult] = useState<BlueprintResult | null>(null);
  const [blueprintSlug, setBlueprintSlug] = useState<string | null>(null);
  const [aiPowered, setAiPowered] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const questionTimerRef = useRef<number | null>(null);

  const answeredMap = Object.fromEntries(
    conversation.map((c) => [c.question, c.answer])
  );

  const { isListening, isSupported, startListening, stopListening } = useSpeechInput(
    (transcript) => setNeedText((prev) => (prev ? prev + " " + transcript : transcript))
  );

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, currentQuestion, loadingQuestion]);

  function fetchNextQuestion(
    historyOverride?: { question: string; answer: string }[]
  ) {
    // Cancel any pending transition so stale timers can't overwrite current state
    if (questionTimerRef.current) clearTimeout(questionTimerRef.current);

    setLoadingQuestion(true);

    const historyToSend = historyOverride ?? conversation;

    fetch("/api/conversation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ needText, history: historyToSend }),
    })
      .then((res) => res.json())
      .then((data: { question: string | null; provider?: string }) => {
        setAiKeyMissing(data.provider === "rules");
        if (data.question) {
          setCurrentQuestion(data.question);
        } else {
          setCurrentQuestion(null);
          setStage("confirm");
        }
        setLoadingQuestion(false);
      })
      .catch(() => {
        // Network error fallback: skip to confirm
        setCurrentQuestion(null);
        setStage("confirm");
        setLoadingQuestion(false);
      });
  }

  function skipAllToConfirm() {
    if (questionTimerRef.current) {
      clearTimeout(questionTimerRef.current);
      questionTimerRef.current = null;
    }
    setLoadingQuestion(false);
    setCurrentQuestion(null);
    setStage("confirm");
  }

  function handleDescribeContinue() {
    if (!needText.trim()) return;
    setAskedQuestions([]);
    setConversation([]);
    setGenerateError(null);
    setCurrentQuestion(null);
    setCurrentAnswer("");
    setAiKeyMissing(false);

    if (generationMode === "demo") {
      void generate("demo");
      return;
    }

    setStage("conversation");
    fetchNextQuestion([]);
  }

  function handleAnswer(skip = false) {
    if (!currentQuestion) return;
    const answer = (!skip && currentAnswer.trim()) ? currentAnswer.trim() : "";
    const nextConversation = [...conversation, { question: currentQuestion, answer }];
    setConversation(nextConversation);
    setAskedQuestions([...askedQuestions, currentQuestion]);
    setCurrentAnswer("");
    fetchNextQuestion(nextConversation);
  }

  async function generate(modeOverride?: GenerationMode) {
    const mode = modeOverride ?? generationMode;
    setGenerating(true);
    setGenerateError(null);
    setProgressStep(0);
    setStage("generating");

    // Cycle through progress steps every 3s while waiting
    progressIntervalRef.current = window.setInterval(() => {
      setProgressStep((s) => s + 1);
    }, 3000);

    try {
      const res = await fetch("/api/blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: needText, answers: answeredMap, mode }),
      });
      const data = await res.json();

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      if (res.status === 429) {
        setGenerateError(data.error ?? "Quota exceeded.");
        setGenerating(false);
        setStage("confirm");
        return;
      }

      setAiKeyMissing(mode === "ai" && !data.aiPowered);
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
      setGenerating(false);
      setStage("confirm");
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
        savedAnswers={answeredMap}
        onReset={() => {
          setStage("describe");
          setNeedText("");
          setConversation([]);
          setAskedQuestions([]);
          setCurrentQuestion(null);
          setCurrentAnswer("");
          setResult(null);
          setBlueprintSlug(null);
          setGenerateError(null);
          setGenerating(false);
          setAiKeyMissing(false);
          setProgressStep(0);
        }}
      />
    );
  }

  /* ── Describe stage — full hero layout ─────────────────────────────── */
  if (stage === "describe") {
    return (
      <div className="relative isolate w-full overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-8rem] top-12 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute right-[-6rem] top-28 h-80 w-80 rounded-full bg-fuchsia-500/10 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_60%)]" />
          <div className="absolute inset-x-0 bottom-0 h-64 bg-[linear-gradient(180deg,transparent,rgba(15,23,42,0.85))]" />
        </div>
        <div className="relative mx-auto max-w-6xl">

        {/* ── HERO ──────────────────────────────────────────────────── */}
        <div className="text-center pt-16 pb-12 px-4 sm:pt-20">

          {/* Badge pill */}
          <div className="inline-flex items-center gap-2 mb-7 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold tracking-widest uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Salesforce Discovery Engine · Orb V4
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl font-extrabold mb-5 tracking-tight leading-[1.08]">
            <span className="text-white block">Cut Salesforce Discovery</span>
            <span className="block bg-gradient-to-r from-pink-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
              From Weeks to Minutes.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-slate-400 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            Turn a rough business description into a structured Salesforce implementation blueprint in seconds —<br className="hidden sm:block" />
            so founders, RevOps teams, admins, and consultants start with a real scope instead of another blank discovery doc.
          </p>

          <div className="mx-auto mb-8 grid max-w-4xl grid-cols-1 gap-3 text-left sm:grid-cols-3">
            {[
              {
                eyebrow: "FAST START",
                title: "First-cut scope instantly",
                body: "Run the rules engine immediately when you need a directional blueprint without waiting on a discovery cycle.",
              },
              {
                eyebrow: "GUIDED",
                title: "Tighten the brief",
                body: "Use Orb to ask the questions a solution architect would ask before finalising the recommendation.",
              },
              {
                eyebrow: "DELIVERABLE",
                title: "Start with a blueprint",
                body: "Recommendations, architecture, cost, roadmap, and checklist in one pass so the real conversation starts sooner.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-slate-900/55 px-4 py-4 shadow-[0_10px_40px_rgba(15,23,42,0.28)] backdrop-blur">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">{item.eyebrow}</p>
                <p className="mb-1 text-sm font-semibold text-white">{item.title}</p>
                <p className="text-sm leading-relaxed text-slate-400">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-3 mb-6 px-4">
            <button
              type="button"
              onClick={() => setGenerationMode("demo")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                generationMode === "demo"
                  ? "bg-white text-slate-950"
                  : "border border-slate-700 bg-slate-900/70 text-slate-300 hover:border-indigo-500/50 hover:text-white"
              }`}
            >
              Demo Mode
            </button>
            <button
              type="button"
              onClick={() => setGenerationMode("ai")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                generationMode === "ai"
                  ? "bg-indigo-500 text-white"
                  : "border border-slate-700 bg-slate-900/70 text-slate-300 hover:border-indigo-500/50 hover:text-white"
              }`}
            >
              AI Enhanced
            </button>
            <span className="hidden md:block text-xs text-slate-500">
              {generationMode === "demo"
                ? "Instant rules-engine output"
                : "Orb asks clarifying questions first"}
            </span>
          </div>

          {/* ── INPUT BAR ── */}
          <div className="max-w-3xl mx-auto">
            <div className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-900/85 shadow-[0_24px_80px_rgba(15,23,42,0.45)] ring-1 ring-white/5 backdrop-blur">

              {/* Example chips */}
              <div className="flex gap-2 overflow-x-auto px-4 pt-3 pb-3 scrollbar-none border-b border-slate-800/60">
                {EXAMPLE_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setNeedText(p.text)}
                    className="shrink-0 whitespace-nowrap rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs text-slate-400 transition-colors hover:border-indigo-500/40 hover:bg-indigo-500/10 hover:text-indigo-300"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Textarea */}
              <div className="px-4 pt-3 pb-1">
                <Textarea
                  placeholder="E.g. We're a 200-person B2B SaaS company. 80 AEs, 20 SDRs, need pipeline, CPQ for complex deals, service team of 20 handling tickets, integrate with NetSuite..."
                  className="min-h-40 resize-none border-0 bg-transparent p-0 text-base text-slate-100 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-slate-600"
                  value={needText}
                  onChange={(e) => setNeedText(e.target.value)}
                />
              </div>

              {/* Listening indicator */}
              {isListening && (
                <div className="flex items-center gap-2 text-red-400 text-xs px-4 pb-2">
                  <span className="inline-flex gap-0.5">
                    {[0,1,2,3].map(i => (
                      <span key={i} className="inline-block w-0.5 bg-red-400 rounded-full animate-pulse" style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 100}ms` }} />
                    ))}
                  </span>
                  <span className="font-medium">Listening… speak now</span>
                  <span className="ml-1 text-slate-500">Click Stop when done</span>
                </div>
              )}

              {/* Bottom bar: mic + trust + CTA */}
              <div className="flex flex-col gap-3 border-t border-slate-800 px-4 py-3 sm:flex-row sm:items-center">
                {/* Mic button — prominent, labelled */}
                {isSupported ? (
                  <button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    className={`flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 sm:justify-start ${
                      isListening
                        ? "bg-red-500 text-white shadow-lg shadow-red-500/30 scale-105"
                        : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-indigo-500/20 hover:border-indigo-500/50 hover:text-indigo-300"
                    }`}
                    title={isListening ? "Stop recording" : "Use your voice instead of typing"}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    {isListening ? "Stop" : "Voice Input"}
                  </button>
                ) : (
                  <span className="flex shrink-0 items-center justify-center gap-1.5 text-xs text-slate-600 sm:justify-start">
                    <Mic className="h-3.5 w-3.5" /> Type your needs
                  </span>
                )}

                {/* Trust badges */}
                <div className="hidden items-center gap-3 text-xs text-slate-600 sm:flex sm:ml-1">
                  <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-green-500/70" /> No credentials</span>
                  <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3 text-indigo-400/70" /> Architecture-grade</span>
                </div>

                {/* CTA */}
                <button
                  type="button"
                  onClick={handleDescribeContinue}
                  disabled={!needText.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:from-indigo-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-40 sm:ml-auto sm:w-auto"
                >
                  {generationMode === "demo" ? "Run Instant Blueprint" : "Start Guided Blueprint"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Trust strip */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] uppercase tracking-widest text-slate-600">
              <span>{generationMode === "demo" ? "Instant Output" : "Guided Discovery"}</span>
              <span className="text-slate-700">·</span>
              <span>No Salesforce Login Needed</span>
              <span className="text-slate-700">·</span>
              <span>Deterministic Output</span>
            </div>
          </div>
        </div>

        {/* ── PLATFORM PILLS ─────────────────────────────────────────── */}
        <div className="flex flex-wrap justify-center gap-2 pb-10 px-4">
          {CRM_PLATFORMS.map((p) => (
            <button
              key={p.key}
              type="button"
              disabled={!p.available}
              onClick={() => p.available && setCrmPlatform(p.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
                p.key === crmPlatform
                  ? "bg-indigo-600 text-white shadow-sm"
                  : p.available
                  ? "bg-slate-800 text-slate-300 border border-slate-700 hover:border-indigo-500/50 hover:text-indigo-300"
                  : "bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed"
              }`}
              title={!p.available ? "Coming soon" : undefined}
            >
              <span>{p.icon}</span>
              <span>{p.label}</span>
              {!p.available && <span className="text-[9px] opacity-50">soon</span>}
            </button>
          ))}
        </div>

        {/* ── HOW IT WORKS — 3 cards ──────────────────────────────────── */}
        <div className="max-w-5xl mx-auto px-4 pb-10">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">From Input to Architecture</h2>
            <p className="text-slate-500 text-sm max-w-lg">
              A multi-stage engine that turns a plain English description into a structured, production-ready blueprint.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              {
                icon: "01",
                title: "Understand",
                desc: "Extract signals from natural language — user count, industry, product needs, integration complexity, and pain points.",
                tag: "Signal Processing Layer",
                color: "from-blue-500/10 to-indigo-500/5",
                border: "border-blue-500/20",
              },
              {
                icon: "02",
                title: "Refine",
                desc: "Orb asks up to 3 context-aware questions to eliminate ambiguity and improve blueprint accuracy.",
                tag: "Decision Logic Matrix",
                color: "from-purple-500/10 to-fuchsia-500/5",
                border: "border-purple-500/20",
              },
              {
                icon: "03",
                title: "Generate",
                desc: "Produce structured blueprints: product recommendations, data model, cost estimates, roadmap, and document checklist.",
                tag: "Output Synthesis Module",
                color: "from-indigo-500/10 to-purple-500/5",
                border: "border-indigo-500/20",
              },
            ].map((card) => (
              <div key={card.title} className={`rounded-2xl border ${card.border} bg-gradient-to-br ${card.color} p-5 flex flex-col gap-3`}>
                <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">{card.icon}</span>
                <div>
                  <h3 className="text-white font-bold text-base mb-1">{card.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{card.desc}</p>
                </div>
                <span className="mt-auto text-[10px] font-semibold uppercase tracking-widest text-slate-600">{card.tag}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── TECH STACK SECTION ──────────────────────────────────────── */}
        <div className="max-w-5xl mx-auto border-t border-slate-800/60 px-4 pb-16 pt-10">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">How We Built This</h2>
            <p className="text-slate-500 text-sm max-w-lg">
              No Salesforce org connection needed. You describe your needs — we apply a deterministic rules engine + LLM to produce recommendations based on Salesforce&apos;s product catalog.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { layer: "Frontend", tech: "Next.js 14 · React 18 · TypeScript", icon: "FE", detail: "App Router, server components, Tailwind CSS" },
              { layer: "Voice Input", tech: "Web Speech API", icon: "MIC", detail: "Browser-native, no server, no API key — speak your needs directly" },
              { layer: "Rules Engine", tech: "Pure TypeScript · Deterministic", icon: "RULES", detail: "extractSignals() → decideProducts() → generateBlueprint() — zero LLM, about 200ms" },
              { layer: "AI Layer", tech: "Claude Sonnet → Gemini → Groq", icon: "AI", detail: "4-provider fallback chain — always produces output even if one provider is down" },
              { layer: "Database", tech: "Prisma ORM · Hosted Postgres", icon: "DB", detail: "Blueprints saved as JSON, slugs via nanoid, NextAuth v5 JWT auth" },
              { layer: "Salesforce Data", tech: "Hardcoded product catalog", icon: "CRM", detail: "21 Salesforce product families, pricing assumptions, AppExchange recommendations — no live SF API" },
            ].map((item) => (
              <div key={item.layer} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-indigo-300">{item.icon}</span>
                  <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">{item.layer}</span>
                </div>
                <p className="text-white text-sm font-semibold">{item.tech}</p>
                <p className="text-slate-500 text-xs leading-relaxed">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        </div>
      </div>
    );
  }

  /* ── All other stages (conversation / confirm / generating) ─────── */
  return (
    <div className="mx-auto max-w-2xl space-y-6">

      {/* Conversation stage — chat bubbles */}
      {stage === "conversation" && (
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Orb — Solution Architect</CardTitle>
                  <span className="text-xs text-slate-400 font-normal">{askedQuestions.length} / 3</span>
                </div>
                <Progress value={(askedQuestions.length / 3) * 100} className="h-1 mt-1" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Chat history */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1 pb-1">
              {/* Greeting bubble always shown first */}
              <div className="flex justify-start gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
                <div className="max-w-[82%] rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-2.5 text-sm text-slate-800 leading-relaxed">
                  Hi! I&apos;m Orb, your CRM solution architect. I read your description — let me ask a few quick questions to fine-tune your blueprint. This usually takes under 2 minutes.
                </div>
              </div>
              {conversation.map((c, i) => (
                <div key={i} className="space-y-2">
                  {/* AI question bubble */}
                  <div className="flex justify-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles className="h-3 w-3 text-white" />
                    </div>
                    <div className="max-w-[82%] rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-2.5 text-sm text-slate-800 leading-relaxed">
                      {c.question}
                    </div>
                  </div>
                  {/* User answer bubble */}
                  <div className="flex justify-end">
                    <div className="max-w-[82%] rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-2.5 text-sm text-white leading-relaxed">
                      {c.answer}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing indicator or current question */}
              {loadingQuestion ? (
                <div className="flex justify-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              ) : currentQuestion ? (
                <div className="flex justify-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                  <div className="max-w-[82%] rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-2.5 text-sm text-slate-800 leading-relaxed">
                    {currentQuestion}
                  </div>
                </div>
              ) : null}

              <div ref={chatEndRef} />
            </div>

            {/* Input row — shown when there is a current question (hide during typing indicator only if answer input is shown) */}
            {(currentQuestion || loadingQuestion) && (
              <>
                {!loadingQuestion && currentQuestion && (
                  <div className="flex gap-2 pt-1 border-t border-slate-100">
                    <Input
                      placeholder="Your answer…"
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAnswer(false)}
                      className="flex-1 h-10"
                      autoFocus
                    />
                    <Button
                      size="icon"
                      className="h-10 w-10 shrink-0"
                      onClick={() => handleAnswer(false)}
                      disabled={!currentAnswer.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    disabled={loadingQuestion}
                    onClick={() => handleAnswer(true)}
                  >
                    Skip question
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-xs text-slate-400 hover:text-slate-600"
                    onClick={skipAllToConfirm}
                  >
                    Skip all → generate now
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Confirm stage */}
      {stage === "confirm" && (
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">Ready to generate your blueprint</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiKeyMissing && (
              <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-500" />
                <span>
                  <span className="font-semibold">AI mode unavailable</span> — no API key configured on this server. Switched to Demo mode. Your blueprint will still be generated using the rules engine.
                </span>
              </div>
            )}
            <div className="rounded-lg bg-slate-50 border border-slate-100 p-4 text-sm text-slate-700">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Business need</p>
              <p className="leading-relaxed">{needText}</p>
            </div>
            {conversation.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Your answers ({conversation.length})
                </p>
                {conversation.map((c, i) => (
                  <div key={i} className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
                    <p className="font-medium text-slate-600 text-xs mb-0.5">{c.question}</p>
                    <p className="text-slate-800">{c.answer}</p>
                  </div>
                ))}
              </div>
            )}
            <Button
              className="w-full h-11 text-base font-medium"
              onClick={() => void generate()}
              disabled={generating}
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Generating stage */}
      {stage === "generating" && (() => {
        const steps = [
          { icon: "🔍", text: "Reading your requirements…", sub: "Parsing business context and signals" },
          { icon: "🧠", text: "Evaluating Salesforce product families…", sub: "Matching 21 clouds to your use case" },
          { icon: "🏗️", text: "Designing architecture…", sub: "OOTB vs custom, integrations, AppExchange" },
          { icon: "🗄️", text: "Mapping your data model…", sub: "Objects, relationships, automations" },
          { icon: "💰", text: "Estimating costs and roadmap…", sub: "License tiers and phased delivery plan" },
          { icon: "✨", text: "Finalising your blueprint…", sub: "Almost ready" },
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
