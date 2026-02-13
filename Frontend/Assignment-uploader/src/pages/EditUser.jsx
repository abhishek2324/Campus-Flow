import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { getUserForEdit, updateUser } from "../Api/users";

export default function EditUser() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [departments, setDepartments] = useState([]);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    departmentId: "",
    role: "",
    status: "",
    password: "",
  });

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await getUserForEdit(id);
        const { user, departments } = data;

        setForm({
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          departmentId:
            (user.departmentId && (user.departmentId._id || user.departmentId)) ||
            (user.department && (user.department._id || user.department)) ||
            "",
          role: user.role || "",
          status: user.status || "Active",
          password: "",
        });
        setDepartments(departments || []);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Failed to load user.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        departmentId: form.departmentId,
        status: form.status,
      };

      if (form.password.trim()) {
        payload.password = form.password;
      }

      const res = await updateUser(id, payload);
      setSuccess(res.message || "User updated successfully");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to update user.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-lg font-bold text-white">Loading user...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-xl mx-auto">
        <div className="mb-6">
          <Link to="/admin/users" className="text-sm font-bold text-blue-600 hover:text-blue-700">← Back to Users</Link>
        </div>
        <div className="bg-white shadow-2xl rounded-2xl border-2 border-slate-200 p-8">
          <h1 className="text-2xl font-extrabold text-slate-900 mb-6">Edit User</h1>

          {error && (
            <div className="mb-4 p-4 text-red-700 font-bold bg-red-50 border-2 border-red-200 rounded-xl">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 text-emerald-700 font-bold bg-emerald-50 border-2 border-emerald-200 rounded-xl">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 font-bold text-slate-700" htmlFor="name">Name</label>
              <input id="name" name="name" className="input-strong" value={form.name} onChange={handleChange} required />
            </div>

            <div>
              <label className="block mb-1 font-bold text-slate-700" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" className="input-strong" value={form.email} onChange={handleChange} required />
            </div>

            <div>
              <label className="block mb-1 font-bold text-slate-700" htmlFor="phone">Phone</label>
              <input id="phone" name="phone" className="input-strong" value={form.phone} onChange={handleChange} />
            </div>

            <div>
              <label className="block mb-1 font-bold text-slate-700" htmlFor="departmentId">Department</label>
              <select id="departmentId" name="departmentId" className="input-strong" value={form.departmentId || ""} onChange={handleChange} required>
                <option value="">-- Select Department --</option>
                {departments.map((dep) => (
                  <option key={dep._id} value={dep._id}>{dep.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 font-bold text-slate-700" htmlFor="role">Role</label>
              <input id="role" name="role" className="input-strong bg-slate-100" value={form.role} disabled readOnly />
              <p className="text-xs font-medium text-slate-500 mt-1">Role cannot be changed (security restriction).</p>
            </div>

            <div>
              <label className="block mb-1 font-bold text-slate-700" htmlFor="status">Status</label>
              <select id="status" name="status" className="input-strong" value={form.status} onChange={handleChange}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 font-bold text-slate-700" htmlFor="password">Password</label>
              <input id="password" name="password" type="password" className="input-strong" value={form.password} onChange={handleChange} placeholder="Leave blank to keep current password" />
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-70">
                {saving ? "Saving..." : "Update User"}
              </button>
              <button type="button" className="px-5 py-3 font-bold rounded-xl border-2 border-slate-300 text-slate-700 hover:bg-slate-100" onClick={() => navigate("/admin/users")}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
