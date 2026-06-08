"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";

const Scene3D = dynamic(
  () => import("@/components/hero/Scene3D").then((m) => m.Scene3D),
  { ssr: false }
);

const RULES = [
  { icon: "🎓", title: "Who Can Join",       text: "All enrolled students, faculty, and staff with a valid college ID." },
  { icon: "📚", title: "Borrow Limit",       text: "Up to 5 books at a time per member." },
  { icon: "📅", title: "Loan Period",        text: "14 days. Renewable once online if no hold exists." },
  { icon: "💰", title: "Overdue Fine",       text: "₹2 per day per book after the due date." },
  { icon: "📖", title: "Reference Books",   text: "In-library use only. Cannot be checked out." },
  { icon: "🔄", title: "Annual Renewal",     text: "Membership must be renewed each academic year." },
  { icon: "⚠️", title: "Suspension",         text: "3 or more overdue books result in membership suspension." },
  { icon: "🔍", title: "Lost Book",          text: "Replacement cost + ₹50 processing fee." },
];

const STATS = [
  { label: "Books in Catalog", value: "10,000+" },
  { label: "Active Members",   value: "2,400+" },
  { label: "Categories",       value: "80+" },
  { label: "Years of Service", value: "25+" },
];

function fadeUp(delay = 0) {
  return {
    initial:   { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport:  { once: true },
    transition: { duration: 0.6, delay },
  };
}

export default function HomePage() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    else router.push("/search");
  }

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">

        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a1a] via-[#0f0f2e] to-[#0f0f1a]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.15)_0%,_transparent_70%)]" />

        {/* 3D Scene */}
        <Scene3D />

        {/* Hero text */}
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-blue-400 text-sm font-medium tracking-widest uppercase mb-4">
              Welcome to
            </p>
            <h1 className="font-serif text-5xl sm:text-7xl font-bold mb-6 leading-tight">
              <span className="text-gradient">City Library</span>
            </h1>
            <p className="text-gray-300 text-lg sm:text-xl mb-10 leading-relaxed">
              Discover thousands of books. Join our community of readers.
              <br className="hidden sm:block" />
              Knowledge is free — come borrow some.
            </p>
          </motion.div>

          {/* Search bar */}
          <motion.form
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex gap-2 max-w-xl mx-auto mb-8"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, author, ISBN…"
              className="flex-1 px-5 py-3 rounded-full glass text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 font-medium text-sm transition-colors"
            >
              Search
            </button>
          </motion.form>

          <motion.div
            className="flex flex-wrap justify-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <Link
              href="/membership/apply"
              className="px-6 py-2.5 rounded-full border border-purple-500 text-purple-300 hover:bg-purple-500/20 transition-all text-sm"
            >
              Apply for Membership
            </Link>
            <Link
              href="/search"
              className="px-6 py-2.5 rounded-full border border-gray-600 text-gray-300 hover:border-gray-400 transition-all text-sm"
            >
              Browse Catalog
            </Link>
          </motion.div>
        </div>

        {/* Scroll cue */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-gray-600 flex justify-center pt-2">
            <div className="w-1 h-2 bg-gray-400 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* ── Stats ── */}
      <section className="py-16 border-y border-white/5">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((s, i) => (
            <motion.div key={s.label} {...fadeUp(i * 0.1)}>
              <p className="text-3xl font-bold text-gradient">{s.value}</p>
              <p className="text-gray-400 text-sm mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── About ── */}
      <section className="py-24 max-w-5xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div {...fadeUp()}>
            <h2 className="font-serif text-3xl font-bold mb-5">About the Library</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              City Library has been serving the college community for over 25 years.
              Our collection spans science, literature, engineering, arts, and more —
              with thousands of physical books available to borrow.
            </p>
            <p className="text-gray-400 leading-relaxed mb-6">
              All currently enrolled students, faculty, and staff are eligible for
              a free library membership. Apply online and start borrowing within
              24 hours of approval.
            </p>
            <Link
              href="/membership/apply"
              className="inline-block px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-colors"
            >
              Apply for Free Membership →
            </Link>
          </motion.div>

          <motion.div {...fadeUp(0.2)} className="grid grid-cols-2 gap-4">
            {["Search the Catalog", "Place Holds", "Track Due Dates", "Renew Online"].map((f) => (
              <div key={f} className="glass rounded-xl p-5 text-center">
                <p className="text-white text-sm font-medium">{f}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── How to Join ── */}
      <section className="py-24 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.h2 {...fadeUp()} className="font-serif text-3xl font-bold mb-3">
            How to Get a Membership
          </motion.h2>
          <motion.p {...fadeUp(0.1)} className="text-gray-400 mb-12">
            Takes less than 2 minutes. Approved within one working day.
          </motion.p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { step: "1", title: "Fill the Form", desc: "Provide your name, student ID, department and email." },
              { step: "2", title: "Wait for Approval", desc: "The library admin reviews and approves your request." },
              { step: "3", title: "Start Borrowing", desc: "Receive login credentials and borrow up to 5 books." },
            ].map((s, i) => (
              <motion.div key={s.step} {...fadeUp(i * 0.15)} className="glass rounded-2xl p-6 text-left">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-lg mb-4">
                  {s.step}
                </div>
                <h3 className="font-semibold mb-2">{s.title}</h3>
                <p className="text-gray-400 text-sm">{s.desc}</p>
              </motion.div>
            ))}
          </div>
          <motion.div {...fadeUp(0.4)} className="mt-10">
            <Link
              href="/membership/apply"
              className="px-8 py-3 rounded-full bg-purple-600 hover:bg-purple-500 font-medium transition-colors"
            >
              Apply Now — It&apos;s Free
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Library Rules ── */}
      <section className="py-24 max-w-5xl mx-auto px-4">
        <motion.div {...fadeUp()} className="text-center mb-12">
          <h2 className="font-serif text-3xl font-bold mb-3">Library Rules</h2>
          <p className="text-gray-400">Please read before applying for membership.</p>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {RULES.map((r, i) => (
            <motion.div
              key={r.title}
              {...fadeUp(i * 0.07)}
              className="glass rounded-xl p-5 hover:border-blue-500/40 transition-all"
            >
              <div className="text-2xl mb-3">{r.icon}</div>
              <h3 className="font-semibold text-sm mb-2">{r.title}</h3>
              <p className="text-gray-400 text-xs leading-relaxed">{r.text}</p>
            </motion.div>
          ))}
        </div>
        <motion.div {...fadeUp(0.3)} className="text-center mt-8">
          <Link href="/membership/rules" className="text-blue-400 text-sm hover:text-blue-300 transition-colors">
            View full rules & policies →
          </Link>
        </motion.div>
      </section>

      {/* ── Opening Hours ── */}
      <section className="py-20 bg-white/[0.02] border-t border-white/5">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <motion.h2 {...fadeUp()} className="font-serif text-3xl font-bold mb-10">
            Opening Hours
          </motion.h2>
          <motion.div {...fadeUp(0.1)} className="glass rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-blue-600/20 text-blue-300">
                  <th className="py-3 px-6 text-left">Day</th>
                  <th className="py-3 px-6 text-right">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  ["Monday – Friday", "09:00 AM – 11:00 PM"],
                  ["Saturday",        "09:00 AM – 06:30 PM"],
                  ["Sunday",          "10:00 AM – 05:00 PM"],
                  ["Public Holidays", "Closed"],
                ].map(([day, hours]) => (
                  <tr key={day} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-6 text-left text-gray-300">{day}</td>
                    <td className="py-3 px-6 text-right font-medium">
                      {hours === "Closed"
                        ? <span className="text-red-400">{hours}</span>
                        : hours}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>
    </>
  );
}
