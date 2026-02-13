import { request } from "./api";

export function listDepartments({ page = 1, limit = 10, search = "", type = "All" } = {}) {
  const params = new URLSearchParams();
  params.append("page", page);
  params.append("limit", limit);
  if (search) params.append("search", search);
  if (type) params.append("type", type);

  return request(`/admin/departments?${params.toString()}`, {
    method: "GET",
    cache: "no-store",
  });
}

export function getDepartment(id) {
  return request(`/admin/departments/${id}`, {
    method: "GET",
    cache: "no-store",
  });
}

export function createDepartment(payload) {
  return request("/admin/departments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateDepartment(id, payload) {
  return request(`/admin/departments/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteDepartment(id) {
  return request(`/admin/departments/${id}`, {
    method: "DELETE",
  });
}
