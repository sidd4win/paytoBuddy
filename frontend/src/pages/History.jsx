import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://paybuddy-1.onrender.com/api/v1";

export function History() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        axios.get(`${BACKEND_URL}/account/history`, {
            headers: {
                Authorization: "Bearer " + localStorage.getItem("token")
            }
        })
        .then(res => {
            setTransactions(res.data.transactions);
            setLoading(false);
        })
        .catch(err => {
            console.error("Failed to fetch history", err);
            setLoading(false);
        });
    }, []);

    const formatDate = (dateString) => {
        const options = { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('en-IN', options);
    };

    return (
        <div className="bg-gray-50 min-h-screen font-sans text-rzp-navy">
            {/* Header */}
            <div className="border-b border-gray-200 h-16 flex items-center px-8 bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <button 
                    onClick={() => navigate("/dashboard")}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-4"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m15 18-6-6 6-6"/>
                    </svg>
                </button>
                <h1 className="text-xl font-bold tracking-tight">Transaction History</h1>
            </div>

            <div className="max-w-2xl mx-auto pt-8 px-4 pb-12">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rzp-blue"></div>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="18" height="18" x="3" y="3" rx="2"/>
                                <path d="M3 9h18"/><path d="M9 21V9"/>
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-400 mb-2">No Transactions Yet</h2>
                        <p className="text-gray-400">Your recent activities will appear here.</p>
                        <button 
                            onClick={() => navigate("/dashboard")}
                            className="mt-8 px-6 py-3 bg-rzp-blue text-white rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-200"
                        >
                            Send Money Now
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {transactions.map((t) => (
                            <div key={t.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex justify-between items-center group">
                                <div className="flex items-center space-x-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                        t.type === 'sent' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'
                                    }`}>
                                        {t.type === 'sent' ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M7 7h10v10"/><path d="M7 17 17 7"/>
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M7 17h10V7"/><path d="m7 7 10 10"/>
                                            </svg>
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900">
                                            {t.type === 'sent' ? `To: ${t.receiver}` : `From: ${t.sender}`}
                                        </div>
                                        <div className="text-sm text-gray-500">{formatDate(t.date)}</div>
                                    </div>
                                </div>
                                <div className={`text-lg font-bold ${
                                    t.type === 'sent' ? 'text-gray-900' : 'text-emerald-600'
                                }`}>
                                    {t.type === 'sent' ? '-' : '+'}₹{t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
