export function Button({ label, onClick }) {
    return <button
        onClick={onClick}
        className="w-full text-white bg-rzp-blue hover:bg-rzp-blue-hover focus:ring-4 focus:ring-blue-100 font-semibold rounded-xl text-sm px-5 py-3 mt-2 transition-all duration-200 shadow-sm"
    >
        {label}
    </button>
}