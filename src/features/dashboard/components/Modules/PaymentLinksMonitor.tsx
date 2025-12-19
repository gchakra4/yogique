import { Activity, AlertCircle, CheckCircle, Clock, ExternalLink, Link2, RefreshCw, Search, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../../../shared/lib/supabase';
import { Button } from '../../../../shared/components/ui/Button';
import { LoadingSpinner } from '../../../../shared/components/ui/LoadingSpinner';

interface PaymentLink {
    payment_link_id: string;
    razorpay_link_id: string;
    short_url: string;
    link_status: string;
    created_at: string;
    expires_at: string;
    invoice_id: string;
    invoice_number: string;
    invoice_status: string;
    total_amount: number;
    due_date: string;
    booking_ref: string;
    customer_name: string;
    customer_email: string;
    access_status: string;
    event_count: number;
    last_event_time: string | null;
    link_state: 'success' | 'active' | 'expired' | 'cancelled' | 'unknown';
}

export function PaymentLinksMonitor() {
    const [links, setLinks] = useState<PaymentLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'active' | 'paid' | 'expired'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchLinks = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('admin_payment_links_monitor_v')
                .select('*')
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            setLinks(data || []);
        } catch (err) {
            console.error('Error fetching payment links:', err);
            setError(err instanceof Error ? err.message : 'Failed to load payment links');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLinks();

        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchLinks, 30000);
        return () => clearInterval(interval);
    }, []);

    const filteredLinks = links.filter(link => {
        // Filter by state
        if (filter === 'active' && link.link_state !== 'active') return false;
        if (filter === 'paid' && link.link_status !== 'paid') return false;
        if (filter === 'expired' && link.link_status !== 'expired') return false;

        // Search filter
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            return (
                link.invoice_number.toLowerCase().includes(search) ||
                link.booking_ref.toLowerCase().includes(search) ||
                link.customer_name.toLowerCase().includes(search) ||
                link.razorpay_link_id.toLowerCase().includes(search)
            );
        }

        return true;
    });

    const getLinkStateBadge = (state: string, status: string) => {
        const config = {
            success: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', icon: <CheckCircle className="w-4 h-4" />, label: 'Paid' },
            active: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', icon: <Clock className="w-4 h-4" />, label: 'Active' },
            expired: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', icon: <XCircle className="w-4 h-4" />, label: 'Expired' },
            cancelled: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', icon: <AlertCircle className="w-4 h-4" />, label: 'Cancelled' }
        };

        const cfg = state === 'success' ? config.success :
            status === 'expired' ? config.expired :
                status === 'cancelled' ? config.cancelled :
                    state === 'active' ? config.active : config.expired;

        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                {cfg.icon}
                {cfg.label}
            </span>
        );
    };

    const getAccessBadge = (status: string) => {
        const config = {
            active: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', label: 'Active' },
            overdue_grace: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', label: 'Grace' },
            overdue_locked: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', label: 'Locked' }
        };

        const cfg = config[status as keyof typeof config] || config.active;
        return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cfg.color}`}>
                {cfg.label}
            </span>
        );
    };

    const formatDateTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return {
            date: date.toLocaleDateString('en-IN'),
            time: date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        };
    };

    const isExpiringSoon = (expiresAt: string) => {
        const hoursUntilExpiry = (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60);
        return hoursUntilExpiry > 0 && hoursUntilExpiry < 24;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Links Monitor</h1>
                    <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                        Real-time monitoring of Razorpay payment links
                    </p>
                </div>
                <Button onClick={fetchLinks} variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Status Filter */}
                    <div className="flex gap-2">
                        {(['all', 'active', 'paid', 'expired'] as const).map(status => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === status
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                                    }`}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by invoice #, booking ref, customer, link ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Link2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-600 dark:text-slate-400">Total Links</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">{links.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-600 dark:text-slate-400">Active</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                {links.filter(l => l.link_state === 'active').length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-600 dark:text-slate-400">Paid</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                {links.filter(l => l.link_status === 'paid').length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <XCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-600 dark:text-slate-400">Expired</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                {links.filter(l => l.link_status === 'expired').length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Links Table */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <LoadingSpinner />
                </div>
            ) : error ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4 text-sm text-red-800 dark:text-red-300">
                    {error}
                </div>
            ) : filteredLinks.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-12 text-center">
                    <Link2 className="w-12 h-12 text-gray-400 dark:text-slate-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No payment links found</h3>
                    <p className="text-gray-600 dark:text-slate-400">
                        {searchTerm ? 'Try a different search term' : 'No payment links match the selected filter'}
                    </p>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase">Link Info</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase">Invoice</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase">Customer</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase">Amount</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase">Access</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase">Expires</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase">Events</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 dark:text-slate-400 uppercase">Link</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                {filteredLinks.map(link => {
                                    const expires = formatDateTime(link.expires_at);
                                    const expiringSoon = isExpiringSoon(link.expires_at);

                                    return (
                                        <tr key={link.payment_link_id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                            <td className="px-4 py-3">
                                                <div>
                                                    <div className="text-xs font-mono text-gray-600 dark:text-slate-400">
                                                        {link.razorpay_link_id.slice(0, 16)}...
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-slate-500">
                                                        {formatDateTime(link.created_at).date}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-white">{link.invoice_number}</div>
                                                    <div className="text-xs text-gray-500 dark:text-slate-400">{link.booking_ref}</div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-white">{link.customer_name}</div>
                                                    <div className="text-xs text-gray-500 dark:text-slate-400">{link.customer_email}</div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-gray-900 dark:text-white">
                                                    ₹{link.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {getLinkStateBadge(link.link_state, link.link_status)}
                                            </td>
                                            <td className="px-4 py-3">
                                                {getAccessBadge(link.access_status)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <div className={`text-sm ${expiringSoon ? 'text-yellow-600 dark:text-yellow-400 font-medium' : 'text-gray-900 dark:text-white'}`}>
                                                        {expires.date}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-slate-400">{expires.time}</div>
                                                    {expiringSoon && (
                                                        <div className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1 mt-0.5">
                                                            <AlertCircle className="w-3 h-3" />
                                                            Expiring soon
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    <Activity className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm text-gray-900 dark:text-white">{link.event_count}</span>
                                                </div>
                                                {link.last_event_time && (
                                                    <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                                                        Last: {formatDateTime(link.last_event_time).time}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <a
                                                    href={link.short_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                                >
                                                    Open
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PaymentLinksMonitor;
