"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BlueprintDashboard } from "@/components/BlueprintDashboard";
import { BlueprintResult } from "@orgblueprint/core";

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

  const answeredMap = Object.fromEntries(
    conversation.map((c) => [c.question, c.answer])
  );

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
        <h1 className="text-4xl font-bold text-slate-900 mb-2">OrgBlueprint</h1>
        <p className="text-slate-500 text-lg">
          Describe your business needs and get a tailored Salesforce blueprint.
        </p>
      </div>

      {stage === "describe" && (
        <Card>
          <CardHeader>
            <CardTitle>What does your business need?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="E.g. We need to track leads better, manage our support queue, and integrate with our ERP system. About 150 users across sales and service teams."
              className="min-h-40 text-base"
              value={needText}
              onChange={(e) => setNeedText(e.target.value)}
            />
            <Button
              className="w-full"
              onClick={handleDescribeContinue}
              disabled={!needText.trim()}
            >
              Continue →
            </Button>
          </CardContent>
        </Card>
      )}

      {stage === "conversation" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Clarifying questions</CardTitle>
              <span className="text-sm text-slate-500">
                {conversation.length} answered
              </span>
            </div>
            <Progress value={(conversation.length / 5) * 100} className="h-1.5" />
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Answered questions */}
            {conversation.length > 0 && (
              <div className="space-y-2 mb-4">
                {conversation.map((c, i) => (
                  <div key={i} className="rounded-md bg-slate-50 px-3 py-2 text-sm">
                    <p className="font-medium text-slate-600">{c.question}</p>
                    <p className="text-slate-800 mt-0.5">{c.answer}</p>
                  </div>
                ))}
              </div>
            )}

            {loadingQuestion ? (
              <div className="flex items-center gap-2 text-slate-500 py-4">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
                <span>Thinking of the best question…</span>
              </div>
            ) : currentQuestion ? (
              <>
                <p className="font-medium text-slate-800">{currentQuestion}</p>
                <Input
                  placeholder="Your answer…"
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAnswer(false)}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleAnswer(false)}
                    disabled={!currentAnswer.trim()}
                  >
                    Save & next
                  </Button>
                  <Button variant="outline" onClick={() => handleAnswer(true)}>
                    Skip
                  </Button>
                  <Button
                    variant="ghost"
                    className="ml-auto"
                    onClick={() => {
                      setCurrentQuestion(null);
                      setStage("confirm");
                    }}
                  >
                    I&apos;m done answering
                  </Button>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      )}

      {stage === "confirm" && (
        <Card>
          <CardHeader>
            <CardTitle>Ready to generate your blueprint</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
              <strong>Business need:</strong> {needText}
            </div>
            {conversation.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600">
                  Your answers ({conversation.length}):
                </p>
                {conversation.map((c, i) => (
                  <div key={i} className="rounded border px-3 py-2 text-sm">
                    <span className="font-medium">{c.question}</span>
                    <span className="text-slate-500"> → </span>
                    {c.answer}
                  </div>
                ))}
              </div>
            )}
            <Button className="w-full" onClick={generate} disabled={generating}>
              {generating ? "Generating…" : "Generate Blueprint"}
            </Button>
          </CardContent>
        </Card>
      )}

      {stage === "generating" && (
        <Card>
          <CardContent className="py-16 text-center space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent mx-auto" />
            <p className="text-slate-600 text-lg">
              Generating your Salesforce blueprint…
            </p>
            <p className="text-slate-400 text-sm">This usually takes 10-20 seconds</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
