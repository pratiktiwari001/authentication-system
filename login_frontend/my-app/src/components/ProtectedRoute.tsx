import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import api from "../api/axios";

export default function ProtectedRoute() {
    // null = checking, true = authorized, false = unauthorized
    const [isAuth, setIsAuth] = useState<boolean | null>(null);

    useEffect(() => {
        const verifySession = async () => {
            try {
                const response = await api.get('/auth/profile');
                
                if (!response.data || !response.data.email) {
                    setIsAuth(false);
                } else {
                    setIsAuth(true); // Cookie is completely valid!
                }
            } catch (err) {
                setIsAuth(false); // 401 Unauthorized, 403, or connection failure
            }
        };

        verifySession();
    }, []);

    // While waiting for your /getprofile API, show a loading screen that matches your dark theme
    if (isAuth === null) {
        return (
            <div style={{ backgroundColor: '#0d0d0d', color: '#ffffff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
                <p style={{ opacity: 0.7, letterSpacing: '1px' }}>Verifying security credentials...</p>
            </div>
        );
    }

    // If authorized, render the profile page (via Outlet). If not, kick them to login.
    return isAuth ? <Outlet /> : <Navigate to="/login" replace />;
}