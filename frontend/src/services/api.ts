// ─────────────────────────────────────────────────────────────────────────────
// src/services/api.ts — DATA PILOT UNIFIED AXIOS SERVICE WRAPPER
// ─────────────────────────────────────────────────────────────────────────────

import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000/api",
  timeout: 600000, // 10 minutes for intensive backend operations
  headers: {
    "Content-Type": "application/json",
  },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Data Pilot Network Exception:", error);

    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      return Promise.reject({
        response: {
          data: {
            detail: "The pipeline execution timed out while computing complex metrics. Consider optimizing sparse target frames.",
          },
        },
      });
    }

    return Promise.reject(error);
  }
);

// Ingest Vector Source File Matrix
export const uploadFile = (file: File) => {
  const form = new FormData()
  form.append("file", file)
  return api.post("/upload/", form, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })
}

// Fetch Active Data Profile
export const getProfile = (sessionId: string) =>
  api.get(`/profile/${sessionId}`)

// Fetch Automatic Pipeline Suggestions
export const getSuggestions = (sessionId: string) =>
  api.get(`/suggestions/${sessionId}`)

// Apply Linear Cleaning Sequence Operations Matrix
export const applyClean = (sessionId: string, operations: object[]) =>
  api.post(`/clean/${sessionId}`, { operations })

// Visual Analytics Distribution Data
export const getAnalytics = (sessionId: string) =>
  api.get(`/analytics/${sessionId}`)

// Comparative Analytics Target Metrics (Before / After Delta Profiles)
export const getComparison = (originalId: string, cleanedId: string) =>
  api.get(`/analytics/compare/${originalId}/${cleanedId}`)

// Export Target Matrix Output Blob Stream
export const exportDataset = (sessionId: string, format: "csv" | "xlsx" | "json") =>
  api.get(`/export/${sessionId}?format=${format}`, { responseType: "blob" })

export default api
