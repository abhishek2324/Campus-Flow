import React, { useState } from "react";
import api from "../Api/api";
import { useNavigate } from "react-router-dom";

export default function UploadAssignment() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Assignment");
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const nav = useNavigate();

  const validateFile = (file) => {
    if (!file) return "Please select a PDF file.";
    if (file.type !== "application/pdf") return "Only PDF files are allowed.";
    if (file.size > 10 * 1024 * 1024) return "File size must be under 10MB.";
    return null;
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");

    const fileError = validateFile(file);
    if (fileError) {
      setMsg(fileError);
      return;
    }

    const form = new FormData();
    form.append("title", title);
    form.append("description", description);
    form.append("category", category);
    form.append("file", file);

    try {
      setLoading(true);

      const res = await api.axiosInstance.post(
        "/api/student/assignments/upload",
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setMsg(`Uploaded successfully ✔ (ID: ${res.data?.id || "created"})`);

      setTimeout(() => nav("/student/assignments"), 900);
    } catch (err) {
      console.error("Upload error:", err);

      if (err?.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        nav("/");
        return;
      }

      setMsg(err?.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex justify-center items-start py-10 px-4">
      <div className="w-full max-w-2xl bg-white shadow-2xl rounded-2xl p-8 border-2 border-slate-200">
        <h2 className="text-3xl font-extrabold text-slate-900 mb-6">
          Upload Assignment
        </h2>

        {msg && (
          <div
            className={`mb-4 px-4 py-3 rounded-xl border-2 font-bold ${
              msg.includes("successfully")
                ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                : "bg-blue-50 border-blue-300 text-blue-800"
            }`}
          >
            {msg}
          </div>
        )}

        <form onSubmit={submit} className="grid gap-5">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-strong disabled:opacity-70"
              placeholder="Enter assignment title"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-strong resize-none disabled:opacity-70"
              placeholder="Enter description (optional)"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input-strong disabled:opacity-70"
              disabled={loading}
            >
              <option>Assignment</option>
              <option>Thesis</option>
              <option>Report</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Upload PDF File</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full text-slate-700 font-medium"
              disabled={loading}
            />
            <p className="text-sm font-medium text-slate-600 mt-1">Max size: 10MB</p>
          </div>

          <div className="flex gap-4 mt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-70 disabled:hover:scale-100"
            >
              {loading ? "Uploading..." : "Upload"}
            </button>

            <button
              type="button"
              onClick={() => nav(-1)}
              disabled={loading}
              className="px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white font-bold rounded-xl border-2 border-slate-500 disabled:opacity-70"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
