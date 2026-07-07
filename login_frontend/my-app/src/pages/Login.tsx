import React, { useState } from 'react';
import type { LoginRequest } from '../types/auth';
import { useNavigate } from 'react-router-dom';
// import { Login } from '../services/authService';
import styles from "../stlyles/login.module.css"; // Fixed path typo
import api from "../api/axios";
import { useEffect } from 'react';

const LogIN = () => {
    const navigate = useNavigate();
    
    // Toggle modes: 'password' | 'otp' | 'forgot'
    const [loginMethod, setLoginMethod] = useState<'password' | 'otp' | 'forgot'>('password');
    
    // Sub-toggle for OTP sub-methods: 'email' | 'phone'
    const [otpChannel, setOtpChannel] = useState<'email' | 'phone'>('email');

    // Forgot Password Flow Sub-Steps: 1 (Email) | 2 (OTP Entry) | 3 (New Password Entry)
    const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);

    const [otpSent, setOtpSent] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [successMessage, setSuccessMessage] = useState<string>("");

    const [loginData, setLoginData] = useState<LoginRequest>({
        email: "",
        password: ""
    });
    
    // State explicitly for handling mobile phone string inputs
    const [phone, setPhone] = useState<string>("");
    const [otp, setOtp] = useState<string>("");
    
    // States specifically for resetting the password
    const [newPassword, setNewPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");

    useEffect(() => {
        // Check if the Axios interceptor dropped off an expiration message from the backend
        const expiredMessage = sessionStorage.getItem("logout_reason");
        
        if (expiredMessage) {
            setErrorMessage(expiredMessage);
            
            // Clear it out immediately so refreshing the page manually hides the error banner
            sessionStorage.removeItem("logout_reason");
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLoginData({
            ...loginData,
            [e.target.name]: e.target.value
        });
        setErrorMessage(""); 
        setSuccessMessage("");
    };

    const handleRegisterRedirect = () => {
        navigate("/"); 
    };

    // Action: Handles dynamic OTP dispatch based on active channel strategy
    const handleSendOTP = async () => {
        if (otpChannel === 'email' && !loginData.email) {
            setErrorMessage("Please enter your email first.");
            return;
        }
        if (otpChannel === 'phone' && !phone) {
            setErrorMessage("Please enter your phone number first.");
            return;
        }

        setLoading(true);
        setErrorMessage("");
        try {
            if (otpChannel === 'email') {
                await api.post('/login/email/send', { email: loginData.email });
            } else {
                await api.post('/login/phone/send', { phone });
            }
            setOtpSent(true); 
            setSuccessMessage("Verification code dispatched successfully!");
        } catch (error: any) {
            setErrorMessage(error.response?.data?.message || "Failed to send OTP.");
        } finally {
            setLoading(false);
        }
    };

    // Forgot Password Phase 1: Submit email to request a reset
    const handleForgotEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage("");
        try {
            await api.post('/auth/forgot-password', { email: loginData.email });
            setSuccessMessage("Reset OTP sent to your email.");
            setForgotStep(2); 
        } catch (error: any) {
            setErrorMessage(error.response?.data?.message || "Email lookup failed.");
        } finally {
            setLoading(false);
        }
    };

    // Forgot Password Phase 2: Verify the security token
    const handleForgotOTPSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage("");
        try {
            await api.post('/auth/forgot-password/otp-verify', { email: loginData.email, otp: otp });
            setSuccessMessage("Identity verified. Set your new password.");
            setForgotStep(3); 
        } catch (error: any) {
            setErrorMessage(error.response?.data?.message || "Invalid OTP code.");
        } finally {
            setLoading(false);
        }
    };

    // Forgot Password Phase 3: Update and route to Dashboard
    const handleResetPasswordFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            setErrorMessage("Passwords do not match!");
            return;
        }

        setLoading(true);
        setErrorMessage("");
        try {
            await api.post('/auth/forgot-password/reset-password', { 
                email: loginData.email, 
                password: newPassword 
            });
            
            navigate("/dashboard");
        } catch (error: any) {
            setErrorMessage(error.response?.data?.message || "Failed to change password.");
        } finally {
            setLoading(false);
        }
    };

    // Central handler for standard log-in forms
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage("");
        setSuccessMessage("");
        
        try {
            if (loginMethod === 'password') {
                const response = await api.post('/login', loginData); 
                // console.log("Password login successful:", response.data);
                navigate("/dashboard"); 
            } else {
                let response;
                if (otpChannel === 'email') {
                    response = await api.post('/login/email/verify', { 
                        email: loginData.email, 
                        otp: otp 
                    });
                } else {
                    response = await api.post('/login/phone/verify', { 
                        phone: phone, 
                        otp: otp 
                    });
                }
                // console.log("OTP Verified successfully:", response.data);
                navigate("/dashboard"); 
            }
        } catch (error: any) {
            console.error("Login catch block fired:", error);
            setErrorMessage(error.response?.data?.message || "Authentication failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.authContainer}>
            <div className={styles.authCard}>
                
                {/* Header Navigation Tabs */}
                {loginMethod !== 'forgot' && (
                    <div className={styles.tabContainer}>
                        <div className={styles.tabPill}>
                            <button type="button" onClick={handleRegisterRedirect} className={styles.tabBtn}>
                                Sign Up
                            </button>
                            <button type="button" className={`${styles.tabBtn} ${styles.tabBtnActive}`}>
                                Log In
                            </button>
                        </div>
                    </div>
                )}

                {/* Sub-Toggle for Strategy */}
                {loginMethod !== 'forgot' && (
                    <div className={styles.tabContainer} style={{ marginTop: '-10px' }}>
                        <div className={styles.tabPill} style={{ backgroundColor: '#0d0d0f' }}>
                            <button
                                type="button"
                                onClick={() => { setLoginMethod('password'); setOtpSent(false); setOtp(""); setErrorMessage(""); setSuccessMessage(""); }}
                                className={`${styles.tabBtn} ${loginMethod === 'password' ? styles.tabBtnActive : ''}`}
                                style={{ fontSize: '12px', padding: '6px 16px' }}
                            >
                                Password
                            </button>
                            <button
                                type="button"
                                onClick={() => { setLoginMethod('otp'); setOtpSent(false); setOtp(""); setErrorMessage(""); setSuccessMessage(""); }}
                                className={`${styles.tabBtn} ${loginMethod === 'otp' ? styles.tabBtnActive : ''}`}
                                style={{ fontSize: '12px', padding: '6px 16px' }}
                            >
                                OTP Login
                            </button>
                        </div>
                    </div>
                )}

                {/* Sub-Toggle Options for Email vs Phone under OTP Mode */}
                {loginMethod === 'otp' && !otpSent && (
                    <div className={styles.tabContainer} style={{ marginTop: '-4px', animation: "cardAppear 0.3s ease forwards" }}>
                        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#8e8e93', cursor: 'pointer', transition: 'color 0.2s' }}>
                                <input 
                                    type="radio" 
                                    name="otpChannel" 
                                    checked={otpChannel === 'email'} 
                                    onChange={() => setOtpChannel('email')} 
                                    style={{ accentColor: '#ffcc00', transform: 'scale(1.05)' }}
                                />
                                Email Channel
                            </label>
                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#8e8e93', cursor: 'pointer', transition: 'color 0.2s' }}>
                                <input 
                                    type="radio" 
                                    name="otpChannel" 
                                    checked={otpChannel === 'phone'} 
                                    onChange={() => setOtpChannel('phone')} 
                                    style={{ accentColor: '#ffcc00', transform: 'scale(1.05)' }}
                                />
                                SMS Channel
                            </label>
                        </div>
                    </div>
                )}

                {/* Header Typography Label Context */}
                <div style={{ textAlign: "center", marginBottom: "4px" }}>
                    <h1 className={styles.authTitle}>
                        {loginMethod === 'password' && 'Welcome Back'}
                        {loginMethod === 'otp' && (otpChannel === 'email' ? 'Email Handshake' : 'Secure SMS Lock')}
                        {loginMethod === 'forgot' && (
                            forgotStep === 1 ? 'Recover Password' : forgotStep === 2 ? 'Security Token' : 'Update Credentials'
                        )}
                    </h1>
                    <p style={{ color: "#636366", fontSize: "13px", margin: "6px 0 0 0" }}>
                        {loginMethod === 'password' && "Access your personal workspace portal"}
                        {loginMethod === 'otp' && "Provide identity credentials to initialize token"}
                        {loginMethod === 'forgot' && "Follow automated isolation blocks to reset keys"}
                    </p>
                </div>

                {/* Premium Status Warning/Info Banners */}
                {errorMessage && (
                    <div style={{ 
                        color: '#ff4a4a', 
                        fontSize: '13px', 
                        textAlign: 'center', 
                        background: 'rgba(255, 74, 74, 0.08)', 
                        padding: '11px 14px', 
                        borderRadius: '12px', 
                        border: '1px solid rgba(255, 74, 74, 0.15)',
                        animation: "cardAppear 0.25s ease forwards"
                    }}>
                        ⚠️ {errorMessage}
                    </div>
                )}
                {successMessage && (
                    <div style={{ 
                        color: '#00ff66', 
                        fontSize: '13px', 
                        textAlign: 'center', 
                        background: 'rgba(0, 255, 102, 0.08)', 
                        padding: '11px 14px', 
                        borderRadius: '12px', 
                        border: '1px solid rgba(0, 255, 102, 0.15)',
                        animation: "cardAppear 0.25s ease forwards"
                    }}>
                        ✓ {successMessage}
                    </div>
                )}

                {/* --- RENDER VIEW 1: STANDARD FORMS (PASSWORD & OTP LOGIN) --- */}
                {loginMethod !== 'forgot' && (
                    <form onSubmit={handleSubmit} className={styles.authForm}>
                        
                        {/* Dynamic Field Identity Layer */}
                        {loginMethod === 'password' || (loginMethod === 'otp' && otpChannel === 'email') ? (
                            <div className={styles.inputGroup}>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    placeholder="Enter Your Email"
                                    value={loginData.email}
                                    onChange={handleChange}
                                    disabled={otpSent && loginMethod === 'otp'}
                                    className={styles.authInput}
                                />
                            </div>
                        ) : (
                            <div className={styles.inputGroup} style={{ animation: "cardAppear 0.3s ease forwards" }}>
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter Your Phone Number"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    disabled={otpSent}
                                    className={styles.authInput}
                                />
                            </div>
                        )}

                        {loginMethod === 'password' ? (
                            <div className={styles.inputGroup}>
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    placeholder="Password"
                                    value={loginData.password}
                                    onChange={handleChange}
                                    className={styles.authInput}
                                />
                                <div 
                                    onClick={() => { setLoginMethod('forgot'); setErrorMessage(""); setSuccessMessage(""); }}
                                    style={{ color: '#ffcc00', fontSize: '12px', textAlign: 'right', marginTop: '8px', cursor: 'pointer', transition: 'color 0.2s' }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#ffe066'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#ffcc00'}
                                >
                                    Forgot Password?
                                </div>
                            </div>
                        ) : (
                            otpSent && (
                                <div className={styles.inputGroup} style={{ animation: "cardAppear 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}>
                                    <input
                                        type="text"
                                        name="otp"
                                        required
                                        maxLength={6}
                                        placeholder="🔢 Enter 6-Digit Verification Token"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        className={styles.authInput}
                                        style={{ letterSpacing: '2px', textAlign: 'center', borderColor: 'rgba(255, 204, 0, 0.35)' }}
                                    />
                                </div>
                            )
                        )}

                        {loginMethod === 'otp' && !otpSent ? (
                            <button type="button" onClick={handleSendOTP} disabled={loading} className={styles.submitBtn}>
                                {loading ? 'Requesting Key...' : 'Send OTP'}
                            </button>
                        ) : (
                            <button type="submit" disabled={loading} className={styles.submitBtn}>
                                {loading ? 'Validating Handshake...' : loginMethod === 'password' ? 'Authorize Session' : 'Verify & Login'}
                            </button>
                        )}
                    </form>
                )}

                {/* --- RENDER VIEW 2: FORGOT PASSWORD SEQUENTIAL STEPS --- */}
                {loginMethod === 'forgot' && (
                    <div className={styles.authForm} style={{ animation: "cardAppear 0.3s ease forwards" }}>
                        {forgotStep === 1 && (
                            <form onSubmit={handleForgotEmailSubmit} className={styles.authForm}>
                                <div className={styles.inputGroup}>
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        placeholder="Enter Your Account Email"
                                        value={loginData.email}
                                        onChange={handleChange}
                                        className={styles.authInput}
                                    />
                                </div>
                                <button type="submit" disabled={loading} className={styles.submitBtn}>
                                    {loading ? 'Routing Recovery Request...' : 'Send Reset OTP'}
                                </button>
                            </form>
                        )}

                        {forgotStep === 2 && (
                            <form onSubmit={handleForgotOTPSubmit} className={styles.authForm}>
                                <div className={styles.inputGroup}>
                                    <input
                                        type="text"
                                        required
                                        maxLength={6}
                                        placeholder="🔢 Enter 6-Digit Recovery Token"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        className={styles.authInput}
                                        style={{ letterSpacing: '2px', textAlign: 'center', borderColor: 'rgba(255, 204, 0, 0.35)' }}
                                    />
                                </div>
                                <button type="submit" disabled={loading} className={styles.submitBtn}>
                                    {loading ? 'Authenticating Token...' : 'Verify Token'}
                                </button>
                            </form>
                        )}

                        {forgotStep === 3 && (
                            <form onSubmit={handleResetPasswordFinalSubmit} className={styles.authForm}>
                                <div className={styles.inputGroup}>
                                    <input
                                        type="password"
                                        required
                                        placeholder="Enter New Password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className={styles.authInput}
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <input
                                        type="password"
                                        required
                                        placeholder="Confirm New Password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className={styles.authInput}
                                    />
                                </div>
                                <button type="submit" disabled={loading} className={styles.submitBtn}>
                                    {loading ? 'Overwriting Records...' : 'Update Password'}
                                </button>
                            </form>
                        )}

                        <div 
                            onClick={() => { setLoginMethod('password'); setForgotStep(1); setErrorMessage(""); setSuccessMessage(""); }}
                            className={styles.redirectLink} 
                            style={{ textAlign: 'center', fontSize: '13px', display: 'block', marginTop: '10px' }}
                        >
                            ← Back to Login Selection
                        </div>
                    </div>
                )}

                <div className={styles.authFooter}>
                    New User?? <span onClick={handleRegisterRedirect} className={styles.redirectLink}>Register here</span>
                </div>

            </div>
        </div>
    );
};

export default LogIN;