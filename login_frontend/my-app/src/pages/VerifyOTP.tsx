import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyOTP } from "../services/authService";
import type { VerifyOTPRequest } from "../types/auth";
import styles from "../stlyles/login.module.css"; // Pointing to your unified CSS module

function VerifyOTP() {
    const location = useLocation();
    const navigate = useNavigate();

    const email = location.state?.email || "";
    
    const [loading, setLoading] = useState<boolean>(false);
    const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

    const [otpData, setOtpData] = useState<VerifyOTPRequest>({
        email,
        emailOTP: "",
        phoneOTP: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Validation: Only allow typing numbers for OTP fields
        const numericValue = e.target.value.replace(/\D/g, "");
        
        setOtpData({
            ...otpData,
            [e.target.name]: numericValue,
        });
        setStatusMessage(null); // Clear errors on type
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setStatusMessage(null);

        try {
            const response = await verifyOTP(otpData);
            
            setStatusMessage({ text: response.message || "OTP Verified Successfully!", isError: false });
            
            // Give the user 1.5 seconds to read the success message before switching routes
            setTimeout(() => {
                navigate("/login");
            }, 1500);

        } catch (error: any) {
            setStatusMessage({
                text: error.response?.data?.message || "Something went wrong. Please check your codes.",
                isError: true
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.authContainer}>
            <div className={styles.authCard}>
                
                {/* Heading Title */}
                <h1 className={styles.authTitle}>Verify Identity</h1>
                
                <p className={styles.authFooter} style={{ marginTop: "-15px" }}>
                    We've sent verification codes to your accounts.
                </p>

                {/* Modern Banner Message replacing browser alerts */}
                {statusMessage && (
                    <div 
                        style={{ 
                            color: statusMessage.isError ? '#ff4a4a' : '#00ff66', 
                            fontSize: '14px', 
                            textAlign: 'center',
                            fontWeight: '500'
                        }}
                    >
                        {statusMessage.text}
                    </div>
                )}

                {/* Controlled Form Element */}
                <form onSubmit={handleSubmit} className={styles.authForm}>
                    
                    {/* Read-Only Target Email Container */}
                    <div className={styles.inputGroup}>
                        <input
                            type="text"
                            value={otpData.email}
                            readOnly
                            style={{ opacity: 0.6, cursor: 'not-allowed' }}
                            className={styles.authInput}
                        />
                    </div>

                    {/* Email Verification input code */}
                    <div className={styles.inputGroup}>
                        <input
                            type="text"
                            name="emailOTP"
                            required
                            maxLength={6}
                            placeholder="Enter Email OTP"
                            value={otpData.emailOTP}
                            onChange={handleChange}
                            className={styles.authInput}
                        />
                    </div>

                    {/* Mobile Verification input code */}
                    <div className={styles.inputGroup}>
                        <input
                            type="text"
                            name="phoneOTP"
                            required
                            maxLength={6}
                            placeholder="Enter Phone OTP"
                            value={otpData.phoneOTP}
                            onChange={handleChange}
                            className={styles.authInput}
                        />
                    </div>

                    {/* Styled Action Button */}
                    <button type="submit" disabled={loading} className={styles.submitBtn}>
                        {loading ? 'Verifying...' : 'Verify OTP'}
                    </button>
                </form>

                {/* Back to Login option link */}
                <div className={styles.authFooter}>
                    Didn't get codes?{" "}
                    <span onClick={() => navigate("/")} className={styles.redirectLink}>
                        Go Back
                    </span>
                </div>

            </div>
        </div>
    );
}

export default VerifyOTP;