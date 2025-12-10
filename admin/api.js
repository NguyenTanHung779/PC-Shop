// api.js
const BASE_URL = "http://localhost:5000";

export const api = {
  async request(method, path, body) {
    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = "Bearer " + token;

    const res = await fetch(BASE_URL + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    if (!res.ok) {
      let msg = "API error";
      try { msg = (await res.json()).error || msg; } catch {}
      throw new Error(msg);
    }

    try { return await res.json(); }
    catch { return {}; }
  },

  get(path) { return this.request("GET", path); },
  post(path, data) { return this.request("POST", path, data); },
  put(path, data) { return this.request("PUT", path, data); },
  delete(path) { return this.request("DELETE", path); }
};
