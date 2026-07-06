import React, { useState, useEffect } from "react";
import type { RegisterRequest } from "../types/auth";
import { useNavigate } from "react-router-dom";
import styles from "../stlyles/login.module.css"; 
import api from "../api/axios";

function Register() {
    const navigate = useNavigate();
    
    // Core Form Fields
    const [formData, setFormData] = useState<RegisterRequest>({
        name: "",
        email: "",
        phone: "",
        password: ""
    });

    // Sub-states for OTP inputs
    const [emailOtp, setEmailOtp] = useState<string>("");
    const [phoneOtp, setPhoneOtp] = useState<string>("");
    
    // Control toggle for stage transitions
    const [isOtpStage, setIsOtpStage] = useState<boolean>(false);

    // ⚡ Resend Cooldown Timer States
    const [countdown, setCountdown] = useState<number>(30);
    const [isResendDisabled, setIsResendDisabled] = useState<boolean>(true);

    // Dynamic state messages
    const [loading, setLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [successMessage, setSuccessMessage] = useState<string>("");

    // ⚡ Timer Hook: Triggers down from 30s when the OTP area is active
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isOtpStage && countdown > 0 && isResendDisabled) {
            timer = setTimeout(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        } else if (countdown === 0) {
            setIsResendDisabled(false);
        }
        return () => clearTimeout(timer);
    }, [isOtpStage, countdown, isResendDisabled]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setErrorMessage("");
        setSuccessMessage("");
    };

    const handleLoginRedirect = () => {
        navigate("/login");
    };

    // ⚡ STEP 1: Submit profile details to trigger OTP distribution
    const handleInitialSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            await api.post('/auth/register', formData);
            setIsOtpStage(true);
            setCountdown(30);
            setIsResendDisabled(true);
            setSuccessMessage("Account initialized! Verification codes sent to your email and phone.");
        } catch (err: any) {
            setErrorMessage(err.response?.data?.message || "Registration failed to initialize. Try again.");
        } finally {
            setLoading(false);
        }
    };

    // ⚡ OPTIONAL EXTENSION: Resend codes action hitting your staging registration endpoint again
    const handleResendOtps = async () => {
        setLoading(true);
        setErrorMessage("");
        setSuccessMessage("");
        try {
            await api.post('/auth/register', formData);
            setSuccessMessage("Fresh validation codes dispatched successfully!");
            // Reset countdown mechanism
            setCountdown(30);
            setIsResendDisabled(true);
        } catch (err: any) {
            setErrorMessage(err.response?.data?.message || "Failed to resend tokens. Try again later.");
        } finally {
            setLoading(false);
        }
    };

    // ⚡ STEP 2: Submit OTP inputs to finalize account creation
    const handleOtpVerificationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!emailOtp || !phoneOtp) {
            setErrorMessage("Please fill out both OTP codes.");
            return;
        }

        setLoading(true);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            await api.post('/auth/verify-otp', {
                email: formData.email, 
                emailOTP: emailOtp,
                phoneOTP: phoneOtp
            });

            setSuccessMessage("Identity verified and account created successfully! Redirecting...");
            setTimeout(() => navigate("/login"), 2000);
        } catch (err: any) {
            setErrorMessage(err.response?.data?.message || "Invalid validation codes. Please check and retry.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.authContainer}>
            <div className={styles.authCard}>
                
                <div className={styles.tabContainer}>
                    <div className={styles.tabPill}>
                        <button type="button" className={`${styles.tabBtn} ${styles.tabBtnActive}`}>Sign Up</button>
                        <button type="button" onClick={handleLoginRedirect} className={styles.tabBtn}>Log In</button>
                    </div>
                </div>

                <h1 className={styles.authTitle}>Create An Account</h1>

                {/* Status Banners */}
                {errorMessage && <div style={{ color: '#ff4a4a', fontSize: '14px', textAlign: 'center', marginBottom: '10px' }}>{errorMessage}</div>}
                {successMessage && <div style={{ color: '#00ff66', fontSize: '14px', textAlign: 'center', marginBottom: '10px' }}>{successMessage}</div>}

                <form onSubmit={!isOtpStage ? handleInitialSubmit : handleOtpVerificationSubmit} className={styles.authForm}>
                    
                    {/* Input Field: Name */}
                    <div className={styles.inputGroup}>
                        <input type="text" name="name" required disabled={isOtpStage} placeholder="Enter Name" value={formData.name} onChange={handleChange} className={styles.authInput} />
                    </div>

                    {/* Input Field: Email */}
                    <div className={styles.inputGroup}>
                        <input type="email" name="email" required disabled={isOtpStage} placeholder="Enter Email Address" value={formData.email} onChange={handleChange} className={styles.authInput} />
                    </div>

                    {/* Conditional Drop: Email OTP */}
                    {isOtpStage && (
                        <div className={styles.inputGroup} style={{ marginTop: '-8px' }}>
                            <input
                                type="text"
                                required
                                maxLength={6}
                                placeholder="🔢 Enter 6-Digit Email OTP"
                                value={emailOtp}
                                onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ""))}
                                className={styles.authInput}
                                style={{ textAlign: 'center', borderColor: '#ffcc00' }}
                            />
                        </div>
                    )}

                    {/* Input Field: Phone Number */}
                    <div className={styles.inputGroup}>
                        <input type="text" name="phone" required disabled={isOtpStage} placeholder="Enter Phone Number" value={formData.phone} onChange={handleChange} className={styles.authInput} />
                    </div>

                    {/* Conditional Drop: Phone OTP */}
                    {isOtpStage && (
                        <div className={styles.inputGroup} style={{ marginTop: '-8px' }}>
                            <input
                                type="text"
                                required
                                maxLength={6}
                                placeholder="🔢 Enter 6-Digit Phone OTP"
                                value={phoneOtp}
                                onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ""))}
                                className={styles.authInput}
                                style={{ textAlign: 'center', borderColor: '#ffcc00' }}
                            />
                        </div>
                    )}

                    {/* Input Field: Password */}
                    <div className={styles.inputGroup}>
                        <input type="password" name="password" required disabled={isOtpStage} placeholder="Enter Password" value={formData.password} onChange={handleChange} className={styles.authInput} />
                    </div>

                    {/* ⚡ Inline Resend Timer Text Flag */}
                    {isOtpStage && (
                        <div style={{ textAlign: 'right', fontSize: '13px', marginTop: '-4px', marginBottom: '4px' }}>
                            {isResendDisabled ? (
                                <span style={{ color: '#8e8e93' }}>Resend codes in <strong style={{ color: '#ffcc00' }}>{countdown}s</strong></span>
                            ) : (
                                <span 
                                    onClick={!loading ? handleResendOtps : undefined} 
                                    style={{ color: '#ffcc00', cursor: 'pointer', fontWeight: '600', textDecoration: 'underline' }}
                                >
                                    🔄 Resend OTPs
                                </span>
                            )}
                        </div>
                    )}

                    {/* Submit Button Switch */}
                    {!isOtpStage ? (
                        <button type="submit" disabled={loading} className={styles.submitBtn}>
                            {loading ? 'Sending Codes...' : 'Send OTPs'}
                        </button>
                    ) : (
                        <button 
                            type="submit" 
                            disabled={loading} 
                            className={styles.submitBtn}
                            style={{ backgroundColor: '#00ff66', color: '#121212', fontWeight: 'bold' }}
                        >
                            {loading ? 'Verifying & Registering...' : 'Verify & Register'}
                        </button>
                    )}
                </form>

                <div className={styles.authFooter}>
                    Already have an account? <span onClick={handleLoginRedirect} className={styles.redirectLink}>Log In here</span>
                </div>

            </div>
        </div>
    );
}

export default Register;