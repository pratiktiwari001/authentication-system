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
        let timer: ReturnType<typeof setTimeout>;
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
                
                {/* Header Toggle Navigation Tabs */}
                <div className={styles.tabContainer}>
                    <div className={styles.tabPill}>
                        <button type="button" className={`${styles.tabBtn} ${styles.tabBtnActive}`}>Sign Up</button>
                        <button type="button" onClick={handleLoginRedirect} className={styles.tabBtn}>Log In</button>
                    </div>
                </div>

                <div style={{ textAlign: "center", marginBottom: "4px" }}>
                    <h1 className={styles.authTitle}>Create An Account</h1>
                    <p style={{ color: "#636366", fontSize: "13px", margin: "6px 0 0 0" }}>
                        {!isOtpStage ? "Get started with your secure credentials" : "Confirm identity via multi-channel tokens"}
                    </p>
                </div>

                {/* Premium Status Banner System */}
                {errorMessage && (
                    <div style={{ 
                        color: '#ff4a4a', 
                        fontSize: '13px', 
                        textAlign: 'center', 
                        background: 'rgba(255, 74, 74, 0.08)', 
                        padding: '10px 14px', 
                        borderRadius: '10px', 
                        border: '1px solid rgba(255, 74, 74, 0.15)' 
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
                        padding: '10px 14px', 
                        borderRadius: '10px', 
                        border: '1px solid rgba(0, 255, 102, 0.15)' 
                    }}>
                        ✓ {successMessage}
                    </div>
                )}

                <form onSubmit={!isOtpStage ? handleInitialSubmit : handleOtpVerificationSubmit} className={styles.authForm}>
                    
                    {/* Input Field: Name */}
                    <div className={styles.inputGroup}>
                        <input type="text" name="name" required disabled={isOtpStage} placeholder="Enter Name" value={formData.name} onChange={handleChange} className={styles.authInput} />
                    </div>

                    {/* Input Field: Email Component Stack */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <div className={styles.inputGroup}>
                            <input type="email" name="email" required disabled={isOtpStage} placeholder="Enter Email Address" value={formData.email} onChange={handleChange} className={styles.authInput} />
                        </div>

                        {/* Conditional Drop: Email OTP */}
                        {isOtpStage && (
                            <div className={styles.inputGroup} style={{ animation: "cardAppear 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}>
                                <input
                                    type="text"
                                    required
                                    maxLength={6}
                                    placeholder="🔢 Enter 6-Digit Email OTP"
                                    value={emailOtp}
                                    onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ""))}
                                    className={styles.authInput}
                                    style={{ textAlign: 'center', letterSpacing: '2px', borderColor: 'rgba(255, 204, 0, 0.35)', background: "#151518" }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Input Field: Phone Number Component Stack */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <div className={styles.inputGroup}>
                            <input type="text" name="phone" required disabled={isOtpStage} placeholder="Enter Phone Number" value={formData.phone} onChange={handleChange} className={styles.authInput} />
                        </div>

                        {/* Conditional Drop: Phone OTP */}
                        {isOtpStage && (
                            <div className={styles.inputGroup} style={{ animation: "cardAppear 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}>
                                <input
                                    type="text"
                                    required
                                    maxLength={6}
                                    placeholder="🔢 Enter 6-Digit Phone OTP"
                                    value={phoneOtp}
                                    onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ""))}
                                    className={styles.authInput}
                                    style={{ textAlign: 'center', letterSpacing: '2px', borderColor: 'rgba(255, 204, 0, 0.35)', background: "#151518" }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Input Field: Password */}
                    <div className={styles.inputGroup}>
                        <input type="password" name="password" required disabled={isOtpStage} placeholder="Enter Password" value={formData.password} onChange={handleChange} className={styles.authInput} />
                    </div>

                    {/* ⚡ Inline Resend Timer Container */}
                    {isOtpStage && (
                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "-6px" }}>
                            {isResendDisabled ? (
                                <span style={{ color: '#636366', fontSize: '12px', letterSpacing: '0.3px' }}>
                                    Resend keys in <strong style={{ color: '#ffcc00', fontWeight: "600" }}>{countdown}s</strong>
                                </span>
                            ) : (
                                <span 
                                    onClick={!loading ? handleResendOtps : undefined} 
                                    className={styles.redirectLink}
                                    style={{ fontSize: '12px', margin: 0 }}
                                >
                                    🔄 Resend Security Codes
                                </span>
                            )}
                        </div>
                    )}

                    {/* Dynamic Submit Button System */}
                    {!isOtpStage ? (
                        <button type="submit" disabled={loading} className={styles.submitBtn}>
                            {loading ? 'Sending Verification...' : 'Send OTPs'}
                        </button>
                    ) : (
                        <button 
                            type="submit" 
                            disabled={loading} 
                            className={styles.submitBtn}
                            style={{ 
                                background: 'linear-gradient(135deg, #00ff66 0%, #00cc52 100%)', 
                                color: '#050505', 
                                boxShadow: '0 6px 20px rgba(0, 255, 102, 0.15)' 
                            }}
                        >
                            {loading ? 'Validating Handshake...' : 'Verify & Complete Register'}
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