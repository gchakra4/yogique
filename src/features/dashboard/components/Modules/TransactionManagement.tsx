import {
  AlertCircle,
  Clock,
  DollarSign,
  Download,
  Edit3,
  Eye,
  Plus,
  Search,
  TrendingDown,
  TrendingUp,
  X
} from 'lucide-react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { useEffect, useState } from 'react';
import EmailService from '../../../../services/emailService';
import { supabase } from '../../../../shared/lib/supabase';
import { renderEmailTemplate } from '../../../../shared/utils/emailTemplates';
import logoImage from '/images/Brand.png';


type BillingPlanType = 'one_time' | 'monthly' | 'crash_course';

const humanPlanType = (p?: BillingPlanType) => {
  switch (p) {
    case 'monthly': return 'Monthly Subscription';
    case 'crash_course': return 'Crash Course';
    default: return 'One Time';
  }
};

const TransactionManagement = () => {
  const [currentUser] = useState({ role: 'super_admin' });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [newTx, setNewTx] = useState({
    userEmail: '',
    user_name: '',
    amount: 0,
    currency: 'INR',
    description: '',
    payment_method: 'manual',
    category: 'class_booking',
    billing_plan_type: 'one_time' as BillingPlanType, // one_time | monthly | crash_course
    billing_period_month: '', // YYYY-MM when monthly
    gst_rate: '0'
  });

  // combobox / user search state
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const searchUsers = async (q: string) => {
    if (!q || q.length < 2) {
      setUserSearchResults([]);
      return;
    }
    setUserSearchLoading(true);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-users?q=${encodeURIComponent(q)}&limit=10`;
      const res = await fetch(url, {
        headers: { apikey: (import.meta.env as any).VITE_SUPABASE_ANON_KEY || '' }
      });
      if (res.ok) {
        const data = await res.json();
        setUserSearchResults(Array.isArray(data) ? data : []);
      } else {
        setUserSearchResults([]);
      }
    } catch (e) {
      console.warn('search users failed', e);
      setUserSearchResults([]);
    } finally {
      setUserSearchLoading(false);
    }
  };
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [businessConfig, setBusinessConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [manualUserNames, setManualUserNames] = useState<Record<string, { user_name: string; userEmail?: string }>>({});

  useEffect(() => {
    const loadBusinessSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('business_settings')
          .select('key,value')
          .in('key', ['business_profile', 'business_contact', 'invoice_preferences', 'legal_disclaimer']); // added legal_disclaimer
        if (!error && data) {
          const map = data.reduce((acc, row) => {
            acc[row.key] = row.value;
            return acc;
          }, {} as any);
          setBusinessConfig({
            profile: map.business_profile || {},
            contact: map.business_contact || {},
            invoice: map.invoice_preferences || {},
            legal: map.legal_disclaimer || {} // new: legal fields (llpin, gst_number, cin_number)
          });
        }
      } catch (e) {
        console.warn('Failed to load business settings', e);
      }
    };
    loadBusinessSettings();
  }, []);

  const hasAccess = ['super_admin', 'super_user', 'energy_exchange_lead'].includes(currentUser.role);
  const canEdit = ['super_admin', 'super_user', 'energy_exchange_lead'].includes(currentUser.role);

  // Fetch transactions from DB (requires a view or RPC exposing user email/full name)
  const fetchTransactions = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data, error } = await supabase
        .from('transactions_with_user')
        .select('id,user_id,subscription_id,amount,currency,status,payment_method,description,created_at,updated_at,billing_plan_type,billing_period_month,user_email,user_full_name')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;

      // Use functional state update to access latest prev (avoids stale closure causing 'Unknown')
      setTransactions(prev => {
        const rows = (data || []).map((r: any) => {
          const existing = prev.find(t => t.id === r.id);
          const manual = manualUserNames[r.id];
          return {
            ...r,
            user_name: r.user_full_name
              || r.user_email
              || existing?.user_name
              || manual?.user_name
              || manual?.userEmail
              || existing?.userEmail
              || 'Unknown',
            type: r.amount >= 0 ? 'income' : 'expense',
            category: r.category || 'class_booking'
          };
        });
        return rows;
      });

      // Second-pass resolution: fetch profile names for rows still showing 'Unknown'
      const unresolvedIds = (data || [])
        .filter(r =>
          (!r.user_full_name && !r.user_email) &&
          r.user_id
        )
        .map(r => r.user_id);

      if (unresolvedIds.length) {
        try {
          const { data: profilesData, error: profilesErr } = await supabase
            .from('profiles')
            .select('id,full_name,email')
            .in('id', unresolvedIds);

          if (!profilesErr && profilesData?.length) {
            const profileMap = new Map<string, any>(profilesData.map(p => [p.id, p]));
            setTransactions(prev =>
              prev.map(t => {
                if ((t.user_name === 'Unknown' || !t.user_name) && t.user_id && profileMap.has(t.user_id)) {
                  const prof = profileMap.get(t.user_id);
                  return {
                    ...t,
                    user_name: prof.full_name || prof.email || t.user_name
                  };
                }
                return t;
              })
            );
          }
        } catch {/* ignore profile resolution errors */ }
      }
    } catch (e: any) {
      console.error('Failed to load transactions', e);
      setLoadError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  // Hydrate manualUserNames from localStorage before initial fetch (if available)
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('manualUserNames');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            setManualUserNames(parsed);
            // Re-fetch to apply hydrated names
            fetchTransactions();
          }
        }
      }
    } catch (e) {
      console.warn('Failed to hydrate manualUserNames', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist manualUserNames to localStorage whenever they change
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        if (Object.keys(manualUserNames).length) {
          localStorage.setItem('manualUserNames', JSON.stringify(manualUserNames));
        } else {
          localStorage.removeItem('manualUserNames');
        }
      }
    } catch (e) {
      console.warn('Failed to persist manualUserNames', e);
    }
  }, [manualUserNames]);

  useEffect(() => {
    fetchTransactions();
    // Real-time updates
    const channel = supabase
      .channel('public:transactions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        fetchTransactions();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    let filtered = transactions;

    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterStatus !== 'all') filtered = filtered.filter(t => t.status === filterStatus);
    if (filterType !== 'all') filtered = filtered.filter(t => t.type === filterType);

    setFilteredTransactions(filtered);
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterType, transactions]);

  const totalIncome = transactions.filter(t => t.type === 'income' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = Math.abs(transactions.filter(t => t.type === 'expense' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0));
  const netProfit = totalIncome - totalExpense;
  const pendingTransactions = transactions.filter(t => t.status === 'pending').length;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'class_booking': return 'bg-blue-100 text-blue-800';
      case 'subscription': return 'bg-purple-100 text-purple-800';
      case 'instructor_payment': return 'bg-orange-100 text-orange-800';
      case 'maintenance': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number, currency = 'INR', useCode = false) => {
    const opts: Intl.NumberFormatOptions = useCode
      ? { style: 'currency', currency, currencyDisplay: 'code' }
      : { style: 'currency', currency };
    return new Intl.NumberFormat('en-IN', opts).format(Math.abs(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  const formatBillingMonth = (val?: string | null) => {
    if (!val) return '';
    // Accept 'YYYY-MM' or a full date
    let year: string, month: string;
    if (/^\d{4}-\d{2}$/.test(val)) {
      [year, month] = val.split('-');
    } else {
      const d = new Date(val);
      if (isNaN(d.getTime())) return val;
      year = String(d.getUTCFullYear());
      month = String(d.getUTCMonth() + 1).padStart(2, '0');
    }
    const dateForName = new Date(`${year}-${month}-01T00:00:00Z`);
    const monthName = dateForName.toLocaleDateString('en-IN', { month: 'short' });
    return `${monthName} ${year}`;
  };

  const generateProfessionalInvoiceNumber = (rawId: string) => {
    const prefix = (businessConfig?.invoice?.invoice_number_prefix || 'YG').toUpperCase();
    const now = new Date();
    const yyyymm = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const numeric = (rawId.match(/\d+/g) || ['0000']).join('');
    const last4 = numeric.slice(-4).padStart(4, '0');
    return `${prefix}-${yyyymm}-${last4}`;
  };

  const paymentMethodOptions: { value: string; label: string }[] = [
    { value: 'upi', label: 'UPI' },
    { value: 'neft', label: 'NEFT' },
    { value: 'net_banking', label: 'Net Banking' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'debit_card', label: 'Debit Card' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'demand_draft', label: 'Demand Draft' },
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'manual', label: 'Manual' }
  ];

  const buildPendingTx = () => {
    return {
      id: Date.now().toString(),
      user_id: null,
      user_name: newTx.user_name || newTx.userEmail,
      amount: Number(newTx.amount),
      currency: newTx.currency || 'INR',
      status: 'completed',
      type: 'income',
      category: newTx.category || 'class_booking',
      payment_method: newTx.payment_method || 'manual',
      description: newTx.description || 'Manual payment',
      billing_plan_type: newTx.billing_plan_type,
      billing_period_month: newTx.billing_plan_type === 'monthly' && newTx.billing_period_month
        ? newTx.billing_period_month
        : null,
      gst_rate: newTx.gst_rate,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  };

  const handleInitiateSave = () => {
    setShowConfirm(true);
  };

  const handleConfirmSaveTransaction = async () => {
    const tx: any = buildPendingTx();
    setSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const jwt = sessionData?.session?.access_token;

      const { data: inserted, error: dbErr } = await supabase.functions.invoke('record-transaction', {
        body: {
          // Prefer explicit user_id when available; otherwise provide email so the edge function
          // can resolve it to the correct user PK.
          user_id: selectedUser?.id || null,
          user_email: newTx.userEmail || null,
          user_full_name: selectedUser?.full_name || newTx.user_name || null,
          subscription_id: null,
          amount: tx.amount,
          currency: tx.currency,
          status: 'completed',
          payment_method: tx.payment_method,
          stripe_payment_intent_id: null,
          description: tx.description,
          // Include billing metadata so invoices and DB rows carry the same plan info
          billing_plan_type: tx.billing_plan_type,
          billing_period_month: tx.billing_plan_type === 'monthly' && tx.billing_period_month
            ? tx.billing_period_month
            : null
        },
        headers: jwt ? { Authorization: `Bearer ${jwt}` } : undefined
      });

      if (dbErr) {
        console.warn('DB insert failed (RLS/policy?):', dbErr);
      } else if (inserted) {
        tx.id = inserted.id || tx.id;
        tx.created_at = inserted.created_at || tx.created_at;
        tx.updated_at = inserted.updated_at || tx.updated_at;
      }

      // Persist manual name for future fetch cycles
      setManualUserNames(prev => ({
        ...prev,
        [tx.id]: { user_name: tx.user_name, userEmail: newTx.userEmail }
      }));
      setTransactions(prev => [tx, ...prev]);

      const generateInvoicePdfBase64 = async () => {
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595.28, 841.89]); // A4
        const { width, height } = page.getSize();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        // Palette derived strictly from DB (invoice preferences).
        const primaryHex = businessConfig?.invoice?.color_primary;
        const accentHex = businessConfig?.invoice?.color_accent;

        // New: header/footer text color (explicit overrides)
        const headerHex = businessConfig?.invoice?.header_text_color || primaryHex || '#000000';
        const footerHex = businessConfig?.invoice?.footer_text_color || businessConfig?.invoice?.footer_text_color || accentHex || '#333333';

        const hexToRgbNorm = (hex: string) => {
          const h = (hex || '').replace('#', '');
          const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
          const intVal = parseInt(full || '000000', 16);
          const r = (intVal >> 16) & 255;
          const g = (intVal >> 8) & 255;
          const b = intVal & 255;
          return rgb(r / 255, g / 255, b / 255);
        };

        const primaryColor = primaryHex ? hexToRgbNorm(primaryHex) : rgb(0.97, 0.97, 0.97);
        const accentColor = accentHex ? hexToRgbNorm(accentHex) : primaryColor;
        const headerTextRgb = headerHex ? hexToRgbNorm(headerHex) : rgb(0, 0, 0);
        const footerTextRgb = footerHex ? hexToRgbNorm(footerHex) : rgb(0.2, 0.2, 0.2);

        const darkGray = rgb(0.2, 0.2, 0.2);
        const lightGray = rgb(0.94, 0.94, 0.94);
        const black = rgb(0, 0, 0);

        // Ensure vertical cursor exists for layout calculations (declare once)
        let currentY = 0; // will set after page size known

        // Header band (B/W friendly)
        page.drawRectangle({
          x: 0,
          y: height - 140,
          width,
          height: 140,
          color: lightGray
        });

        // Logo
        let logoMetrics = { x: 20, y: 0, width: 0, height: 0 };
        try {
          const normalize = (c: string) => {
            if (!c) return null;
            if (c.startsWith('data:')) return c;
            if (c.startsWith('http')) return c;
            if (c.startsWith('/')) return window.location.origin + c;
            return window.location.origin + (c.startsWith('images') ? '/' + c : '/' + c);
          };
          const baseUrl = (import.meta as any)?.env?.BASE_URL || '/';
          const rawCandidates = [
            businessConfig?.profile?.logo_url,
            (import.meta as any)?.env?.VITE_INVOICE_LOGO_URL,
            logoImage,
            `${baseUrl}images/Brand.png`,
            '/images/Brand.png',
            '/dist/images/Brand.png'
          ].filter(Boolean) as string[];
          const logoCandidates = rawCandidates.map(normalize).filter(Boolean) as string[];

          let imgBytes: ArrayBuffer | null = null;
          const logoFetchAttempts: { url: string; ok: boolean; status?: number }[] = [];
          for (const candidate of logoCandidates) {
            try {
              if (candidate.startsWith('data:')) {
                const base64 = candidate.split(',')[1];
                imgBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer;
                logoFetchAttempts.push({ url: candidate, ok: true, status: 200 });
                break;
              }
              const r = await fetch(candidate);
              logoFetchAttempts.push({ url: candidate, ok: r.ok, status: r.status });
              if (r.ok) {
                imgBytes = await r.arrayBuffer();
                break;
              }
            } catch {
              logoFetchAttempts.push({ url: candidate, ok: false });
            }
          }

          // Canvas fallback (handles scenarios where fetch is blocked / CORS)
          if (!imgBytes && logoImage) {
            try {
              const imgEl = new Image();
              imgEl.crossOrigin = 'anonymous';
              imgEl.src = normalize(logoImage)!;
              await new Promise((res, rej) => {
                imgEl.onload = res;
                imgEl.onerror = rej;
              });
              const canvas = document.createElement('canvas');
              canvas.width = imgEl.naturalWidth;
              canvas.height = imgEl.naturalHeight;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(imgEl, 0, 0);
                const dataUrl = canvas.toDataURL('image/png');
                const base64 = dataUrl.split(',')[1];
                imgBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer;
                logoFetchAttempts.push({ url: 'canvas-fallback', ok: true, status: 200 });
              }
            } catch {
              logoFetchAttempts.push({ url: 'canvas-fallback', ok: false });
            }
          }

          console.log('Invoice PDF logo attempts:', logoFetchAttempts);
          if (!imgBytes) {
            try {
              const forced = normalize('/images/Brand.png');
              if (forced) {
                const r = await fetch(forced);
                if (r.ok) {
                  imgBytes = await r.arrayBuffer();
                  logoFetchAttempts.push({ url: forced + ' (forced)', ok: true, status: 200 });
                  console.log('Forced invoice logo loaded:', forced);
                } else {
                  logoFetchAttempts.push({ url: forced + ' (forced)', ok: false, status: r.status });
                }
              }
            } catch (e) {
              console.warn('Forced logo fetch failed', e);
            }
          }
          if (!imgBytes) {
            try {
              // As a last resort embed a 1x1 transparent pixel to avoid errors (placeholder)
              const transparentPixel =
                'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
              imgBytes = Uint8Array.from(atob(transparentPixel), c => c.charCodeAt(0)).buffer;
              logoFetchAttempts.push({ url: 'transparent-pixel', ok: true, status: 200 });
            } catch {/* ignore */ }
          }
          console.log('Final invoice logo decision bytesLength=', imgBytes ? (imgBytes as ArrayBuffer).byteLength : 0);

          if (imgBytes) {
            let img;
            try {
              img = await pdfDoc.embedPng(imgBytes);
            } catch {
              img = await pdfDoc.embedJpg(imgBytes);
            }
            // Enhanced logo sizing (further reduced) & positioning.
            const headerBandHeight = 140;
            const headerBandBottomY = height - headerBandHeight;

            const maxW = 110;
            const maxH = 55;
            const minH = 32; // further reduced for smaller appearance
            const minW = 32;

            const { width: rawW, height: rawH } = img;

            let scale = Math.min(maxW / rawW, maxH / rawH, 1);
            let drawW = rawW * scale;
            let drawH = rawH * scale;

            // Enforce minimum dimensions for visibility
            if (drawH < minH || drawW < minW) {
              const boost = Math.max(minH / drawH, minW / drawW);
              scale *= boost;
              drawW = rawW * scale;
              drawH = rawH * scale;
              // Cap again at max
              if (drawW > maxW) {
                const adjust = maxW / drawW;
                drawW *= adjust;
                drawH *= adjust;
              }
              if (drawH > maxH) {
                const adjust = maxH / drawH;
                drawW *= adjust;
                drawH *= adjust;
              }
            }

            const centeredY = headerBandBottomY + (headerBandHeight - drawH) / 2;
            page.drawImage(img, {
              x: 20,
              y: centeredY,
              width: drawW,
              height: drawH
            });
            logoMetrics.x = 20;
            logoMetrics.y = centeredY;
            logoMetrics.width = drawW;
            logoMetrics.height = drawH;
          } else {
            console.warn('Invoice PDF: no logo loaded from candidates', logoCandidates);
            // Visible placeholder so issue is obvious in PDF
            page.drawText('LOGO', {
              x: 50,
              y: height - 110,
              size: 28,
              font: boldFont,
              color: darkGray
            });
          }
        } catch {/* ignore */ }

        // When drawing brand/tagline use explicit headerTextRgb color (if provided)
        // Brand text (dynamically positioned next to logo)
        {
          const gap = 4; // tighter gap to sit closer to logo
          const brandFontSize = 14;
          const computedX = (logoMetrics.width ? (logoMetrics.x + logoMetrics.width + gap) : 64);
          const brandNameY = (logoMetrics.height
            ? (logoMetrics.y + (logoMetrics.height / 2) + (brandFontSize / 3))
            : (height - 82));
          const brandName = businessConfig?.profile?.name || 'Yogique';
          page.drawText(brandName, {
            x: computedX,
            y: brandNameY,
            size: brandFontSize,
            font: boldFont,
            color: headerTextRgb  // use explicit header text color
          });
          const tagline = businessConfig?.profile?.tagline || 'Holistic Health • Movement • Mindfulness';
          const taglineY = brandNameY - (brandFontSize + 4);
          page.drawText(tagline, {
            x: computedX,
            y: taglineY,
            size: 8,
            font,
            color: headerTextRgb
          });
        }

        // Address
        const addressLines: string[] = businessConfig?.contact?.address_lines || [
          'Yoga Studio & Wellness Center',
          'Mumbai, Maharashtra, India'
        ];
        const address = [
          ...addressLines,
          `Phone: ${businessConfig?.contact?.phone || '+91 98765 43210'}`,
          `Email: ${businessConfig?.contact?.email || 'info@yogique.life'}`
        ];
        address.forEach((line, i) => {
          page.drawText(line, {
            x: width - 180,
            y: height - 60 - (i * 15),
            size: 10,
            font,
            color: headerTextRgb // use explicit header text color from settings (prevents it switching to white when background color changes)
          });
        });

        currentY = height - 200;

        // Title
        page.drawText('INVOICE', {
          x: 40,
          y: currentY,
          size: 24,
          font: boldFont,
          color: darkGray
        });

        currentY -= 40;

        // Professional Invoice Number
        const displayNumber = generateProfessionalInvoiceNumber(String(tx.id));
        const invoiceDetails: string[][] = [
          ['Invoice No:', displayNumber],
          ['Issue Date:', formatDate(tx.created_at)],
          ['Plan Type:', humanPlanType(tx.billing_plan_type)]
        ];
        if (tx.billing_plan_type === 'monthly' && tx.billing_period_month) {
          invoiceDetails.push(['Billing Month:', formatBillingMonth(tx.billing_period_month)]);
        }
        invoiceDetails.push(['Payment Method:', (tx.payment_method || 'manual').replace('_', ' ').toUpperCase()]);
        invoiceDetails.push(['Status:', 'PAID']);

        const infoBoxHeight = invoiceDetails.length * 18 + 30;
        page.drawRectangle({
          x: 40,
          y: currentY - infoBoxHeight,
          width: 290,
          height: infoBoxHeight,
          color: lightGray
        });

        invoiceDetails.forEach(([label, value], idx) => {
          const yPos = currentY - 20 - (idx * 18);
          page.drawText(label, {
            x: 50,
            y: yPos,
            size: 10,
            font: boldFont,
            color: darkGray
          });
          page.drawText(value, {
            x: 190,
            y: yPos,
            size: 10,
            font,
            color: black
          });
        });

        // Bill To
        page.drawText('BILL TO:', {
          x: width - 180,
          y: currentY,
          size: 12,
          font: boldFont,
          color: darkGray
        });
        const billToInfo = [
          tx.user_name || newTx.userEmail || 'Customer',
          newTx.userEmail || '-'
        ].filter(Boolean);
        billToInfo.forEach((line, i) => {
          page.drawText(line, {
            x: width - 180,
            y: currentY - 25 - (i * 15),
            size: 11,
            font,
            color: black
          });
        });

        currentY -= 160;

        // Services Section
        page.drawText('DESCRIPTION OF SERVICES', {
          x: 40,
          y: currentY,
          size: 14,
          font: boldFont,
          color: darkGray
        });

        currentY -= 30;

        const tableStartY = currentY;
        const rowHeight = 35;
        const headers = ['Description', 'Qty', 'Rate', 'Amount'];
        const colStartX = [40, 290, 370, 450];

        // Section header for table (light gray bg + black text for print)
        page.drawRectangle({
          x: 40,
          y: tableStartY - rowHeight,
          width: width - 80,
          height: rowHeight,
          color: lightGray
        });
        headers.forEach((h, i) => {
          page.drawText(h, {
            x: colStartX[i] + 10,
            y: tableStartY - 22,
            size: 11,
            font: boldFont,
            color: black
          });
        });

        const tableHeight = rowHeight * 2;

        [40, 290, 370, 450, width - 40].forEach(x => {
          page.drawLine({
            start: { x, y: tableStartY },
            end: { x, y: tableStartY - tableHeight },
            thickness: 1,
            color: darkGray
          });
        });

        [tableStartY, tableStartY - rowHeight, tableStartY - tableHeight].forEach(y => {
          page.drawLine({
            start: { x: 40, y },
            end: { x: width - 40, y },
            thickness: 1,
            color: darkGray
          });
        });

        const serviceRowY = tableStartY - rowHeight;
        const descRaw = tx.description || 'Yoga Session Payment';
        const description = descRaw.length > 50 ? descRaw.slice(0, 49) + '…' : descRaw;
        const quantity = '1';
        const rate = formatCurrency(tx.amount, tx.currency, true);
        const amount = formatCurrency(tx.amount, tx.currency, true);
        const serviceData = [description, quantity, rate, amount];
        serviceData.forEach((d, i) => {
          page.drawText(d, {
            x: colStartX[i] + 10,
            y: serviceRowY - 22,
            size: 10,
            font,
            color: black
          });
        });

        currentY = tableStartY - tableHeight - 30;

        const invoiceTaxRate = Number(newTx.gst_rate || businessConfig?.invoice?.tax_rate || 0);
        const taxAmount = tx.amount * (invoiceTaxRate / 100);
        const grandTotal = tx.amount + taxAmount;

        // Build totals array conditionally (omit GST line if 0%)
        const totals: [string, string][] = [
          ['Subtotal:', formatCurrency(tx.amount, tx.currency, true)],
        ];
        if (invoiceTaxRate > 0) {
          totals.push([`GST (${invoiceTaxRate.toFixed(2)}%):`, formatCurrency(taxAmount, tx.currency, true)]);
        }
        totals.push(['Plan Type:', humanPlanType(tx.billing_plan_type)]);
        if (tx.billing_plan_type === 'monthly' && tx.billing_period_month) {
          totals.push(['Billing Month:', formatBillingMonth(tx.billing_period_month)]);
        }
        totals.push(['TOTAL:', formatCurrency(grandTotal, tx.currency, true)]);

        // Dynamic box height based on number of rows (18 line height + 30 padding)
        const totalBoxWidth = 240;
        const totalBoxX = width - (totalBoxWidth + 40);
        const totalBoxHeight = totals.length * 18 + 30;
        page.drawRectangle({
          x: totalBoxX,
          y: currentY - totalBoxHeight,
          width: totalBoxWidth,
          height: totalBoxHeight,
          color: lightGray
        });

        totals.forEach(([label, value], idx) => {
          const isTotal = label === 'TOTAL:';
          const yPos = currentY - 20 - (idx * 18);
          page.drawText(label, {
            x: totalBoxX + 10,
            y: yPos,
            size: isTotal ? 12 : 10,
            font: isTotal ? boldFont : font,
            color: darkGray
          });
          page.drawText(value, {
            x: totalBoxX + totalBoxWidth - 110,
            y: yPos,
            size: isTotal ? 12 : 10,
            font: isTotal ? boldFont : font,
            color: isTotal ? accentColor : black
          });
        });

        currentY -= (totalBoxHeight + 40);

        // Payment Information (reordered & dynamically positioned to avoid footer overlap)
        // Split long date into two lines to avoid horizontal overlap with totals box.
        const dateLocalUTC = (() => {
          const d = new Date(tx.created_at);
          const tz = businessConfig?.invoice?.time_zone || 'Asia/Kolkata';
          let localPart: string;
          try {
            localPart = new Intl.DateTimeFormat('en-IN', {
              timeZone: tz,
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }).format(d) + ` (${tz})`;
          } catch {
            localPart = formatDate(tx.created_at) + ` (${tz})`;
          }
          const utcPart = new Intl.DateTimeFormat('en-IN', {
            timeZone: 'UTC',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }).format(d) + ' UTC';
          return { localPart, utcPart };
        })();

        const paymentInfo: string[] = [
          `Payment Status: COMPLETED`,
          `Payment Date (Local): ${dateLocalUTC.localPart}`,
          `Payment Date (UTC): ${dateLocalUTC.utcPart}`,
          `Payment Method: ${(tx.payment_method || 'manual').replace('_', ' ').toUpperCase()}`,
          `Plan Type: ${humanPlanType(tx.billing_plan_type)}`
        ];
        if (tx.billing_plan_type === 'monthly' && tx.billing_period_month) {
          paymentInfo.push(`Billing Month: ${formatBillingMonth(tx.billing_period_month)}`);
        }
        paymentInfo.push(`Transaction ID: ${tx.id}`);

        const paymentInfoBlockHeight = 25 + paymentInfo.length * 15 + 40; // heading gap + lines + bottom spacer
        // Ensure at least 110pt remains above footer (80 footer + 30 breathing room)
        if (currentY - paymentInfoBlockHeight < 110) {
          currentY = 110 + paymentInfoBlockHeight;
        }

        page.drawText('PAYMENT INFORMATION', {
          x: 40,
          y: currentY,
          size: 12,
          font: boldFont,
          color: darkGray
        });

        paymentInfo.forEach((info, idx) => {
          page.drawText(info, {
            x: 40,
            y: currentY - 25 - (idx * 15),
            size: 10,
            font,
            color: black
          });
        });

        currentY -= (25 + paymentInfo.length * 15 + 40);

        // Footer band (reduced height, use light bg and footer text color)
        const footerHeight = 60; // reduced from 80
        page.drawRectangle({
          x: 0,
          y: 0,
          width,
          height: footerHeight,
          color: lightGray
        });

        // Footer variables (declare here so they're available when drawing footer content)
        let hostDomainRaw = businessConfig?.profile?.website_url || 'https://www.yogique.life';
        hostDomainRaw = hostDomainRaw.replace(/Yogique\.com/gi, 'yogique.life');
        const hostDomain = hostDomainRaw.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
        const footerEmail = businessConfig?.contact?.email || `contact@${hostDomain}`;
        const footerPhone = businessConfig?.contact?.phone || '+91 98765 43210';
        const footerTerms = businessConfig?.invoice?.terms || 'Thank you for supporting your holistic health journey with us.';

        // Draw formatted footer: terms & contact at top, legal/company at bottom
        {
          const legal = businessConfig?.legal || {};
          const registeredOffice = (businessConfig?.contact?.address_lines || []).join(', ');
          const leftX = 40;
          const rightX = width - 280;

          // TOP LEFT: Terms - reduced top margin
          page.drawText(footerTerms.length > 80 ? footerTerms.slice(0, 77) + '...' : footerTerms, {
            x: leftX,
            y: footerHeight - 10,
            size: 9,
            font: boldFont,
            color: footerTextRgb
          });

          // BELOW TERMS: Contact line with "Questions? Contact Yogique at email or phone"
          page.drawText(`Questions? Contact ${footerEmail} at ${footerPhone}`, {
            x: leftX,
            y: footerHeight - 22,
            size: 8,
            font,
            color: footerTextRgb
          });

          // TOP RIGHT: Website URL (right-aligned)
          const websiteUrl = businessConfig?.profile?.website_url || 'https://www.yogique.life';
          const displayUrl = websiteUrl.replace(/^https?:\/\//, ''); // remove protocol for display
          // measure text width and align to right margin (40pt)
          const websiteTextWidth = font.widthOfTextAtSize(displayUrl, 9);
          const websiteX = Math.max(width - 40 - websiteTextWidth, rightX);
          page.drawText(displayUrl, {
            x: websiteX,
            y: footerHeight - 10,
            size: 9,
            font,
            color: footerTextRgb
          });

          // MIDDLE SECTION: Legal/Company info (single line now)
          const legalSentenceFull = 'Yogique is a brand operated by Sampurnayogam LLP. All services, including online B2C classes and programs, are offered by Sampurnayogam LLP.';

          let currentY = footerHeight - 34;
          page.drawText(legalSentenceFull.length > 140 ? legalSentenceFull.slice(0, 137) + '...' : legalSentenceFull, {
            x: leftX,
            y: currentY,
            size: 7,
            font,
            color: footerTextRgb
          });

          // SINGLE LINE: Registered Company • LLPIN/GST/CIN • Registered Office
          currentY -= 8;

          const registeredCompany = businessConfig?.profile?.registered_company || 'Sampurnayogam LLP';
          const legalInfoParts: string[] = [registeredCompany];

          // Add LLPIN/GST/CIN
          const idParts: string[] = [];
          if (legal.llpin) idParts.push(`LLPIN: ${legal.llpin}`);
          if (legal.gst_number) idParts.push(`GSTIN: ${legal.gst_number}`);
          if (legal.cin_number) idParts.push(`CIN: ${legal.cin_number}`);
          if (idParts.length) legalInfoParts.push(idParts.join(', '));

          // Add Registered Office
          if (registeredOffice) {
            const shortOffice = registeredOffice.length > 60 ? registeredOffice.slice(0, 57) + '...' : registeredOffice;
            legalInfoParts.push(`Registered Office: ${shortOffice}`);
          }

          page.drawText(legalInfoParts.join(' • '), {
            x: leftX,
            y: currentY,
            size: 7,
            font,
            color: footerTextRgb
          });

          // Add spacing before copyright
          currentY -= 12; // extra space before copyright

          // Copyright centered at bottom
          const copyright = `© ${new Date().getFullYear()} ${registeredCompany}. All rights reserved.`;
          const cpWidth = copyright.length * 3.5;
          page.drawText(copyright, {
            x: (width / 2) - (cpWidth / 2),
            y: 4,
            size: 7,
            font,
            color: footerTextRgb
          });
        }

        const base64 = await pdfDoc.saveAsBase64({ dataUri: false });
        return base64;
      };

      const pdfBase64 = await generateInvoicePdfBase64();

      // Email-level values — pulled from businessConfig (they were local to the PDF function earlier)
      const emailPrimaryHex = businessConfig?.invoice?.color_primary;
      const emailAccentHex = businessConfig?.invoice?.color_accent;
      const emailHeaderHex = businessConfig?.invoice?.header_text_color || emailPrimaryHex || '#000000';
      const emailFooterHex = businessConfig?.invoice?.footer_text_color || emailAccentHex || '#333333';
      const emailCompanyName = businessConfig?.profile?.name || 'Yogique';
      const emailCompanyAddress = (businessConfig?.contact?.address_lines || []).join(', ');
      const emailLLPIN = businessConfig?.legal?.llpin || '';
      const emailGST = businessConfig?.legal?.gst_number || '';
      const emailCIN = businessConfig?.legal?.cin_number || '';

      // AFTER finishing PDF generation and before building email HTML: compute tax values used in the email body
      const taxRateDisplay = Number(newTx.gst_rate || businessConfig?.invoice?.tax_rate || 0);
      const taxAmountDisplay = tx.amount * (taxRateDisplay / 100);
      const grandTotalDisplay = tx.amount + taxAmountDisplay;

      const html = renderEmailTemplate('corporate-professional', {
        title: 'Payment Invoice',
        headerTitle: 'Invoice',
        content: `
           <p>Hi ${tx.user_name || ''},</p>
           <p>Thanks for your payment. Your invoice is attached as a PDF.</p>
           <p>
             <strong>Subtotal:</strong> ${formatCurrency(tx.amount, tx.currency)}<br/>
             ${taxRateDisplay > 0 ? `<strong>GST (${taxRateDisplay.toFixed(2)}%):</strong> ${formatCurrency(taxAmountDisplay, tx.currency)}<br/>` : ''}
             <strong>Total:</strong> ${formatCurrency(grandTotalDisplay, tx.currency)}<br/>
             <strong>Invoice ID:</strong> ${generateProfessionalInvoiceNumber(String(tx.id))}<br/>
             <strong>Date:</strong> ${formatDate(tx.created_at)}<br/>
             <strong>Plan Type:</strong> ${humanPlanType(tx.billing_plan_type)}${tx.billing_plan_type === 'monthly' && tx.billing_period_month ? `<br/><strong>Billing Month:</strong> ${formatBillingMonth(tx.billing_period_month)}` : ''}
           </p>
         `,
        primaryColor: emailPrimaryHex || '#2563eb',
        secondaryColor: emailAccentHex || emailPrimaryHex || '#1d4ed8',
        headerTextColor: emailHeaderHex,
        footerTextColor: emailFooterHex,
        backgroundColor: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        companyName: emailCompanyName,
        companyAddress: emailCompanyAddress,
        llpin: emailLLPIN,
        gstNumber: emailGST,
        cinNumber: emailCIN,
        unsubscribeUrl: `${window.location.origin}/unsubscribe`
      });

      const res = await EmailService.sendTransactionalEmail(
        newTx.userEmail,
        'Your Yogique Invoice',
        html,
        [
          {
            filename: `invoice-${tx.id}.pdf`,
            content: pdfBase64,
            contentType: 'application/pdf'
          }
        ]
      );

      if (!res.ok) {
        throw new Error('Transactional email failed');
      }

      alert(res.simulated ? 'Invoice sent (simulated - no provider configured)' : 'Invoice sent');
    } catch (e) {
      console.error(e);
      alert('Failed to save or send invoice');
    } finally {
      setSaving(false);
      setShowConfirm(false);
      setShowAddTransaction(false);
      setNewTx({
        userEmail: '',
        user_name: '',
        amount: 0,
        currency: 'INR',
        description: '',
        payment_method: 'manual',
        category: 'class_booking',
        billing_plan_type: 'one_time',
        billing_period_month: '',
        gst_rate: '0'
      });
    }
  };

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Transaction Management</h1>
              <p className="text-sm text-gray-600">Manage all financial transactions</p>
            </div>
            <div className="flex space-x-3">
              <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
              {canEdit && (
                <button
                  onClick={() => setShowAddTransaction(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Transaction</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Income</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Profit</p>
                <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(netProfit)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingTransactions}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
              </select>
            </div>
          </div>
        </div>

        {loadError && <div className="mb-4 text-sm text-red-600">Error loading transactions: {loadError}</div>}
        {loading && <div className="mb-4 text-sm text-gray-600">Loading transactions...</div>}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User/Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{transaction.user_name}</div>
                        <div className="text-xs text-gray-500">
                          {humanPlanType(transaction.billing_plan_type)}{transaction.billing_plan_type === 'monthly' && transaction.billing_period_month ? ` • ${formatBillingMonth(transaction.billing_period_month)}` : ''}
                        </div>
                        <div className="text-sm text-gray-500">{transaction.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount, transaction.currency)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(transaction.category)}`}>
                        {transaction.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.payment_method.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(transaction.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setSelectedTransaction(transaction)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {canEdit && (
                          <button className="text-green-600 hover:text-green-900">
                            <Edit3 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(indexOfLastItem, filteredTransactions.length)}</span> of{' '}
                  <span className="font-medium">{filteredTransactions.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === i + 1
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAddTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-lg">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Add Manual Transaction</h2>
                <button onClick={() => setShowAddTransaction(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={selectedUser ? (selectedUser.full_name || selectedUser.email) : newTx.userEmail}
                      onChange={async (e) => {
                        const v = e.target.value;
                        setSelectedUser(null);
                        setNewTx(prev => ({ ...prev, userEmail: v }));
                        await searchUsers(v);
                      }}
                      placeholder="Type name or email to search..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {userSearchLoading && (
                      <div className="absolute right-3 top-3 text-xs text-gray-500">Searching...</div>
                    )}
                    {userSearchResults.length > 0 && (
                      <ul className="absolute z-10 left-0 right-0 mt-1 max-h-48 overflow-auto bg-white border border-gray-200 rounded shadow">
                        {userSearchResults.map((u: any) => (
                          <li
                            key={u.id}
                            onClick={() => {
                              setSelectedUser(u);
                              setNewTx(prev => ({ ...prev, userEmail: u.email || '', user_name: u.full_name || '' }));
                              setUserSearchResults([]);
                            }}
                            className="px-3 py-2 hover:bg-gray-50 cursor-pointer"
                          >
                            <div className="text-sm font-medium">{u.full_name || u.email}</div>
                            <div className="text-xs text-gray-500">{u.email}</div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {!selectedUser && newTx.userEmail && (
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={async () => {
                          const ok = window.confirm(`Create new user with email: ${newTx.userEmail}?`);
                          if (!ok) return;
                          try {
                            const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`;
                            try {
                              const { data: sessionData } = await supabase.auth.getSession();
                              const jwt = sessionData?.session?.access_token;
                              const headers: Record<string, string> = {
                                'Content-Type': 'application/json',
                                apikey: (import.meta.env as any).VITE_SUPABASE_ANON_KEY || ''
                              };
                              if (jwt) headers['Authorization'] = `Bearer ${jwt}`;
                              const res = await fetch(url, {
                                method: 'POST',
                                headers,
                                body: JSON.stringify({ email: newTx.userEmail, full_name: newTx.user_name || null })
                              });
                              if (res.ok) {
                                const created = await res.json();
                                setSelectedUser({ id: created.id, email: created.email, full_name: created.full_name || created.email });
                                setNewTx(prev => ({ ...prev, userEmail: created.email || prev.userEmail, user_name: created.full_name || prev.user_name }));
                                alert('User created');
                              } else {
                                const err = await res.text();
                                console.warn('create-user failed', err);
                                alert('Failed to create user');
                              }
                            } catch (e) {
                              console.error('create-user error', e);
                              alert('Failed to create user');
                            }
                          } catch (e) {
                            console.error('create-user error', e);
                            alert('Failed to create user');
                          }
                        }}
                        className="px-3 py-2 bg-yellow-500 text-white rounded"
                      >
                        Create user
                      </button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                    <input
                      type="number"
                      value={newTx.amount}
                      onChange={(e) => setNewTx(prev => ({ ...prev, amount: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                    <select
                      value={newTx.currency}
                      onChange={(e) => setNewTx(prev => ({ ...prev, currency: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="INR">INR</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={newTx.description}
                    onChange={(e) => setNewTx(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={newTx.payment_method}
                    onChange={(e) => setNewTx(prev => ({ ...prev, payment_method: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {paymentMethodOptions.map(pm => (
                      <option key={pm.value} value={pm.value}>{pm.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GST %</label>
                  <select
                    value={newTx.gst_rate}
                    onChange={(e) => setNewTx(prev => ({ ...prev, gst_rate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {['0', '5', '10', '18', '28'].map(r => <option key={r} value={r}>{r}%</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Billing Type</label>
                  <select
                    value={newTx.billing_plan_type}
                    onChange={(e) => {
                      const val = e.target.value as BillingPlanType;
                      setNewTx(prev => ({
                        ...prev,
                        billing_plan_type: val,
                        billing_period_month: val === 'monthly' ? prev.billing_period_month : ''
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="one_time">One Time</option>
                    <option value="monthly">Monthly Subscription</option>
                    <option value="crash_course">Crash Course</option>
                  </select>
                </div>
                {newTx.billing_plan_type === 'monthly' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Billing Month</label>
                    <input
                      type="month"
                      value={newTx.billing_period_month}
                      onChange={(e) => setNewTx(prev => ({ ...prev, billing_period_month: e.target.value, billing_plan_type: 'monthly' }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-2">
                <button onClick={() => setShowAddTransaction(false)} className="px-4 py-2 rounded-lg border">
                  Cancel
                </button>
                <button onClick={handleInitiateSave} className="px-4 py-2 rounded-lg bg-blue-600 text-white">
                  Review & Send Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-lg">
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Confirm Transaction</h2>
                <button onClick={() => setShowConfirm(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <p className="text-sm text-gray-600">Please review the details before saving & sending the invoice.</p>
              <div className="divide-y text-sm">
                <div className="py-2 flex justify-between"><span className="text-gray-500">User Email</span><span>{newTx.userEmail || '-'}</span></div>
                <div className="py-2 flex justify-between"><span className="text-gray-500">User Name</span><span>{newTx.user_name || newTx.userEmail || '-'}</span></div>
                <div className="py-2 flex justify-between"><span className="text-gray-500">Amount</span><span>{newTx.amount} {newTx.currency}</span></div>
                <div className="py-2 flex justify-between"><span className="text-gray-500">Currency</span><span>{newTx.currency}</span></div>
                <div className="py-2 flex justify-between"><span className="text-gray-500">GST %</span><span>{newTx.gst_rate}</span></div>
                <div className="py-2 flex justify-between"><span className="text-gray-500">Payment Method</span><span>{newTx.payment_method.replace('_', ' ')}</span></div>
                <div className="py-2 flex justify-between"><span className="text-gray-500">Billing Type</span><span>{humanPlanType(newTx.billing_plan_type)}</span></div>
                {newTx.billing_plan_type === 'monthly' && (
                  <div className="py-2 flex justify-between"><span className="text-gray-500">Billing Month</span><span>{newTx.billing_period_month || '-'}</span></div>
                )}
                <div className="py-2 flex justify-between"><span className="text-gray-500">Description</span><span className="max-w-[60%] text-right">{newTx.description || '-'}</span></div>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 rounded-lg border"
                  disabled={saving}
                >
                  Edit
                </button>
                <button
                  onClick={handleConfirmSaveTransaction}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Confirm & Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Transaction Details</h2>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
                  <p className="text-sm text-gray-900">{selectedTransaction.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User/Vendor</label>
                  <p className="text-sm text-gray-900">{selectedTransaction.user_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <p className={`text-sm font-medium ${selectedTransaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedTransaction.type === 'income' ? '+' : '-'}{formatCurrency(selectedTransaction.amount, selectedTransaction.currency)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTransaction.status)}`}>
                    {selectedTransaction.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(selectedTransaction.category)}`}>
                    {selectedTransaction.category.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <p className="text-sm text-gray-900">{selectedTransaction.payment_method.replace('_', ' ')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created Date</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedTransaction.created_at)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Updated Date</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedTransaction.updated_at)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan Type</label>
                  <p className="text-sm text-gray-900">{humanPlanType(selectedTransaction.billing_plan_type)}</p>
                </div>
                {selectedTransaction.billing_plan_type === 'monthly' && selectedTransaction.billing_period_month && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Billing Month</label>
                    <p className="text-sm text-gray-900">{formatBillingMonth(selectedTransaction.billing_period_month)}</p>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <p className="text-sm text-gray-900">{selectedTransaction.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionManagement;
