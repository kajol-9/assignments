"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export function Navbar() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold">
              L
            </div>
            <span className="font-serif text-lg font-semibold tracking-wide group-hover:text-blue-400 transition-colors">
              City Library
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/search"        className="text-gray-300 hover:text-white transition-colors">Search Books</Link>
            <Link href="/membership/rules" className="text-gray-300 hover:text-white transition-colors">Rules</Link>
            <Link href="/membership/apply" className="text-gray-300 hover:text-white transition-colors">Join Library</Link>

            {session ? (
              <>
                <Link href="/dashboard" className="text-gray-300 hover:text-white transition-colors">My Account</Link>
                {(session.user as any).role === "ADMIN" && (
                  <Link href="/admin" className="text-yellow-400 hover:text-yellow-300 transition-colors">Admin</Link>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="px-4 py-1.5 rounded-full border border-gray-600 text-gray-300 hover:border-red-500 hover:text-red-400 transition-colors text-xs"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
              >
                Sign in
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-md text-gray-400 hover:text-white"
            onClick={() => setOpen(!open)}
          >
            <div className="w-5 h-0.5 bg-current mb-1 transition-all" />
            <div className="w-5 h-0.5 bg-current mb-1 transition-all" />
            <div className="w-5 h-0.5 bg-current transition-all" />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden glass-dark border-t border-white/10 px-4 py-4 flex flex-col gap-3 text-sm">
          <Link href="/search"            onClick={() => setOpen(false)} className="text-gray-300 hover:text-white">Search Books</Link>
          <Link href="/membership/rules"  onClick={() => setOpen(false)} className="text-gray-300 hover:text-white">Rules</Link>
          <Link href="/membership/apply"  onClick={() => setOpen(false)} className="text-gray-300 hover:text-white">Join Library</Link>
          {session ? (
            <>
              <Link href="/dashboard"     onClick={() => setOpen(false)} className="text-gray-300 hover:text-white">My Account</Link>
              <button onClick={() => signOut({ callbackUrl: "/" })} className="text-left text-red-400">Sign out</button>
            </>
          ) : (
            <Link href="/login"           onClick={() => setOpen(false)} className="text-blue-400">Sign in</Link>
          )}
        </div>
      )}
    </nav>
  );
}
