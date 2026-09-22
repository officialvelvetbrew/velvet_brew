import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import Blogs from "./pages/Blogs";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import { AlertProvider } from "./contexts/AlertContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AlertProvider>
      <BrowserRouter>
        <Routes>
        <Route path="/" element={<App />} />
        <Route path="/blogs" element={<Blogs />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<App />} />
      </Routes>
      </BrowserRouter>
    </AlertProvider>
  </React.StrictMode>
);
