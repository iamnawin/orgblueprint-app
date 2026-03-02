import { generateBlueprint } from "@orgblueprint/core";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = generateBlueprint(body.input ?? "", body.answers ?? {});
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }
}
