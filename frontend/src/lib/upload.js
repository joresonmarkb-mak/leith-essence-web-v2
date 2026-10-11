import { api } from "./api.js";

export async function uploadFile(file, type) {
  const fd = new FormData();
  fd.append("file", file);
  const d = await api(`/uploads?type=${type}`, { method: "POST", formData: fd });
  return d.url;
}