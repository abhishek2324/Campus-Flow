import React from 'react';

export default function ConfirmModal({ open, title, message, onCancel, onConfirm, confirmLabel = 'Delete', loading = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-slate-200 p-6 w-full max-w-md">
        <h3 className="text-xl font-extrabold text-slate-900 mb-2">{title}</h3>
        <p className="mb-6 text-sm font-medium text-slate-600">{message}</p>

        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2.5 font-bold rounded-xl border-2 border-slate-300 text-slate-700 hover:bg-slate-100">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="btn-danger px-4 py-2.5 text-sm disabled:opacity-70"
          >
            {loading ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
