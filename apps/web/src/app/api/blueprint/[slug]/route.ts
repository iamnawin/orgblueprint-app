import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const blueprint = await prisma.blueprint.findUnique({
    where: { slug: params.slug },
    include: { user: { select: { name: true, email: true } } },
  });

  if (!blueprint) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const session = await auth();
  const isOwner = session?.user?.id === blueprint.userId;

  if (!blueprint.isPublic && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    ...blueprint,
    result: JSON.parse(blueprint.result),
    answers: JSON.parse(blueprint.answers),
    isOwner,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const blueprint = await prisma.blueprint.findUnique({
    where: { slug: params.slug },
  });

  if (!blueprint || blueprint.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const updated = await prisma.blueprint.update({
    where: { slug: params.slug },
    data: {
      ...(body.result !== undefined && { result: JSON.stringify(body.result) }),
      ...(body.isPublic !== undefined && { isPublic: body.isPublic }),
      ...(body.title !== undefined && { title: body.title }),
    },
  });

  return NextResponse.json({ slug: updated.slug, isPublic: updated.isPublic });
}
