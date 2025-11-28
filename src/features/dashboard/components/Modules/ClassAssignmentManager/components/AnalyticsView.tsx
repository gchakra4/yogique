import { BarChart3, Calendar, CheckSquare, Clock, IndianRupee, TrendingUp, User, Users, X } from 'lucide-react'
import { useMemo } from 'react'
import { ClassAssignment, UserProfile } from '../types'
import { getAssignmentType } from '../utils'

interface AnalyticsViewProps {
    assignments: ClassAssignment[]
    instructors: UserProfile[]
}

export const AnalyticsView = ({ assignments, instructors }: AnalyticsViewProps) => {
    const analytics = useMemo(() => {
        const totalRevenue = assignments.reduce((sum, assignment) => sum + assignment.payment_amount, 0)
        const activeAssignments = assignments.filter(a => a.class_status !== 'cancelled')
        const completedAssignments = assignments.filter(a => a.class_status === 'completed')
        const pendingAssignments = assignments.filter(a => a.instructor_status === 'pending')
        const acceptedAssignments = assignments.filter(a => a.instructor_status === 'accepted')

        // Assignment type distribution
        const typeDistribution = assignments.reduce((acc, assignment) => {
            const type = getAssignmentType(assignment)
            acc[type] = (acc[type] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        // Revenue by type
        const revenueByType = assignments.reduce((acc, assignment) => {
            const type = getAssignmentType(assignment)
            acc[type] = (acc[type] || 0) + assignment.payment_amount
            return acc
        }, {} as Record<string, number>)

        // Instructor workload
        const instructorStats = instructors.map(instructor => {
            const instructorAssignments = assignments.filter(a => a.instructor_id === instructor.user_id)
            const revenue = instructorAssignments.reduce((sum, a) => sum + a.payment_amount, 0)
            const completed = instructorAssignments.filter(a => a.class_status === 'completed').length
            const pending = instructorAssignments.filter(a => a.instructor_status === 'pending').length
            const accepted = instructorAssignments.filter(a => a.instructor_status === 'accepted').length

            return {
                instructor,
                totalAssignments: instructorAssignments.length,
                revenue,
                completed,
                pending,
                accepted,
                completionRate: instructorAssignments.length > 0 ? (completed / instructorAssignments.length) * 100 : 0
            }
        }).filter(stat => stat.totalAssignments > 0)
            .sort((a, b) => b.totalAssignments - a.totalAssignments)

        // Payment status breakdown
        const paymentStats = {
            paid: assignments.filter(a => a.payment_status === 'paid').length,
            pending: assignments.filter(a => a.payment_status === 'pending').length,
            cancelled: assignments.filter(a => a.payment_status === 'cancelled').length
        }

        // Monthly trends (last 6 months)
        const monthlyTrends = Array.from({ length: 6 }, (_, i) => {
            const date = new Date()
            date.setMonth(date.getMonth() - i)
            const monthKey = date.toISOString().slice(0, 7) // YYYY-MM

            const monthAssignments = assignments.filter(a => a.date.startsWith(monthKey))
            return {
                month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                assignments: monthAssignments.length,
                revenue: monthAssignments.reduce((sum, a) => sum + a.payment_amount, 0),
                completed: monthAssignments.filter(a => a.class_status === 'completed').length
            }
        }).reverse()

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
        }
    }, [assignments, instructors])

    const StatCard = ({ title, value, icon: Icon, subtitle, color = 'blue' }: {
        title: string
        value: string | number
        icon: any
        subtitle?: string
        color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
    }) => {
        const colorClasses = {
            blue: 'bg-blue-50 text-blue-600',
            green: 'bg-green-50 text-green-600',
            yellow: 'bg-yellow-50 text-yellow-600',
            red: 'bg-red-50 text-red-600',
            purple: 'bg-purple-50 text-purple-600'
        }

        return (
            <div className="w-full p-2 sm:p-6 sm:bg-white sm:rounded-lg sm:shadow">
                <div className="flex items-center">
                    <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <div className="ml-0 sm:ml-4 flex-1">
                        <p className="text-sm font-medium text-gray-600">{title}</p>
                        <p className="text-2xl font-semibold text-gray-900">{value}</p>
                        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
                    </div>
                </div>
            </div>
        )
    }

    const ProgressBar = ({ value, max, color = 'blue' }: { value: number; max: number; color?: string }) => {
        const percentage = max > 0 ? (value / max) * 100 : 0
        const colorClasses = {
            blue: 'bg-blue-600',
            green: 'bg-green-600',
            yellow: 'bg-yellow-600',
            red: 'bg-red-600',
            purple: 'bg-purple-600'
        }

        return (
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                    className={`h-2 rounded-full ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />
            </div>
        )
    }

    return (
        <div className="w-full max-w-none -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 sm:py-6 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <BarChart3 className="w-6 h-6 mr-2" />
                    Analytics Dashboard
                </h2>
                <div className="text-sm text-gray-500">
                    Last updated: {new Date().toLocaleDateString()}
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <StatCard
                    title="Total Revenue"
                    value={`₹${analytics.totalRevenue.toFixed(2)}`}
                    icon={IndianRupee}
                    color="green"
                />
                <StatCard
                    title="Total Assignments"
                    value={analytics.totalAssignments}
                    icon={Calendar}
                    subtitle={`${analytics.activeAssignments} active`}
                    color="blue"
                />
                <StatCard
                    title="Completion Rate"
                    value={`${analytics.completionRate.toFixed(1)}%`}
                    icon={CheckSquare}
                    subtitle={`${analytics.completedAssignments} completed`}
                    color="green"
                />
                <StatCard
                    title="Acceptance Rate"
                    value={`${analytics.acceptanceRate.toFixed(1)}%`}
                    icon={TrendingUp}
                    subtitle={`${analytics.acceptedAssignments} accepted`}
                    color="purple"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Assignment Type Distribution */}
                <div className="w-full p-4 sm:p-6 sm:bg-white sm:rounded-lg sm:shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment Type Distribution</h3>
                    <div className="space-y-4">
                        {Object.entries(analytics.typeDistribution).map(([type, count]) => (
                            <div key={type} className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700 capitalize">
                                    {type.replace('_', ' ')}
                                </span>
                                <div className="flex items-center space-x-3 flex-1 ml-4">
                                    <ProgressBar
                                        value={count}
                                        max={Math.max(...Object.values(analytics.typeDistribution))}
                                    />
                                    <span className="text-sm text-gray-600 min-w-[3rem] text-right">
                                        {count} ({((count / analytics.totalAssignments) * 100).toFixed(1)}%)
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Revenue Breakdown */}
                <div className="w-full p-4 sm:p-6 sm:bg-white sm:rounded-lg sm:shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Assignment Type</h3>
                    <div className="space-y-4">
                        {Object.entries(analytics.revenueByType).map(([type, revenue]) => (
                            <div key={type} className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700 capitalize">
                                    {type.replace('_', ' ')}
                                </span>
                                <div className="flex items-center space-x-3 flex-1 ml-4">
                                    <ProgressBar
                                        value={revenue}
                                        max={Math.max(...Object.values(analytics.revenueByType))}
                                        color="green"
                                    />
                                    <span className="text-sm text-gray-600 min-w-[5rem] text-right">
                                        ₹${revenue.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Instructor Performance */}
            <div className="w-full p-4 sm:p-6 sm:bg-white sm:rounded-lg sm:shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Instructor Performance
                </h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Instructor
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total Assignments
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Revenue
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Completion Rate
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status Breakdown
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {analytics.instructorStats.map((stat) => (
                                <tr key={stat.instructor.user_id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <User className="w-8 h-8 text-gray-400 mr-3" />
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {stat.instructor.full_name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {stat.instructor.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {stat.totalAssignments}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        ₹${stat.revenue.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="w-16 mr-2">
                                                <ProgressBar
                                                    value={stat.completionRate}
                                                    max={100}
                                                    color="green"
                                                />
                                            </div>
                                            <span className="text-sm text-gray-900">
                                                {stat.completionRate.toFixed(1)}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex space-x-2">
                                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                                {stat.completed} completed
                                            </span>
                                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                                {stat.accepted} accepted
                                            </span>
                                            {stat.pending > 0 && (
                                                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                                                    {stat.pending} pending
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Paid Assignments"
                    value={analytics.paymentStats.paid}
                    icon={CheckSquare}
                    subtitle={`${((analytics.paymentStats.paid / analytics.totalAssignments) * 100).toFixed(1)}% of total`}
                    color="green"
                />
                <StatCard
                    title="Pending Payments"
                    value={analytics.paymentStats.pending}
                    icon={Clock}
                    subtitle={`${((analytics.paymentStats.pending / analytics.totalAssignments) * 100).toFixed(1)}% of total`}
                    color="yellow"
                />
                <StatCard
                    title="Cancelled Payments"
                    value={analytics.paymentStats.cancelled}
                    icon={X}
                    subtitle={`${((analytics.paymentStats.cancelled / analytics.totalAssignments) * 100).toFixed(1)}% of total`}
                    color="red"
                />
            </div>

            {/* Monthly Trends */}
            <div className="w-full p-4 sm:p-6 sm:bg-white sm:rounded-lg sm:shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Monthly Trends (Last 6 Months)
                </h3>
                <div className="space-y-4">
                    {analytics.monthlyTrends.map((month, index) => (
                        <div key={index} className="flex items-center p-4 bg-gray-50 rounded-lg">
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">{month.month}</div>
                                <div className="text-xs text-gray-500 truncate">
                                    {month.assignments} assignments • {month.completed} completed
                                </div>
                            </div>

                            <div className="flex items-center space-x-4 ml-4 w-40 sm:w-48 lg:w-56 flex-shrink-0">
                                <div className="text-right">
                                    <div className="text-lg font-semibold text-green-600">
                                        ₹${month.revenue.toFixed(2)}
                                    </div>
                                    <div className="text-xs text-gray-500">Revenue</div>
                                </div>
                            </div>

                            <div className="flex-1 ml-3 min-w-0">
                                <ProgressBar
                                    value={month.assignments}
                                    max={Math.max(...analytics.monthlyTrends.map(m => m.assignments))}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}