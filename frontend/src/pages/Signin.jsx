import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import axios from "axios"
import { InputBox } from "../components/InputBox"
import { GoogleLogin } from '@react-oauth/google'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://paybuddy-1.onrender.com/api/v1";

export function Signin() {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const navigate = useNavigate()

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 font-sans bg-white">
            {/* Left Column - Animation & Marketing */}
            <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-blue-50 via-teal-50 to-cyan-100 animate-gradient-xy relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-40">
                    <div className="absolute -top-[70%] -left-[10%] w-[80%] h-[80%] rounded-full bg-blue-200 blur-3xl mix-blend-multiply"></div>
                    <div className="absolute top-[80%] -right-[10%] w-[80%] h-[80%] rounded-full bg-teal-200 blur-3xl mix-blend-multiply"></div>
                    <div className="absolute -bottom-[70%] left-[20%] w-[80%] h-[80%] rounded-full bg-cyan-200 blur-3xl mix-blend-multiply"></div>
                </div>

                <div className="z-10 relative">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-rzp-navy rounded-sm flex items-center justify-center transform -skew-x-12">
                            <span className="text-white font-bold text-xl leading-none italic">P</span>
                        </div>
                        <span className="text-2xl font-bold text-rzp-navy tracking-tight italic">PayBuddy</span>
                    </div>
                </div>

                <div className="z-10 relative mb-20">
                    <h1 className="text-[2.75rem] font-bold text-teal-900 leading-tight mb-8">
                        Your each step is secure
                    </h1>
                    <div className="flex items-center space-x-8 text-teal-800 font-semibold text-sm">
                        <div className="flex items-center space-x-2">
                            <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                            <span>Pay Any Corner Of India</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                            <span>Easy To Use</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                            <span>Secure For Your Data</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column - Auth */}
            <div className="flex flex-col justify-center items-center p-8 bg-white z-10">
                <div className="w-full max-w-md">
                    <div className="mb-8">
                        <div className="w-12 h-12 bg-rzp-blue rounded-xl flex items-center justify-center mb-6 shadow-sm transform -skew-x-12">
                            <span className="text-white font-bold text-3xl leading-none italic">P</span>
                        </div>
                        <p className="text-gray-600 font-medium mb-2 text-md">Welcome to PayBuddy</p>
                        <h2 className="text-[2rem] leading-tight font-bold text-rzp-navy tracking-tight">Get started with your email</h2>
                    </div>

                    <div className="space-y-4">
                        <InputBox onChange={e => setUsername(e.target.value)} placeholder="Enter your email or phone number" label={""} />
                        <InputBox onChange={e => setPassword(e.target.value)} placeholder="Enter your password" label={""} />
                        
                        <button
                            onClick={async () => {
                                try {
                                    const response = await axios.post(`${BACKEND_URL}/user/signin`, {
                                        username,
                                        password
                                    })
                                    localStorage.setItem("token", response.data.token)
                                    navigate("/dashboard")
                                } catch (e) {
                                    console.error("Sign in failed")
                                    alert(e.response?.data?.message || "Sign in failed. Please ensure you enter a valid email address.");
                                }
                            }}
                            className="w-full text-white bg-rzp-blue hover:bg-rzp-blue-hover focus:ring-4 focus:ring-blue-100 font-semibold rounded-lg text-sm px-5 py-3.5 transition-all duration-200 shadow-sm mt-2"
                        >
                            Continue
                        </button>
                    </div>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="px-4 bg-white text-gray-400 font-medium">or</span>
                        </div>
                    </div>

                    <div className="flex justify-center mb-8 w-full">
                        <div className="w-full border border-gray-200 rounded-lg overflow-hidden flex justify-center py-1">
                            <GoogleLogin
                                onSuccess={async (credentialResponse) => {
                                    try {
                                        const response = await axios.post(`${BACKEND_URL}/user/google-signin`, {
                                            credential: credentialResponse.credential
                                        });
                                        localStorage.setItem("token", response.data.token);
                                        navigate("/dashboard");
                                    } catch (e) {
                                        console.error("Google sign in failed", e);
                                        alert(e.response?.data?.message || "Google sign in failed. Please ensure you are a test user in Google Console.");
                                    }
                                }}
                                onError={() => {
                                    console.log('Login Failed');
                                }}
                                theme="outline"
                                size="large"
                                text="continue_with"
                            />
                        </div>
                    </div>

                    <div className="bg-[#f9f9f9] rounded-xl p-6 border border-gray-100">
                        <p className="text-sm font-medium text-gray-700 mb-3">Don't have an account?</p>
                        <Link to="/signup" className="text-rzp-blue font-semibold text-sm hover:text-rzp-blue-hover hover:underline flex items-center">
                            Sign up for PayBuddy <span className="ml-1 text-lg leading-none">→</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}