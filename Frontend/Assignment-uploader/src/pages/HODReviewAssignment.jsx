import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../Api/api";

export default function HODReviewAssignment() {
  const { id } = useParams();
  const nav = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [remark, setRemark] = useState("");
  const [signature, setSignature] = useState("");
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("info");
  const [loading, setLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectRemark, setRejectRemark] = useState("");

  useEffect(() => {
    fetchAssignment();
  }, [id]);

  const fetchAssignment = async () => {
    try {
      const res = await api.request(`/api/hod/assignments/${id}/review`);
      setAssignment(res.assignment);
    } catch (err) {
      setMsg("Failed to load assignment");
      setMsgType("error");
    }
  };

  const approve = async () => {
    if (!signature.trim()) {
      setMsg("Digital signature is required");
      setMsgType("error");
      return;
    }

    try {
      setLoading(true);
      setMsg("");

      await api.request(`/api/hod/assignments/${id}/approve`, {
        method: "POST",
        body: JSON.stringify({ remark, signature }),
      });

      setMsg("Assignment finally approved!");
      setMsgType("success");
      setTimeout(() => nav("/hod/dashboard"), 1000);
    } catch (err) {
      setMsg(err?.message || "Approval failed");
      setMsgType("error");
    } finally {
      setLoading(false);
    }
  };

  const reject = async () => {
    const trimmed = rejectRemark.trim();
    if (!trimmed) {
      setMsg("Rejection feedback is required");
      setMsgType("error");
      return;
    }
    if (trimmed.length < 10) {
      setMsg("Feedback must be at least 10 characters");
      setMsgType("error");
      return;
    }

    try {
      setLoading(true);
      setMsg("");

      await api.request(`/api/hod/assignments/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ remark: trimmed }),
      });

      setMsg("Assignment rejected");
      setMsgType("success");
      setShowRejectModal(false);
      setRejectRemark("");
      setTimeout(() => nav("/hod/dashboard"), 1000);
    } catch (err) {
      setMsg(err?.message || err?.data?.message || "Rejection failed");
      setMsgType("error");
    } finally {
      setLoading(false);
    }
  };

  const getMessageStyles = () => {
    switch (msgType) {
      case "success":
        return "bg-green-50 border-green-200 text-green-700";
      case "error":
        return "bg-red-50 border-red-200 text-red-700";
      default:
        return "bg-blue-50 border-blue-200 text-blue-700";
    }
  };

  if (!assignment) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-lg font-bold text-white">Loading assignment...</div>
      </div>
    );
  }

  const pdfUrl = assignment.filePath?.startsWith("http")
    ? assignment.filePath
    : `${import.meta.env.VITE_API_URL}${assignment.filePath}`;

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-extrabold text-white">Finalize Assignment</h2>
          <Link
            to="/hod/dashboard"
            className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold border-2 border-slate-600"
          >
            Back to Dashboard
          </Link>
        </div>

        {msg && (
          <div className={`mb-4 p-4 rounded-xl border-2 font-bold ${getMessageStyles()}`}>
            {msg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-slate-200 overflow-hidden">
            <div className="p-4 border-b-2 border-slate-200 bg-slate-50">
              <h3 className="font-extrabold text-slate-800">Document Preview</h3>
            </div>
            <div className="h-[600px]">
              <iframe
                src={pdfUrl}
                className="w-full h-full"
                title="Assignment PDF"
              />
            </div>
            <div className="p-3 bg-gray-50 border-t">
              <a
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 hover:underline text-sm font-medium"
              >
                Open in new tab / Download
              </a>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl border-2 border-slate-200 p-6">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                {assignment.title}
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Student:</span>
                  <p className="font-medium">{assignment.student?.name}</p>
                </div>
                <div>
                  <span className="text-gray-500">Email:</span>
                  <p className="font-medium">{assignment.student?.email}</p>
                </div>
                <div>
                  <span className="text-gray-500">Category:</span>
                  <p className="font-medium">{assignment.category}</p>
                </div>
                <div>
                  <span className="text-gray-500">Submitted:</span>
                  <p className="font-medium">
                    {new Date(assignment.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {assignment.description && (
                <div className="mt-4">
                  <span className="text-gray-500 text-sm">Description:</span>
                  <p className="text-gray-700 mt-1">{assignment.description}</p>
                </div>
              )}
            </div>

            {assignment.history && assignment.history.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-700 mb-2">History</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {assignment.history.map((h, i) => (
                    <div
                      key={i}
                      className="p-2 bg-gray-50 rounded-lg text-sm border"
                    >
                      <span
                        className={`font-medium ${
                          h.action === "approved"
                            ? "text-green-600"
                            : h.action === "rejected"
                            ? "text-red-600"
                            : h.action === "forwarded"
                            ? "text-purple-600"
                            : "text-blue-600"
                        }`}
                      >
                        {h.action.toUpperCase()}
                      </span>
                      <span className="text-gray-500 ml-2">
                        {new Date(h.date).toLocaleString()}
                      </span>
                      {h.remark && (
                        <p className="text-gray-600 mt-1">Remark: {h.remark}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <hr className="my-4" />

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remarks (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Add your approval remarks..."
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="input-strong resize-none disabled:opacity-70"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Digital Signature *
                </label>
                <input
                  type="text"
                  placeholder="Enter your name as signature"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  className="input-strong disabled:opacity-70"
                  disabled={loading}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={approve}
                  disabled={loading || !signature.trim()}
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Processing..." : "Final Approve"}
                </button>

                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-slate-200 p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Reject Assignment
            </h3>

            <p className="text-sm text-gray-600 mb-4">
              Please provide feedback for the student (minimum 10 characters).
            </p>

            <textarea
              rows={4}
              placeholder="Enter rejection feedback (min 10 characters)..."
              value={rejectRemark}
              onChange={(e) => setRejectRemark(e.target.value)}
              className="input-strong resize-none mb-2"
              autoFocus
            />
            <p className="text-xs text-gray-500 mb-4">
              {rejectRemark.length}/10 characters minimum
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectRemark("");
                }}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                onClick={reject}
                disabled={loading || !rejectRemark.trim() || rejectRemark.trim().length < 10}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold disabled:opacity-50"
              >
                {loading ? "Rejecting..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
