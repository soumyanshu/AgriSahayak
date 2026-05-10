import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { RecaptchaVerifier, signInWithPhoneNumber, GoogleAuthProvider, signInWithPopup, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';

const Login = () => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [isVerifyingRegistration, setIsVerifyingRegistration] = useState(false);

    // Auth & OTP State
    const [showOtpField, setShowOtpField] = useState(false);
    const [userId, setUserId] = useState(null); // For login 2-step process
    const [countryCode, setCountryCode] = useState('+91');
    const [otpTimer, setOtpTimer] = useState(120); // 2 minutes in seconds
    const [confirmationResult, setConfirmationResult] = useState(null);

    // Password Visiblity States
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Toast State
    const [toast, setToast] = useState({ message: '', type: '', visible: false });

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        'mobile-email': '',
        password: '',
        'confirm-password': '',
        otp: ''
    });

    const showToast = (message, type = 'error') => {
        setToast({ message, type, visible: true });
        // Auto hide toast after 4 seconds
        setTimeout(() => {
            setToast((prev) => ({ ...prev, visible: false }));
        }, 4000);
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // Formatter for timer
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // Timer Effect
    useEffect(() => {
        let interval = null;
        if (showOtpField && otpTimer > 0) {
            interval = setInterval(() => {
                setOtpTimer(prev => prev - 1);
            }, 1000);
        } else if (!showOtpField) {
            setOtpTimer(120);
        }
        return () => clearInterval(interval);
    }, [showOtpField, otpTimer]);

    useEffect(() => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                size: 'invisible'
            });
        }

        return () => {
            if (window.recaptchaVerifier) {
                window.recaptchaVerifier.clear();
                window.recaptchaVerifier = null;
            }
        };
    }, []);

    // Check for Magic Link return
    useEffect(() => {
        if (isSignInWithEmailLink(auth, window.location.href)) {
            let email = window.localStorage.getItem('emailForSignIn');
            if (!email) {
                email = window.prompt('Please provide your email for confirmation');
            }
            if (email) {
                signInWithEmailLink(auth, email, window.location.href)
                    .then(async (result) => {
                        window.localStorage.removeItem('emailForSignIn');
                        const user = result.user;
                        
                        const userData = {
                            _id: user.uid,
                            name: user.displayName || 'Magic Link User',
                            email: user.email,
                            profilePicture: user.photoURL || '',
                            token: await user.getIdToken()
                        };
                        
                        try {
                            await setDoc(doc(db, "users", user.uid), {
                                name: userData.name,
                                email: userData.email,
                                createdAt: new Date().toISOString()
                            }, { merge: true });
                        } catch (e) { console.error("Firestore sync error:", e); }

                        localStorage.setItem('userInfo', JSON.stringify(userData));
                        showToast("Magic Link Login successful!", "success");
                        setTimeout(() => navigate('/dashboard'), 1500);
                    })
                    .catch((error) => {
                        console.error(error);
                        showToast("Invalid or expired Magic Link.", "error");
                    });
            }
        }
    }, [navigate]);

    const handleLoginWithOtp = async () => {
        const input = formData['mobile-email'];
        if (!input) {
            showToast("Please enter an Email or Mobile Number.", 'error');
            return;
        }
        
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/send-login-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: input })
            });
            if (!res.ok && res.status === 404) {
                showToast("Account not found. Please create an account.", 'error');
                return;
            }
            const data = await res.json();
            
            if (res.ok) {
                setUserId(data.userId);
                showToast("OTP generated. Please check your otp.txt file!", 'success');
                setOtpTimer(120);
                setShowOtpField(true);
            } else {
                showToast(data.message || "Failed to send OTP", 'error');
            }
        } catch (err) {
            showToast("Server error. Did you restart the backend?", 'error');
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            
            const userData = {
                _id: user.uid,
                name: user.displayName || 'Google User',
                email: user.email,
                profilePicture: user.photoURL,
                token: await user.getIdToken()
            };
            
            try {
                await setDoc(doc(db, "users", user.uid), {
                    name: userData.name,
                    email: userData.email,
                    createdAt: new Date().toISOString()
                }, { merge: true });
            } catch (e) { console.error(e); }

            localStorage.setItem('userInfo', JSON.stringify(userData));
            showToast("Google Login successful!", "success");
            setTimeout(() => navigate('/dashboard'), 1000);
        } catch (error) {
            console.error(error);
            showToast(`Login failed: ${error.message || 'Cancelled'}`, "error");
        }
    };

    const handleMagicLinkLogin = async () => {
        const input = formData['mobile-email'];
        if (!input || !input.includes('@')) {
            showToast("Please enter a valid Email Address for Magic Link.", 'error');
            return;
        }

        const actionCodeSettings = {
            url: window.location.origin + '/login',
            handleCodeInApp: true,
        };

        try {
            await sendSignInLinkToEmail(auth, input, actionCodeSettings);
            window.localStorage.setItem('emailForSignIn', input);
            showToast("Magic Link sent! Please check your email inbox.", "success");
        } catch (error) {
            console.error("Magic Link error:", error);
            showToast(error.message || "Failed to send Magic Link.", "error");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // -------------------------
        // FORGOT PASSWORD FLOW
        // -------------------------
        if (isForgotPassword && !isResettingPassword) {
            if (!formData['mobile-email']) {
                showToast("Please enter Mobile or Email.", 'error');
                return;
            }

            const isMobile = !formData['mobile-email'].includes('@');
            if (isMobile) {
                const fullMobile = `${countryCode}${formData['mobile-email']}`;
                try {
                    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/forgot-password`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 'mobile-email': formData['mobile-email'], firebaseVerified: true })
                    });
                    const data = await res.json();
                    if (res.ok) {
                        setUserId(data.userId);
                        const confirmation = await signInWithPhoneNumber(auth, fullMobile, window.recaptchaVerifier);
                        setConfirmationResult(confirmation);
                        showToast("OTP sent to your mobile via Firebase.", 'success');
                        setOtpTimer(120);
                        setShowOtpField(true);
                    } else {
                        showToast(data.message || "User not found", 'error');
                    }
                } catch (err) {
                    showToast("Failed to send Firebase SMS: " + err.message, 'error');
                }
                return;
            }

            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/forgot-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 'mobile-email': formData['mobile-email'] })
                });
                const data = await res.json();
                if (res.ok) {
                    setUserId(data.userId);
                    showToast("Account found. Please enter your new password.", 'success');
                    setIsResettingPassword(true);
                } else {
                    showToast(data.message || "User not found", 'error');
                }
            } catch (err) {
                showToast("Server error. Please try again later.", 'error');
            }
            return;
        }

        // -------------------------
        // NEW PASSWORD FLOW
        // -------------------------
        if (isResettingPassword) {
            if (formData.password !== formData['confirm-password']) {
                showToast("Passwords do not match!", 'error');
                return;
            }
            if (formData.password.length < 6) {
                showToast("Password must be at least 6 characters.", 'error');
                return;
            }
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/reset-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId,
                        otp: formData.otp,
                        newPassword: formData.password,
                        firebaseVerified: confirmationResult ? true : false
                    })
                });
                const data = await res.json();
                if (res.ok) {
                    showToast("Password Reset Successful! Please login.", 'success');
                    setTimeout(() => {
                        resetToLogin();
                    }, 2000);
                } else {
                    showToast(data.message || "Failed to reset password", 'error');
                }
            } catch (err) {
                showToast("Server error. Please try again later.", 'error');
            }
            return;
        }

        // -------------------------
        // REGISTRATION FLOW
        // -------------------------
        if (!isLogin && !isForgotPassword && !isResettingPassword) {
            // Registration validation
            if (formData.password !== formData['confirm-password']) {
                showToast("Passwords do not match!", 'error');
                return;
            }
            const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*.,])[a-zA-Z0-9!@#$%^&*.,]{8,}$/;
            if (!passwordRegex.test(formData.password)) {
                showToast("Password must be 8+ chars, include a number & special character.", 'error');
                return;
            }

            const isMobile = !formData['mobile-email'].includes('@');
            const fullMobile = isMobile ? `${countryCode}${formData['mobile-email']}` : formData['mobile-email'];

            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: formData.name,
                        email: formData.email,
                        'mobile-email': fullMobile,
                        password: formData.password,
                        firebaseVerified: true // Bypass backend OTP requirement
                    })
                });

                const data = await res.json();
                if (res.ok) {
                    try {
                        await setDoc(doc(db, "users", data._id), {
                            name: data.name || "",
                            email: data.email || "",
                            mobile: data.mobileOrEmail || "",
                            agriId: data.agriId || "",
                            createdAt: new Date().toISOString()
                        });
                    } catch (e) { console.error("Firestore error", e); }

                    showToast("Registration successful! Please login.", 'success');
                    setTimeout(() => {
                        resetToLogin();
                    }, 1500);
                } else {
                    showToast(data.message || "Registration failed", 'error');
                }
            } catch (err) {
                showToast("Server error. Please try again later.", 'error');
            }
            return;
        }

        // -------------------------
        // LOGIN FLOW
        // -------------------------
        if (isLogin) {
            if (formData.password.length < 6) {
                showToast("Invalid password.", 'error');
                return;
            }

            try {
                const isMobile = !formData['mobile-email'].includes('@');
                const fullLoginId = isMobile ? `${countryCode}${formData['mobile-email']}` : formData['mobile-email'];

                const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        'mobile-email': fullLoginId,
                        password: formData.password
                    })
                });

                const data = await res.json();
                if (res.ok) {
                    localStorage.setItem('userInfo', JSON.stringify(data));
                    showToast("Login successful! Redirecting...", 'success');
                    setTimeout(() => {
                        navigate('/dashboard');
                    }, 1000);
                } else {
                    showToast(data.message || "Invalid credentials", 'error');
                }
            } catch (err) {
                showToast("Server error. Please try again later.", 'error');
            }
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();

        if (otpTimer <= 0) {
            showToast("OTP has expired. Please request a new one.", 'error');
            return;
        }

        if (!formData.otp || formData.otp.length !== 6) {
            showToast("Please enter a valid 6-digit OTP", "error");
            return;
        }

        if (confirmationResult) {
            try {
                await confirmationResult.confirm(formData.otp);
                if (isLogin) {
                    const fullMobile = `${countryCode}${formData['mobile-email']}`;
                    try {
                        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/login`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                'mobile-email': fullMobile,
                                firebaseVerified: true
                            })
                        });
                        const data = await res.json();
                        if (res.ok) {
                            localStorage.setItem('userInfo', JSON.stringify(data));
                            showToast("Login successful!", 'success');
                            setShowOtpField(false);
                            setTimeout(() => navigate('/dashboard'), 1000);
                        } else {
                            showToast(data.message || "Invalid credentials", 'error');
                        }
                    } catch (err) {
                        showToast("Server error.", 'error');
                    }
                    return;
                }

                if (isForgotPassword) {
                    setIsResettingPassword(true);
                    setShowOtpField(false);
                    showToast("Mobile verified! Enter your new password.", "success");
                    return;
                }

                if (isVerifyingRegistration) {
                    const fullMobile = `${countryCode}${formData['mobile-email']}`;
                    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/register`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: formData.name,
                            email: formData.email,
                            'mobile-email': fullMobile,
                            password: formData.password,
                            firebaseVerified: true
                        })
                    });

                    const data = await res.json();
                    if (res.ok) {
                        try {
                            await setDoc(doc(db, "users", data._id), {
                                name: data.name || "",
                                email: data.email || "",
                                mobile: data.mobileOrEmail || "",
                                agriId: data.agriId || "",
                                createdAt: new Date().toISOString()
                            });
                        } catch (e) { console.error("Firestore error", e); }
                        
                        localStorage.setItem('userInfo', JSON.stringify(data));
                        showToast("Registration verified! Logging you in...", 'success');
                        setShowOtpField(false);
                        setTimeout(() => {
                            navigate('/dashboard');
                        }, 1500);
                    } else {
                        showToast(data.message || "Final registration failed", 'error');
                    }
                    return;
                }
            } catch (error) {
                showToast("Invalid code entered.", "error");
                return;
            }
        }

        if (isForgotPassword) {
            // Verify implicitly if we are in forgot password flow by allowing them to skip to reset form
            // Or better, verify it at the end during reset-password request
            setIsResettingPassword(true);
            setShowOtpField(false);
            showToast("OTP Accepted. Enter your new password.", "success");
            return;
        }

        if (isVerifyingRegistration) {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/verify-register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, otp: formData.otp })
                });

                const data = await res.json();
                if (res.ok) {
                    try {
                        await setDoc(doc(db, "users", data._id), {
                            name: data.name || "",
                            email: data.email || "",
                            mobile: data.mobileOrEmail || "",
                            agriId: data.agriId || "",
                            createdAt: new Date().toISOString()
                        });
                    } catch (e) { console.error("Firestore error", e); }

                    localStorage.setItem('userInfo', JSON.stringify(data));
                    showToast("Registration verified! Logging you in...", 'success');
                    setShowOtpField(false);
                    setTimeout(() => navigate('/dashboard'), 1500);
                } else {
                    showToast(data.message || "Invalid or Expired OTP", 'error');
                }
            } catch (err) {
                showToast("Server error. Please try again later.", 'error');
            }
            return;
        }

        if (isLogin && userId) {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/verify-login-otp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, otp: formData.otp })
                });
                const data = await res.json();
                if (res.ok) {
                    localStorage.setItem('userInfo', JSON.stringify(data));
                    showToast("Login successful!", 'success');
                    setShowOtpField(false);
                    setTimeout(() => navigate('/dashboard'), 1500);
                } else {
                    showToast(data.message || "Invalid OTP", 'error');
                }
            } catch (err) {
                showToast("Server error.", 'error');
            }
            return;
        }

        showToast("Unexpected OTP verification state.", "error");
    };

    const resetToLogin = () => {
        setIsLogin(true);
        setIsForgotPassword(false);
        setIsResettingPassword(false);
        setIsVerifyingRegistration(false);
        setShowOtpField(false);
        setConfirmationResult(null);
        setToast({ message: '', type: '', visible: false });
        setShowPassword(false);
        setShowConfirmPassword(false);
        setFormData({
            name: '',
            email: '',
            'mobile-email': '',
            password: '',
            'confirm-password': '',
            otp: ''
        });
    };

    const toggleMode = () => {
        if (isForgotPassword || isResettingPassword) {
            resetToLogin();
        } else {
            setIsLogin(!isLogin);
            setIsVerifyingRegistration(false);
            setShowOtpField(false);
            setConfirmationResult(null);
            setToast({ message: '', type: '', visible: false });
            setShowPassword(false);
            setShowConfirmPassword(false);
            setFormData({
                name: '',
                email: '',
                'mobile-email': '',
                password: '',
                'confirm-password': '',
                otp: ''
            });
        }
    };

    const toggleForgotPassword = (e) => {
        e.preventDefault();
        resetToLogin();
        setIsForgotPassword(true);
        setIsLogin(false);
    };

    // Resend OTP Helper
    const resendOtp = async () => {
        showToast("Requesting new OTP...", "success");
        try {
            let res;
            if (isForgotPassword) {
                res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/forgot-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 'mobile-email': formData['mobile-email'] })
                });
            } else if (isLogin) {
                res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/send-login-otp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: formData['mobile-email'] })
                });
            } else {
                // Registration
                const fullMobile = !formData['mobile-email'].includes('@') ? `${countryCode}${formData['mobile-email']}` : formData['mobile-email'];
                res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: formData.name,
                        email: formData.email,
                        'mobile-email': fullMobile,
                        password: formData.password
                    })
                });
            }

            if (res && res.ok) {
                setOtpTimer(120);
                showToast("New OTP sent!", "success");
            } else {
                showToast("Failed to resend OTP", "error");
            }
        } catch (err) {
            showToast("Server error resending OTP", "error");
        }
    };

    return (
        <div className="h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4 sm:p-8 font-sans overflow-hidden">
            
            {/* Global Toast Notification */}
            {toast.visible && (
                <div className="fixed top-6 right-6 z-50 animate-fade-in-up">
                    <div className={`p-4 rounded-xl shadow-2xl flex items-center gap-3 border backdrop-blur-md ${
                        toast.type === 'error' 
                            ? 'bg-red-500/90 border-red-400 text-white' 
                            : 'bg-green-500/90 border-green-400 text-white'
                    }`}>
                        <i className={`fas ${toast.type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'} text-xl`}></i>
                        <span className="font-medium">{toast.message}</span>
                    </div>
                </div>
            )}

            {/* Main Landscape Card */}
            <div className="w-full sm:max-w-5xl bg-white sm:rounded-3xl shadow-2xl flex flex-col md:flex-row h-full max-h-[90vh] relative overflow-hidden">
                
                {/* Left Side: Image / Landscape */}
                <div 
                    className="hidden md:flex md:w-1/2 relative flex-col justify-center items-center text-center p-10"
                    style={{
                        backgroundImage: 'url("/image/agrilogin.jpg")',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    <div className="absolute inset-0 bg-black/40"></div>
                    
                    {/* Desktop: Back Button in Image Section */}
                    <div className="absolute top-6 left-6 z-20">
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center gap-2 text-white hover:text-green-200 font-bold bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl transition-all cursor-pointer text-sm shadow-lg border border-white/20"
                        >
                            <i className="fas fa-arrow-left"></i> Back to Home
                        </button>
                    </div>

                    {/* Desktop: Logo in Image Section (Top Right) */}
                    <div className="absolute top-6 right-6 z-20 flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/30">
                        <img src="/image/logo.png" alt="AgriSahayak Logo" className="h-10 drop-shadow-md" />
                        <span className="text-xl font-extrabold text-white tracking-tight drop-shadow-md">AgriSahayak</span>
                    </div>

                    <div className="relative z-10 text-white mt-auto mb-6">
                        <h1 className="text-4xl font-extrabold drop-shadow-lg mb-3">Empowering Farmers</h1>
                        <p className="text-lg text-gray-200 font-medium drop-shadow-md">Smart Agriculture for a Better Future</p>
                    </div>
                </div>

                {/* Right Side: Form Card */}
                <div className="w-full md:w-1/2 flex flex-col px-6 sm:px-12 bg-gradient-to-br from-white to-green-50 relative overflow-y-auto h-full">
                
                    {/* Mobile Only: Back to Home Button */}
                    <div className="absolute top-4 left-4 z-20 md:hidden">
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center justify-center w-10 h-10 text-gray-600 hover:text-green-800 font-bold bg-gray-100 rounded-full transition-all cursor-pointer"
                        >
                            <i className="fas fa-arrow-left"></i>
                        </button>
                    </div>

                <div className="w-full max-w-sm mx-auto space-y-4 py-12 md:py-8 my-auto">
                    <div className="text-center">
                        {/* Mobile Only: Branding / Logo */}
                        <div className="flex justify-center items-center gap-2 mb-3 md:hidden">
                            <img src="/image/logo.png" alt="AgriSahayak Logo" className="h-8 drop-shadow-sm" />
                            <span className="text-xl font-extrabold text-[#115e3b] tracking-tight">
                                AgriSahayak
                            </span>
                        </div>
                    <h2 className="mt-2 text-3xl font-bold text-gray-900 tracking-tight">
                        {isResettingPassword ? 'Create New Password' :
                            isForgotPassword ? 'Reset Password' :
                                isLogin ? 'Welcome back' : 'Create an account'}
                    </h2>
                    <p className="mt-2 text-sm text-gray-500 font-light">
                        {isResettingPassword ? 'Please enter your new secure password' :
                            isForgotPassword ? 'Enter your email or mobile to get an OTP.' :
                                isLogin ? 'Sign in to access your digital farming tools.' : 'Join us and start farming smarter today.'}
                    </p>
                </div>

                {/* Form Elements */}
                <form className="space-y-4" onSubmit={handleSubmit}>

                    {/* Registration Specific Fields */}
                    {!isLogin && !isForgotPassword && !isResettingPassword && (
                        <>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-lg z-10">
                                    👤
                                </div>
                                <input id="full-name" name="name" type="text" required placeholder="Full Name"
                                    value={formData.name} onChange={handleChange}
                                    className="appearance-none rounded-xl relative block w-full pl-11 px-4 py-2.5 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#115e3b]/20 focus:border-[#115e3b] text-sm bg-white transition-all font-medium"
                                />
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-lg z-10">
                                    📧
                                </div>
                                <input id="reg-email" name="email" type="email" required placeholder="Email Address"
                                    value={formData.email} onChange={handleChange}
                                    className="appearance-none rounded-xl relative block w-full pl-11 px-4 py-2.5 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#115e3b]/20 focus:border-[#115e3b] text-sm bg-white transition-all font-medium"
                                />
                            </div>
                        </>
                    )}

                    {/* Shared / Login fields (Mobile/Email) */}
                    {!isResettingPassword && (
                        <div className="relative group flex items-center rounded-xl overflow-hidden border border-gray-300 focus-within:ring-2 focus-within:ring-[#115e3b]/20 focus-within:border-[#115e3b] transition-all bg-white">
                            <div className="pl-4 flex items-center pointer-events-none text-lg z-10">
                                {(isLogin || isForgotPassword) ? "👤" : "📱"}
                            </div>

                            {(!isLogin && !isForgotPassword) && (
                                <select 
                                    className="appearance-none bg-transparent py-2.5 pl-2 pr-4 text-gray-600 font-bold focus:outline-none border-r border-gray-200 z-10 text-sm cursor-pointer hover:bg-gray-50"
                                    value={countryCode}
                                    onChange={(e) => setCountryCode(e.target.value)}
                                >
                                    <option value="+91">+91</option>
                                    <option value="+1">+1</option>
                                </select>
                            )}

                            <input
                                id="mobile-email" name="mobile-email"
                                type={(isLogin || isForgotPassword) ? "text" : "tel"}
                                required
                                value={formData['mobile-email']} onChange={handleChange}
                                className={`appearance-none relative block w-full px-4 py-2.5 placeholder-gray-400 text-gray-900 focus:outline-none text-sm bg-transparent font-medium ${(isLogin || isForgotPassword) ? 'pl-3' : ''}`}
                                placeholder={(isLogin || isForgotPassword) ? "Mobile Number or Email" : "Mobile Number"}
                            />
                        </div>
                    )}

                    {/* Password */}
                    {(!isForgotPassword || isResettingPassword) && (
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-lg z-10">
                                🔒
                            </div>
                            <input
                                id="password" name="password" 
                                type={showPassword ? "text" : "password"} 
                                required
                                value={formData.password} onChange={handleChange}
                                className="appearance-none rounded-xl relative block w-full pl-11 pr-10 px-4 py-2.5 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#115e3b]/20 focus:border-[#115e3b] text-sm bg-white transition-all font-medium"
                                placeholder="Password"
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-400 hover:text-gray-600" onClick={() => setShowPassword(!showPassword)}>
                                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </div>
                        </div>
                    )}
                    {/* Password Strength Hint */}
                    {(!isLogin && !isForgotPassword && !isResettingPassword) && (
                        <p className={`text-[11px] pl-2 -mt-2 transition-colors duration-300 ${
                            !formData.password ? 'text-gray-500' :
                            /^(?=.*[0-9])(?=.*[!@#$%^&*.,])[a-zA-Z0-9!@#$%^&*.,]{8,}$/.test(formData.password) ? 'text-green-600 font-bold' : 'text-red-500 font-medium'
                        }`}>Must be 8+ chars with a number and special character.</p>
                    )}

                    {/* Confirm Password */}
                    {(!isLogin && !isForgotPassword) || isResettingPassword ? (
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-lg z-10">
                                🔐
                            </div>
                            <input
                                id="confirm-password" name="confirm-password" 
                                type={showConfirmPassword ? "text" : "password"} 
                                required
                                value={formData['confirm-password']} onChange={handleChange}
                                className="appearance-none rounded-xl relative block w-full pl-11 pr-10 px-4 py-2.5 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#115e3b]/20 focus:border-[#115e3b] text-sm bg-white transition-all font-medium"
                                placeholder="Confirm Password"
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-400 hover:text-gray-600" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </div>
                        </div>
                    ) : null}

                    {/* Meta Options */}
                    {isLogin && !isForgotPassword && !isResettingPassword && (
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center">
                                <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-[#115e3b] focus:ring-[#115e3b] border-gray-300 rounded cursor-pointer" />
                                <label htmlFor="remember-me" className="ml-2 text-gray-600 cursor-pointer"> Remember me </label>
                            </div>
                            <button type="button" onClick={toggleForgotPassword} className="font-semibold text-[#115e3b] hover:text-green-700 transition-colors cursor-pointer"> Forgot password? </button>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div>
                        <button
                            type="submit"
                            className="w-full flex justify-center py-3 px-4 rounded-xl text-white font-bold bg-[#115e3b] hover:bg-[#0c472a] shadow-lg shadow-green-900/20 transition-all cursor-pointer text-base"
                        >
                            {isResettingPassword ? 'Save New Password' :
                                isForgotPassword ? 'Find Account' :
                                    isLogin ? 'Login Securely' : 'Create an account'}
                        </button>
                    </div>

                    {/* Social Auth */}
                    {isLogin && (
                        <div className="mt-4 space-y-3">
                            <div className="flex items-center py-1">
                                <div className="flex-grow border-t border-gray-200"></div>
                                <span className="flex-shrink-0 mx-4 text-gray-400 text-sm font-medium">OR</span>
                                <div className="flex-grow border-t border-gray-200"></div>
                            </div>
                            <button type="button" onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold bg-white hover:bg-gray-50 transition-colors cursor-pointer text-sm shadow-sm">
                                <i className="fab fa-google text-red-500"></i> Continue with Google
                            </button>
                            <button type="button" onClick={handleMagicLinkLogin} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold bg-white hover:bg-gray-50 transition-colors cursor-pointer text-sm shadow-sm">
                                <i className="fas fa-envelope text-blue-500"></i> Login with Link
                            </button>
                        </div>
                    )}
                </form>

                {/* Toggle Footer */}
                <div className="mt-1 pt-2 border-t border-gray-100 flex items-center justify-center flex-wrap gap-1.5">
                    <span className="text-sm text-gray-600">
                        {isForgotPassword || isResettingPassword ? 'Remembered your password?' :
                            isLogin ? 'New to AgriSahayak?' : 'Already have an account?'}
                    </span>
                    <button type="button" onClick={toggleMode} className="text-sm font-bold text-[#115e3b] hover:text-[#0c472a] hover:underline transition-all cursor-pointer">
                        {isForgotPassword || isResettingPassword ? 'Back to Login' :
                            isLogin ? 'Register now' : 'Sign in'}
                    </button>
                </div>
                </div>
                </div>
            </div>

            {/* OTP Modal Layer */}
            {showOtpField && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative z-[10000]">
                        <button onClick={() => setShowOtpField(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer">
                            <i className="fas fa-times text-xl"></i>
                        </button>

                        <div className="text-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-900">Enter OTP</h3>
                            <p className="text-sm text-gray-500 mt-2">Code sent to <span className="font-semibold text-gray-700">{formData['mobile-email']}</span></p>
                            <div className={`mt-3 font-mono text-xl font-bold ${otpTimer > 30 ? 'text-green-600' : 'text-red-500'}`}>
                                {formatTime(otpTimer)}
                            </div>
                        </div>

                        <form onSubmit={handleOtpSubmit} className="space-y-4">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-2xl">
                                    🔑
                                </div>
                                <input
                                    id="otp-modal" name="otp" type="text" required maxLength="6"
                                    value={formData.otp} onChange={handleChange}
                                    disabled={otpTimer <= 0}
                                    className="w-full p-4 pl-12 border-2 border-gray-200 rounded-xl text-center text-2xl font-bold tracking-[0.5em] focus:border-[#115e3b] focus:outline-none"
                                    placeholder="------"
                                    autoFocus
                                />
                            </div>

                            <div className="pt-2">
                            <button
                                type="submit"
                                className="w-full flex justify-center py-3 px-4 rounded-xl text-white font-bold bg-[#115e3b] hover:bg-[#0c472a] shadow-md transition-all cursor-pointer text-base"
                            >
                                Verify & Access
                            </button>
                            </div>

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={resendOtp}
                                    className="text-sm font-semibold text-primary hover:text-green-700 transition-colors cursor-pointer"
                                >
                                    Resend OTP
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div id="recaptcha-container"></div>
        </div>
    );
};

export default Login;
