// ─────────────────────────────────────────────────────────────────────────────
// src/services/api.ts — RESPONSIVE & MOBILE-OPTIMIZED VERSION (ROUTING FIXED)
// ─────────────────────────────────────────────────────────────────────────────

import axios from "axios"

// Define a reasonable timeout (e.g., 30s) so mobile devices don't hang infinitely
const api = axios.create({
  // Clean up trailing slash defaults to maintain predictable path generation
  baseURL: import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, "") : "http://localhost:8000/api",
  timeout: 100000, 
  headers: {
    "Content-Type": "application/json",
  },
})

// Global interceptor to handle mobile network errors cleanly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the network request was aborted or timed out
    if (error.code === "ECONNABORTED" || !error.response) {
      return Promise.reject({
        response: {
          data: {
            detail: "Network timeout or weak connection. Please check your signal and try again.",
          },
        },
      });
    }
    return Promise.reject(error)
  }
)

// Upload File (multipart/form-data)
export const uploadFile = (file: File) => {
  const form = new FormData()
  form.append("file", file)
  
  // FIXED: Removed manual content-type header context completely
  // This lets the browser dynamically generate the correct form boundary signatures
  return api.post("/upload", form)
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
