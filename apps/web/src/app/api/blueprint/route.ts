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
  const contextInput = buildBlueprintContext(input, answers);
  const structuredAnswers = inferClarificationAnswers(input, answers);

  let result;
  let aiPowered = false;

  const hasAiKey = !!(
    process.env.ANTHROPIC_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GROQ_API_KEY ||
    process.env.NVIDIA_API_KEY
  );

  // Always try LLM first — it makes ALL decisions (products, objects, architecture, roadmap)
  // Falls through silently if quota exhausted or all providers fail
  if (hasAiKey) {
    const ip = getClientIp(req);
    const quota = await checkAndRecordAiRun(ip);

    if (quota.allowed) {
      try {
        if (process.env.ANTHROPIC_API_KEY) {
          result = await generateBlueprintFromLLM(input, answers);
        } else if (process.env.GEMINI_API_KEY) {
          result = await generateBlueprintFromGemini(input, answers);
        } else if (process.env.GROQ_API_KEY) {
          result = await generateBlueprintFromGroq(input, answers);
        } else if (process.env.NVIDIA_API_KEY) {
          result = await generateBlueprintFromNvidia(input, answers);
        }

        if (result) {
          result = normalizeBlueprintResult(result, contextInput, structuredAnswers);
          aiPowered = true;
        }
      } catch (e) {
        console.error("All LLM providers failed, falling back to rules engine:", e);
      }
    }
    // quota exhausted → fall through to rules engine below
  }

  // Fallback: deterministic rules engine (always works, no API key needed)
  if (!result) {
    const signals = extractSignals(contextInput, structuredAnswers);
    result = enrichWithTemplates(generateBlueprint(contextInput, structuredAnswers), signals);
  }

  // Save to DB if user is authenticated
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
