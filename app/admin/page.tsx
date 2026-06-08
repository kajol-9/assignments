"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";

type Member = {
  id: string; name: string; email: string; studentId: string;
  department: string; membershipId: string; status: string;
  joinedAt: string; expiresAt: string;
};

const STATUS_COLORS: Record<string, string> = {
  PENDING:   "text-yellow-400 bg-yellow-400/10",
  ACTIVE:    "text-green-400  bg-green-400/10",
  EXPIRED:   "text-gray-400   bg-gray-400/10",
  SUSPENDED: "text-red-400    bg-red-400/10",
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router   = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("ALL");

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated" && (session?.user as any)?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/admin/members")
      .then((r) => r.json())
      .then((data) => { setMembers(data); setLoading(false); });
  }, [status]);

  async function updateStatus(memberId: string, newStatus: string) {
    await fetch("/api/admin/members", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ memberId, status: newStatus }),
    });
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, status: newStatus } : m))
    );
  }

  const filtered = filter === "ALL" ? members : members.filter((m) => m.status === filter);
  const counts   = {
    ALL:       members.length,
    PENDING:   members.filter((m) => m.status === "PENDING").length,
    ACTIVE:    members.filter((m) => m.status === "ACTIVE").length,
    SUSPENDED: members.filter((m) => m.status === "SUSPENDED").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl font-bold">Admin — Members</h1>
        <span className="text-xs text-yellow-400 glass px-3 py-1 rounded-full">Admin</span>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 text-sm flex-wrap">
        {(["ALL", "PENDING", "ACTIVE", "SUSPENDED"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full transition-colors ${
              filter === s ? "bg-blue-600 text-white" : "glass text-gray-400 hover:text-white"
            }`}
          >
            {s} ({counts[s] ?? members.length})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 text-xs uppercase tracking-wider">
                <th className="text-left px-5 py-3">Name</th>
                <th className="text-left px-5 py-3">ID</th>
                <th className="text-left px-5 py-3">Department</th>
                <th className="text-left px-5 py-3">Membership</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Joined</th>
                <th className="text-left px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-medium text-white">{m.name}</p>
                    <p className="text-gray-500 text-xs">{m.email}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-400">{m.studentId}</td>
                  <td className="px-5 py-3 text-gray-400">{m.department}</td>
                  <td className="px-5 py-3 text-gray-400 font-mono text-xs">{m.membershipId}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[m.status] ?? ""}`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{formatDate(m.joinedAt)}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {m.status !== "ACTIVE" && (
                        <button
                          onClick={() => updateStatus(m.id, "ACTIVE")}
                          className="px-2 py-1 rounded text-xs bg-green-600/20 text-green-400 hover:bg-green-600/40 transition-colors"
                        >
                          Approve
                        </button>
                      )}
                      {m.status !== "SUSPENDED" && (
                        <button
                          onClick={() => updateStatus(m.id, "SUSPENDED")}
                          className="px-2 py-1 rounded text-xs bg-red-600/20 text-red-400 hover:bg-red-600/40 transition-colors"
                        >
                          Suspend
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
