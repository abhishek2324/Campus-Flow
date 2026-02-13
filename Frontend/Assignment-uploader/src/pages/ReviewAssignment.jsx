import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../Api/api";

export default function ReviewAssignment() {
  const { id } = useParams();
  const nav = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [remark, setRemark] = useState("");
  const [signature, setSignature] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState(""); // For development only
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("info"); // info, success, error
  const [loading, setLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectRemark, setRejectRemark] = useState("");
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [colleagues, setColleagues] = useState([]);
  const [forwardRecipientId, setForwardRecipientId] = useState("");
  const [forwardNote, setForwardNote] = useState("");

  useEffect(() => {
    fetchAssignment();
  }, [id]);

  const fetchAssignment = async () => {
    try {
      const res = await api.request(`/api/professor/assignments/${id}/review`);
      setAssignment(res.assignment);
    } catch (err) {
      setMsg("Failed to load assignment");
      setMsgType("error");
    }
  };

  const sendOtp = async () => {
    try {
      setLoading(true);
      setMsg("");
      
      const res = await api.request(`/api/professor/assignments/${id}/send-otp`, {
        method: "POST",
      });

      setOtpSent(true);
      setMsg("OTP sent to your email");
      setMsgType("success");
      
      if (res.devOtp) {
        setDevOtp(res.devOtp);
      }
    } catch (err) {
      setMsg(err?.message || "Failed to send OTP");
      setMsgType("error");
    } finally {
      setLoading(false);
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

      await api.request(`/api/professor/assignments/${id}/approve`, {
        method: "POST",
        body: JSON.stringify({ 
          remark, 
          signature,
          otp: otpSent ? otp : undefined,
          skipOtp: !otpSent // Skip OTP if not sent (for development)
        }),
      });

      setMsg("Assignment approved successfully!");
      setMsgType("success");
      setTimeout(() => nav("/professor/dashboard"), 1000);
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

      await api.request(`/api/professor/assignments/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ remark: trimmed }),
      });

      setMsg("Assignment rejected");
      setMsgType("success");
      setShowRejectModal(false);
      setRejectRemark("");
      setTimeout(() => nav("/professor/dashboard"), 1000);
    } catch (err) {
      setMsg(err?.message || err?.data?.message || "Rejection failed");
      setMsgType("error");
    } finally {
      setLoading(false);
    }
  };

  const openForwardModal = async () => {
    setShowForwardModal(true);
    setForwardRecipientId("");
    setForwardNote("");
    try {
      const res = await api.request("/api/professor/colleagues");
      setColleagues(res.colleagues || []);
    } catch (err) {
      setMsg("Failed to load colleagues");
      setMsgType("error");
    }
  };

  const forward = async () => {
    if (!forwardRecipientId) {
      setMsg("Please select a recipient");
      setMsgType("error");
      return;
    }

    try {
      setLoading(true);
      setMsg("");

      await api.request(`/api/professor/assignments/${id}/forward`, {
        method: "POST",
        body: JSON.stringify({ recipientId: forwardRecipientId, note: forwardNote }),
      });

      setMsg("Assignment forwarded successfully");
      setMsgType("success");
      setShowForwardModal(false);
      setTimeout(() => nav("/professor/dashboard"), 1000);
    } catch (err) {
      setMsg(err?.message || err?.data?.message || "Forward failed");
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
          <h2 className="text-2xl font-extrabold text-white">Review Assignment</h2>
          <Link
            to="/professor/dashboard"
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
                  placeholder="Add your review remarks..."
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border">
                <p className="text-sm text-gray-600 mb-3">
                  For security, you can request an OTP to verify your identity before approval.
                </p>
                
                {!otpSent ? (
                  <button
                    onClick={sendOtp}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm disabled:opacity-50"
                  >
                    {loading ? "Sending..." : "Send OTP to Email"}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Enter OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      disabled={loading}
                    />
                    {devOtp && (
                      <p className="text-xs text-orange-600">
                        Dev OTP (remove in production): {devOtp}
                      </p>
                    )}
                    <button
                      onClick={sendOtp}
                      disabled={loading}
                      className="text-sm text-indigo-600 hover:underline"
                    >
                      Resend OTP
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <div className="flex gap-3">
                  <button
                    onClick={approve}
                    disabled={loading || !signature.trim()}
                    className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold shadow disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Processing..." : "Approve"}
                  </button>

                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold shadow disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>

                <button
                  onClick={openForwardModal}
                  disabled={loading}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow disabled:opacity-50"
                >
                  Forward to Another Reviewer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Reject Assignment
            </h3>

            <p className="text-sm text-gray-600 mb-4">
              Please provide feedback for the student (minimum 10 characters). This will be sent to the student and shown in the resubmission form.
            </p>

            <textarea
              rows={4}
              placeholder="Enter rejection feedback (min 10 characters)..."
              value={rejectRemark}
              onChange={(e) => setRejectRemark(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl mb-2"
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
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={reject}
                disabled={loading || !rejectRemark.trim() || rejectRemark.trim().length < 10}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl disabled:opacity-50"
              >
                {loading ? "Rejecting..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showForwardModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Forward Assignment
            </h3>

            <p className="text-sm text-gray-600 mb-4">
              Forward this assignment to another professor or HOD in your department for review.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Recipient *
              </label>
              <select
                value={forwardRecipientId}
                onChange={(e) => setForwardRecipientId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl"
              >
                <option value="">-- Choose Professor or HOD --</option>
                {colleagues.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.role})
                  </option>
                ))}
              </select>
              {colleagues.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  No colleagues found. Ensure you have a department assigned.
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Forwarding Note (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Add a note for the new reviewer..."
                value={forwardNote}
                onChange={(e) => setForwardNote(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowForwardModal(false);
                  setForwardRecipientId("");
                  setForwardNote("");
                }}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={forward}
                disabled={loading || !forwardRecipientId}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50"
              >
                {loading ? "Forwarding..." : "Confirm Forward"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
