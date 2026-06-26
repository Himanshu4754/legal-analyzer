import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL
    ? `${import.meta.env.VITE_BACKEND_URL}/api`
    : "http://localhost:5000/api",
});

API.interceptors.request.use((req) => {
  const user = localStorage.getItem("user");

  if (user) {
    req.headers.Authorization = `Bearer ${JSON.parse(user).token}`;
  }

  return req;
});

export default API;