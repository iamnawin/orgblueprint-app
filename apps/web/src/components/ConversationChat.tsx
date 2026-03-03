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
import { Mic, MicOff, Send, Sparkles, ArrowRight } from "lucide-react";

type Stage = "describe" | "conversation" | "confirm" | "generating" | "results";

interface ConversationEntry {
  question: string;
  answer: string;
}

export function ConversationChat() {
  const [stage, setStage] = useState<Stage>("describe");
  const [needText, setNeedText] = useState("");
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [generating, setGenerating] = useState(false);
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

  async function fetchNextQuestion() {
    setLoadingQuestion(true);
    try {
      const res = await fetch("/api/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ needText, answered: answeredMap }),
      });
      const data = await res.json();
      if (data.question) {
        setCurrentQuestion(data.question);
      } else {
        setCurrentQuestion(null);
        setStage("confirm");
      }
    } catch {
      setCurrentQuestion(null);
      setStage("confirm");
    } finally {
      setLoadingQuestion(false);
    }
  }

  function handleDescribeContinue() {
    if (!needText.trim()) return;
    setStage("conversation");
    fetchNextQuestion();
  }

  function handleAnswer(skip = false) {
    if (!currentQuestion) return;
    if (!skip && currentAnswer.trim()) {
      setConversation((prev) => [
        ...prev,
        { question: currentQuestion, answer: currentAnswer.trim() },
      ]);
    }
    setCurrentAnswer("");
    fetchNextQuestion();
  }

  async function generate() {
    setGenerating(true);
    setStage("generating");
    try {
      const res = await fetch("/api/blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: needText, answers: answeredMap }),
      });
      const data = await res.json();
      setResult(data.result);
      setBlueprintSlug(data.slug ?? null);
      setAiPowered(data.aiPowered ?? false);
      setStage("results");
    } catch {
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
        onReset={() => {
          setStage("describe");
          setNeedText("");
          setConversation([]);
          setCurrentQuestion(null);
          setResult(null);
          setBlueprintSlug(null);
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
          AI-powered Salesforce blueprint generator
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">OrgBlueprint</h1>
        <p className="text-slate-500 text-lg">
          Describe your business — we&apos;ll ask the right questions and build your Salesforce blueprint.
        </p>
      </div>

      {/* Describe stage */}
      {stage === "describe" && (
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">What does your business need?</CardTitle>
            <p className="text-sm text-slate-500">
              Describe your industry, team, pain points, and goals. The more detail, the better.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
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
          </CardContent>
        </Card>
      )}

      {/* Conversation stage — chat bubbles */}
      {stage === "conversation" && (
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Let&apos;s refine your blueprint</CardTitle>
              <span className="text-sm text-slate-400 font-normal">
                {conversation.length} / 5
              </span>
            </div>
            <Progress value={(conversation.length / 5) * 100} className="h-1.5 mt-1" />
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Chat history */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1 pb-1">
              {conversation.map((c, i) => (
                <div key={i} className="space-y-2">
                  {/* AI question bubble */}
                  <div className="flex justify-start">
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
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span
                        className="h-2 w-2 rounded-full bg-slate-400 animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="h-2 w-2 rounded-full bg-slate-400 animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="h-2 w-2 rounded-full bg-slate-400 animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </div>
              ) : currentQuestion ? (
                <div className="flex justify-start">
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
              {generating ? "Generating…" : "Generate Blueprint"}
              {!generating && <Sparkles className="ml-2 h-4 w-4" />}
            </Button>
          </CardContent>
        </Card>
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
                Analysing your Salesforce blueprint…
              </p>
              <p className="text-slate-400 text-sm mt-1">
                Evaluating 21 product families across all Salesforce clouds
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
