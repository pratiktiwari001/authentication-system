import { Navigate, Outlet, useLocation } from "react-router-dom";

const ProtectedRoute = () => {
    const location = useLocation();
    const isAuthenticated = localStorage.getItem("isLoggedIn") === "true";

    if (!isAuthenticated) {
        // If no flag is found, force them to the login screen
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    // If authenticated, render the secure workspace component smoothly
    return <Outlet />;
};

export default ProtectedRoute;