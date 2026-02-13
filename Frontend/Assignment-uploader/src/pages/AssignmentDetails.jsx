import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../Api/api";

export default function AssignmentDetails() {
  const { id } = useParams();
  const nav = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [history, setHistory] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [reviewerId, setReviewerId] = useState("");
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("info");
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    fetchDetails();
    fetchProfessors();
    // eslint-disable-next-line
  }, []);

  const fetchDetails = async () => {
    try {
      const res = await api.request(`/api/student/assignments/${id}`);
      setAssignment(res.assignment);

      const hist = await api.request(`/api/student/assignments/${id}/history`);
      setHistory(hist.history || []);
    } catch (err) {
      console.error(err);
      setMsg("Failed to load assignment");
      setMsgType("error");
    }
  };

  const fetchProfessors = async () => {
    try {
      const res = await api.request("/api/student/professors");
      setProfessors(res.professors || []);
    } catch (err) {
      console.error("Failed to load professors:", err);
    }
  };

  const submitForReview = async () => {
    if (!reviewerId) {
      setMsg("Please select a professor");
      setMsgType("error");
      return;
    }

    try {
      setLoading(true);
      await api.request(`/api/student/assignments/${id}/submit`, {
        method: "POST",
        body: JSON.stringify({ reviewerId }),
      });

      setMsg("Assignment submitted for review successfully!");
      setMsgType("success");
      setShowConfirmModal(false);
      fetchDetails();
    } catch (err) {
      setMsg(err?.message || "Submit failed");
      setMsgType("error");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      draft: "bg-gray-500",
      submitted: "bg-yellow-500",
      forwarded: "bg-purple-500",
      approved: "bg-green-500",
      rejected: "bg-red-500",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-white text-sm font-medium ${
          styles[status] || "bg-gray-500"
        }`}
      >
        {status?.toUpperCase()}
      </span>
    );
  };

  const getActionColor = (action) => {
    switch (action) {
      case "approved":
        return "text-green-600 bg-green-50 border-green-200";
      case "rejected":
        return "text-red-600 bg-red-50 border-red-200";
      case "resubmitted":
        return "text-blue-600 bg-blue-50 border-blue-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
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

  const pdfUrl = assignment?.filePath?.startsWith("http")
    ? assignment.filePath
    : `${import.meta.env.VITE_API_URL}${assignment?.filePath}`;

  if (!assignment) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-lg font-bold text-white">Loading assignment...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-extrabold text-white">Assignment Details</h2>
          <div className="flex gap-3">
            <Link
              to="/student/assignments"
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold border-2 border-slate-600"
            >
              My Assignments
            </Link>
            <Link
              to="/student/dashboard"
              className="btn-primary px-4 py-2.5 text-sm"
            >
              Dashboard
            </Link>
          </div>
        </div>

        {msg && (
          <div className={`mb-4 p-4 rounded-xl border-2 font-bold ${getMessageStyles()}`}>
            {msg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-2xl border-2 border-slate-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  {assignment.title}
                </h3>
                {getStatusBadge(assignment.status)}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <span className="text-gray-500">Category:</span>
                  <p className="font-medium text-gray-800">{assignment.category}</p>
                </div>
                <div>
                  <span className="text-gray-500">Created:</span>
                  <p className="font-medium text-gray-800">
                    {new Date(assignment.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {assignment.currentReviewer && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Current Reviewer:</span>
                    <p className="font-medium text-gray-800">
                      {assignment.currentReviewer.name} ({assignment.currentReviewer.email})
                    </p>
                  </div>
                )}
              </div>

              {assignment.description && (
                <div className="mb-4">
                  <span className="text-gray-500 text-sm">Description:</span>
                  <p className="text-gray-700 mt-1">{assignment.description}</p>
                </div>
              )}

              <div className="flex items-center gap-4 pt-4 border-t">
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium"
                >
                  View / Download PDF
                </a>
                {assignment.fileOriginalName && (
                  <span className="text-sm text-gray-500">
                    {assignment.fileOriginalName}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-2xl border-2 border-slate-200 overflow-hidden">
              <div className="p-4 border-b-2 border-slate-200 bg-slate-50">
                <h4 className="font-extrabold text-slate-800">Document Preview</h4>
              </div>
              <div className="h-[500px]">
                <iframe
                  src={pdfUrl}
                  className="w-full h-full"
                  title="Assignment PDF"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {assignment.status === "draft" && (
              <div className="bg-white rounded-2xl shadow-2xl border-2 border-slate-200 p-6">
                <h4 className="font-semibold text-gray-800 mb-4">
                  Submit for Review
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Select a professor to review your assignment. Once submitted, you cannot edit it.
                </p>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Professor *
                  </label>
                  <select
                    value={reviewerId}
                    onChange={(e) => setReviewerId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                  >
                    <option value="">-- Choose Professor --</option>
                    {professors.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} {p.departmentId?.name ? `(${p.departmentId.name})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={!reviewerId}
                  className="btn-primary w-full py-3 disabled:opacity-70"
                >
                  Submit for Review
                </button>
              </div>
            )}

            {assignment.status === "rejected" && (
              <div className="bg-white rounded-2xl shadow-2xl border-2 border-slate-200 p-6">
                <h4 className="font-semibold text-gray-800 mb-4">
                  Assignment Rejected
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Your assignment was rejected. You can resubmit with corrections.
                </p>
                
                {history.filter(h => h.action === "rejected").length > 0 && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-red-700">Last rejection reason:</p>
                    <p className="text-sm text-red-600 mt-1">
                      {history.filter(h => h.action === "rejected").pop()?.remark || "No remark provided"}
                    </p>
                  </div>
                )}

                <Link
                  to={`/student/assignments/${id}/resubmit`}
                  className="block w-full px-5 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium text-center"
                >
                  Resubmit Assignment
                </Link>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-2xl border-2 border-slate-200 p-6">
              <h4 className="font-semibold text-gray-800 mb-4">
                Approval History
              </h4>
              
              {history.length === 0 ? (
                <p className="text-gray-500 text-sm">No history yet.</p>
              ) : (
                <div className="space-y-3">
                  {history.map((h, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-xl border ${getActionColor(h.action)}`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-sm">
                          {h.action.toUpperCase()}
                        </span>
                        <span className="text-xs opacity-75">
                          {new Date(h.date).toLocaleString()}
                        </span>
                      </div>
                      
                      <p className="text-sm mt-1 opacity-90">
                        By: {h.reviewerId?.name || "System"}
                      </p>
                      
                      {h.remark && (
                        <p className="text-sm mt-2 pt-2 border-t border-current/20">
                          <strong>Remark:</strong> {h.remark}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-slate-200 p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Confirm Submission
            </h3>
            
            <p className="text-gray-600 mb-4">
              Are you sure you want to submit this assignment for review?
            </p>
            
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
              <p className="text-sm text-yellow-700">
                <strong>Note:</strong> Once submitted, you will not be able to edit this assignment unless it is rejected.
              </p>
            </div>

            <div className="text-sm text-gray-600 mb-4">
              <p><strong>Professor:</strong> {professors.find(p => p._id === reviewerId)?.name}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={submitForReview}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Confirm Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
