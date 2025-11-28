import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BarChart3, Calendar, CheckSquare, Clock, IndianRupee, TrendingUp, User, Users, X } from 'lucide-react';
import { useMemo } from 'react';
import { getAssignmentType } from '../utils';
export const AnalyticsView = ({ assignments, instructors }) => {
    const analytics = useMemo(() => {
        const totalRevenue = assignments.reduce((sum, assignment) => sum + assignment.payment_amount, 0);
        const activeAssignments = assignments.filter(a => a.class_status !== 'cancelled');
        const completedAssignments = assignments.filter(a => a.class_status === 'completed');
        const pendingAssignments = assignments.filter(a => a.instructor_status === 'pending');
        const acceptedAssignments = assignments.filter(a => a.instructor_status === 'accepted');
        // Assignment type distribution
        const typeDistribution = assignments.reduce((acc, assignment) => {
            const type = getAssignmentType(assignment);
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});
        // Revenue by type
        const revenueByType = assignments.reduce((acc, assignment) => {
            const type = getAssignmentType(assignment);
            acc[type] = (acc[type] || 0) + assignment.payment_amount;
            return acc;
        }, {});
        // Instructor workload
        const instructorStats = instructors.map(instructor => {
            const instructorAssignments = assignments.filter(a => a.instructor_id === instructor.user_id);
            const revenue = instructorAssignments.reduce((sum, a) => sum + a.payment_amount, 0);
            const completed = instructorAssignments.filter(a => a.class_status === 'completed').length;
            const pending = instructorAssignments.filter(a => a.instructor_status === 'pending').length;
            const accepted = instructorAssignments.filter(a => a.instructor_status === 'accepted').length;
            return {
                instructor,
                totalAssignments: instructorAssignments.length,
                revenue,
                completed,
                pending,
                accepted,
                completionRate: instructorAssignments.length > 0 ? (completed / instructorAssignments.length) * 100 : 0
            };
        }).filter(stat => stat.totalAssignments > 0)
            .sort((a, b) => b.totalAssignments - a.totalAssignments);
        // Payment status breakdown
        const paymentStats = {
            paid: assignments.filter(a => a.payment_status === 'paid').length,
            pending: assignments.filter(a => a.payment_status === 'pending').length,
            cancelled: assignments.filter(a => a.payment_status === 'cancelled').length
        };
        // Monthly trends (last 6 months)
        const monthlyTrends = Array.from({ length: 6 }, (_, i) => {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
            const monthAssignments = assignments.filter(a => a.date.startsWith(monthKey));
            return {
                month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                assignments: monthAssignments.length,
                revenue: monthAssignments.reduce((sum, a) => sum + a.payment_amount, 0),
                completed: monthAssignments.filter(a => a.class_status === 'completed').length
            };
        }).reverse();
        return {
            totalRevenue,
            totalAssignments: assignments.length,
            activeAssignments: activeAssignments.length,
            completedAssignments: completedAssignments.length,
            pendingAssignments: pendingAssignments.length,
            acceptedAssignments: acceptedAssignments.length,
            completionRate: assignments.length > 0 ? (completedAssignments.length / assignments.length) * 100 : 0,
            acceptanceRate: assignments.length > 0 ? (acceptedAssignments.length / assignments.length) * 100 : 0,
            typeDistribution,
            revenueByType,
            instructorStats,
            paymentStats,
            monthlyTrends
        };
    }, [assignments, instructors]);
    const StatCard = ({ title, value, icon: Icon, subtitle, color = 'blue' }) => {
        const colorClasses = {
            blue: 'bg-blue-50 text-blue-600',
            green: 'bg-green-50 text-green-600',
            yellow: 'bg-yellow-50 text-yellow-600',
            red: 'bg-red-50 text-red-600',
            purple: 'bg-purple-50 text-purple-600'
        };
        return (_jsx("div", { className: "w-full p-2 sm:p-6 sm:bg-white sm:rounded-lg sm:shadow", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: `p-2 rounded-lg ${colorClasses[color]}`, children: _jsx(Icon, { className: "w-6 h-6" }) }), _jsxs("div", { className: "ml-0 sm:ml-4 flex-1", children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: title }), _jsx("p", { className: "text-2xl font-semibold text-gray-900", children: value }), subtitle && _jsx("p", { className: "text-sm text-gray-500", children: subtitle })] })] }) }));
    };
    const ProgressBar = ({ value, max, color = 'blue' }) => {
        const percentage = max > 0 ? (value / max) * 100 : 0;
        const colorClasses = {
            blue: 'bg-blue-600',
            green: 'bg-green-600',
            yellow: 'bg-yellow-600',
            red: 'bg-red-600',
            purple: 'bg-purple-600'
        };
        return (_jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: `h-2 rounded-full ${colorClasses[color] || colorClasses.blue}`, style: { width: `${Math.min(percentage, 100)}%` } }) }));
    };
    return (_jsxs("div", { className: "w-full max-w-none -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 sm:py-6 space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("h2", { className: "text-2xl font-bold text-gray-900 flex items-center", children: [_jsx(BarChart3, { className: "w-6 h-6 mr-2" }), "Analytics Dashboard"] }), _jsxs("div", { className: "text-sm text-gray-500", children: ["Last updated: ", new Date().toLocaleDateString()] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6", children: [_jsx(StatCard, { title: "Total Revenue", value: `₹${analytics.totalRevenue.toFixed(2)}`, icon: IndianRupee, color: "green" }), _jsx(StatCard, { title: "Total Assignments", value: analytics.totalAssignments, icon: Calendar, subtitle: `${analytics.activeAssignments} active`, color: "blue" }), _jsx(StatCard, { title: "Completion Rate", value: `${analytics.completionRate.toFixed(1)}%`, icon: CheckSquare, subtitle: `${analytics.completedAssignments} completed`, color: "green" }), _jsx(StatCard, { title: "Acceptance Rate", value: `${analytics.acceptanceRate.toFixed(1)}%`, icon: TrendingUp, subtitle: `${analytics.acceptedAssignments} accepted`, color: "purple" })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "w-full p-4 sm:p-6 sm:bg-white sm:rounded-lg sm:shadow", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Assignment Type Distribution" }), _jsx("div", { className: "space-y-4", children: Object.entries(analytics.typeDistribution).map(([type, count]) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm font-medium text-gray-700 capitalize", children: type.replace('_', ' ') }), _jsxs("div", { className: "flex items-center space-x-3 flex-1 ml-4", children: [_jsx(ProgressBar, { value: count, max: Math.max(...Object.values(analytics.typeDistribution)) }), _jsxs("span", { className: "text-sm text-gray-600 min-w-[3rem] text-right", children: [count, " (", ((count / analytics.totalAssignments) * 100).toFixed(1), "%)"] })] })] }, type))) })] }), _jsxs("div", { className: "w-full p-4 sm:p-6 sm:bg-white sm:rounded-lg sm:shadow", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Revenue by Assignment Type" }), _jsx("div", { className: "space-y-4", children: Object.entries(analytics.revenueByType).map(([type, revenue]) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm font-medium text-gray-700 capitalize", children: type.replace('_', ' ') }), _jsxs("div", { className: "flex items-center space-x-3 flex-1 ml-4", children: [_jsx(ProgressBar, { value: revenue, max: Math.max(...Object.values(analytics.revenueByType)), color: "green" }), _jsxs("span", { className: "text-sm text-gray-600 min-w-[5rem] text-right", children: ["\u20B9$", revenue.toFixed(2)] })] })] }, type))) })] })] }), _jsxs("div", { className: "w-full p-4 sm:p-6 sm:bg-white sm:rounded-lg sm:shadow", children: [_jsxs("h3", { className: "text-lg font-semibold text-gray-900 mb-4 flex items-center", children: [_jsx(Users, { className: "w-5 h-5 mr-2" }), "Instructor Performance"] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Instructor" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Total Assignments" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Revenue" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Completion Rate" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Status Breakdown" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: analytics.instructorStats.map((stat) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "flex items-center", children: [_jsx(User, { className: "w-8 h-8 text-gray-400 mr-3" }), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium text-gray-900", children: stat.instructor.full_name }), _jsx("div", { className: "text-sm text-gray-500", children: stat.instructor.email })] })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: stat.totalAssignments }), _jsxs("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: ["\u20B9$", stat.revenue.toFixed(2)] }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-16 mr-2", children: _jsx(ProgressBar, { value: stat.completionRate, max: 100, color: "green" }) }), _jsxs("span", { className: "text-sm text-gray-900", children: [stat.completionRate.toFixed(1), "%"] })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: _jsxs("div", { className: "flex space-x-2", children: [_jsxs("span", { className: "bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs", children: [stat.completed, " completed"] }), _jsxs("span", { className: "bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs", children: [stat.accepted, " accepted"] }), stat.pending > 0 && (_jsxs("span", { className: "bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs", children: [stat.pending, " pending"] }))] }) })] }, stat.instructor.user_id))) })] }) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [_jsx(StatCard, { title: "Paid Assignments", value: analytics.paymentStats.paid, icon: CheckSquare, subtitle: `${((analytics.paymentStats.paid / analytics.totalAssignments) * 100).toFixed(1)}% of total`, color: "green" }), _jsx(StatCard, { title: "Pending Payments", value: analytics.paymentStats.pending, icon: Clock, subtitle: `${((analytics.paymentStats.pending / analytics.totalAssignments) * 100).toFixed(1)}% of total`, color: "yellow" }), _jsx(StatCard, { title: "Cancelled Payments", value: analytics.paymentStats.cancelled, icon: X, subtitle: `${((analytics.paymentStats.cancelled / analytics.totalAssignments) * 100).toFixed(1)}% of total`, color: "red" })] }), _jsxs("div", { className: "w-full p-4 sm:p-6 sm:bg-white sm:rounded-lg sm:shadow", children: [_jsxs("h3", { className: "text-lg font-semibold text-gray-900 mb-4 flex items-center", children: [_jsx(TrendingUp, { className: "w-5 h-5 mr-2" }), "Monthly Trends (Last 6 Months)"] }), _jsx("div", { className: "space-y-4", children: analytics.monthlyTrends.map((month, index) => (_jsxs("div", { className: "flex items-center p-4 bg-gray-50 rounded-lg", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "text-sm font-medium text-gray-900 truncate", children: month.month }), _jsxs("div", { className: "text-xs text-gray-500 truncate", children: [month.assignments, " assignments \u2022 ", month.completed, " completed"] })] }), _jsx("div", { className: "flex items-center space-x-4 ml-4 w-40 sm:w-48 lg:w-56 flex-shrink-0", children: _jsxs("div", { className: "text-right", children: [_jsxs("div", { className: "text-lg font-semibold text-green-600", children: ["\u20B9$", month.revenue.toFixed(2)] }), _jsx("div", { className: "text-xs text-gray-500", children: "Revenue" })] }) }), _jsx("div", { className: "flex-1 ml-3 min-w-0", children: _jsx(ProgressBar, { value: month.assignments, max: Math.max(...analytics.monthlyTrends.map(m => m.assignments)) }) })] }, index))) })] })] }));
};
