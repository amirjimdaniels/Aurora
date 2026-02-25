import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Register.css";
import axios from "../../api/axios.tsx";

const ForgotPassword = () => {
    const inputRef = useRef<HTMLInputElement>(null);
    const errRef = useRef<HTMLParagraphElement>(null);
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errMsg, setErrMsg] = useState('');
    const [success, setSuccess] = useState(false);
    const [step, setStep] = useState(1); // 1: enter email, 2: enter code, 3: set new password
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        inputRef.current?.focus();
    }, [step]);

    useEffect(() => {
        setErrMsg('');
    }, [email, code, newPassword, confirmPassword]);

    // Step 1: Request reset code
    const handleRequestCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            setErrMsg('Please enter your email address');
            return;
        }
        setLoading(true);
        try {
            const response = await axios.post('/api/auth/verify-reset', { email });
            if (response.data.success) {
                setStep(2);
            }
        } catch (err: any) {
            if (err.response?.status === 429) {
                setErrMsg('Too many attempts. Please try again in 15 minutes.');
            } else {
                setErrMsg('Something went wrong. Please try again.');
            }
            errRef.current?.focus();
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify code
    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code || code.length !== 6) {
            setErrMsg('Please enter the 6-digit code from your email');
            return;
        }
        setLoading(true);
        try {
            const response = await axios.post('/api/auth/verify-token', { email, code });
            if (response.data.success) {
                setStep(3);
            }
        } catch (err: any) {
            if (err.response?.status === 400) {
                setErrMsg(err.response.data.message || 'Invalid or expired code.');
            } else if (err.response?.status === 429) {
                setErrMsg('Too many attempts. Please try again in 15 minutes.');
            } else {
                setErrMsg('Verification failed. Please try again.');
            }
            errRef.current?.focus();
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Set new password
    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setErrMsg('Passwords do not match');
            return;
        }
        if (newPassword.length < 8) {
            setErrMsg('Password must be at least 8 characters');
            return;
        }
        setLoading(true);
        try {
            const response = await axios.post('/api/auth/reset-password', {
                email,
                code,
                newPassword,
            });
            if (response.data.success) {
                setSuccess(true);
            }
        } catch (err: any) {
            if (err.response?.status === 400) {
                setErrMsg(err.response.data.message || 'Password reset failed.');
            } else {
                setErrMsg('Password reset failed. Please try again.');
            }
            errRef.current?.focus();
        } finally {
            setLoading(false);
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

                {step === 1 && (
                    <form onSubmit={handleRequestCode}>
                        <p style={{ marginBottom: '1rem', color: '#aaa', fontSize: '0.9rem' }}>
                            Enter your email address and we'll send you a reset code
                        </p>
                        <label htmlFor="email">Email:</label>
                        <input
                            type="email"
                            id="email"
                            ref={inputRef}
                            autoComplete="off"
                            onChange={(e) => setEmail(e.target.value)}
                            value={email}
                            required
                        />
                        <button disabled={loading}>
                            {loading ? 'Sending...' : 'Send Reset Code'}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleVerifyCode}>
                        <p style={{ marginBottom: '1rem', color: '#aaa', fontSize: '0.9rem' }}>
                            We sent a 6-digit code to <strong style={{ color: '#e2e8f0' }}>{email}</strong>. Enter it below.
                        </p>
                        <label htmlFor="code">Reset Code:</label>
                        <input
                            type="text"
                            id="code"
                            ref={inputRef}
                            autoComplete="off"
                            maxLength={6}
                            placeholder="000000"
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            value={code}
                            required
                            style={{ textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.5rem' }}
                        />
                        <button disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify Code'}
                        </button>
                        <p style={{ marginTop: '0.5rem', color: '#64748b', fontSize: '0.8rem', textAlign: 'center' }}>
                            Code expires in 15 minutes.{' '}
                            <span
                                onClick={() => { setStep(1); setCode(''); }}
                                style={{ color: '#4a9eff', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                Resend code
                            </span>
                        </p>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={handleReset}>
                        <p style={{ marginBottom: '1rem', color: '#aaa', fontSize: '0.9rem' }}>
                            Code verified! Enter your new password.
                        </p>
                        <label htmlFor="newPassword">New Password:</label>
                        <input
                            type="password"
                            id="newPassword"
                            ref={inputRef}
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
                        <button disabled={loading}>
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
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
