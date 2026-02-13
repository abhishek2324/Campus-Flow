import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [navOpen, setNavOpen] = useState({ users: false, departments: false, mobile: false });
  const navigate = useNavigate();

  const userFromStorage = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();
  const adminName = userFromStorage?.name || "Admin";

  useEffect(() => {
    const user = userFromStorage;
    const token = localStorage.getItem("token");
    if (!user || !token || user.role !== "admin") {
      navigate("/");
      return;
    }

    (async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/overview`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(res.data);
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
        <div className="text-lg font-bold">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <aside className="hidden md:flex md:flex-col w-72 bg-slate-900 border-2 border-slate-600 p-4 sticky top-4 m-4 rounded-2xl h-[calc(100vh-2rem)] shadow-xl">
        <div className="mb-6 px-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-lg font-extrabold shadow-lg border-2 border-blue-500/50">
              AD
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Admin</h2>
              <p className="text-sm font-medium text-slate-400 mt-1">Assignment Uploader</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-2 text-sm font-semibold">
          <Link
            to="/admin/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 transition border-2 border-transparent hover:border-slate-600"
          >
            <span className="w-6 text-center">🏠</span>
            <span className="text-slate-200">Overview</span>
          </Link>

          <div>
            <button
              onClick={() => setNavOpen((s) => ({ ...s, departments: !s.departments }))}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-800 transition"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 text-center">🏛️</span>
                <span className="text-slate-200">Departments</span>
              </div>
              <span className="text-slate-400 font-bold">{navOpen.departments ? "▲" : "▼"}</span>
            </button>

            {navOpen.departments && (
              <div className="ml-8 mt-2 space-y-1">
                <Link to="/admin/departments" className="block text-sm text-slate-300 hover:text-white font-medium">
                  All Departments
                </Link>
                <Link to="/admin/departments/new" className="block text-sm text-slate-300 hover:text-white font-medium">
                  Create Department
                </Link>
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() => setNavOpen((s) => ({ ...s, users: !s.users }))}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-800 transition"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 text-center">👥</span>
                <span className="text-slate-200">Users</span>
              </div>
              <span className="text-slate-400 font-bold">{navOpen.users ? "▲" : "▼"}</span>
            </button>

            {navOpen.users && (
              <div className="ml-8 mt-2 space-y-1">
                <Link to="/admin/users" className="block text-sm text-slate-300 hover:text-white font-medium">
                  All Users
                </Link>
                <Link to="/admin/users/new" className="block text-sm text-slate-300 hover:text-white font-medium">
                  Create User
                </Link>
              </div>
            )}
          </div>
        </nav>

        <div className="mt-4 border-t-2 border-slate-600 pt-4 px-3">
          <div className="mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Signed in as</div>
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold text-white">{adminName}</div>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white font-bold text-sm border-2 border-red-500/50 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="md:hidden fixed top-4 left-4 z-40">
        <button
          onClick={() => setNavOpen((s) => ({ ...s, mobile: !s.mobile }))}
          className="p-2.5 rounded-xl bg-slate-800 border-2 border-slate-600 text-white font-bold shadow-lg"
          aria-label="Toggle menu"
        >
          {navOpen.mobile ? "✕" : "☰"}
        </button>
      </div>

      {navOpen.mobile && (
        <div className="md:hidden fixed inset-0 z-30">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setNavOpen((s) => ({ ...s, mobile: false }))}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-slate-900 border-r-2 border-slate-600 shadow-2xl p-4">
            <div className="mb-6 px-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center text-white">AD</div>
                <div>
                  <h2 className="text-base font-bold text-gray-100">Admin</h2>
                  <p className="text-xs text-gray-400 mt-1">Assignment Uploader</p>
                </div>
              </div>
            </div>

            <nav className="space-y-2 text-sm font-semibold">
              <Link
                onClick={() => setNavOpen((s) => ({ ...s, mobile: false }))}
                to="/admin/dashboard"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-200"
              >
                🏠 Overview
              </Link>
              <Link
                onClick={() => setNavOpen((s) => ({ ...s, mobile: false }))}
                to="/admin/departments"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-200"
              >
                🏛️ Departments
              </Link>
              <Link
                onClick={() => setNavOpen((s) => ({ ...s, mobile: false }))}
                to="/admin/users"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-200"
              >
                👥 Users
              </Link>
              <div className="mt-4 border-t-2 border-slate-600 pt-4">
                <div className="mb-2 text-xs font-bold text-slate-500 uppercase">Signed in as</div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-bold text-white">{adminName}</div>
                  <button
                    onClick={() => {
                      setNavOpen((s) => ({ ...s, mobile: false }));
                      handleLogout();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white font-bold border-2 border-red-500/50"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </nav>
          </aside>
        </div>
      )}

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <header className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-white">Overview</h1>
              <p className="text-sm font-semibold text-slate-400">Welcome, Admin</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm font-medium text-slate-400">
                Signed in as <span className="font-bold text-white">{adminName}</span>
              </div>
            </div>
          </header>

          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <StatCard title="Total Departments" value={data?.totalDepartments ?? 0} />
            <StatCard title="Total Users" value={data?.totalUsers ?? 0} />
            <StatCard title="Students" value={data?.totalStudents ?? 0} />
            <StatCard title="Professors" value={data?.totalProfessors ?? 0} />
            <StatCard title="HODs" value={data?.totalHODs ?? 0} />

            <div className="bg-slate-800/90 p-6 rounded-xl border-2 border-slate-600 flex items-center justify-center">
              <Link to="/admin/departments" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg border-2 border-blue-500 transition">
                Manage Departments
              </Link>
            </div>
          </section>

          <section className="bg-slate-800/90 rounded-xl border-2 border-slate-600 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-extrabold text-white">Quick Actions</h2>
              <div className="text-sm font-semibold text-slate-400">Create or manage entities</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ActionCard to="/admin/departments/new" title="New Department" description="Add a new academic department." emoji="🏛️" />
              <ActionCard to="/admin/users/new" title="Create User" description="Add staff or students." emoji="➕" />
              <ActionCard to="/admin/users" title="View All Users" description="Manage users and roles." emoji="👥" />
              <ActionCard to="/admin/departments" title="View Departments" description="See all departments." emoji="📚" />
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-800/90 rounded-xl border-2 border-slate-600 p-6">
              <h3 className="text-lg font-extrabold mb-3 text-white">Recent Activity</h3>
              <p className="text-sm font-medium text-slate-400">No activity to show yet.</p>
            </div>

            <div className="bg-slate-800/90 rounded-xl border-2 border-slate-600 p-6">
              <h3 className="text-lg font-extrabold mb-3 text-white">Shortcuts</h3>
              <div className="flex flex-wrap gap-2">
                <Link to="/admin/departments/new" className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-blue-600 text-sm font-bold text-white border-2 border-slate-600 transition">New Dept</Link>
                <Link to="/admin/users/new" className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-blue-600 text-sm font-bold text-white border-2 border-slate-600 transition">New User</Link>
                <Link to="/admin/users" className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-blue-600 text-sm font-bold text-white border-2 border-slate-600 transition">Users</Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-slate-800/90 p-5 rounded-xl border-2 border-slate-600 flex flex-col justify-between shadow-lg">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-300">{title}</p>
        <div className="w-3 h-3 rounded-full bg-blue-500" />
      </div>

      <p className="mt-4 text-3xl font-extrabold text-white">{value}</p>
    </div>
  );
}

function ActionCard({ to, title, description, emoji }) {
  return (
    <Link to={to} className="block p-5 border-2 rounded-xl hover:border-blue-500 hover:shadow-xl transition border-slate-600 bg-slate-800/80">
      <div className="flex items-center gap-3">
        <div className="text-3xl">{emoji}</div>
        <div>
          <p className="font-extrabold text-white">{title}</p>
          <p className="text-xs font-medium text-slate-400">{description}</p>
        </div>
      </div>
    </Link>
  );
}
