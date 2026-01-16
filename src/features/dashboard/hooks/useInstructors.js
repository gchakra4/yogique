import { useEffect, useState } from 'react';
import { supabase, SUPABASE_URL } from '../../../shared/lib/supabase';
export const useInstructors = () => {
    const [instructors, setInstructors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchInstructors = async () => {
            try {
                setLoading(true);
                // First try the secure Edge Function used by UserManagement to get users with role names
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session && SUPABASE_URL) {
                        const apiUrl = `${SUPABASE_URL}/functions/v1/public-instructors`;
                        const resp = await fetch(apiUrl, {
                            method: 'GET',
                            headers: {
                                'Authorization': `Bearer ${session.access_token}`,
                                'Content-Type': 'application/json',
                            },
                        });
                        if (resp.ok) {
                            const json = await resp.json();
                            const users = json.users || [];
                            // public-instructors returns only users with desired roles — map directly
                            const instructorsList = users.map((u) => ({ id: u.user_id || u.id, email: u.email, name: u.full_name || u.email }));
                            if (instructorsList.length > 0) {
                                setInstructors(instructorsList);
                                return;
                            }
                        }
                    }
                } catch (edgeErr) {
                    // Edge function may be unavailable in some environments; fall back to DB queries
                    console.debug('admin-users edge function unavailable, falling back to DB lookup', edgeErr);
                }

                // Fallback: Resolve role IDs for role names then fetch user_ids from user_roles by role_id
                const desiredRoleNames = ['instructor', 'yoga_acharya'];
                const { data: rolesData, error: rolesError } = await supabase
                    .from('roles')
                    .select('id, name')
                    .in('name', desiredRoleNames);
                if (rolesError)
                    throw rolesError;
                const roleIds = (rolesData || []).map(r => r.id);
                if (roleIds.length === 0) {
                    setInstructors([]);
                    return;
                }

                const { data: roleData, error: roleError } = await supabase
                    .from('user_roles')
                    .select('user_id')
                    .in('role_id', roleIds);
                if (roleError)
                    throw roleError;
                const instructorIds = roleData?.map(r => r.user_id) || [];
                if (instructorIds.length === 0) {
                    setInstructors([]);
                    return;
                }
                // 2. Fetch user profiles based on the collected IDs (try auth.users then profiles)
                let formattedInstructors = [];
                try {
                    const { data: usersData, error: usersError } = await supabase
                        .from('auth.users')
                        .select('id, email, raw_user_meta_data')
                        .in('id', instructorIds);
                    if (usersError) throw usersError;
                    if (usersData && usersData.length > 0) {
                        formattedInstructors = usersData.map((user) => ({
                            id: user.id,
                            email: user.email,
                            name: (user.raw_user_meta_data && (user.raw_user_meta_data.name || user.raw_user_meta_data.full_name)) || 'Unnamed Instructor',
                        }));
                    }
                } catch (e) {
                    console.debug('auth.users lookup failed, will try profiles fallback', e);
                }

                if (formattedInstructors.length === 0) {
                    try {
                        const { data: profilesData, error: profilesErr } = await supabase
                            .from('profiles')
                            .select('id, user_id, full_name, email')
                            .in('user_id', instructorIds);
                        if (!profilesErr && profilesData && profilesData.length > 0) {
                            formattedInstructors = profilesData.map((p) => ({ id: p.user_id || p.id, email: p.email, name: p.full_name || p.email || 'Unnamed Instructor' }));
                        }
                    } catch (pfErr) {
                        console.debug('profiles lookup failed', pfErr);
                    }
                }

                if (formattedInstructors.length > 0) setInstructors(formattedInstructors);
                else setInstructors([]);
            }
            catch (err) {
                setError(err);
            }
            finally {
                setLoading(false);
            }
        };
        fetchInstructors();
    }, []);
    return { instructors, loading, error };
};
