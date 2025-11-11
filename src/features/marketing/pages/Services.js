import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate } from 'react-router-dom';
// Services page retired — redirect to YogaForYou
export default function Services() {
    return _jsx(Navigate, { to: "/yogique-for-you", replace: true });
}
