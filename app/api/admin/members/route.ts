import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const members = await prisma.member.findMany({
    where:   { role: "MEMBER" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, email: true, studentId: true,
      department: true, membershipId: true, status: true,
      joinedAt: true, expiresAt: true,
    },
  });

  return NextResponse.json(members);
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { memberId, status } = await req.json();
  const validStatuses = ["ACTIVE", "PENDING", "EXPIRED", "SUSPENDED"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = await prisma.member.update({
    where: { id: memberId },
    data:  { status },
  });

  return NextResponse.json(updated);
}
