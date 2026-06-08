"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { BookCard } from "@/components/search/BookCard";
import { motion } from "framer-motion";

type Book = {
  id: string; title: string; author: string; isbn: string;
  category: string; publisher: string; year: number; language: string;
  pages: number | null; location: string | null; description: string | null;
  coverImage: string | null; totalCopies: number; availableCopies: number;
};

export default function BookDetailPage() {
  const { id }           = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [book,    setBook]    = useState<Book | null>(null);
  const [related, setRelated] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [held,    setHeld]    = useState(false);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    fetch(`/api/books/${id}`)
      .then((r) => r.json())
      .then(({ book, related }) => {
        setBook(book);
        setRelated(related);
        setLoading(false);
      });
  }, [id]);

  async function placeHold() {
    if (!session) { window.location.href = "/login"; return; }
    setPlacing(true);
    await fetch("/api/holds", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ bookId: id }),
    });
    setPlacing(false);
    setHeld(true);
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen pt-24 text-center text-gray-400">
        <p className="text-5xl mb-4">📭</p>
        <p>Book not found.</p>
        <Link href="/search" className="text-blue-400 mt-4 inline-block">← Back to search</Link>
      </div>
    );
  }

  const available = book.availableCopies > 0;

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 max-w-5xl mx-auto">
      <Link href="/search" className="text-gray-400 hover:text-white text-sm mb-8 inline-block transition-colors">
        ← Back to search
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid md:grid-cols-3 gap-10"
      >
        {/* Cover */}
        <div className="md:col-span-1">
          <div className="glass rounded-2xl overflow-hidden aspect-[3/4] flex items-center justify-center bg-gradient-to-br from-blue-900/40 to-purple-900/40">
            {book.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-6">
                <div className="text-7xl mb-3">📖</div>
                <p className="text-gray-400 text-sm">{book.title}</p>
              </div>
            )}
          </div>

          {/* Availability */}
          <div className="mt-4 glass rounded-xl p-4">
            <div className={`flex items-center gap-2 mb-2 ${available ? "text-green-400" : "text-red-400"}`}>
              <div className={`w-2 h-2 rounded-full ${available ? "bg-green-400" : "bg-red-400"}`} />
              <span className="font-medium text-sm">{available ? "Available" : "All copies checked out"}</span>
            </div>
            <p className="text-gray-400 text-xs">{book.availableCopies} of {book.totalCopies} copies available</p>
            {book.location && (
              <p className="text-gray-400 text-xs mt-1">Location: {book.location}</p>
            )}
          </div>

          {/* Action */}
          <button
            onClick={placeHold}
            disabled={held || placing}
            className={`w-full mt-3 py-3 rounded-xl font-medium text-sm transition-colors ${
              held
                ? "bg-green-600/20 text-green-400 cursor-default"
                : "bg-blue-600 hover:bg-blue-500 text-white"
            }`}
          >
            {held ? "✓ Hold placed" : placing ? "Placing hold…" : "Place Hold"}
          </button>
          {!session && (
            <p className="text-gray-500 text-xs text-center mt-2">
              <Link href="/login" className="text-blue-400 hover:underline">Sign in</Link> to place a hold
            </p>
          )}
        </div>

        {/* Details */}
        <div className="md:col-span-2">
          <span className="text-xs px-3 py-1 rounded-full bg-blue-600/20 text-blue-400 mb-3 inline-block">
            {book.category}
          </span>
          <h1 className="font-serif text-3xl font-bold mb-2 leading-tight">{book.title}</h1>
          <p className="text-gray-400 text-lg mb-6">by {book.author}</p>

          {book.description && (
            <div className="mb-8">
              <h2 className="font-semibold mb-2 text-sm uppercase tracking-widest text-gray-400">Description</h2>
              <p className="text-gray-300 leading-relaxed text-sm">{book.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {[
              ["Publisher",  book.publisher],
              ["Year",       String(book.year)],
              ["ISBN",       book.isbn],
              ["Language",   book.language],
              book.pages ? ["Pages", String(book.pages)] : null,
            ]
              .filter(Boolean)
              .map(([label, value]) => (
                <div key={label} className="glass rounded-xl px-4 py-3">
                  <p className="text-gray-500 text-xs mb-0.5">{label}</p>
                  <p className="text-white text-sm font-medium">{value}</p>
                </div>
              ))}
          </div>
        </div>
      </motion.div>

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="font-serif text-2xl font-bold mb-6">More in {book.category}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {related.map((r) => <BookCard key={r.id} book={r} />)}
          </div>
        </div>
      )}
    </div>
  );
}
