import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createDepartment } from '../Api/departments';

export default function CreateDepartment({ onCreated }) {
  const [form, setForm] = useState({ name: '', type: '', address: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Department name is required';
    if (!['UG', 'PG', 'Research'].includes(form.type)) e.type = 'Select a program type';
    if (!form.address.trim()) e.address = 'Address is required';
    return e;
  }

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setSuccess('');
    const e = validate();
    if (Object.keys(e).length) return setErrors(e);
    setErrors({});
    setLoading(true);
    try {
      const created = await createDepartment(form);
      setSuccess('Department created successfully');
      setForm({ name: '', type: '', address: '' });
      if (onCreated) onCreated(created);
    } catch (err) {
      if (err && err.errors && Array.isArray(err.errors)) {
        const map = {};
        err.errors.forEach(x => { if (x.field) map[x.field] = x.msg; });
        setErrors(map);
      } else if (err && err.message) {
        setErrors({ _global: err.message });
      } else {
        setErrors({ _global: 'Server error' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link to="/admin/departments" className="text-sm font-bold text-blue-600 hover:text-blue-700">← Back to Departments</Link>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl border-2 border-slate-200 p-8">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Create Department</h2>
          {success && <div className="mb-4 p-4 rounded-xl text-emerald-700 font-bold bg-emerald-50 border-2 border-emerald-200">{success}</div>}
          {errors._global && <div className="mb-4 p-4 rounded-xl text-red-700 font-bold bg-red-50 border-2 border-red-200">{errors._global}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-700 mb-1">Department Name</label>
              <input name="name" value={form.name} onChange={handleChange} className="input-strong" />
              {errors.name && <small className="text-red-600 font-bold">{errors.name}</small>}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-700 mb-1">Program Type</label>
              <select name="type" value={form.type} onChange={handleChange} className="input-strong">
                <option value="">Select...</option>
                <option value="UG">UG</option>
                <option value="PG">PG</option>
                <option value="Research">Research</option>
              </select>
              {errors.type && <small className="text-red-600 font-bold">{errors.type}</small>}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-1">Address</label>
              <textarea name="address" value={form.address} onChange={handleChange} rows={3} className="input-strong"></textarea>
              {errors.address && <small className="text-red-600 font-bold">{errors.address}</small>}
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Creating...' : 'Create Department'}
              </button>
              <Link to="/admin/departments" className="px-5 py-3 font-bold rounded-xl border-2 border-slate-300 text-slate-700 hover:bg-slate-100">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
