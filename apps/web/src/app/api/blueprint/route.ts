import { generateBlueprint } from "@orgblueprint/core";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = generateBlueprint(body.input ?? "", body.answers ?? {});
  return NextResponse.json(result);
}
