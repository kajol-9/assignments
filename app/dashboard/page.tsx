"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { formatDate, daysUntil } from "@/lib/utils";

type Loan = {
  id: string;
  dueDate: string;
  status: "ACTIVE" | "OVERDUE";
  fine: number;
  book: { id: string; title: string; author: string; coverImage: string | null };
};

type Hold = {
  id: string;
  position: number;
  requestedAt: string;
  book: { id: string; title: string; author: string };
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [holds, setHolds] = useState<Hold[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    Promise.all([
      fetch("/api/dashboard/loans").then((r) => r.json()),
      fetch("/api/holds").then((r) => r.json()),
    ]).then(([loansData, holdsData]) => {
      setLoans(loansData);
      setHolds(holdsData);
      setLoading(false);
    });
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const overdue    = loans.filter((l) => l.status === "OVERDUE");
  const totalFines = overdue.reduce((s, l) => s + l.fine, 0);

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="font-serif text-3xl font-bold">My Account</h1>
          <p className="text-gray-400 text-sm mt-1">
            {(session?.user as any)?.membershipId} · {session?.user?.name}
          </p>
        </div>
        <Link
          href="/dashboard/history"
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          Borrowing History →
        </Link>
      </div>

      {/* Fine banner */}
      {totalFines > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 glass border border-red-500/30 rounded-2xl p-4 flex items-center gap-4"
        >
          <div className="text-2xl">⚠️</div>
          <div>
            <p className="font-semibold text-red-400">Outstanding Fine: ₹{totalFines}</p>
            <p className="text-gray-400 text-sm">Please clear your fines at the library counter to continue borrowing.</p>
          </div>
        </motion.div>
      )}

      {/* Active Loans */}
      <section className="mb-10">
        <h2 className="font-semibold text-lg mb-4">
          Active Loans
          <span className="ml-2 text-xs text-gray-400 font-normal">{loans.length} of 5 slots used</span>
        </h2>

        {loans.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-gray-400">
            <p className="text-3xl mb-3">📚</p>
            <p>No active loans. <Link href="/search" className="text-blue-400 hover:underline">Browse the catalog →</Link></p>
          </div>
        ) : (
          <div className="space-y-3">
            {loans.map((loan) => {
              const days = daysUntil(loan.dueDate);
              const urgent = days <= 2 && loan.status === "ACTIVE";
              return (
                <div
                  key={loan.id}
                  className={`glass rounded-xl p-4 flex items-center gap-4 ${
                    loan.status === "OVERDUE" ? "border border-red-500/30" : urgent ? "border border-yellow-500/30" : ""
                  }`}
                >
                  <div className="w-10 h-14 glass rounded-lg flex items-center justify-center text-xl shrink-0">📖</div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/book/${loan.book.id}`} className="font-medium text-sm hover:text-blue-400 transition-colors line-clamp-1">
                      {loan.book.title}
                    </Link>
                    <p className="text-gray-400 text-xs">{loan.book.author}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-medium ${
                      loan.status === "OVERDUE" ? "text-red-400"
                      : urgent ? "text-yellow-400"
                      : "text-gray-300"
                    }`}>
                      {loan.status === "OVERDUE"
                        ? `Overdue · ₹${loan.fine} fine`
                        : days === 0 ? "Due today"
                        : days < 0  ? `${Math.abs(days)}d overdue`
                        : `${days}d left`}
                    </p>
                    <p className="text-gray-500 text-xs">Due {formatDate(loan.dueDate)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Holds */}
      <section>
        <h2 className="font-semibold text-lg mb-4">
          My Holds
          <span className="ml-2 text-xs text-gray-400 font-normal">{holds.length} in queue</span>
        </h2>

        {holds.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-gray-400">
            <p className="text-3xl mb-3">🔖</p>
            <p>No holds placed. <Link href="/search" className="text-blue-400 hover:underline">Search for books →</Link></p>
          </div>
        ) : (
          <div className="space-y-3">
            {holds.map((hold) => (
              <div key={hold.id} className="glass rounded-xl p-4 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-sm font-bold text-blue-400 shrink-0">
                  #{hold.position}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/book/${hold.book.id}`} className="font-medium text-sm hover:text-blue-400 transition-colors line-clamp-1">
                    {hold.book.title}
                  </Link>
                  <p className="text-gray-400 text-xs">{hold.book.author}</p>
                </div>
                <p className="text-gray-500 text-xs shrink-0">Requested {formatDate(hold.requestedAt)}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
