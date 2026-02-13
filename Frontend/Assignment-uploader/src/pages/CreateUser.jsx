import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

export default function CreateUser() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    departmentId: "",
    role: "Student",
  });

  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/departments`, {
          params: { limit: 500 },
        });
        const data = res.data;
        setDepartments(Array.isArray(data) ? data : (data?.departments || []));
      } catch (err) {
        console.error(err);
        setMessage("Failed to load departments");
      } finally {
        setLoadingDepts(false);
      }
    };

    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/admin/users/create`, form);
      setMessage(res.data.message || "User created successfully");

      if (res.data.defaultPassword) {
        alert(`User default password: ${res.data.defaultPassword}`);
      }

      setTimeout(() => {
        navigate("/admin/users");
      }, 1000);
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        "Error creating user";
      setMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex justify-center p-6">
      <div className="w-full max-w-xl">
        <div className="mb-6">
          <Link to="/admin/users" className="text-sm font-bold text-blue-600 hover:text-blue-700">← Back to Users</Link>
        </div>
        <div className="bg-white shadow-2xl rounded-2xl border-2 border-slate-200 p-8">
          <h1 className="text-2xl font-extrabold text-slate-900 mb-6">Create User</h1>

          {message && (
            <div className="mb-4 text-sm font-bold text-blue-700 bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
              {message}
            </div>
          )}

          {loadingDepts ? (
            <p className="font-bold text-slate-600">Loading departments...</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="input-strong"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="input-strong"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Password (optional, leave blank for auto-generation)
                </label>
                <input
                  type="text"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="input-strong"
                  placeholder="Leave empty for default password"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="input-strong"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Department</label>
                <select
                  name="departmentId"
                  value={form.departmentId}
                  onChange={handleChange}
                  className="input-strong"
                  required
                >
                  <option value="">Select department</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name} ({dept.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Role</label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="input-strong"
                  required
                >
                  <option value="Student">Student</option>
                  <option value="Professor">Professor</option>
                  <option value="HOD">HOD</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full py-3 disabled:opacity-70"
              >
                {submitting ? "Creating..." : "Create User"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
