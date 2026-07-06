import api from "../api/axios";
import type { RegisterRequest } from "../types/auth";
import type { VerifyOTPRequest } from "../types/auth";
import type { LoginRequest } from "../types/auth";

export const registerUser = async (data: RegisterRequest) => {
    const response = await api.post("/auth/register", data);
    return response.data;
};


export const verifyOTP = async (data: VerifyOTPRequest) => {
    const response = await api.post("/auth/verify-otp", data);
    return response.data;
};

export const Login = async (data: LoginRequest) =>{
    const response = await api.post("/login", data);
    return response.data;
}