"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const DEPARTMENTS = [
  "Computer Science & Engineering",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Chemical Engineering",
  "Physics",
  "Chemistry",
  "Mathematics",
  "Biology",
  "Humanities & Social Sciences",
  "Economics",
  "Management",
  "Administration / Staff",
  "Other",
];

export default function ApplyPage() {
  const [form, setForm] = useState({
    name: "", email: "", studentId: "", department: "", phone: "",
  });
  const [agreed,   setAgreed]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState<string | null>(null);
  const [error,    setError]    = useState<string | null>(null);

  function change(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) { setError("Please agree to the library rules before submitting."); return; }
    setLoading(true);
    setError(null);

    const res  = await fetch("/api/membership", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setSuccess(`Application submitted! Your membership ID is ${data.membershipId}. You will receive login credentials by email once approved.`);
    } else {
      setError(data.error ?? "Something went wrong. Please try again.");
    }
  }

  if (success) {
    return (
      <div className="min-h-screen pt-24 pb-20 px-4 max-w-lg mx-auto flex flex-col items-center justify-center text-center">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="font-serif text-3xl font-bold mb-4">Application Submitted!</h1>
        <p className="text-gray-300 leading-relaxed mb-8">{success}</p>
        <Link href="/" className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 font-medium transition-colors">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 max-w-xl mx-auto">
      <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">← Home</Link>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6"
      >
        <h1 className="font-serif text-4xl font-bold mb-2">Apply for Membership</h1>
        <p className="text-gray-400 mb-8">
          Fill in the form below. An admin will review your application and send you login
          credentials within one working day.
        </p>

        <form onSubmit={submit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Full Name *</label>
            <input
              name="name" value={form.name} onChange={change} required
              placeholder="As on your college ID"
              className="w-full glass px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">College Email *</label>
            <input
              name="email" type="email" value={form.email} onChange={change} required
              placeholder="you@college.edu"
              className="w-full glass px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Student ID */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Student / Employee ID *</label>
            <input
              name="studentId" value={form.studentId} onChange={change} required
              placeholder="e.g. 23CS001"
              className="w-full glass px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Department *</label>
            <select
              name="department" value={form.department} onChange={change} required
              className="w-full glass px-4 py-3 rounded-xl text-white bg-transparent outline-none focus:ring-2 focus:ring-blue-500 text-sm cursor-pointer"
            >
              <option value="" className="bg-gray-900">Select department…</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d} className="bg-gray-900">{d}</option>
              ))}
            </select>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Phone (optional)</label>
            <input
              name="phone" type="tel" value={form.phone} onChange={change}
              placeholder="+91 98765 43210"
              className="w-full glass px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Rules agreement */}
          <div className="glass rounded-xl p-4">
            <label className="flex gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 accent-blue-500 shrink-0"
              />
              <span className="text-sm text-gray-300">
                I have read and agree to the{" "}
                <Link href="/membership/rules" className="text-blue-400 hover:underline" target="_blank">
                  library rules and policies
                </Link>
                . I understand the borrowing limits, fine policy, and my responsibilities as a member.
              </span>
            </label>
          </div>

          {error && (
            <div className="glass border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 font-medium transition-colors"
          >
            {loading ? "Submitting…" : "Submit Application"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
