import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../Api/api";

export default function ResubmitAssignment() {
  const { id } = useParams();
  const nav = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [history, setHistory] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [reviewerId, setReviewerId] = useState("");
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState("");
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("info");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAssignment();
    api.request("/api/student/professors").then((r) => setProfessors(r.professors || [])).catch(() => {});
  }, []);

  const fetchAssignment = async () => {
    try {
      const res = await api.request(`/api/student/assignments/${id}`);
      setAssignment(res.assignment);
      setDescription(res.assignment?.description || "");

      const hist = await api.request(`/api/student/assignments/${id}/history`);
      setHistory(hist.history || []);
    } catch (err) {
      console.error(err);
      setMsg("Failed to load assignment");
      setMsgType("error");
    }
  };

  const getLastRejectionRemark = () => {
    const rejections = history.filter((h) => h.action === "rejected");
    if (rejections.length > 0) {
      return rejections[rejections.length - 1];
    }
    return null;
  };

  const validateFile = (file) => {
    if (!file) return null;
    if (file.type !== "application/pdf") return "Only PDF files are allowed.";
    if (file.size > 10 * 1024 * 1024) return "File size must be under 10MB.";
    return null;
  };

  const needsReviewerSelection = assignment && !assignment.reviewerId && !assignment.currentReviewer;

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");

    if (needsReviewerSelection && !reviewerId) {
      setMsg("Please select a professor to review your resubmission");
      setMsgType("error");
      return;
    }

    const fileError = validateFile(file);
    if (fileError) {
      setMsg(fileError);
      setMsgType("error");
      return;
    }

    const form = new FormData();
    if (file) form.append("file", file);
    if (description) form.append("description", description);
    if (needsReviewerSelection && reviewerId) form.append("reviewerId", reviewerId);

    try {
      setLoading(true);
      await api.axiosInstance.post(
        `/api/student/assignments/${id}/resubmit`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setMsg("Assignment resubmitted successfully!");
      setMsgType("success");
      setTimeout(() => nav("/student/assignments"), 1000);
    } catch (err) {
      setMsg(err?.response?.data?.message || "Resubmission failed");
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

  const lastRejection = getLastRejectionRemark();

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-extrabold text-white">Resubmit Assignment</h2>
          <Link
            to={`/student/assignments/${id}`}
            className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold border-2 border-slate-600"
          >
            Back to Details
          </Link>
        </div>

        {msg && (
          <div className={`mb-4 p-4 rounded-xl border-2 font-bold ${getMessageStyles()}`}>
            {msg}
          </div>
        )}

        {assignment && (
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-slate-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {assignment.title}
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              <div>
                <strong>Category:</strong> {assignment.category}
              </div>
              <div>
                <strong>Status:</strong>{" "}
                <span className="text-red-600 font-medium">REJECTED</span>
              </div>
            </div>
          </div>
        )}

        {lastRejection && (
          <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 mb-6">
            <h4 className="font-semibold text-red-700 mb-2">
              Rejection Feedback
            </h4>
            <div className="text-sm text-red-600 mb-2">
              <strong>Rejected by:</strong> {lastRejection.reviewerId?.name || "Professor"}
            </div>
            <div className="text-sm text-red-600 mb-2">
              <strong>Date:</strong> {new Date(lastRejection.date).toLocaleString()}
            </div>
            <div className="mt-3 p-3 bg-white rounded-lg border border-red-200">
              <strong className="text-red-700">Reason:</strong>
              <p className="text-gray-700 mt-1">
                {lastRejection.remark || "No specific reason provided."}
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-2xl border-2 border-slate-200 p-6">
          <h4 className="font-semibold text-gray-800 mb-4">
            Submit Updated Version
          </h4>

          <form onSubmit={submit} className="space-y-4">
            {needsReviewerSelection && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Professor for Review *
                </label>
                <select
                  value={reviewerId}
                  onChange={(e) => setReviewerId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-400"
                  required={needsReviewerSelection}
                >
                  <option value="">-- Choose Professor --</option>
                  {professors.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} {p.departmentId?.name ? `(${p.departmentId.name})` : ""}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  You can choose a different professor for this resubmission.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Updated Description
              </label>
              <textarea
                rows={4}
                placeholder="Update your description if needed..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                You can address the reviewer's feedback here.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload New File (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-4">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files[0])}
                  disabled={loading}
                  className="text-gray-700"
                />
                <p className="text-xs text-gray-500 mt-2">
                  PDF only, max 10MB. Leave empty to keep the original file.
                </p>
              </div>

              {file && (
                <div className="mt-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <p className="text-sm text-indigo-700">
                    <strong>Selected:</strong> {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="submit"
                disabled={loading || (needsReviewerSelection && !reviewerId)}
                className="btn-primary flex-1 py-3 disabled:opacity-70"
              >
                {loading ? "Resubmitting..." : "Resubmit Assignment"}
              </button>

              <button
                type="button"
                onClick={() => nav(-1)}
                disabled={loading}
                className="px-5 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
