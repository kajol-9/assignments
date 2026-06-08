import { motion } from "framer-motion";
import Link from "next/link";

export const metadata = {
  title: "Library Rules — City Library",
};

const SECTIONS = [
  {
    title: "Membership Eligibility",
    items: [
      "Membership is open to all enrolled students, teaching faculty, and full-time staff.",
      "A valid college student/employee ID card must be presented when applying.",
      "Membership is strictly non-transferable.",
      "Membership must be renewed each academic year; expired memberships are automatically deactivated.",
    ],
  },
  {
    title: "Borrowing Rules",
    items: [
      "Members may borrow a maximum of 5 books at any one time.",
      "The standard loan period is 14 days from the date of issue.",
      "A loan can be renewed once online provided no other member has placed a hold on the item.",
      "Reference books, journals, periodicals, and newspapers are available for in-library reading only — they cannot be checked out.",
      "Rare or restricted materials require special permission from the librarian.",
    ],
  },
  {
    title: "Overdue Fines",
    items: [
      "A fine of ₹2 per book per day is charged for overdue returns.",
      "Fines must be paid before the member can borrow additional books.",
      "Members with 3 or more overdue books will have their membership suspended until fines are cleared.",
      "Fines can be paid at the library counter. Online payment will be available soon.",
    ],
  },
  {
    title: "Damage and Loss",
    items: [
      "Members are responsible for any damage to library materials during the loan period.",
      "If a borrowed book is lost, the member must pay the full replacement cost plus a ₹50 processing fee.",
      "Minor damage (torn pages, wet damage) is assessed by library staff; repair costs are charged to the member.",
      "Writing in or defacing library materials will result in immediate suspension.",
    ],
  },
  {
    title: "Library Conduct",
    items: [
      "Silence must be maintained inside the library at all times.",
      "Mobile phones must be kept on silent mode; calls should be taken outside.",
      "Food and beverages are not permitted inside the library.",
      "Personal belongings may be left in the provided lockers at the entrance.",
      "Library staff reserve the right to inspect bags upon entry and exit.",
    ],
  },
  {
    title: "Computer & Internet Use",
    items: [
      "Library computers are available for academic research purposes only.",
      "Sessions are limited to 60 minutes during peak hours.",
      "Downloading or accessing non-academic content is prohibited.",
      "Members are responsible for any content they access or transmit.",
    ],
  },
];

export default function RulesPage() {
  return (
    <div className="min-h-screen pt-24 pb-20 px-4 max-w-3xl mx-auto">
      <div className="mb-10">
        <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">← Home</Link>
        <h1 className="font-serif text-4xl font-bold mt-4 mb-3">Library Rules & Policies</h1>
        <p className="text-gray-400">
          Please read these rules carefully. All members are expected to follow them.
          Violations may result in fines or suspension.
        </p>
      </div>

      <div className="space-y-8">
        {SECTIONS.map((section, i) => (
          <div key={section.title} className="glass rounded-2xl p-6">
            <h2 className="font-semibold text-lg mb-4 text-blue-400">
              {i + 1}. {section.title}
            </h2>
            <ul className="space-y-2">
              {section.items.map((item, j) => (
                <li key={j} className="flex gap-3 text-gray-300 text-sm leading-relaxed">
                  <span className="text-blue-500 mt-0.5 shrink-0">›</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-10 glass rounded-2xl p-6 border border-yellow-500/20">
        <p className="text-yellow-400 font-semibold mb-2">Note</p>
        <p className="text-gray-300 text-sm">
          These rules are subject to change. Updated policies will be posted at the library
          entrance and on this page. For queries, contact the library desk directly.
        </p>
      </div>

      <div className="mt-10 text-center">
        <Link
          href="/membership/apply"
          className="px-8 py-3 rounded-full bg-blue-600 hover:bg-blue-500 font-medium transition-colors inline-block"
        >
          Apply for Membership →
        </Link>
      </div>
    </div>
  );
}
