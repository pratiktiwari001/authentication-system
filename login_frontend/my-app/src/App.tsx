import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import VerifyOTP from "./pages/VerifyOTP";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />

            <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                </Route>
                </Routes>
        </BrowserRouter>
    );
}

export default App;
