import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";

// 🔓 Public Gateway Guard (Defined inline to keep your file structure minimal)
const PublicRoute = () => {
    const isAuthenticated = localStorage.getItem("isLoggedIn") === "true";
    
    // If already logged in, redirect them forward to the dashboard automatically
    return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* 🚫 Blocks logged-in users from falling back into Auth Screens */}
                <Route element={<PublicRoute />}>
                    <Route path="/" element={<Register />} />
                    <Route path="/login" element={<Login />} />
                </Route>

                {/* 🔒 Blocks unauthenticated guests from entering the Secure Dashboard */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                </Route>

                {/* Catch-all fallback redirect */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;