// ─────────────────────────────────────────────────────────────────────────────
// src/services/api.ts  — replace your existing file with this
// ─────────────────────────────────────────────────────────────────────────────

import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000/api",
})

// Upload
export const uploadFile = (file: File) => {
  const form = new FormData()
  form.append("file", file)
  return api.post("/upload/", form)
}

// Profile
export const getProfile = (sessionId: string) =>
  api.get(`/profile/${sessionId}`)

// Suggestions
export const getSuggestions = (sessionId: string) =>
  api.get(`/suggestions/${sessionId}`)

// Clean
export const applyClean = (sessionId: string, operations: object[]) =>
  api.post(`/clean/${sessionId}`, { operations })

// Analytics
export const getAnalytics = (sessionId: string) =>
  api.get(`/analytics/${sessionId}`)

export const getComparison = (originalId: string, cleanedId: string) =>
  api.get(`/analytics/compare/${originalId}/${cleanedId}`)

// Export
export const exportDataset = (sessionId: string, format: "csv" | "xlsx" | "json") =>
  api.get(`/export/${sessionId}?format=${format}`, { responseType: "blob" })
