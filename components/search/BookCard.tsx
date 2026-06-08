"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";

type Book = {
  id:             string;
  title:          string;
  author:         string;
  category:       string;
  year:           number;
  availableCopies: number;
  totalCopies:    number;
  coverImage:     string | null;
  publisher:      string;
};

export function BookCard({ book }: { book: Book }) {
  const { data: session } = useSession();
  const [held, setHeld]   = useState(false);
  const [loading, setLoading] = useState(false);

  async function placeHold() {
    if (!session) { window.location.href = "/login"; return; }
    setLoading(true);
    const res = await fetch("/api/holds", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ bookId: book.id }),
    });
    setLoading(false);
    if (res.ok || res.status === 409) setHeld(true);
  }

  const available = book.availableCopies > 0;

  return (
    <div className="glass rounded-2xl overflow-hidden hover:border-blue-500/40 transition-all group flex flex-col">
      {/* Cover placeholder */}
      <div className="h-40 bg-gradient-to-br from-blue-900/40 to-purple-900/40 flex items-center justify-center relative overflow-hidden">
        {book.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={book.coverImage} alt={book.title} className="h-full w-full object-cover" />
        ) : (
          <div className="text-center px-4">
            <div className="text-4xl mb-1">📖</div>
            <p className="text-xs text-gray-400 line-clamp-2">{book.title}</p>
          </div>
        )}
        <span
          className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-medium ${
            available ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
          }`}
        >
          {available ? `${book.availableCopies} available` : "All out"}
        </span>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <Link href={`/book/${book.id}`} className="group-hover:text-blue-400 transition-colors">
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 mb-1">{book.title}</h3>
        </Link>
        <p className="text-gray-400 text-xs mb-1">{book.author}</p>
        <p className="text-gray-500 text-xs mb-3">{book.category} · {book.year}</p>

        <div className="mt-auto flex gap-2">
          <Link
            href={`/book/${book.id}`}
            className="flex-1 text-center py-1.5 rounded-lg border border-white/10 text-xs text-gray-300 hover:border-blue-500 hover:text-blue-400 transition-colors"
          >
            Details
          </Link>
          <button
            onClick={placeHold}
            disabled={held || loading}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              held
                ? "bg-green-600/20 text-green-400 cursor-default"
                : "bg-blue-600 hover:bg-blue-500 text-white"
            }`}
          >
            {held ? "Hold placed" : loading ? "…" : "Place hold"}
          </button>
        </div>
      </div>
    </div>
  );
}
