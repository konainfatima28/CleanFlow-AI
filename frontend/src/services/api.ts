// ─────────────────────────────────────────────────────────────────────────────
// src/services/api.ts — RESPONSIVE & MOBILE-OPTIMIZED VERSION
// ─────────────────────────────────────────────────────────────────────────────

import axios from "axios"

// Define a reasonable timeout (e.g., 30s) so mobile devices don't hang infinitely
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000/api",
  timeout: 600000, 
  headers: {
    "Content-Type": "application/json",
  },
})

// Global interceptor to handle mobile network errors cleanly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Axios Error:", error);

    if (error.code === "ECONNABORTED") {
      return Promise.reject({
        response: {
          data: {
            detail: "Upload timed out. Try using a CSV file or a smaller Excel file.",
          },
        },
      });
    }

    return Promise.reject(error);
  }
);

// Upload File (multipart/form-data)
export const uploadFile = (file: File) => {
  const form = new FormData()
  form.append("file", file)
  return api.post("/upload/", form, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    // Optional: add onUploadProgress here if you want real progress percentages on mobile
  })
}

// Profile Diagnostics
export const getProfile = (sessionId: string) =>
  api.get(`/profile/${sessionId}`)

// Fetch AI Remediation Suggestions
export const getSuggestions = (sessionId: string) =>
  api.get(`/suggestions/${sessionId}`)

// Apply Single or Bulk Clean Operations
export const applyClean = (sessionId: string, operations: object[]) =>
  api.post(`/clean/${sessionId}`, { operations })

// Visual Analytics Data
export const getAnalytics = (sessionId: string) =>
  api.get(`/analytics/${sessionId}`)

// Comparative Analytics Data (Before/After)
export const getComparison = (originalId: string, cleanedId: string) =>
  api.get(`/analytics/compare/${originalId}/${cleanedId}`)

// Export Clean Output Blobs
export const exportDataset = (sessionId: string, format: "csv" | "xlsx" | "json") =>
  api.get(`/export/${sessionId}?format=${format}`, { responseType: "blob" })

export default api
