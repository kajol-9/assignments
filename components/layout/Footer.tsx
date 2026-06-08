import Link from "next/link";

const HOURS = [
  { day: "Monday – Friday", open: "09:00 AM", close: "11:00 PM" },
  { day: "Saturday",        open: "09:00 AM", close: "06:30 PM" },
  { day: "Sunday",          open: "10:00 AM", close: "05:00 PM" },
];

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/40 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">

        <div>
          <h3 className="font-serif text-lg font-semibold mb-3">City Library</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            Your local community library. Discover thousands of books, apply for
            membership, and start borrowing today.
          </p>
        </div>

        <div>
          <h3 className="font-semibold mb-3 text-sm uppercase tracking-widest text-gray-400">Quick Links</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><Link href="/search"           className="hover:text-white transition-colors">Search Catalog</Link></li>
            <li><Link href="/membership/apply" className="hover:text-white transition-colors">Apply for Membership</Link></li>
            <li><Link href="/membership/rules" className="hover:text-white transition-colors">Library Rules</Link></li>
            <li><Link href="/login"            className="hover:text-white transition-colors">Member Login</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold mb-3 text-sm uppercase tracking-widest text-gray-400">Opening Hours</h3>
          <ul className="space-y-1 text-sm text-gray-400">
            {HOURS.map((h) => (
              <li key={h.day} className="flex justify-between gap-4">
                <span>{h.day}</span>
                <span className="text-white">{h.open} – {h.close}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5 text-center text-xs text-gray-600 py-4">
        © {new Date().getFullYear()} City Library. All rights reserved.
      </div>
    </footer>
  );
}
