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
import { Mic, MicOff, Send, Sparkles, ArrowRight, ShieldCheck, BarChart3, Brain, Zap, FlaskConical, AlertCircle, Building2 } from "lucide-react";

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

type Stage = "describe" | "conversation" | "confirm" | "expand" | "generating" | "results";
type Mode = "demo" | "ai";

const EXPANSION_OPTIONS = [
  { key: "architecture", label: "Salesforce architecture & scalability" },
  { key: "ootb", label: "OOTB vs custom guidance" },
  { key: "integrations", label: "Integration patterns & API design" },
  { key: "reporting", label: "Reporting & analytics strategy" },
  { key: "ai_automation", label: "AI & automation opportunities" },
] as const;

type ExpansionKey = (typeof EXPANSION_OPTIONS)[number]["key"];

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
  const [mode, setMode] = useState<Mode>("demo");
  const [needText, setNeedText] = useState("");
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const [askedQuestions, setAskedQuestions] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [selectedExpansions, setSelectedExpansions] = useState<ExpansionKey[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [aiRunsLeft, setAiRunsLeft] = useState<number | null>(null);
  const [aiKeyMissing, setAiKeyMissing] = useState(false);
  const [crmPlatform, setCrmPlatform] = useState<CrmPlatform>("salesforce");
  const [result, setResult] = useState<BlueprintResult | null>(null);
  const [blueprintSlug, setBlueprintSlug] = useState<string | null>(null);
  const [aiPowered, setAiPowered] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

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
    answeredOverride?: Record<string, string>,
    askedOverride?: string[]
  ) {
    setLoadingQuestion(true);
    const nextQuestion = nextOrbQuestion(
      needText,
      answeredOverride ?? answeredMap,
      askedOverride ?? askedQuestions
    );
    window.setTimeout(() => {
      if (nextQuestion) {
        setAiKeyMissing(false);
        setCurrentQuestion(nextQuestion);
      } else {
        setCurrentQuestion(null);
        setStage("confirm");
      }
      setLoadingQuestion(false);
    }, 250);
  }

  function handleDescribeContinue() {
    if (!needText.trim()) return;
    if (mode === "demo") {
      // Demo mode: skip AI question loop, go straight to confirm
      setStage("confirm");
    } else {
      setAskedQuestions([]);
      setStage("conversation");
      fetchNextQuestion({}, []);
    }
  }

  function handleAnswer(skip = false) {
    if (!currentQuestion) return;
    const nextAnswered = { ...answeredMap };
    const nextAsked = [...askedQuestions, currentQuestion];
    if (!skip && currentAnswer.trim()) {
      nextAnswered[currentQuestion] = currentAnswer.trim();
      setConversation((prev) => [
        ...prev,
        { question: currentQuestion, answer: currentAnswer.trim() },
      ]);
    }
    setAskedQuestions(nextAsked);
    setCurrentAnswer("");
    fetchNextQuestion(nextAnswered, nextAsked);
  }

  async function generate() {
    setGenerating(true);
    setGenerateError(null);
    setStage("generating");
    try {
      const res = await fetch("/api/blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: needText, answers: answeredMap, mode, expansions: selectedExpansions }),
      });
      const data = await res.json();

      if (res.status === 429) {
        setGenerateError(data.error ?? "Quota exceeded.");
        setGenerating(false);
        setStage("expand");
        return;
      }

      if (data.quota?.remainingToday !== undefined) {
        setAiRunsLeft(data.quota.remainingToday);
      }

      setResult(data.result);
      setBlueprintSlug(data.slug ?? null);
      setAiPowered(data.aiPowered ?? false);
      setStage("results");
    } catch {
      setGenerateError("Something went wrong. Please try again.");
      setGenerating(false);
      setStage("expand");
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
          setSelectedExpansions([]);
          setGenerateError(null);
        }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="text-center py-8">
        <div className="inline-flex items-center gap-2 mb-3 text-blue-600 text-sm font-medium bg-blue-50 px-3 py-1.5 rounded-full">
          <Sparkles className="h-3.5 w-3.5" />
          AI-powered CRM blueprint generator
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">OrgBlueprint</h1>
        <p className="text-slate-500 text-lg mb-5">
          Describe your business — we&apos;ll ask the right questions and build your CRM blueprint.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-400">
          <span className="flex items-center gap-1.5"><Brain className="h-3.5 w-3.5 text-blue-400" /> Architecture-grade recommendations</span>
          <span className="flex items-center gap-1.5"><BarChart3 className="h-3.5 w-3.5 text-indigo-400" /> Built on CRM best practices</span>
          <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-green-400" /> Designed for RevOps &amp; Solution Architects</span>
        </div>
      </div>

      {/* Describe stage */}
      {stage === "describe" && (
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">What does your business need?</CardTitle>
            <p className="text-sm text-slate-500">
              Describe your industry, team size, pain points, and goals. The more detail, the better.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* CRM Platform selector */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> CRM Platform
              </p>
              <div className="flex gap-2 flex-wrap">
                {CRM_PLATFORMS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    disabled={!p.available}
                    onClick={() => p.available && setCrmPlatform(p.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-150 ${
                      p.key === crmPlatform
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : p.available
                        ? "bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:text-blue-600"
                        : "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                    }`}
                    title={!p.available ? "Coming soon" : undefined}
                  >
                    <span>{p.icon}</span>
                    <span>{p.label}</span>
                    {!p.available && <span className="text-[9px] opacity-60 font-normal">soon</span>}
                  </button>
                ))}
              </div>
            </div>
            {/* Mode toggle */}
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Generation Mode</p>
              <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-100 p-1.5">
              <button
                type="button"
                onClick={() => setMode("demo")}
                aria-pressed={mode === "demo"}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border px-3 py-2.5 text-sm transition-all duration-150 ${
                  mode === "demo"
                    ? "border-blue-300 bg-white text-slate-950 shadow-sm ring-2 ring-blue-200"
                    : "border-transparent bg-transparent text-slate-500 hover:border-slate-200 hover:bg-white/70 hover:text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-blue-500 shrink-0" />
                  <span className="font-semibold">Demo</span>
                </div>
                <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${mode === "demo" ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-500"}`}>Free</span>
                <span className="text-[11px] text-slate-500">Instant rules-based blueprint</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("ai")}
                aria-pressed={mode === "ai"}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border px-3 py-2.5 text-sm transition-all duration-150 ${
                  mode === "ai"
                    ? "border-amber-300 bg-white text-slate-950 shadow-sm ring-2 ring-amber-200"
                    : "border-transparent bg-transparent text-slate-500 hover:border-slate-200 hover:bg-white/70 hover:text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500 shrink-0" />
                  <span className="font-semibold">AI Enhanced</span>
                </div>
                <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${mode === "ai" ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-500"}`}>Orb</span>
                <span className="text-[11px] text-slate-500">Clarifying questions + richer output</span>
              </button>
            </div>
            </div>
            {mode === "demo" && (
              <p className="text-xs text-slate-400 flex items-start gap-1.5">
                <FlaskConical className="h-3.5 w-3.5 mt-0.5 text-blue-400 shrink-0" />
                Instant blueprint using our deterministic rules engine — no API key needed, no wait time.
              </p>
            )}
            {mode === "ai" && (
              <p className="text-xs text-amber-600 flex items-start gap-1.5 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                <Zap className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  AI Enhanced asks up to 5 smart clarifying questions, then generates a richer narrative blueprint with Orb.
                  {aiRunsLeft !== null && (
                    <span className="ml-1 font-semibold">({aiRunsLeft} AI run{aiRunsLeft !== 1 ? "s" : ""} left today)</span>
                  )}
                </span>
              </p>
            )}

            {/* Example prompt chips */}
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setNeedText(p.text)}
                  className="text-xs px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-slate-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="relative">
              <Textarea
                placeholder="E.g. We're a 200-person healthcare company. We need to manage patient referrals, track our sales pipeline, integrate with our EHR system, and automate appointment reminders. We also want a patient portal."
                className="min-h-44 text-base pr-12 resize-none"
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
                  {isListening ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>

            {isListening && (
              <div className="flex items-center gap-2 text-red-500 text-sm">
                <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span>Listening… speak now</span>
              </div>
            )}

            {isSupported && !isListening && (
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <Mic className="h-3 w-3" />
                Click the mic to speak your needs (Chrome/Edge)
              </p>
            )}

            <Button
              className="w-full h-11 text-base font-medium"
              onClick={handleDescribeContinue}
              disabled={!needText.trim()}
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <p className="text-center text-xs text-slate-400">
              ⏱ ~30 seconds · We&apos;ll ask up to 5 smart questions
            </p>
          </CardContent>
        </Card>
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
                  <span className="text-xs text-slate-400 font-normal">{askedQuestions.length} / 5</span>
                </div>
                <Progress value={(askedQuestions.length / 5) * 100} className="h-1 mt-1" />
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

            {/* Input row */}
            {!loadingQuestion && currentQuestion && (
              <>
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
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleAnswer(true)}
                  >
                    Skip question
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-xs text-slate-400 hover:text-slate-600"
                    onClick={() => {
                      setCurrentQuestion(null);
                      setStage("confirm");
                    }}
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
              onClick={() => setStage("expand")}
              disabled={generating}
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Expand stage — optional additional recommendations */}
      {stage === "expand" && (
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">Anything else to include?</CardTitle>
            <p className="text-sm text-slate-500">
              Select optional deep-dives to add to your blueprint. Skip to generate now.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-2">
              {EXPANSION_OPTIONS.map((opt) => {
                const selected = selectedExpansions.includes(opt.key);
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() =>
                      setSelectedExpansions((prev) =>
                        selected ? prev.filter((k) => k !== opt.key) : [...prev, opt.key]
                      )
                    }
                    className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm text-left transition-all duration-100 ${
                      selected
                        ? "border-blue-300 bg-blue-50 text-blue-800 font-medium"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                        selected ? "border-blue-500 bg-blue-500" : "border-slate-300"
                      }`}
                    >
                      {selected && (
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 12 12">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {generateError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {generateError}
                {mode === "ai" && (
                  <button
                    type="button"
                    className="ml-2 underline font-medium"
                    onClick={() => { setMode("demo"); setGenerateError(null); }}
                  >
                    Switch to Demo mode
                  </button>
                )}
              </div>
            )}

            {mode === "ai" && aiRunsLeft !== null && (
              <p className="text-xs text-amber-600 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 shrink-0" />
                AI runs left today: {aiRunsLeft}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1 h-10"
                onClick={() => { setSelectedExpansions([]); generate(); }}
              >
                Skip — generate now
              </Button>
              <Button
                className="flex-1 h-10 font-medium"
                onClick={generate}
              >
                {selectedExpansions.length > 0
                  ? `Generate + ${selectedExpansions.length} extra`
                  : "Generate Blueprint"}
                <Sparkles className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trust signals footer — shown on describe stage only */}
      {stage === "describe" && (
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-400 pt-2 pb-4">
          <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> No Salesforce credentials required</span>
          <span className="flex items-center gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Directional estimates only</span>
          {mode === "ai"
            ? <span className="flex items-center gap-1.5"><Brain className="h-3.5 w-3.5" /> Orb-powered recommendations</span>
            : <span className="flex items-center gap-1.5"><FlaskConical className="h-3.5 w-3.5" /> Instant — no AI quota used</span>
          }
        </div>
      )}

      {/* Generating stage */}
      {stage === "generating" && (
        <Card className="shadow-sm border-slate-200">
          <CardContent className="py-20 text-center space-y-5">
            <div className="relative mx-auto w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
              <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
              <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-slate-700 text-lg font-medium">
                {mode === "ai" ? "Analysing your Salesforce blueprint…" : "Building your blueprint…"}
              </p>
              <p className="text-slate-400 text-sm mt-1">
                {mode === "ai"
                  ? "Orb is evaluating 21 product families across all Salesforce clouds"
                  : "Running rules engine across 21 Salesforce product families"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

