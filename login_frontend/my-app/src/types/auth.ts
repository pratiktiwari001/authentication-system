export interface RegisterRequest {
    name: string;
    email: string;
    phone: string;
    password: string;
}

export interface VerifyOTPRequest {
    email: string;
    emailOTP: string;
    phoneOTP: string;
}

export interface LoginRequest {
    email: string,
    password: string
}