import React, { useState } from "react";
import api from "../Api/api";
import { useNavigate } from "react-router-dom";

export default function BulkUpload() {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Assignment");
  const [files, setFiles] = useState([]);
  const [msg, setMsg] = useState("");
  const [uploading, setUploading] = useState(false);

  const nav = useNavigate();

  const onFilesChange = (e) => {
    const selected = Array.from(e.target.files || []);

    if (selected.length > 5) {
      setFiles(selected.slice(0, 5));
      setMsg("You selected more than 5 files — only the first 5 will be used.");
    } else {
      setFiles(selected);
      setMsg("");
    }
  };

  const validateFiles = () => {
    if (!files.length) return "Select at least one PDF file (max 5).";

    for (const f of files) {
      if (f.type !== "application/pdf") {
        return `File "${f.name}" is not a PDF.`;
      }
      if (f.size > 10 * 1024 * 1024) {
        return `File "${f.name}" exceeds the 10MB limit.`;
      }
    }
    return null;
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");

    const validationError = validateFiles();
    if (validationError) {
      setMsg(validationError);
      return;
    }

    const form = new FormData();
    form.append("description", description);
    form.append("category", category);

    files.slice(0, 5).forEach((f) => form.append("files", f));

    try {
      setUploading(true);

      const res = await api.axiosInstance.post(
        "/api/student/assignments/bulk-upload",
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setMsg(`Uploaded ${res.data?.created?.length || files.length} files ✔`);

      setTimeout(() => nav("/student/assignments"), 900);
    } catch (err) {
      console.error("Bulk upload error:", err);

      if (err?.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        nav("/");
        return;
      }

      setMsg(
        err?.response?.data?.message ||
          err.message ||
          "Bulk upload failed"
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl border-2 border-slate-200 p-8">
        <div className="flex items-start justify-between">
          <h2 className="text-2xl font-extrabold text-slate-900">Bulk Upload</h2>
          <div className="text-sm font-bold text-slate-600">
            Upload up to 5 PDF files
          </div>
        </div>

        {msg && (
          <div
            className={`mt-4 mb-2 px-4 py-3 rounded-xl border-2 font-bold ${
              msg.includes("Uploaded")
                ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                : "bg-amber-50 border-amber-300 text-amber-800"
            }`}
          >
            {msg}
          </div>
        )}

        <form onSubmit={submit} className="grid gap-4 mt-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Common description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={uploading}
              className="input-strong resize-none disabled:opacity-70"
              placeholder="This description will apply to all uploaded files"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={uploading}
              className="input-strong disabled:opacity-70"
            >
              <option>Assignment</option>
              <option>Thesis</option>
              <option>Report</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Select PDF files</label>
            <input
              type="file"
              accept="application/pdf"
              multiple
              disabled={uploading}
              onChange={onFilesChange}
              className="text-slate-700 font-medium"
            />
            <p className="mt-1 text-xs font-medium text-slate-600">
              Maximum 5 files — each must be PDF and ≤ 10MB
            </p>
          </div>

          <div>
            <div className="text-sm font-bold text-slate-700 mb-2">
              Files to upload ({files.length}/5)
            </div>

            {files.length === 0 ? (
              <div className="text-slate-500 text-sm font-medium">
                No files selected yet.
              </div>
            ) : (
              <ul className="space-y-2">
                {files.map((f, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border-2 border-slate-200"
                  >
                    <div>
                      <div className="font-medium text-gray-800">
                        {f.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {(f.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">{f.type}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center gap-3 mt-2">
            <button
              type="submit"
              disabled={uploading || files.length === 0}
              className="btn-primary disabled:opacity-70 disabled:hover:scale-100"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>

            <button
              type="button"
              onClick={() => nav(-1)}
              disabled={uploading}
              className="px-4 py-2 rounded-xl bg-slate-600 hover:bg-slate-500 text-white font-bold disabled:opacity-70"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={uploading}
              onClick={() => {
                setFiles([]);
                setMsg("");
              }}
              className="ml-auto px-3 py-2 rounded-xl border-2 border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-100"
            >
              Clear selection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
