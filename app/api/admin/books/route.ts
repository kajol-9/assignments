import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") return null;
  return session;
}

const bookSchema = z.object({
  title:       z.string().min(1),
  author:      z.string().min(1),
  isbn:        z.string().min(1),
  category:    z.string().min(1),
  publisher:   z.string().min(1),
  year:        z.number().int(),
  totalCopies: z.number().int().min(1),
  description: z.string().optional(),
  coverImage:  z.string().url().optional(),
  language:    z.string().optional(),
  pages:       z.number().int().optional(),
  location:    z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const data = bookSchema.parse(body);

    const book = await prisma.book.create({
      data: { ...data, availableCopies: data.totalCopies },
    });

    return NextResponse.json(book, { status: 201 });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: err.errors }, { status: 422 });
    }
    if (err.code === "P2002") {
      return NextResponse.json({ error: "ISBN already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { bookId } = await req.json();
  await prisma.book.delete({ where: { id: bookId } });
  return NextResponse.json({ ok: true });
}
