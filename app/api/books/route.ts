import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q         = searchParams.get("q")?.trim() ?? "";
  const category  = searchParams.get("category") ?? "";
  const available = searchParams.get("available") === "true";
  const sort      = searchParams.get("sort") ?? "relevance";
  const page      = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit     = 12;
  const skip      = (page - 1) * limit;

  const where: any = {};

  if (q) {
    where.OR = [
      { title:     { contains: q, mode: "insensitive" } },
      { author:    { contains: q, mode: "insensitive" } },
      { isbn:      { contains: q, mode: "insensitive" } },
      { category:  { contains: q, mode: "insensitive" } },
      { publisher: { contains: q, mode: "insensitive" } },
    ];
  }

  if (category) {
    where.category = { equals: category, mode: "insensitive" };
  }

  if (available) {
    where.availableCopies = { gt: 0 };
  }

  const orderBy: any =
    sort === "author" ? { author: "asc" }
    : sort === "year" ? { year: "desc" }
    : sort === "title" ? { title: "asc" }
    : { title: "asc" };

  const [books, total] = await Promise.all([
    prisma.book.findMany({ where, orderBy, skip, take: limit }),
    prisma.book.count({ where }),
  ]);

  return NextResponse.json({
    books,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
