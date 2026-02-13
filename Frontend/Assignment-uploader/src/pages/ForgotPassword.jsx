import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/forgot-password`, {
        email: email.trim(),
      });
      setMessage(res.data?.message || "If this email is registered, you will receive password reset instructions.");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Request failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-2xl rounded-2xl p-8 border-2 border-slate-200">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-linear-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-2xl font-extrabold shadow-lg border-2 border-blue-500/50">
              ?
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">
                Forgot Password
              </h1>
              <p className="text-sm font-medium text-slate-600">
                Enter your email to receive reset instructions
              </p>
            </div>
          </div>

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
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="input-strong"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-blue-600 hover:text-blue-700 font-bold"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
