import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const memberId = (session.user as any).id;

  const history = await prisma.loan.findMany({
    where:   { memberId, status: "RETURNED" },
    include: { book: true },
    orderBy: { returnedAt: "desc" },
  });

  return NextResponse.json(history);
}
