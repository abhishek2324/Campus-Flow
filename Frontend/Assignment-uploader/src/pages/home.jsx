import { Link } from "react-router-dom";

const cardConfig = [
  {
    id: "admin",
    borderColor: "border-red-500",
    bgAccent: "bg-red-500",
    title: "Admin",
    icon: "👤",
    bullets: ["Manage departments", "Create users", "System setup"],
    linkClass: "text-red-700 hover:bg-red-50 border-red-500",
  },
  {
    id: "student",
    borderColor: "border-blue-600",
    bgAccent: "bg-blue-600",
    title: "Student",
    icon: "🎓",
    bullets: ["Upload assignments", "Submit for review", "Resubmit if needed"],
    linkClass: "text-blue-700 hover:bg-blue-50 border-blue-600",
  },
  {
    id: "professor",
    borderColor: "border-amber-500",
    bgAccent: "bg-amber-500",
    title: "Professor",
    icon: "🧑‍🏫",
    bullets: ["Review submissions", "Approve/Reject", "Forward to HOD"],
    linkClass: "text-amber-700 hover:bg-amber-50 border-amber-500",
  },
  {
    id: "hod",
    borderColor: "border-emerald-600",
    bgAccent: "bg-emerald-600",
    title: "HOD",
    icon: "🧑‍💼",
    bullets: ["Final approval", "Escalation handling"],
    linkClass: "text-emerald-700 hover:bg-emerald-50 border-emerald-600",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-10">
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            Assignment Uploader
          </h1>
          <nav className="flex items-center gap-4">
            <Link
              className="px-4 py-2 font-bold text-slate-300 hover:text-white border-2 border-slate-600 rounded-xl hover:border-slate-500 transition"
              to="/"
            >
              Login
            </Link>
            <Link
              className="px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-500 border-2 border-blue-500 rounded-xl transition shadow-lg"
              to="/signup"
            >
              Signup
            </Link>
          </nav>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cardConfig.map((c) => (
            <article
              key={c.id}
              className={`bg-white rounded-2xl shadow-2xl p-8 border-2 ${c.borderColor} hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1`}
            >
              <div className="flex flex-col items-center text-center">
                <div
                  className={`w-20 h-20 rounded-xl flex items-center justify-center text-4xl mb-4 ${c.bgAccent} text-white border-2 border-black/10 shadow-lg`}
                  aria-hidden
                >
                  {c.icon}
                </div>

                <h2 className="text-2xl font-extrabold text-slate-900 mb-4">{c.title}</h2>

                <ul className="text-left text-slate-700 font-semibold list-disc list-inside space-y-2 mb-6">
                  {c.bullets.map((b, i) => (
                    <li key={i} className="text-sm">
                      {b}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  <Link
                    to="/"
                    className={`inline-block px-5 py-2.5 rounded-xl border-2 font-bold text-sm ${c.linkClass} transition`}
                  >
                    View {c.title}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
