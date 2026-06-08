"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BookCard } from "@/components/search/BookCard";
import { motion } from "framer-motion";

type Book = {
  id: string; title: string; author: string; category: string;
  year: number; availableCopies: number; totalCopies: number;
  coverImage: string | null; publisher: string;
};

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const [query,      setQuery]      = useState(searchParams.get("q") ?? "");
  const [category,   setCategory]   = useState("");
  const [available,  setAvailable]  = useState(false);
  const [sort,       setSort]       = useState("relevance");
  const [books,      setBooks]      = useState<Book[]>([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading,    setLoading]    = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/books/categories")
      .then((r) => r.json())
      .then(setCategories);
  }, []);

  const fetchBooks = useCallback(async (p = 1) => {
    setLoading(true);
    const params = new URLSearchParams({
      q:         query,
      category,
      available: String(available),
      sort,
      page:      String(p),
    });
    const res  = await fetch(`/api/books?${params}`);
    const data = await res.json();
    setBooks(data.books);
    setTotal(data.total);
    setTotalPages(data.totalPages);
    setPage(p);
    setLoading(false);
  }, [query, category, available, sort]);

  useEffect(() => { fetchBooks(1); }, [category, available, sort]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(query)}`);
    fetchBooks(1);
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 max-w-7xl mx-auto">
      <h1 className="font-serif text-3xl font-bold mb-8">Search the Catalog</h1>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-8 max-w-2xl">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Title, author, ISBN, category…"
          className="flex-1 px-5 py-3 rounded-full glass text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <button type="submit" className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 font-medium text-sm transition-colors">
          Search
        </button>
      </form>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8 text-sm">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="glass px-4 py-2 rounded-full text-gray-300 bg-transparent outline-none cursor-pointer"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c} className="bg-gray-900">{c}</option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="glass px-4 py-2 rounded-full text-gray-300 bg-transparent outline-none cursor-pointer"
        >
          <option value="relevance" className="bg-gray-900">Sort: Relevance</option>
          <option value="title"     className="bg-gray-900">Sort: Title A–Z</option>
          <option value="author"    className="bg-gray-900">Sort: Author</option>
          <option value="year"      className="bg-gray-900">Sort: Newest</option>
        </select>

        <label className="glass px-4 py-2 rounded-full text-gray-300 flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={available}
            onChange={(e) => setAvailable(e.target.checked)}
            className="accent-blue-500"
          />
          Available only
        </label>
      </div>

      {/* Results count */}
      <p className="text-gray-400 text-sm mb-6">
        {loading ? "Searching…" : `${total} result${total !== 1 ? "s" : ""} found`}
      </p>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl h-64 animate-pulse" />
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">📭</p>
          <p className="text-lg">No books found. Try a different search.</p>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-12">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => fetchBooks(p)}
              className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${
                p === page
                  ? "bg-blue-600 text-white"
                  : "glass text-gray-400 hover:text-white"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
