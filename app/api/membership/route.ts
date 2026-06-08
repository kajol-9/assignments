import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createHash } from "crypto";
import { prisma } from "@/lib/db";
import { generateMembershipId } from "@/lib/utils";

const applySchema = z.object({
  name:       z.string().min(2).max(100),
  email:      z.string().email(),
  studentId:  z.string().min(3).max(30),
  department: z.string().min(2).max(100),
  phone:      z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = applySchema.parse(body);

    const existing = await prisma.member.findFirst({
      where: {
        OR: [{ email: data.email }, { studentId: data.studentId }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Email or Student ID already registered." },
        { status: 409 }
      );
    }

    const tempPassword   = Math.random().toString(36).slice(-8);
    const passwordHash   = createHash("sha256").update(tempPassword).digest("hex");
    const membershipId   = generateMembershipId();
    const expiresAt      = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const member = await prisma.member.create({
      data: {
        ...data,
        membershipId,
        passwordHash,
        expiresAt,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      message:
        "Application submitted. Await admin approval — you will receive login credentials by email.",
      membershipId: member.membershipId,
    });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: err.errors }, { status: 422 });
    }
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
