'use client'
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { enqueueSnackbar } from 'notistack';
import { auth } from "../app/config"; 
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";
import { getDatabase, ref, set } from "firebase/database";
import { useNavigate } from 'react-router-dom';

export default function Signup() {
    const [isLogin, setIsLogin] = useState(false);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleSignup = (e:any) => {
        e.preventDefault();
        const userData = {
            userName: username,
            email: email,
        };

        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const database = getDatabase();
                set(ref(database, 'users/' + userCredential.user.uid), userData);
                enqueueSnackbar("User created successfully", { 
                    anchorOrigin: {
                        vertical: 'top',
                        horizontal: 'center',
                    },
                    variant: 'success',
                });
            })
            .catch((error) => {
                enqueueSnackbar("User create failed", { 
                    anchorOrigin: {
                        vertical: 'top',
                        horizontal: 'center',
                    },
                    variant: 'error'
                });
            });
    };

    const handleLogin = (e:any) => {
        e.preventDefault();
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                enqueueSnackbar("User login successfully", { 
                    anchorOrigin: {
                        vertical: 'top',
                        horizontal: 'center',
                    },
                    variant: 'success',
                });
                navigate('/Menu');
            })
            .catch((error) => {
                enqueueSnackbar("User login failed", { 
                    anchorOrigin: {
                        vertical: 'top',
                        horizontal: 'center',
                    },
                    variant: 'error'
                });
            });
    };

    const handleGoogleLogin = (e:any) => {
        e.preventDefault();
        const provider = new GoogleAuthProvider();

        signInWithPopup(auth, provider)
            .then((result) => {
                enqueueSnackbar("User login successfully", { 
                    anchorOrigin: {
                        vertical: 'top',
                        horizontal: 'center',
                    },
                    variant: 'success',
                });
                navigate('/Menu');

            }).catch((error) => {
                enqueueSnackbar("User login failed", { 
                    anchorOrigin: {
                        vertical: 'top',
                        horizontal: 'center',
                    },
                    variant: 'error'
                });
            });
    };

    const handleFacebookLogin = (e:any) => {
        const provider = new FacebookAuthProvider();

        signInWithPopup(auth, provider)
            .then((result) => {
                enqueueSnackbar("User login successfully", { 
                    anchorOrigin: {
                        vertical: 'top',
                        horizontal: 'center',
                    },
                    variant: 'success',
                });
                navigate('/Menu');

            }).catch((error) => {
                enqueueSnackbar("User login failed", { 
                    anchorOrigin: {
                        vertical: 'top',
                        horizontal: 'center',
                    },
                    variant: 'error'
                });
            });
    };
    const handleToggleAuth = (isLoginMode) => {
        setIsLogin(isLoginMode);
    };

    const handleSubmit = (e:any) => {
        e.preventDefault();
        if (isLogin) {
            handleLogin(e);
        } else {
            handleSignup(e);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow">
                <div className="flex justify-between">
                    <Button className={isLogin ? "" : "border-b-2 border-blue-500"} variant={isLogin ? "ghost" : "primary"} onClick={() => handleToggleAuth(false)}>Sign Up</Button>
                    <Button className={isLogin ? "border-b-2 border-blue-500" : ""} variant={isLogin ? "primary" : "ghost"} onClick={() => handleToggleAuth(true)}>
                        Log In
                    </Button>
                </div>
                <div className="space-y-4">
                    <h2 className="text-lg font-medium">{isLogin?"Sign in with":"Sign up with"}</h2>
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {!isLogin && (
                            <div>
                                <Label className="block mb-2 text-sm font-medium" htmlFor="username">
                                    Username *
                                </Label>
                                <Input className="w-full" id="username" placeholder="Username" required type="text" onChange={(e)=>{
                                    setUsername(e.target.value)
                                }}/>
                            </div>
                        )}
                        { isLogin && (
                                <div className="flex gap-1">
                                <Button className="flex-1" variant="outline" onClick={handleGoogleLogin}>
                                    <ChromeIcon className="h-5 w-5 mr-2" />
                                    Sign in with Google
                                </Button>
                                <Button className="flex-1" variant="outline" onClick={handleFacebookLogin}>
                                    <FacebookIcon className="h-5 w-5 mr-2" />
                                    Sign in with Facebook
                                </Button>
                            </div>
                            )
                        }
                        <div>
                            <Label className="block mb-2 text-sm font-medium" htmlFor="email">
                                Email Address *
                            </Label>
                            <Input className="w-full" id="email" placeholder="Email Address" required type="email" onChange={(e)=>{
                                setEmail(e.target.value)
                            }}/>
                        </div>
                        <div>
                            <Label className="block mb-2 text-sm font-medium" htmlFor="password">
                                Password *
                            </Label>
                            <Input className="w-full" id="password" placeholder="Password" required type="password" onChange={(e)=>{
                                setPassword(e.target.value)
                            }}/>
                        </div>
                        <Button className="w-full">{isLogin ? "Log In" : "Sign Up"}</Button>
                    </form>
                </div>
            </div>
        </div>
    );
}




function ChromeIcon(props:any) {
    return (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="4" />
        <line x1="21.17" x2="12" y1="8" y2="8" />
        <line x1="3.95" x2="8.54" y1="6.06" y2="14" />
        <line x1="10.88" x2="15.46" y1="21.94" y2="14" />
    </svg>
    )
}


function FacebookIcon(props:any) {
    return (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
    )
}