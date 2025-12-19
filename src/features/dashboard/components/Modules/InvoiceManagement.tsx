import { AlertCircle, Calendar, CheckCircle, Clock, DollarSign, ExternalLink, RefreshCw, Search, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { Button } from '../../../../shared/components/ui/Button';
import { LoadingSpinner } from '../../../../shared/components/ui/LoadingSpinner';

interface Invoice {
    invoice_id: string;
    invoice_number: string;
    invoice_status: string;
    total_amount: number;
    due_date: string;
    created_at: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    booking_ref: string;
    booking_id: string;
    access_status: string;
    booking_status: string;
    payment_link_url: string | null;
    payment_link_status: string | null;
    payment_link_expires: string | null;
    days_overdue: number;
    status_severity: 'success' | 'warning' | 'danger' | 'neutral';
    payment_event_count: number;
}

export function InvoiceManagement() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('admin_invoices_dashboard_v')
                .select('*')
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            setInvoices(data || []);
        } catch (err) {
            console.error('Error fetching invoices:', err);
            setError(err instanceof Error ? err.message : 'Failed to load invoices');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const handleCreatePaymentLink = async (invoiceId: string) => {
        try {
            setActionLoading(invoiceId);

            const { data: functionData, error: functionError } = await supabase.functions.invoke(
                'create-payment-link',
                {
                    body: { invoice_id: invoiceId }
                }
            );

            if (functionError) throw functionError;

            alert('Payment link created successfully');
            await fetchInvoices();
        } catch (err) {
            console.error('Error creating payment link:', err);
            alert(`Failed to create payment link: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setActionLoading(null);
        }
    };

    const filteredInvoices = invoices.filter(inv => {
        // Filter by status
        if (filter === 'pending' && inv.invoice_status !== 'pending') return false;
        if (filter === 'paid' && inv.invoice_status !== 'paid') return false;
        if (filter === 'overdue' && (inv.invoice_status !== 'pending' || inv.days_overdue <= 0)) return false;

        // Search filter
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            return (
                inv.invoice_number.toLowerCase().includes(search) ||
                inv.booking_ref.toLowerCase().includes(search) ||
                inv.customer_name.toLowerCase().includes(search) ||
                inv.customer_email.toLowerCase().includes(search)
            );
        }

        return true;
    });

    const getStatusBadge = (status: string, severity: string) => {
        const colors = {
            success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
            warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
            danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
            neutral: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
        };

        const icons = {
            paid: <CheckCircle className="w-4 h-4" />,
            pending: <Clock className="w-4 h-4" />,
            overdue: <AlertCircle className="w-4 h-4" />,
            cancelled: <XCircle className="w-4 h-4" />
        };

        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors[severity as keyof typeof colors]}`}>
                {icons[status as keyof typeof icons]}
                {status.toUpperCase()}
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invoice Management</h1>
                    <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                        Monitor and manage all customer invoices
                    </p>
                </div>
                <Button onClick={fetchInvoices} variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Status Filter */}
                    <div className="flex gap-2">
                        {(['all', 'pending', 'paid', 'overdue'] as const).map(status => (
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
                            placeholder="Search by invoice #, booking ref, customer..."
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
                            <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-600 dark:text-slate-400">Total Invoices</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">{invoices.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                            <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-600 dark:text-slate-400">Pending</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                {invoices.filter(i => i.invoice_status === 'pending').length}
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
                                {invoices.filter(i => i.invoice_status === 'paid').length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-600 dark:text-slate-400">Overdue</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                {invoices.filter(i => i.invoice_status === 'pending' && i.days_overdue > 0).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Invoices Table */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <LoadingSpinner />
                </div>
            ) : error ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4 text-sm text-red-800 dark:text-red-300">
                    {error}
                </div>
            ) : filteredInvoices.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-12 text-center">
                    <Calendar className="w-12 h-12 text-gray-400 dark:text-slate-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No invoices found</h3>
                    <p className="text-gray-600 dark:text-slate-400">
                        {searchTerm ? 'Try a different search term' : 'No invoices match the selected filter'}
                    </p>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase">Invoice</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase">Customer</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase">Amount</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase">Due Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase">Access</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase">Payment Link</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 dark:text-slate-400 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                {filteredInvoices.map(inv => (
                                    <tr key={inv.invoice_id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                        <td className="px-4 py-3">
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-white">{inv.invoice_number}</div>
                                                <div className="text-xs text-gray-500 dark:text-slate-400">{inv.booking_ref}</div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-white">{inv.customer_name}</div>
                                                <div className="text-xs text-gray-500 dark:text-slate-400">{inv.customer_email}</div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-gray-900 dark:text-white">
                                                ₹{inv.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div>
                                                <div className="text-sm text-gray-900 dark:text-white">
                                                    {new Date(inv.due_date).toLocaleDateString('en-IN')}
                                                </div>
                                                {inv.days_overdue > 0 && (
                                                    <div className="text-xs text-red-600 dark:text-red-400">
                                                        {inv.days_overdue} days overdue
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {getStatusBadge(inv.invoice_status, inv.status_severity)}
                                        </td>
                                        <td className="px-4 py-3">
                                            {getAccessBadge(inv.access_status)}
                                        </td>
                                        <td className="px-4 py-3">
                                            {inv.payment_link_url ? (
                                                <a
                                                    href={inv.payment_link_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                                >
                                                    View Link
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                            ) : (
                                                <span className="text-xs text-gray-400 dark:text-slate-500">No link</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {!inv.payment_link_url && inv.invoice_status === 'pending' && (
                                                <Button
                                                    onClick={() => handleCreatePaymentLink(inv.invoice_id)}
                                                    disabled={actionLoading === inv.invoice_id}
                                                    size="sm"
                                                    variant="outline"
                                                >
                                                    {actionLoading === inv.invoice_id ? 'Creating...' : 'Create Link'}
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
