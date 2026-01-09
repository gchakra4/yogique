import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  XCircle
} from 'lucide-react'
import { Button } from '../../../shared/components/ui/Button'

interface AssignmentCardProps {
  assignment: any
  onAction: (action: string, data?: any) => void
  onViewDetails: () => void
}

export function AssignmentCard({ assignment, onAction, onViewDetails }: AssignmentCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700'
      case 'rejected':
        return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700'
      case 'completed':
        return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700'
      case 'rescheduled':
        return 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700'
      default:
        return 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="w-4 h-4" />
      case 'rejected':
        return <XCircle className="w-4 h-4" />
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'rescheduled':
        return <Calendar className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const status = assignment.instructor_status || 'pending'
  const isPending = status === 'pending'
  const isWeeklySchedule = assignment.schedule_type === 'weekly'

  return (
    <div className="bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 hover:shadow transition-all duration-150 text-sm sm:text-base">
      <div className="p-3">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                {assignment.class_types?.name || 'Class Assignment'}
              </h3>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
                {getStatusIcon(status)}
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-slate-400">
                <Calendar className="w-4 h-4" />
                <span>{new Date(assignment.date).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-600 dark:text-slate-400">
                <Clock className="w-4 h-4" />
                <span>{assignment.start_time} - {assignment.end_time}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-600 dark:text-slate-400">
                <MapPin className="w-4 h-4" />
                <span className="capitalize">{assignment.schedule_type}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-600 dark:text-slate-400">
                <MapPin className="w-4 h-4" />
                <span className="capitalize">{assignment.schedule_type}</span>
              </div>
            </div>

            {assignment.class_types?.description && (
              <p className="text-gray-600 dark:text-slate-400 mt-3 text-xs sm:text-sm">
                {assignment.class_types.description}
              </p>
            )}

            {assignment.notes && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <MessageCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Assignment Notes:</p>
                    <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-300">{assignment.notes}</p>
                  </div>
                </div>
              </div>
            )}

            {assignment.instructor_status === 'rejected' && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
                <div className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">Assignment Rejected:</p>
                    {assignment.rejection_reason && (
                      <p className="text-xs sm:text-sm text-red-600 dark:text-red-300 mb-1">
                        Reason: {assignment.rejection_reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                    )}
                    {assignment.instructor_response_at && (
                      <p className="text-xs text-red-500 dark:text-red-400">
                        Rejected on: {new Date(assignment.instructor_response_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {assignment.instructor_status === 'rescheduled' && (
              <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">Reschedule Requested:</p>
                    <p className="text-xs sm:text-sm text-purple-600 dark:text-purple-300">
                      {assignment.reschedule_requested_date && new Date(assignment.reschedule_requested_date).toLocaleDateString()}
                      {assignment.reschedule_requested_time && ` at ${assignment.reschedule_requested_time}`}
                    </p>
                    {assignment.reschedule_reason && (
                      <p className="text-xs text-purple-500 dark:text-purple-400 mt-1">{assignment.reschedule_reason}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {assignment.instructor_remarks && (
              <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-1">Your Remarks:</p>
                    <p className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-300">{assignment.instructor_remarks}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 ml-2">
            <Button
              onClick={onViewDetails}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <MoreHorizontal className="w-4 h-4" />
              Actions
            </Button>
          </div>
        </div>

        {/* Quick Actions for Pending Assignments */}
        {isPending && !isWeeklySchedule && (
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-slate-600">
            <Button
              onClick={() => onAction('accept')}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Accept
            </Button>
            <Button
              onClick={() => onAction('reject')}
              variant="outline"
              size="sm"
              className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20 flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </Button>
            <Button
              onClick={onViewDetails}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Reschedule
            </Button>
          </div>
        )}

        {/* Info for Weekly Schedules */}
        {isWeeklySchedule && (
          <div className="pt-4 border-t border-gray-200 dark:border-slate-600">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Recurring Weekly Class
                </span>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                This is a recurring weekly schedule. Contact admin for any changes.
              </p>
            </div>
          </div>
        )}

        {/* Payment Status */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-slate-600">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600 dark:text-slate-400">Payment Status:</span>
            <span className={`font-medium ${assignment.payment_status === 'paid'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-orange-600 dark:text-orange-400'
              }`}>
              {assignment.payment_status?.charAt(0).toUpperCase() + assignment.payment_status?.slice(1) || 'Pending'}
            </span>
          </div>

          {assignment.assigned_at && (
            <div className="text-xs text-gray-500 dark:text-slate-500">
              Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}