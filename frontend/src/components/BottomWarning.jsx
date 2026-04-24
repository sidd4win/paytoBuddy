import { Link } from "react-router-dom"

export function BottomWarning({ label, buttonText, to }) {
    return <div className="py-4 text-sm flex justify-center text-rzp-navy/70">
        <div>{label}</div>
        <Link
            className="pointer underline pl-1 cursor-pointer font-semibold text-rzp-blue hover:text-rzp-blue-hover transition-colors"
            to={to}
        >
            {buttonText}
        </Link>
    </div>
}