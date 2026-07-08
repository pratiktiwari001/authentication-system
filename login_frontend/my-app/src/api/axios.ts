import axios from "axios";

const api = axios.create({
     baseURL: "https://authentication-system-gray-two.vercel.app/api",
    withCredentials: true,   // ⭐ VERY IMPORTANT
    headers: {
        "Content-Type": "application/json",
    },
});

// ⚡ Global Interceptor: Handles silent token generation using your /refresh-token API
api.interceptors.response.use(
    (response) => response, // Let successful responses pass through completely untouched
    async (error) => {
        const originalRequest = error.config;

        // If the backend drops a 401 (Access Token Expired) and we haven't tried refreshing yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true; // Mark this request so we don't loop infinitely if refresh fails

            try {
                // 🔄 Call your backend /refresh-token api right here!
                // The backend checks the RefreshToken model, updates updatedAt, and drops a new access cookie.
                await axios.post("https://authentication-system-gray-two.vercel.app/api/auth/refresh-token", {}, { withCredentials: true });
                
                // Retry the original failed request with the fresh new cookie attached
                return api(originalRequest);
            } catch (refreshError: any) {
                // 💥 If the refresh token itself is expired or wiped from DB (Logout All)
                // Extract the backend's exact reason for the failure
                const backendReason = refreshError.response?.data?.message || "Session expired. Please login again.";
                
                sessionStorage.setItem("logout_reason", backendReason);
                
                // Boot them out to the login page
                window.location.href = "/login";
                return Promise.reject(refreshError);
            }
        }
        
        return Promise.reject(error);
    }
);

export default api;