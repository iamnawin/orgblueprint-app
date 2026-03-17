import { NextRequest, NextResponse } from "next/server";
import { generateBlueprint, extractSignals, enrichWithTemplates } from "@orgblueprint/core";
import { generateBlueprintFromLLM, generateBlueprintFromGemini } from "@/lib/anthropic";
import { checkAndRecordAiRun } from "@/lib/quota";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { nanoid } from "nanoid";

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

  let result;
  let aiPowered = false;

  const hasAiKey = !!(process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY);

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
      result = process.env.ANTHROPIC_API_KEY
        ? await generateBlueprintFromLLM(input, answers)
        : await generateBlueprintFromGemini(input, answers);
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
      const signals = extractSignals(input, {});
      result = enrichWithTemplates(generateBlueprint(input, {}), signals);
    }
  } else {
    // Demo mode: deterministic rules engine + polished template narratives
    const signals = extractSignals(input, {});
    result = enrichWithTemplates(generateBlueprint(input, {}), signals);
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
