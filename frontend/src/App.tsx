import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Landing from "./pages/Landing"
import Dashboard from "./pages/Dashboard"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main Entry Framework Paths */}
        <Route path="/"          element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Deep SEO Links pointed straight to Dashboard wrapper layout */}
        <Route path="/about"     element={<Dashboard />} />
        <Route path="/privacy"   element={<Dashboard />} />
        <Route path="/terms"     element={<Dashboard />} />
        <Route path="/contact"   element={<Dashboard />} />
        
        {/* Absolute Wildcard Safeguard */}
        <Route path="*"          element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
