import { NextRequest, NextResponse } from "next/server";
import { generateBlueprint } from "@orgblueprint/core";
import { generateBlueprintFromLLM } from "@/lib/anthropic";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const input: string = body.input ?? "";
  const answers: Record<string, string> = body.answers ?? {};

  let result;
  const hasKey = !!process.env.ANTHROPIC_API_KEY;

  if (hasKey) {
    try {
      result = await generateBlueprintFromLLM(input, answers);
    } catch (e) {
      console.error("LLM blueprint failed, falling back to rules engine:", e);
      result = generateBlueprint(input, {});
    }
  } else {
    result = generateBlueprint(input, {});
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

  return NextResponse.json({ result, slug, aiPowered: hasKey });
}
