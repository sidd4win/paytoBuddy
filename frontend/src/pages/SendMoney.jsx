import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import axios from "axios"

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://paybuddy-1.onrender.com/api/v1";

export function SendMoney() {
    const [searchParams] = useSearchParams()
    const id = searchParams.get("id")
    const name = searchParams.get("name")
    const [amount, setAmount] = useState(0)
    const [showToast, setShowToast] = useState(false)

    const playSuccessSound = () => {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        // PhonePe style success chime (approximate)
        osc.type = 'sine';
        osc.frequency.value = 523;

        const now = audioCtx.currentTime;

        // First note (F5)
        osc.frequency.setValueAtTime(698.46, now);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        // Second note (A5)
        osc.frequency.setValueAtTime(880.00, now + 0.15);
        gainNode.gain.setValueAtTime(0, now + 0.15);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.2);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        // Third note (C6)
        osc.frequency.setValueAtTime(1046.50, now + 0.3);
        gainNode.gain.setValueAtTime(0, now + 0.3);
        gainNode.gain.linearRampToValueAtTime(0.4, now + 0.35);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

        osc.start(now);
        osc.stop(now + 1);

        // Add voice announcement for that soundbox feel
        setTimeout(() => {
            const utterance = new SpeechSynthesisUtterance(`Rupees ${amount} sent successfully to ${name}.`);
            utterance.rate = 1.0;
            utterance.pitch = 1.1;
            window.speechSynthesis.speak(utterance);
        }, 500);
    };

    return <div className="flex justify-center h-screen bg-gray-50 font-sans">
        <div className="h-full flex flex-col justify-center">
            <div className="border border-gray-200 max-w-md p-8 space-y-6 w-96 bg-white shadow-sm rounded-2xl">
                <div className="flex flex-col space-y-1.5">
                    <h2 className="text-3xl font-bold text-center tracking-tight text-rzp-navy">Send Money</h2>
                </div>
                <div>
                    <div className="flex items-center space-x-4 mb-6">
                        <div className="w-14 h-14 rounded-full bg-rzp-blue/10 flex items-center justify-center">
                            <span className="text-2xl text-rzp-blue font-bold">{name?.[0]?.toUpperCase()}</span>
                        </div>
                        <h3 className="text-2xl font-semibold text-rzp-navy">{name}</h3>
                    </div>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-rzp-navy">Amount (in ₹)</label>
                            <input
                                onChange={e => setAmount(e.target.value)}
                                type="number"
                                className="w-full px-4 py-3 border rounded-xl border-gray-200 text-rzp-navy bg-white focus:outline-none focus:ring-2 focus:ring-rzp-blue focus:border-transparent transition-all shadow-sm"
                                placeholder="Enter amount"
                            />
                        </div>
                        <button
                            onClick={async () => {
                                try {
                                    await axios.post(`${BACKEND_URL}/account/transfer`, {
                                        to: id,
                                        amount
                                    }, {
                                        headers: {
                                            Authorization: "Bearer " + localStorage.getItem("token")
                                        }
                                    })

                                    playSuccessSound()
                                    setShowToast(true)
                                    setTimeout(() => setShowToast(false), 4000)
                                } catch (e) {
                                    console.error("Transfer failed", e)
                                    alert(e.response?.data?.message || "Transfer failed. Please check your balance or try again.");
                                }
                            }}
                            className="w-full text-white bg-rzp-blue hover:bg-rzp-blue-hover focus:ring-4 focus:ring-blue-100 font-semibold rounded-xl text-sm px-5 py-3 transition-all duration-200 shadow-sm"
                        >
                            Initiate Transfer
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* Toast Notification */}
        <div
            className={`fixed bottom-6 left-6 flex items-center space-x-3 bg-white border border-green-100 rounded-xl p-4 shadow-2xl transform transition-all duration-500 ease-out z-50 ${showToast ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0 pointer-events-none"
                }`}
        >
            <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-inner">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                </svg>
            </div>
            <div>
                <h4 className="text-base font-bold text-gray-900">Payment Successful</h4>
                <p className="text-sm text-gray-600 font-medium">₹{amount} sent to {name}</p>
            </div>
        </div>
    </div>
}