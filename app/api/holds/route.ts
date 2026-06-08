import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { bookId } = await req.json();
  if (!bookId) {
    return NextResponse.json({ error: "bookId required" }, { status: 400 });
  }

  const memberId = (session.user as any).id;

  const existing = await prisma.hold.findUnique({
    where: { memberId_bookId: { memberId, bookId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Hold already placed" }, { status: 409 });
  }

  const position = (await prisma.hold.count({
    where: { bookId, status: "WAITING" },
  })) + 1;

  const hold = await prisma.hold.create({
    data: { memberId, bookId, position },
  });

  return NextResponse.json(hold, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const memberId = (session.user as any).id;
  const holds = await prisma.hold.findMany({
    where:   { memberId },
    include: { book: true },
    orderBy: { requestedAt: "desc" },
  });

  return NextResponse.json(holds);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { holdId } = await req.json();
  const memberId   = (session.user as any).id;

  await prisma.hold.deleteMany({ where: { id: holdId, memberId } });
  return NextResponse.json({ ok: true });
}
