import React, { useState } from 'react';
import CreateDepartment from './CreateDepartment';
import DepartmentsList from './DepartmentsList';

export default function AdminDepartments() {
  const [signal, setSignal] = useState(0);
  const [creating, setCreating] = useState(false);

  function handleCreated() {
    setSignal((s) => s + 1);
    setCreating(true);
    setTimeout(() => setCreating(false), 1200);
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-extrabold text-white mb-4">Manage Departments</h1>

        {creating && <div className="mb-4 p-3 rounded-xl bg-emerald-50 border-2 border-emerald-200 text-emerald-800 font-bold">Department created — refreshing list…</div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <CreateDepartment onCreated={handleCreated} />
        </div>

        <div>
          <DepartmentsList refreshSignal={signal} />
        </div>
        </div>
      </div>
    </div>
  );
}
