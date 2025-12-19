import { Save, X } from 'lucide-react'
import { useState } from 'react'
import { supabase } from '../../../../../../shared/lib/supabase'

interface QuickBookingFormProps {
    onBookingCreated: (bookingId: string) => void
    onCancel: () => void
}

export const QuickBookingForm = ({ onBookingCreated, onCancel }: QuickBookingFormProps) => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        booking_type: 'individual' as 'individual' | 'private_group' | 'public_group' | 'corporate',
        class_package_id: ''
    })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSaving(true)

        try {
            // Generate booking_id in format YOG-YYYYMMDD-XXXX
            const today = new Date()
            const dateStr = today.toISOString().split('T')[0].replace(/-/g, '')
            const random = Math.floor(1000 + Math.random() * 9000)
            const booking_id = `YOG-${dateStr}-${random}`

            // Get current user
            const { data: { user } } = await supabase.auth.getUser()
            
            const bookingData: any = {
                booking_id,
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email,
                phone: formData.phone,
                booking_type: formData.booking_type,
                class_package_id: formData.class_package_id || null,
                status: 'confirmed',
                class_name: 'Quick Booking',
                class_date: today.toISOString().split('T')[0],
                class_time: '09:00',
                instructor: 'TBD',
                experience_level: 'beginner',
                payment_status: 'pending',
                user_id: user?.id || null
            }

            console.log('Creating booking with data:', bookingData)

            const { data: insertedBooking, error: insertError } = await supabase
                .from('bookings')
                .insert([bookingData])
                .select()
                .single()

            console.log('Insert result:', { insertedBooking, insertError })

            if (insertError) {
                console.error('Insert error details:', insertError)
                throw insertError
            }

            if (!insertedBooking) {
                throw new Error('Booking was not created - no data returned')
            }

            console.log('✅ Booking created successfully:', insertedBooking.id)
            onBookingCreated(booking_id)
        } catch (err: any) {
            console.error('Failed to create booking:', err)
            
            // Better error messages for common issues
            let errorMessage = 'Failed to create booking'
            
            if (err.message) {
                if (err.message.includes('row-level security') || err.message.includes('RLS')) {
                    errorMessage = 'Permission denied. Please ensure you have admin access to create bookings.'
                } else if (err.message.includes('duplicate') || err.message.includes('unique')) {
                    errorMessage = 'This booking ID already exists. Please try again.'
                } else {
                    errorMessage = err.message
                }
            }
            
            setError(errorMessage)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-blue-900">Quick Booking</h3>
                <button
                    type="button"
                    onClick={onCancel}
                    className="text-blue-600 hover:text-blue-800"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.first_name}
                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.last_name}
                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Booking Type <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={formData.booking_type}
                        onChange={(e) => setFormData({ ...formData, booking_type: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        required
                    >
                        <option value="individual">Individual</option>
                        <option value="private_group">Private Group</option>
                        <option value="public_group">Public Group</option>
                        <option value="corporate">Corporate</option>
                    </select>
                </div>

                {error && (
                    <div className="text-red-600 text-sm">{error}</div>
                )}

                <div className="flex justify-end space-x-2 pt-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                        disabled={saving}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-flex items-center"
                        disabled={saving}
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Creating...' : 'Create Booking'}
                    </button>
                </div>
            </form>
        </div>
    )
}
