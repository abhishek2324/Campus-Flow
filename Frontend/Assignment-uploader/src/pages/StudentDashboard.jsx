import React, { useEffect, useState } from "react";
import api from "../Api/api";
import { Link, useNavigate } from "react-router-dom";

export default function StudentDashboard() {
  const [stats, setStats] = useState({
    draft: 0,
    submitted: 0,
    forwarded: 0,
    approved: 0,
    rejected: 0,
  });
  const [recent, setRecent] = useState([]);
  const nav = useNavigate();

  useEffect(() => {
    api
      .request("/api/student/dashboard")
      .then((r) => {
        setStats(
          r.stats || {
            draft: 0,
            submitted: 0,
            forwarded: 0,
            approved: 0,
            rejected: 0,
          }
        );
        setRecent(Array.isArray(r.recent) ? r.recent : []);
      })
      .catch((err) => {
        console.error("Dashboard fetch error", err);

        localStorage.removeItem("token");
        localStorage.removeItem("user");
        nav("/");
      });
  }, [nav]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    nav("/");
  };

  const statusColor = (status) => {
    switch (status) {
      case "approved":
        return "text-green-600";
      case "rejected":
        return "text-red-600";
      case "submitted":
        return "text-yellow-600";
      case "forwarded":
        return "text-purple-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-white">
          Student Dashboard
        </h1>

        <div className="flex gap-3">
          <Link to="/home">
            <button className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold border-2 border-slate-600 transition">
              Home
            </button>
          </Link>
          <button
            onClick={logout}
            className="btn-danger px-4 py-2.5 text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
        <Card title="Drafts" value={stats.draft} color="bg-slate-600" />
        <Card title="Submitted" value={stats.submitted} color="bg-amber-500" />
        <Card title="Forwarded" value={stats.forwarded || 0} color="bg-violet-600" />
        <Card title="Approved" value={stats.approved} color="bg-emerald-600" />
        <Card title="Rejected" value={stats.rejected} color="bg-red-600" />
      </div>

      <div className="mt-10">
        <h3 className="text-xl font-extrabold text-white mb-4">
          Recent Submissions
        </h3>

        {recent.length === 0 ? (
          <p className="text-slate-400 font-medium">No submissions yet.</p>
        ) : (
          <ul className="space-y-3">
            {recent.map((r) => (
              <li
                key={r._id}
                className="bg-slate-800/90 p-5 rounded-xl border-2 border-slate-600 flex justify-between items-center hover:border-blue-500/50 transition"
              >
                <Link
                  to={`/student/assignments/${r._id}`}
                  className="font-bold text-blue-400 hover:text-blue-300"
                >
                  {r.title}
                </Link>

                <div className="text-right">
                  <p className={`text-sm font-bold ${statusColor(r.status)}`}>
                    {r.status?.toUpperCase()}
                  </p>
                  <p className="text-xs font-medium text-slate-400">
                    {new Date(r.createdAt).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-10 flex flex-wrap gap-4">
        <Link to="/student/upload">
          <button className="btn-primary px-5 py-3">
            Upload New Assignment
          </button>
        </Link>

        <Link to="/student/bulk-upload">
          <button className="px-5 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl shadow-lg border-2 border-violet-500/50 transition">
            Bulk Upload
          </button>
        </Link>

        <Link to="/student/assignments">
          <button className="px-5 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl border-2 border-slate-600 transition">
            View All Assignments
          </button>
        </Link>
      </div>
    </div>
  );
}

function Card({ title, value, color }) {
  return (
    <div className="bg-slate-800/90 rounded-xl p-6 border-2 border-slate-600 text-center shadow-lg">
      <p className="text-slate-300 text-sm font-bold">{title}</p>
      <p className={`mt-2 text-3xl font-extrabold text-white px-4 py-2 rounded-xl inline-block ${color} border-2 border-white/20`}>
        {value}
      </p>
    </div>
  );
}
