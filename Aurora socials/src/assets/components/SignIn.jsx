import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Register.css";
import axios from "../../api/axios.js";

const LOGIN_URL = '/api/login';

const SignIn = () => {
    const userRef = useRef();
    const errRef = useRef();
    const navigate = useNavigate();

    const [user, setUser] = useState('');
    const [pwd, setPwd] = useState('');
    const [errMsg, setErrMsg] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        userRef.current.focus();
    }, []);

    useEffect(() => {
        setErrMsg('');
    }, [user, pwd]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(LOGIN_URL,
                JSON.stringify({ username: user, password: pwd }),
                {
                    headers: { 'Content-Type': 'application/json' },
                    withCredentials: true
                }
            );
            console.log(response.data);
            // Store JWT token, userId and username in localStorage
            if (response.data && response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('userId', response.data.userId);
                localStorage.setItem('username', response.data.username);
            }
            setSuccess(true);
            navigate("/feed");
        } catch (err) {
            if (!err?.response) {
                setErrMsg('No Server Response');
            } else if (err.response?.status === 401) {
                setErrMsg('Invalid credentials');
            } else {
                setErrMsg('Sign In Failed');
            }
            errRef.current.focus();
        }
    };

    return (
        <div className="auth-page">
            {success ? (
                <section>
                    <h1>Sign In Successful!</h1>
                    {/* TODO: Redirect to landing page or dashboard */}
                </section>
            ) : (
                <section>
                    <p ref={errRef} className={errMsg ? "errmsg" : "offscreen"} aria-live="assertive">{errMsg}</p>
                    <h1>Sign In</h1>
                    <form onSubmit={handleSubmit}>
                        <label htmlFor="username">Username:</label>
                        <input
                            type="text"
                            id="username"
                            ref={userRef}
                            autoComplete="off"
                            onChange={(e) => setUser(e.target.value)}
                            value={user}
                            required
                        />
                        <label htmlFor="password">Password:</label>
                        <input
                            type="password"
                            id="password"
                            onChange={(e) => setPwd(e.target.value)}
                            value={pwd}
                            required
                        />
                        <button>Sign In</button>
                    </form>
                    <p style={{ marginTop: '1rem', textAlign: 'center' }}>
                        <span 
                            onClick={() => navigate('/forgot-password')} 
                            style={{ color: '#4a9eff', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                            Forgot Password?
                        </span>
                    </p>
                    <p style={{ marginTop: '1rem', textAlign: 'center' }}>
                        Don't have an account?{' '}
                        <span 
                            onClick={() => navigate('/register')}
                            style={{ color: '#4a9eff', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                            Register
                        </span>
                    </p>
                </section>
            )}
        </div>
    );
};

export default SignIn;
