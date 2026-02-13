import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) setError("Invalid or missing reset token.");
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/reset-password`, {
        token,
        password,
      });
      setMessage(res.data?.message || "Password reset successfully. You can now login.");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Reset failed. The link may have expired."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 max-w-md w-full">
          <p className="text-red-600 font-bold mb-4">Invalid or missing reset token.</p>
          <Link to="/forgot" className="text-blue-600 font-bold">Request a new reset link</Link>
          <span className="mx-2">|</span>
          <Link to="/" className="text-blue-600 font-bold">Back to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-2xl rounded-2xl p-8 border-2 border-slate-200">
          <h1 className="text-2xl font-extrabold text-slate-900 mb-2">
            Reset Password
          </h1>
          <p className="text-sm font-medium text-slate-600 mb-6">
            Enter your new password below
          </p>

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 font-semibold">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 rounded-xl bg-emerald-50 border-2 border-emerald-200 text-emerald-700 px-4 py-3 font-semibold">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              className="input-strong"
              required
              minLength={6}
            />

            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm new password"
              className="input-strong"
              required
              minLength={6}
            />

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 disabled:opacity-70"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/" className="text-blue-600 hover:text-blue-700 font-bold">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
