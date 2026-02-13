import { axiosInstance } from "./api";

export async function getUserForEdit(id) {
  const res = await axiosInstance.get(`/admin/users/${id}/edit`);
  return res.data; // { user, departments }
}

export async function updateUser(id, payload) {
  const res = await axiosInstance.put(`/admin/users/${id}/update`, payload);
  return res.data; // { message, user }
}
