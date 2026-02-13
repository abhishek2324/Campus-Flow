import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { listDepartments, deleteDepartment } from '../Api/departments';
import ConfirmModal from './ConfirmModal';

export default function DepartmentsList({ refreshSignal }) {
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('All');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [serverWarning, setServerWarning] = useState('');
  const debounceRef = useRef(null);

  async function load(p = page, s = search, t = type) {
    setLoading(true);
    setError('');
    try {
      const data = await listDepartments({ page: p, limit, search: s, type: t });
      if (data && data.ok) {
        setDepartments(data.departments || []);
        setPage(data.page || p);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      } else {
        setError((data && data.message) || 'Failed to load departments');
      }
    } catch (err) {
      console.error('Failed to load departments', err);
      setError(err?.message || 'Error loading departments');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(1, search, type); }, []);

  useEffect(() => {
    if (refreshSignal !== undefined) load(1, search, type);
  }, [refreshSignal]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(1, search, type), 300);
    setPage(1);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, type]);

  useEffect(() => { load(page, search, type); }, [page]);

  function confirmDelete(dept) {
    setServerWarning('');
    setToDelete(dept);
    setConfirmOpen(true);
  }

  function closeConfirm() {
    setConfirmOpen(false);
    setToDelete(null);
    setDeleting(false);
    setServerWarning('');
  }

  async function handleConfirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    setServerWarning('');
    try {
      const res = await deleteDepartment(toDelete._id);
      if (res && res.ok) {
        const remaining = total - 1;
        const newTotalPages = Math.max(1, Math.ceil(remaining / limit));
        if (page > newTotalPages) setPage(newTotalPages);
        else load(page, search, type);
        closeConfirm();
      } else {
        setServerWarning((res && res.message) || 'Could not delete');
        setDeleting(false);
      }
    } catch (err) {
      console.error('Delete error', err);
      const msg = err?.message || 'Delete failed';
      if (err && err.usersCount !== undefined) {
        setServerWarning(`${msg} — ${err.usersCount} user(s) assigned to this department.`);
      } else {
        setServerWarning(msg);
      }
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-extrabold text-white">All Departments</h1>
          <Link to="/admin/departments/new" className="btn-primary px-5 py-2.5 text-sm">
            + Create Department
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl border-2 border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="flex-1 min-w-60">
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Search</label>
              <input
                className="input-strong py-2"
                placeholder="Search by department name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="w-[220px]">
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Filter by Type</label>
              <select
                className="input-strong py-2"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="All">All</option>
                <option value="UG">UG</option>
                <option value="PG">PG</option>
                <option value="Research">Research</option>
              </select>
            </div>
          </div>

          {/* Summary */}
          <div className="mb-4 text-sm font-bold text-slate-700">
            Showing {departments.length} of {total} departments
          </div>

          {/* Table */}
          <div className="rounded-xl border-2 border-slate-200 overflow-hidden">
            {loading ? (
              <div className="p-8 font-bold text-slate-600 text-center">Loading...</div>
            ) : error ? (
              <div className="p-6 font-bold text-red-600 border-2 border-red-200 bg-red-50 rounded-xl">{error}</div>
            ) : departments.length === 0 ? (
              <div className="p-8 font-bold text-slate-600 text-center">No departments found.</div>
            ) : (
              <table className="min-w-full table-strong">
                <thead>
                  <tr>
                    <th>Department Name</th>
                    <th>Type</th>
                    <th>Number of Users</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {departments.map((d) => (
                    <tr key={d._id}>
                      <td className="font-semibold text-slate-900">{d.name}</td>
                      <td className="text-slate-700">{d.type}</td>
                      <td className="text-slate-700">{d.usersCount ?? 0}</td>
                      <td>
                        <Link to={`/admin/departments/${d._id}/edit`}>
                          <button className="px-4 py-2 mr-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl">
                            Edit
                          </button>
                        </Link>

                        <button
                          className="px-4 py-2 text-red-600 hover:bg-red-50 font-bold rounded-xl border-2 border-red-500/50"
                          onClick={() => confirmDelete(d)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="p-4 flex items-center justify-between font-bold text-slate-700 border-t-2 border-slate-200">
              <div>Page {page} of {totalPages}</div>

              <div className="space-x-2">
                <button
                  className="px-4 py-2 rounded-xl border-2 font-bold disabled:opacity-50 disabled:cursor-not-allowed border-slate-400 hover:bg-slate-100 disabled:hover:bg-transparent"
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                >
                  First
                </button>
                <button
                  className="px-4 py-2 rounded-xl border-2 font-bold disabled:opacity-50 disabled:cursor-not-allowed border-slate-400 hover:bg-slate-100 disabled:hover:bg-transparent"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Prev
                </button>
                <button
                  className="px-4 py-2 rounded-xl border-2 font-bold disabled:opacity-50 disabled:cursor-not-allowed border-slate-400 hover:bg-slate-100 disabled:hover:bg-transparent"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </button>
                <button
                  className="px-4 py-2 rounded-xl border-2 font-bold disabled:opacity-50 disabled:cursor-not-allowed border-slate-400 hover:bg-slate-100 disabled:hover:bg-transparent"
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                >
                  Last
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Link to="/admin/dashboard" className="text-sm font-bold text-blue-600 hover:text-blue-700">← Back to Dashboard</Link>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title={toDelete ? `Delete "${toDelete.name}"?` : 'Delete department?'}
        message={
          serverWarning
            ? serverWarning
            : 'Are you sure you want to delete this department? This action cannot be undone.'
        }
        onCancel={closeConfirm}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        confirmLabel="Delete"
      />
    </div>
  );
}
