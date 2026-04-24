export function InputBox({ label, placeholder, onChange }) {
    return <div>
        <div className="text-sm font-semibold text-left py-2 text-rzp-navy">
            {label}
        </div>
        <input
            onChange={onChange}
            placeholder={placeholder}
            className="w-full px-4 py-2 border rounded-xl border-gray-200 text-rzp-navy bg-white focus:outline-none focus:ring-2 focus:ring-rzp-blue focus:border-transparent transition-all duration-200 shadow-sm"
        />
    </div>
}