import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Register.css";
import axios from "../../api/axios.js";

const ForgotPassword = () => {
    const userRef = useRef();
    const errRef = useRef();
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errMsg, setErrMsg] = useState('');
    const [success, setSuccess] = useState(false);
    const [step, setStep] = useState(1); // 1: verify identity, 2: set new password

    useEffect(() => {
        userRef.current?.focus();
    }, []);

    useEffect(() => {
        setErrMsg('');
    }, [username, email, newPassword, confirmPassword]);

    const handleVerify = async (e) => {
        e.preventDefault();
        if (!username || !email) {
            setErrMsg('Please enter both username and email');
            return;
        }
        try {
            const response = await axios.post('/api/auth/verify-reset', { username, email });
            if (response.data.success) {
                setStep(2);
            }
        } catch (err) {
            if (err.response?.status === 404) {
                setErrMsg('No account found with that username and email combination');
            } else {
                setErrMsg('Verification failed. Please try again.');
            }
            errRef.current?.focus();
        }
    };

    const handleReset = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setErrMsg('Passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            setErrMsg('Password must be at least 6 characters');
            return;
        }
        try {
            const response = await axios.post('/api/auth/reset-password', { 
                username, 
                email, 
                newPassword 
            });
            if (response.data.success) {
                setSuccess(true);
            }
        } catch (err) {
            setErrMsg('Password reset failed. Please try again.');
            errRef.current?.focus();
        }
    };

    if (success) {
        return (
            <div className="auth-page">
                <section>
                    <h1>Password Reset Successful!</h1>
                    <p style={{ marginTop: '1rem' }}>Your password has been updated.</p>
                    <p style={{ marginTop: '1rem' }}>
                        <span 
                            onClick={() => navigate('/signin')} 
                            style={{ color: '#4a9eff', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                            Sign In with your new password
                        </span>
                    </p>
                </section>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <section>
                <p ref={errRef} className={errMsg ? "errmsg" : "offscreen"} aria-live="assertive">
                    {errMsg}
                </p>
                <h1>Reset Password</h1>
                
                {step === 1 ? (
                    <form onSubmit={handleVerify}>
                        <p style={{ marginBottom: '1rem', color: '#aaa', fontSize: '0.9rem' }}>
                            Enter your username and email to verify your identity
                        </p>
                        <label htmlFor="username">Username:</label>
                        <input
                            type="text"
                            id="username"
                            ref={userRef}
                            autoComplete="off"
                            onChange={(e) => setUsername(e.target.value)}
                            value={username}
                            required
                        />
                        <label htmlFor="email">Email:</label>
                        <input
                            type="email"
                            id="email"
                            autoComplete="off"
                            onChange={(e) => setEmail(e.target.value)}
                            value={email}
                            required
                        />
                        <button>Verify Identity</button>
                    </form>
                ) : (
                    <form onSubmit={handleReset}>
                        <p style={{ marginBottom: '1rem', color: '#aaa', fontSize: '0.9rem' }}>
                            Identity verified! Enter your new password.
                        </p>
                        <label htmlFor="newPassword">New Password:</label>
                        <input
                            type="password"
                            id="newPassword"
                            onChange={(e) => setNewPassword(e.target.value)}
                            value={newPassword}
                            required
                        />
                        <label htmlFor="confirmPassword">Confirm Password:</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            value={confirmPassword}
                            required
                        />
                        <button>Reset Password</button>
                    </form>
                )}
                
                <p style={{ marginTop: '1rem', textAlign: 'center' }}>
                    Remember your password?{' '}
                    <span 
                        onClick={() => navigate('/signin')} 
                        style={{ color: '#4a9eff', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                        Sign In
                    </span>
                </p>
            </section>
        </div>
    );
};

export default ForgotPassword;
