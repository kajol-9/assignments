import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const book = await prisma.book.findUnique({
    where: { id: params.id },
  });

  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  const related = await prisma.book.findMany({
    where: {
      category: book.category,
      id:       { not: book.id },
    },
    take: 4,
  });

  return NextResponse.json({ book, related });
}
