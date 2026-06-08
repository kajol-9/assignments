import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calculateFine } from "@/lib/utils";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const memberId = (session.user as any).id;

  await prisma.loan.updateMany({
    where: {
      memberId,
      status:  "ACTIVE",
      dueDate: { lt: new Date() },
    },
    data: { status: "OVERDUE" },
  });

  const loans = await prisma.loan.findMany({
    where:   { memberId, status: { in: ["ACTIVE", "OVERDUE"] } },
    include: { book: true },
    orderBy: { dueDate: "asc" },
  });

  const enriched = loans.map((l) => ({
    ...l,
    fine: l.status === "OVERDUE" ? calculateFine(l.dueDate) : 0,
  }));

  return NextResponse.json(enriched);
}
