import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../../shared/lib/supabase';
export const AuthContext = createContext(undefined);
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userRoles, setUserRoles] = useState([]);
    const [isMantraCurator, setIsMantraCurator] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const fetchUserRoles = async (session) => {
        if (!session?.user) {
            setUserRoles([]);
            setIsMantraCurator(false);
            setIsAdmin(false);
            return;
        }
        try {
            const { data, error } = await supabase
                .from('user_roles')
                .select('roles(name)')
                .eq('user_id', session.user.id);
            if (error)
                throw error;
            const roles = data?.map(item => item.roles?.name).filter((name) => name != null) || [];
            setUserRoles(roles);
            setIsMantraCurator(roles.includes('mantra_curator'));
            setIsAdmin(roles.includes('admin') || roles.includes('super_admin'));
        }
        catch (error) {
            console.error('Error fetching user roles:', error);
            setUserRoles([]);
            setIsMantraCurator(false);
            setIsAdmin(false);
        }
    };
    useEffect(() => {
        let mounted = true;
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!mounted)
                return;
            setUser(session?.user ?? null);
            fetchUserRoles(session).finally(() => {
                if (mounted)
                    setLoading(false);
            });
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!mounted)
                return;
            setUser(session?.user ?? null);
            fetchUserRoles(session).finally(() => {
                if (mounted)
                    setLoading(false);
            });
        });
        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);
    const signIn = async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error)
            throw error;
    };
    const signUp = async (email, password) => {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error)
            throw error;
    };
    const signOut = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                // No active session — nothing to sign out from
                setUser(null);
                return;
            }
            const { error } = await supabase.auth.signOut();
            if (error)
                throw error;
        }
        catch (err) {
            // Ignore missing-session errors from the client library; surface others
            if (err?.name === 'AuthSessionMissingError') {
                setUser(null);
                return;
            }
            throw err;
        }
    };
    const value = {
        user,
        loading,
        userRoles,
        isMantraCurator,
        isAdmin,
        signIn,
        signUp,
        signOut,
    };
    return (_jsx(AuthContext.Provider, { value: value, children: children }));
}
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
