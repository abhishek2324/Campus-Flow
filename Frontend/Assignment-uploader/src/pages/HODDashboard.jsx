import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../Api/api";

export default function HODDashboard() {
  const [assignments, setAssignments] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.request("/api/hod/dashboard");
      setAssignments(res.assignments || []);
      setPendingCount(res.pendingCount || 0);
    } catch (err) {
      if (err?.status === 401 || err?.message?.includes("token")) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        nav("/");
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    nav("/");
  };

  const getDaysPendingColor = (days) => {
    if (days >= 7) return "text-red-600 bg-red-100";
    if (days >= 3) return "text-yellow-600 bg-yellow-100";
    return "text-green-600 bg-green-100";
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-extrabold text-white">HOD Dashboard</h2>
          {pendingCount > 0 && (
            <span className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold border-2 border-emerald-500/50 shadow-lg">
              {pendingCount} Pending Final Approval{pendingCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="flex gap-3">
          <Link to="/home">
            <button className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold border-2 border-slate-600">
              Home
            </button>
          </Link>
          <button onClick={logout} className="btn-danger px-4 py-2.5 text-sm">
            Logout
          </button>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-slate-400 font-medium">
          Finalize assignments forwarded to you by professors. Approve or reject to complete the workflow.
        </p>
      </div>

      <h3 className="text-xl font-extrabold text-white mb-4">
        Pending Assignments
      </h3>

      {loading ? (
        <div className="text-center py-10 font-bold text-slate-400">
          Loading...
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-slate-800/90 rounded-xl p-8 text-center font-bold text-slate-400 border-2 border-slate-600">
          No pending assignments. Assignments forwarded to you will appear here.
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((a) => (
            <div
              key={a._id}
              className="bg-slate-800/90 p-5 rounded-xl border-2 border-slate-600 flex justify-between items-center hover:border-emerald-500/50 transition"
            >
              <div className="flex-1">
                <p className="font-extrabold text-lg text-white">{a.title}</p>
                <div className="flex flex-wrap gap-4 mt-2 text-sm font-medium text-slate-400">
                  <span>
                    <strong>Student:</strong> {a.student?.name || "Unknown"}
                  </span>
                  <span>
                    <strong>Category:</strong> {a.category}
                  </span>
                  <span>
                    <strong>Submitted:</strong>{" "}
                    {new Date(a.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getDaysPendingColor(
                    a.daysPending
                  )}`}
                >
                  {a.daysPending} day{a.daysPending !== 1 ? "s" : ""} pending
                </span>

                <Link
                  to={`/hod/review/${a._id}`}
                  className="btn-primary px-5 py-2 text-sm"
                >
                  Finalize
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
