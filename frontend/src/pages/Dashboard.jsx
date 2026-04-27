import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { Button } from "../components/Button"

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://paybuddy-1.onrender.com/api/v1";

export function Dashboard() {
    const [balance, setBalance] = useState(0)
    const [users, setUsers] = useState([])
    const [filter, setFilter] = useState("")
    const [clientName, setClientName] = useState("")
    const [isAdmin, setIsAdmin] = useState(false)
    const navigate = useNavigate()

    const capitalize = (str) => {
        if (!str) return "";
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    const genZColors = [
        "bg-purple-100 text-purple-700",
        "bg-pink-100 text-pink-700",
        "bg-emerald-100 text-emerald-700",
        "bg-amber-100 text-amber-700",
        "bg-sky-100 text-sky-700",
        "bg-rose-100 text-rose-700",
        "bg-indigo-100 text-indigo-700",
        "bg-lime-100 text-lime-800",
    ];

    const getColorClass = (id) => {
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = id.charCodeAt(i) + ((hash << 5) - hash);
        }
        return genZColors[Math.abs(hash) % genZColors.length];
    };

    useEffect(() => {
        axios.get(`${BACKEND_URL}/account/balance`, {
            headers: {
                Authorization: "Bearer " + localStorage.getItem("token")
            }
        }).then(res => setBalance(res.data.balance))
        
        axios.get(`${BACKEND_URL}/user/me`, {
            headers: {
                Authorization: "Bearer " + localStorage.getItem("token")
            }
        }).then(res => {
            setClientName(capitalize(res.data.firstName));
            setIsAdmin(res.data.isAdmin);
        })
    }, [])

    useEffect(() => {
        axios.get(`${BACKEND_URL}/user/bulk?filter=` + filter, {
            headers: {
                Authorization: "Bearer " + localStorage.getItem("token")
            }
        }).then(res => setUsers(res.data.user))
    }, [filter])

    return <div className="bg-gray-50 min-h-screen font-sans text-rzp-navy">
        <div className="border-b border-gray-200 h-16 flex justify-between px-8 bg-white/80 backdrop-blur-md sticky top-0 z-50">
            <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-rzp-navy rounded-sm flex items-center justify-center transform -skew-x-12">
                    <span className="text-white font-bold text-xl leading-none italic">P</span>
                </div>
                <div className="flex flex-col justify-center text-2xl font-bold tracking-tight text-rzp-navy italic">
                    PayBuddy
                </div>
            </div>
            <div className="flex items-center space-x-4">
                <button 
                    onClick={() => navigate("/history")}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-rzp-navy/70 hover:text-rzp-navy group"
                    title="Transaction History"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform">
                        <path d="M12 8v4l3 3" />
                        <circle cx="12" cy="12" r="9" />
                    </svg>
                    <span className="font-semibold hidden sm:inline">History</span>
                </button>
                {isAdmin && (
                    <button 
                        onClick={() => navigate("/admin")}
                        className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-rzp-navy text-white hover:bg-navy-900 transition-all shadow-md shadow-navy-100 group"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
                        <span className="font-semibold hidden sm:inline">Admin Panel</span>
                    </button>
                )}
                <div className="text-rzp-navy/70 font-semibold">Welcome, {clientName || "User"}</div>
                <div className="rounded-full h-10 w-10 bg-rzp-blue/10 flex items-center justify-center text-rzp-blue font-bold shadow-sm border border-blue-100">
                    {clientName ? clientName[0].toUpperCase() : "U"}
                </div>
            </div>
        </div>

        <div className="max-w-4xl mx-auto pt-8 px-8">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex items-center justify-between">
                <div className="text-rzp-navy/70 font-semibold">Your Balance</div>
                <div className={`font-bold text-3xl tracking-tight ${balance < 100 ? 'text-red-500' : 'text-emerald-600'}`}>
                    ₹{balance.toFixed(2)}
                </div>
            </div>

            <div className="mt-10">
                <div className="font-bold text-xl mb-4 tracking-tight text-rzp-navy">Users</div>
                <div className="relative">
                    <input
                        onChange={e => setFilter(e.target.value)}
                        type="text"
                        placeholder="Search users..."
                        className="w-full px-4 py-3 border rounded-xl border-gray-200 text-rzp-navy bg-white focus:outline-none focus:ring-2 focus:ring-rzp-blue focus:border-transparent transition-all shadow-sm"
                    />
                </div>
                
                <div className="mt-6 space-y-4">
                    {users?.map(user => {
                        const avatarColors = getColorClass(user._id);
                        return (
                            <div key={user._id} className="flex justify-between items-center p-4 hover:bg-white rounded-2xl transition-colors border border-transparent hover:border-gray-200 hover:shadow-sm">
                                <div className="flex items-center space-x-4">
                                    <div className={`rounded-full h-12 w-12 flex items-center justify-center ${avatarColors}`}>
                                        <div className="text-xl font-bold">
                                            {capitalize(user.firstName)[0]}
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-lg text-rzp-navy">{capitalize(user.firstName)} {capitalize(user.lastName)}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col justify-center min-w-[120px]">
                                    <Button onClick={() => {
                                        navigate("/send?id=" + user._id + "&name=" + capitalize(user.firstName))
                                    }} label={"Send Money"} />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    </div>
}