import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { isApprovedDeveloper } from '../../utils/authGuard';
export default function ApprovedRoute({ children }) {
    const [allowed, setAllowed] = useState(null);
    useEffect(() => {
        let mounted = true;
        (async () => {
            const ok = await isApprovedDeveloper();
            if (mounted)
                setAllowed(ok);
        })();
        return () => { mounted = false; };
    }, []);
    if (allowed === null)
        return _jsx("div", { className: "p-4", children: "Checking access\u2026" });
    if (!allowed)
        return _jsx(Navigate, { to: "/request-access", replace: true });
    return _jsx(_Fragment, { children: children });
}
