import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const categories = await prisma.book.findMany({
    select:   { category: true },
    distinct: ["category"],
    orderBy:  { category: "asc" },
  });
  return NextResponse.json(categories.map((c) => c.category));
}
