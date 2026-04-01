import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json();
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const trimmedName = typeof name === "string" ? name.trim() : "";

  if (!normalizedEmail || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  if (String(password).length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(String(password), 12);
    const user = await prisma.user.create({
      data: { email: normalizedEmail, password: hashed, name: trimmedName || null },
    });

    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  } catch (error) {
    console.error("Registration failed", error);
    return NextResponse.json({ error: "Registration is temporarily unavailable." }, { status: 500 });
  }
}
