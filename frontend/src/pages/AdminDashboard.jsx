import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://paybuddy-1.onrender.com/api/v1";

export function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("stats");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const config = {
                    headers: { Authorization: "Bearer " + localStorage.getItem("token") }
                };
                const [statsRes, transRes, usersRes] = await Promise.all([
                    axios.get(`${BACKEND_URL}/admin/stats`, config),
                    axios.get(`${BACKEND_URL}/admin/transactions`, config),
                    axios.get(`${BACKEND_URL}/admin/users`, config)
                ]);

                setStats(statsRes.data);
                setTransactions(transRes.data.transactions);
                setUsers(usersRes.data.users);
                setLoading(false);
            } catch (err) {
                console.error("Admin data fetch failed", err);
                navigate("/dashboard"); // Redirect if not admin
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rzp-navy"></div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen font-sans text-rzp-navy">
            {/* Sidebar/Nav */}
            <div className="border-b border-gray-200 h-16 flex items-center justify-between px-8 bg-white sticky top-0 z-50">
                <div className="flex items-center space-x-4">
                    <button onClick={() => navigate("/dashboard")} className="p-2 hover:bg-gray-100 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    </button>
                    <h1 className="text-xl font-bold tracking-tight">Admin Control Panel</h1>
                </div>
                <div className="flex space-x-2">
                    <TabButton active={activeTab === "stats"} onClick={() => setActiveTab("stats")} label="Overview" />
                    <TabButton active={activeTab === "users"} onClick={() => setActiveTab("users")} label="Users" />
                    <TabButton active={activeTab === "transactions"} onClick={() => setActiveTab("transactions")} label="Global History" />
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-8">
                {activeTab === "stats" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard title="Total Users" value={stats.totalUsers} icon="👥" color="blue" />
                        <StatCard title="Total Transactions" value={stats.totalTransactions} icon="🔄" color="purple" />
                        <StatCard title="System Volume" value={`₹${stats.totalVolume.toLocaleString()}`} icon="💰" color="emerald" />
                        <StatCard title="System Liquidity" value={`₹${stats.totalSystemBalance.toLocaleString()}`} icon="🏦" color="amber" />
                    </div>
                )}

                {activeTab === "users" && (
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-sm">Name</th>
                                    <th className="px-6 py-4 font-semibold text-sm">Email</th>
                                    <th className="px-6 py-4 font-semibold text-sm">Role</th>
                                    <th className="px-6 py-4 font-semibold text-sm">Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users.map(u => (
                                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium">{u.firstName} {u.lastName}</td>
                                        <td className="px-6 py-4 text-gray-500">{u.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${u.isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {u.isAdmin ? 'ADMIN' : 'USER'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-emerald-600">₹{u.balance.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === "transactions" && (
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-sm">Sender</th>
                                    <th className="px-6 py-4 font-semibold text-sm">Receiver</th>
                                    <th className="px-6 py-4 font-semibold text-sm">Amount</th>
                                    <th className="px-6 py-4 font-semibold text-sm">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {transactions.map(t => (
                                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium">{t.sender}</div>
                                            <div className="text-xs text-gray-400">{t.senderEmail}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium">{t.receiver}</div>
                                            <div className="text-xs text-gray-400">{t.receiverEmail}</div>
                                        </td>
                                        <td className="px-6 py-4 font-bold">₹{t.amount.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(t.date).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, color }) {
    const colors = {
        blue: "bg-blue-50 text-blue-600",
        purple: "bg-purple-50 text-purple-600",
        emerald: "bg-emerald-50 text-emerald-600",
        amber: "bg-amber-50 text-amber-600"
    };
    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 ${colors[color]}`}>
                {icon}
            </div>
            <div className="text-sm font-semibold text-gray-400 mb-1">{title}</div>
            <div className="text-2xl font-bold tracking-tight">{value}</div>
        </div>
    );
}

function TabButton({ active, onClick, label }) {
    return (
        <button 
            onClick={onClick}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                active 
                ? "bg-rzp-navy text-white shadow-md shadow-navy-100" 
                : "text-gray-500 hover:bg-gray-100"
            }`}
        >
            {label}
        </button>
    );
}
