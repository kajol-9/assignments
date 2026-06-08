"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

type HistoryLoan = {
  id: string;
  issuedAt: string;
  returnedAt: string;
  book: { id: string; title: string; author: string; category: string };
};

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const router   = useRouter();
  const [history, setHistory] = useState<HistoryLoan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/dashboard/history")
      .then((r) => r.json())
      .then((data) => { setHistory(data); setLoading(false); });
  }, [status]);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 max-w-3xl mx-auto">
      <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm transition-colors">← My Account</Link>
      <h1 className="font-serif text-3xl font-bold mt-4 mb-8">Borrowing History</h1>

      {history.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-gray-400">
          <p className="text-4xl mb-4">📜</p>
          <p>No borrowing history yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((loan) => (
            <div key={loan.id} className="glass rounded-xl p-4 flex items-center gap-4">
              <div className="text-2xl shrink-0">📗</div>
              <div className="flex-1 min-w-0">
                <Link href={`/book/${loan.book.id}`} className="font-medium text-sm hover:text-blue-400 transition-colors line-clamp-1">
                  {loan.book.title}
                </Link>
                <p className="text-gray-400 text-xs">{loan.book.author} · {loan.book.category}</p>
              </div>
              <div className="text-right shrink-0 text-xs text-gray-400">
                <p>Issued: {formatDate(loan.issuedAt)}</p>
                <p className="text-green-400">Returned: {formatDate(loan.returnedAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
