import React, { useState } from 'react';
import type { LoginRequest } from '../types/auth';
import { useNavigate } from 'react-router-dom';
import { Login } from '../services/authService';
import styles from "../stlyles/login.module.css"; // Fixed path typo
import api from "../api/axios";
import { useEffect } from 'react';

const LogIN = () => {
    const navigate = useNavigate();
    
    // Toggle modes: 'password' | 'otp' | 'forgot'
    const [loginMethod, setLoginMethod] = useState<'password' | 'otp' | 'forgot'>('password');
    
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

    // Action: Handle normal Login OTP generation
    const handleSendOTP = async () => {
        if (!loginData.email) {
            setErrorMessage("Please enter your email first.");
            return;
        }
        setLoading(true);
        setErrorMessage("");
        try {
            await api.post('/login/email/send', { email: loginData.email });
            setOtpSent(true); 
            setSuccessMessage("OTP sent successfully!");
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
            setForgotStep(2); // Advance to OTP verification entry stage
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
            setForgotStep(3); // Advance to inputting the password
        } catch (error: any) {
            setErrorMessage(error.response?.data?.message || "Invalid OTP code.");
        } finally {
            setLoading(false);
        }
    };

    // Forgot Password Phase 3: Update and route to Dashboard
    // Forgot Password Phase 3: Update and route to Dashboard
    const handleResetPasswordFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Frontend match verification shield
        if (newPassword !== confirmPassword) {
            setErrorMessage("Passwords do not match!");
            return;
        }

        setLoading(true);
        setErrorMessage("");
        try {
            // ⚡ UPDATED: Hitting your exact backend endpoint path
            await api.post('/auth/forgot-password/reset-password', { 
                email: loginData.email, 
                password: newPassword 
            });
            
            // Password updated successfully! Send them straight to the dashboard
            navigate("/dashboard");
        } catch (error: any) {
            setErrorMessage(error.response?.data?.message || "Failed to change password.");
        } finally {
            setLoading(false);
        }
    };

    // Central handler for standard log-in forms
    // Central handler for standard log-in forms
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage("");
        setSuccessMessage("");
        
        try {
            if (loginMethod === 'password') {
                // ⚡ FIX: Call your configured axios instance directly to ensure cookies drop safely
                const response = await api.post('/login', loginData); 
                console.log("Password login successful:", response.data);
                navigate("/dashboard"); 
            } else {
                const response = await api.post('/login/email/verify', { 
                    email: loginData.email, 
                    otp: otp 
                });
                console.log("OTP Verified successfully:", response.data);
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
                
                {/* Header Navigation Tabs - Hides when resetting password to avoid context breaks */}
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

                {/* Sub-Toggle for Strategy - Hides when resetting password */}
                {loginMethod !== 'forgot' && (
                    <div className={styles.tabContainer} style={{ marginTop: '-10px' }}>
                        <div className={styles.tabPill} style={{ backgroundColor: '#141416' }}>
                            <button
                                type="button"
                                onClick={() => { setLoginMethod('password'); setErrorMessage(""); setSuccessMessage(""); }}
                                className={`${styles.tabBtn} ${loginMethod === 'password' ? styles.tabBtnActive : ''}`}
                                style={{ fontSize: '12px', padding: '6px 16px' }}
                            >
                                Password
                            </button>
                            <button
                                type="button"
                                onClick={() => { setLoginMethod('otp'); setErrorMessage(""); setSuccessMessage(""); }}
                                className={`${styles.tabBtn} ${loginMethod === 'otp' ? styles.tabBtnActive : ''}`}
                                style={{ fontSize: '12px', padding: '6px 16px' }}
                            >
                                OTP Login
                            </button>
                        </div>
                    </div>
                )}

                {/* Header Text rendering dynamically based on routing step state context */}
                <h1 className={styles.authTitle}>
                    {loginMethod === 'password' && 'Welcome Back'}
                    {loginMethod === 'otp' && 'Verify via OTP'}
                    {loginMethod === 'forgot' && (
                        forgotStep === 1 ? 'Reset Password' : forgotStep === 2 ? 'Enter Reset OTP' : 'New Password'
                    )}
                </h1>

                {/* Notification Banners */}
                {errorMessage && <div style={{ color: '#ff4a4a', fontSize: '14px', textAlign: 'center' }}>{errorMessage}</div>}
                {successMessage && <div style={{ color: '#00ff66', fontSize: '14px', textAlign: 'center' }}>{successMessage}</div>}

                {/* --- RENDER VIEW 1: STANDARD FORMS (PASSWORD & OTP LOGIN) --- */}
                {loginMethod !== 'forgot' && (
                    <form onSubmit={handleSubmit} className={styles.authForm}>
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
                                    style={{ color: '#ffcc00', fontSize: '12px', textAlign: 'right', marginTop: '6px', cursor: 'pointer' }}
                                >
                                    Forgot Password?
                                </div>
                            </div>
                        ) : (
                            otpSent && (
                                <div className={styles.inputGroup}>
                                      <input
                                        type="text"
                                        name="otp"
                                        required
                                        maxLength={6}
                                        placeholder="Enter 6-Digit OTP"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        className={styles.authInput}
                                        style={{ letterSpacing: '4px', textAlign: 'center' }}
                                    />
                                </div>
                            )
                        )}

                        {loginMethod === 'otp' && !otpSent ? (
                            <button type="button" onClick={handleSendOTP} disabled={loading} className={styles.submitBtn}>
                                {loading ? 'Sending...' : 'Send OTP'}
                            </button>
                        ) : (
                            <button type="submit" disabled={loading} className={styles.submitBtn}>
                                {loading ? 'Processing...' : loginMethod === 'password' ? 'Login' : 'Verify & Login'}
                            </button>
                        )}
                    </form>
                )}

                {/* --- RENDER VIEW 2: FORGOT PASSWORD SEQUENTIAL STEPS --- */}
                {loginMethod === 'forgot' && (
                    <div className={styles.authForm}>
                        {/* Step 1 Form: Send Verification Token */}
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
                                    {loading ? 'Sending Code...' : 'Send Reset OTP'}
                                </button>
                            </form>
                        )}

                        {/* Step 2 Form: Validate Code */}
                        {forgotStep === 2 && (
                            <form onSubmit={handleForgotOTPSubmit} className={styles.authForm}>
                                <div className={styles.inputGroup}>
                                    <input
                                        type="text"
                                        required
                                        maxLength={6}
                                        placeholder="Enter 6-Digit Reset OTP"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        className={styles.authInput}
                                        style={{ letterSpacing: '4px', textAlign: 'center' }}
                                    />
                                </div>
                                <button type="submit" disabled={loading} className={styles.submitBtn}>
                                    {loading ? 'Verifying...' : 'Verify Token'}
                                </button>
                            </form>
                        )}

                        {/* Step 3 Form: Save and Commit New Credentials */}
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
                                    {loading ? 'Saving Changes...' : 'Update & Open Dashboard'}
                                </button>
                            </form>
                        )}

                        {/* Back navigation out of forgot state option link */}
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
                    New User??
                    <span onClick={handleRegisterRedirect} className={styles.redirectLink}>
                        Register here
                    </span>
                </div>

            </div>
        </div>
    );
};

export default LogIN;