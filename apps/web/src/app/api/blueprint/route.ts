import { NextRequest, NextResponse } from "next/server";
import { generateBlueprint, extractSignals, enrichWithTemplates } from "@orgblueprint/core";
import {
  generateBlueprintFromLLM,
  generateBlueprintFromGemini,
  generateBlueprintFromGroq,
  generateBlueprintFromNvidia,
} from "@/lib/anthropic";
import { checkAndRecordAiRun } from "@/lib/quota";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { nanoid } from "nanoid";
import {
  buildBlueprintContext,
  inferClarificationAnswers,
  normalizeBlueprintResult,
} from "@/lib/clarifications";

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const input: string = body.input ?? "";
  const answers: Record<string, string> = body.answers ?? {};
  const mode: "demo" | "ai" = body.mode ?? "demo";
  const contextInput = buildBlueprintContext(input, answers);
  const structuredAnswers = inferClarificationAnswers(input, answers);

  let result;
  let aiPowered = false;

  const hasAiKey = !!(
    process.env.ANTHROPIC_API_KEY ||
    process.env.NVIDIA_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GROQ_API_KEY
  );

  if (mode === "ai" && hasAiKey) {
    // Enforce per-IP quota for AI mode
    const ip = getClientIp(req);
    const quota = await checkAndRecordAiRun(ip);

    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: quota.cooldownSeconds
            ? `Please wait ${quota.cooldownSeconds}s before your next AI run.`
            : `Daily AI quota reached (${quota.usedToday}/${3} runs used). Resets at midnight UTC or switch to Demo mode.`,
          quota,
        },
        { status: 429 }
      );
    }

    try {
      if (process.env.ANTHROPIC_API_KEY) {
        result = await generateBlueprintFromLLM(input, answers);
      } else if (process.env.GEMINI_API_KEY) {
        // Gemini first — faster and more reliable than NVIDIA for blueprint generation
        result = await generateBlueprintFromGemini(input, answers);
      } else if (process.env.NVIDIA_API_KEY) {
        result = await generateBlueprintFromNvidia(input, answers);
      } else if (process.env.GROQ_API_KEY) {
        result = await generateBlueprintFromGroq(input, answers);
      } else {
        throw new Error("no_ai_key");
      }
      result = normalizeBlueprintResult(result, contextInput, structuredAnswers);
      aiPowered = true;
      // Return quota info in response so UI can show remaining count
      const session = await auth();
      let slug: string | null = null;
      if (session?.user?.id) {
        slug = nanoid(8);
        const title = input.slice(0, 60).trim() + (input.length > 60 ? "…" : "");
        await prisma.blueprint.create({
          data: {
            slug,
            title,
            needText: input,
            answers: JSON.stringify(answers),
            result: JSON.stringify(result),
            userId: session.user.id,
            isPublic: false,
          },
        });
      }
      return NextResponse.json({ result, slug, aiPowered, quota });
    } catch (e) {
      console.error("LLM blueprint failed, falling back to demo mode:", e);
      const signals = extractSignals(contextInput, structuredAnswers);
      result = enrichWithTemplates(generateBlueprint(contextInput, structuredAnswers), signals);
    }
  } else {
    // Demo mode: deterministic rules engine + polished template narratives
    const signals = extractSignals(contextInput, structuredAnswers);
    result = enrichWithTemplates(generateBlueprint(contextInput, structuredAnswers), signals);
  }

  // Save to DB if user is logged in
  const session = await auth();
  let slug: string | null = null;

  if (session?.user?.id) {
    slug = nanoid(8);
    const title = input.slice(0, 60).trim() + (input.length > 60 ? "…" : "");
    await prisma.blueprint.create({
      data: {
        slug,
        title,
        needText: input,
        answers: JSON.stringify(answers),
        result: JSON.stringify(result),
        userId: session.user.id,
        isPublic: false,
      },
    });
  }

  return NextResponse.json({ result, slug, aiPowered });
}
