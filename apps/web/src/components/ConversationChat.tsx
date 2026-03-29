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
import { Mic, MicOff, Send, Sparkles, ArrowRight, ShieldCheck, BarChart3, Brain, AlertCircle, ChevronRight } from "lucide-react";
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

type Stage = "describe" | "conversation" | "confirm" | "generating" | "results";

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
        if (data.question) {
          setAiKeyMissing(false);
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

  async function generate() {
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
        body: JSON.stringify({ input: needText, answers: answeredMap, mode: "ai" }),
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
      <div className="text-center pt-12 pb-8">
        <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-semibold tracking-wide">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
          Orb — AI Solution Architect
        </div>
        <h1 className="text-5xl font-extrabold mb-3 tracking-tight leading-none bg-gradient-to-br from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">OrgBlueprint</h1>
        <p className="text-slate-400 text-lg max-w-md mx-auto leading-relaxed">
          Describe your business needs. Orb asks the right questions, then builds your Salesforce blueprint.
        </p>
      </div>

      {/* Describe stage */}
      {stage === "describe" && (
        <div className="space-y-4">
          {/* Platform pill + hint row */}
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
                      ? "bg-slate-800 text-slate-300 border border-slate-700 hover:border-blue-500/50 hover:text-blue-400"
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
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Brain className="h-3 w-3 text-indigo-400" /> Smart questions adapt to your input
            </span>
          </div>

          {/* Main input card */}
          <div className="relative rounded-2xl border border-slate-700/60 bg-slate-900/80 shadow-[0_0_40px_rgba(59,130,246,0.08)] ring-1 ring-white/5">
            {/* Example prompt chips */}
            <div className="flex gap-2 overflow-x-auto px-4 pt-4 pb-3 scrollbar-none border-b border-slate-800/60">
              {EXAMPLE_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setNeedText(p.text)}
                  className="whitespace-nowrap text-xs px-3 py-1.5 rounded-full border border-slate-700 bg-slate-800/60 text-slate-400 hover:bg-blue-500/10 hover:border-blue-500/40 hover:text-blue-300 transition-colors shrink-0"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="relative px-4 pb-1">
              <Textarea
                placeholder="E.g. We're a 200-person healthcare company. We need to manage patient referrals, track our sales pipeline, integrate with our EHR system, and automate appointment reminders. We also want a patient portal."
                className="min-h-44 text-base pr-12 resize-none border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent p-0 text-slate-100 placeholder:text-slate-600"
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
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
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

            {/* Bottom action bar */}
            <div className="flex items-center justify-between gap-3 border-t border-slate-800 px-4 py-3">
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><BarChart3 className="h-3.5 w-3.5 text-indigo-400" /> Architecture-grade</span>
                <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-green-400" /> No credentials needed</span>
              </div>
              <button
                type="button"
                onClick={handleDescribeContinue}
                disabled={!needText.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
              >
                Generate Blueprint
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-slate-600">
            Orb will ask up to 3 context-aware questions based on what you describe
          </p>
        </div>
      )}

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
              onClick={generate}
              disabled={generating}
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Trust signals footer — shown on describe stage only */}
      {stage === "describe" && (
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-600 pt-2 pb-4">
          <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> No Salesforce credentials required</span>
          <span className="flex items-center gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Directional estimates only</span>
          <span className="flex items-center gap-1.5"><Brain className="h-3.5 w-3.5" /> Orb-powered recommendations</span>
        </div>
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

