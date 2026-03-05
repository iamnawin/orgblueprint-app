import { NextRequest, NextResponse } from "next/server";
import { generateBlueprint, extractSignals } from "@orgblueprint/core";
import { enrichWithTemplates } from "@orgblueprint/core";
import { generateBlueprintFromLLM } from "@/lib/anthropic";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const input: string = body.input ?? "";
  const answers: Record<string, string> = body.answers ?? {};
  const mode: "demo" | "ai" = body.mode ?? "demo";

  let result;
  let aiPowered = false;

  if (mode === "ai" && process.env.ANTHROPIC_API_KEY) {
    try {
      result = await generateBlueprintFromLLM(input, answers);
      aiPowered = true;
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
    const title =
      input.slice(0, 60).trim() + (input.length > 60 ? "…" : "");
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
