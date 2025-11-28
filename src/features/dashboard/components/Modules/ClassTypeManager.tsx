import { Archive, Award, Edit, Eye, Package, Plus, RotateCcw, Save, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../../../../shared/components/ui/Button'
import { LoadingSpinner } from '../../../../shared/components/ui/LoadingSpinner'
import { ResponsiveActionButton } from '../../../../shared/components/ui/ResponsiveActionButton'
import { supabase } from '../../../../shared/lib/supabase'
import { useAuth } from '../../../auth/contexts/AuthContext'; // Add this import

interface ClassType {
  id?: string
  name: string
  description: string
  difficulty_level: string
  price: number
  duration_minutes: number
  max_participants: number
  is_active: boolean
  is_archived?: boolean
  archived_at?: string
  created_by?: string  // Add these fields for RLS
  updated_by?: string
}

interface ClassPackage {
  id?: string
  name: string
  description?: string
  class_count: number
  price: number
  validity_days?: number
  class_type_restrictions?: string[]
  is_active?: boolean
  is_archived: boolean
  archived_at?: string
  type?: 'Individual' | 'Corporate' | 'Private group'
  duration?: string
  course_type?: 'regular' | 'crash'
  created_at?: string
  updated_at?: string
}

// Add interfaces for role checking
interface UserProfile {
  id: string
  user_id: string
  full_name?: string
  email?: string
  roles?: string[]
  hasRole?: (roleName: string) => boolean
  [key: string]: any
}

export function ClassTypeManager() {
  const { user } = useAuth() // Add this
  const [classTypes, setClassTypes] = useState<ClassType[]>([])
  const [archivedClassTypes, setArchivedClassTypes] = useState<ClassType[]>([])
  const [packages, setPackages] = useState<ClassPackage[]>([])
  const [archivedPackages, setArchivedPackages] = useState<ClassPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingClassType, setEditingClassType] = useState<ClassType | null>(null)
  const [editingPackage, setEditingPackage] = useState<ClassPackage | null>(null)
  const [errors, setErrors] = useState<any>({})
  const [mainTab, setMainTab] = useState<'classtypes' | 'packages'>('classtypes')
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active')
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null) // Update type
  const [durationNumber, setDurationNumber] = useState<number>(1)
  const [durationUnit, setDurationUnit] = useState<string>('weeks')

  const [formData, setFormData] = useState<ClassType>({
    name: '',
    description: '',
    difficulty_level: 'beginner',
    price: 800,
    duration_minutes: 60,
    max_participants: 20,
    is_active: true,
    is_archived: false
  })

  const [packageFormData, setPackageFormData] = useState<ClassPackage>({
    name: '',
    description: '',
    class_count: 1,
    price: 800,
    validity_days: 90,
    class_type_restrictions: [],
    is_active: true,
    is_archived: false,
    type: 'Individual',
    course_type: 'regular',
    duration: ''
  })

  const difficultyLevels = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ]

  const packageTypes = [
    { value: 'Individual', label: 'Individual' },
    { value: 'Corporate', label: 'Corporate' },
    { value: 'Private group', label: 'Private group' }
  ]

  const courseTypes = [
    { value: 'regular', label: 'Regular' },
    { value: 'crash', label: 'Crash' }
  ]

  const durationUnits = [
    { value: 'day', label: 'Day' },
    { value: 'days', label: 'Days' },
    { value: 'week', label: 'Week' },
    { value: 'weeks', label: 'Weeks' },
    { value: 'month', label: 'Month' },
    { value: 'months', label: 'Months' }
  ]

  // Add this useEffect to fetch user profile and check permissions from user_roles table
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        try {
          // First get the user's basic profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single()

          if (profileError) {
            console.error('Error fetching user profile:', profileError)
            return
          }

          // Then get the user's roles from user_roles table
          const { data: userRoles, error: rolesError } = await supabase
            .from('user_roles')
            .select(`
              role_id,
              roles!inner(name)
            `)
            .eq('user_id', user.id)

          if (rolesError) {
            console.error('Error fetching user roles:', rolesError)
            setUserProfile({ ...profile, roles: [] })
            return
          }

          // Extract role names from the joined query - handle the actual structure safely
          let roleNames: string[] = []

          if (userRoles && Array.isArray(userRoles)) {
            roleNames = userRoles
              .map((ur: any) => {
                // Handle both possible structures
                if (ur.roles && typeof ur.roles === 'object') {
                  return ur.roles.name
                }
                return null
              })
              .filter(Boolean) // Remove null values
          }

          console.log('Raw userRoles data:', userRoles) // Debug log to see actual structure
          console.log('Extracted role names:', roleNames)

          const profileWithRoles = {
            ...profile,
            roles: roleNames,
            hasRole: (roleName: string) => roleNames.includes(roleName)
          }

          setUserProfile(profileWithRoles)
          console.log('User profile:', profileWithRoles)
          console.log('User roles:', roleNames)

          // Check if user has required permissions
          const allowedRoles = ['yoga_acharya', 'admin', 'super_admin']
          const hasRequiredRole = roleNames.some(role => allowedRoles.includes(role))

          if (!hasRequiredRole) {
            console.warn('User does not have required role for class management. Current roles:', roleNames)
          }
        } catch (error) {
          console.error('Error checking user permissions:', error)
        }
      }
    }

    fetchUserProfile()
  }, [user])

  useEffect(() => {
    fetchClassTypes()
    fetchPackages()
  }, [])

  const fetchClassTypes = async () => {
    try {
      setLoading(true)

      // Fetch active classes (not archived)
      const { data: activeData, error: activeError } = await supabase
        .from('class_types')
        .select('*')
        .eq('is_archived', false)
        .order('name')

      if (activeError) throw activeError

      // Fetch archived classes
      const { data: archivedData, error: archivedError } = await supabase
        .from('class_types')
        .select('*')
        .eq('is_archived', true)
        .order('archived_at', { ascending: false })

      if (archivedError) throw archivedError

      setClassTypes(activeData || [])
      setArchivedClassTypes(archivedData || [])
    } catch (error) {
      console.error('Error fetching class types:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPackages = async () => {
    try {
      setLoading(true)

      const { data: activeData, error: activeError } = await supabase
        .from('class_packages')
        .select('*')
        .eq('is_archived', false)
        .order('name')

      if (activeError) throw activeError

      const { data: archivedData, error: archivedError } = await supabase
        .from('class_packages')
        .select('*')
        .eq('is_archived', true)
        .order('archived_at', { ascending: false })

      if (archivedError) throw archivedError

      setPackages(activeData || [])
      setArchivedPackages(archivedData || [])
    } catch (error) {
      console.error('Error fetching packages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: '' }))
    }
  }

  const handlePackageInputChange = (field: string, value: any) => {
    setPackageFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: any = {}

    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (formData.price < 0) newErrors.price = 'Price cannot be negative'
    if (formData.duration_minutes < 15) newErrors.duration_minutes = 'Duration must be at least 15 minutes'
    if (formData.max_participants < 1) newErrors.max_participants = 'Max participants must be at least 1'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const parseDuration = (duration: string) => {
    if (!duration) return { number: 1, unit: 'weeks' }

    const match = duration.match(/^(\d+)\s+(week|weeks|month|months|day|days)$/i)
    if (match) {
      return { number: parseInt(match[1]), unit: match[2].toLowerCase() }
    }
    return { number: 1, unit: 'weeks' }
  }

  const formatDuration = (number: number, unit: string) => {
    return `${number} ${unit}`
  }

  const validatePackageForm = () => {
    const newErrors: any = {}

    if (!packageFormData.name.trim()) newErrors.name = 'Name is required'
    if (packageFormData.class_count < 1) newErrors.class_count = 'Class count must be at least 1'
    if (packageFormData.price < 0) newErrors.price = 'Price cannot be negative'

    // Validation based on course type
    if (packageFormData.course_type === 'crash') {
      if (durationNumber < 1) {
        newErrors.duration = 'Duration number must be at least 1'
      }
      if (!durationUnit) {
        newErrors.duration = 'Duration unit is required for crash courses'
      }
    } else if (packageFormData.course_type === 'regular') {
      if (!packageFormData.validity_days || packageFormData.validity_days < 1) {
        newErrors.validity_days = 'Validity days must be at least 1 for regular courses'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Add permission check function
  const checkUserPermissions = () => {
    if (!user) {
      setErrors({ general: 'You must be logged in to perform this action' })
      return false
    }

    if (!userProfile) {
      setErrors({ general: 'User profile not loaded. Please try again.' })
      return false
    }

    const allowedRoles = ['yoga_acharya', 'admin', 'super_admin']
    const userRoles = userProfile.roles || []
    const hasRequiredRole = userRoles.some((role: string) => allowedRoles.includes(role))

    if (!hasRequiredRole) {
      setErrors({
        general: `Access denied. Required roles: ${allowedRoles.join(', ')}. Your roles: ${userRoles.join(', ') || 'none'}`
      })
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    // Check permissions before proceeding
    if (!checkUserPermissions()) return

    try {
      setSaving(true)

      if (editingClassType) {
        const { error } = await supabase
          .from('class_types')
          .update({
            ...formData,
            updated_by: user?.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingClassType.id)

        if (error) throw error
      } else {
        // For new class types, include user tracking fields
        const classTypeData = {
          ...formData,
          is_archived: false,
          created_by: user?.id,
          updated_by: user?.id,
        }

        console.log('Inserting class type with data:', classTypeData)
        console.log('Current user:', user)
        console.log('User profile role:', userProfile?.role)

        const { error } = await supabase
          .from('class_types')
          .insert([classTypeData])

        if (error) {
          console.error('Insert error:', error)
          throw error
        }
      }

      await fetchClassTypes()
      resetForm()
      alert(editingClassType ? 'Class type updated successfully!' : 'Class type created successfully!')
    } catch (error: any) {
      console.error('Error saving class type:', error)

      // More specific error handling for RLS
      if (error.message.includes('row-level security') || error.message.includes('policy')) {
        setErrors({
          general: `Permission denied. Please ensure you have the required role (yoga_acharya, admin, or super_admin). Current roles: ${userProfile?.roles?.join(', ') || 'none'}`
        })
      } else {
        setErrors({ general: error.message })
      }
    } finally {
      setSaving(false)
    }
  }

  const handlePackageSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validatePackageForm()) return
    if (!checkUserPermissions()) return

    try {
      setSaving(true)

      // Prepare data based on course type
      const packageData = {
        ...packageFormData,
        // For crash courses, set validity_days to null and ensure duration is set
        validity_days: packageFormData.course_type === 'crash' ? null : packageFormData.validity_days,
        // For regular courses, set duration to null
        duration: packageFormData.course_type === 'regular' ? null : formatDuration(durationNumber, durationUnit)
      }

      if (editingPackage) {
        const { error } = await supabase
          .from('class_packages')
          .update(packageData)
          .eq('id', editingPackage.id)

        if (error) throw error
      } else {
        const newPackageData = {
          ...packageData
          // is_archived has a default value of false in the database
        }

        const { error } = await supabase
          .from('class_packages')
          .insert([newPackageData])

        if (error) throw error
      }

      await fetchPackages()
      resetForm()
      alert(editingPackage ? 'Package updated successfully!' : 'Package created successfully!')
    } catch (error: any) {
      console.error('Error saving package:', error)

      if (error.message.includes('row-level security') || error.message.includes('policy')) {
        setErrors({
          general: `Permission denied. Please ensure you have the required role (yoga_acharya, admin, or super_admin). Current roles: ${userProfile?.roles?.join(', ') || 'none'}`
        })
      } else {
        setErrors({ general: error.message })
      }
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (classType: ClassType) => {
    if (!checkUserPermissions()) return

    setEditingClassType(classType)
    setFormData({ ...classType })
    setShowForm(true)
  }

  const handleArchive = async (id: string) => {
    if (!checkUserPermissions()) return

    if (!confirm('Are you sure you want to archive this class type? It will be moved to the archived section and all related schedules will be deactivated.')) return

    try {
      setLoading(true)

      // Archive the class type
      const { error: classTypeError } = await supabase
        .from('class_types')
        .update({
          is_archived: true,
          is_active: false,
          archived_at: new Date().toISOString(),
          updated_by: user?.id
        })
        .eq('id', id)

      if (classTypeError) throw classTypeError

      // Deactivate all related class schedules
      const { error: schedulesError } = await supabase
        .from('class_schedules')
        .update({
          is_active: false,
          effective_until: new Date().toISOString().split('T')[0]
        })
        .eq('class_type_id', id)

      if (schedulesError) {
        console.error('Error deactivating schedules:', schedulesError)
        // Continue anyway, class type is already archived
      }

      await fetchClassTypes()
      alert('Class type archived successfully!')
    } catch (error: any) {
      console.error('Error archiving class type:', error)
      alert(`Failed to archive class type: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUnarchive = async (id: string) => {
    if (!checkUserPermissions()) return

    if (!confirm('Are you sure you want to restore this class type from the archive?')) return

    try {
      setLoading(true)

      const { error } = await supabase
        .from('class_types')
        .update({
          is_archived: false,
          is_active: true,
          archived_at: null,
          updated_by: user?.id
        })
        .eq('id', id)

      if (error) throw error

      await fetchClassTypes()
      alert('Class type restored successfully!')
    } catch (error: any) {
      console.error('Error restoring class type:', error)
      alert(`Failed to restore class type: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleEditPackage = (pkg: ClassPackage) => {
    if (!checkUserPermissions()) return

    setEditingPackage(pkg)
    setPackageFormData({ ...pkg })

    // Parse duration if it exists
    if (pkg.duration) {
      const parsed = parseDuration(pkg.duration)
      setDurationNumber(parsed.number)
      setDurationUnit(parsed.unit)
    } else {
      setDurationNumber(1)
      setDurationUnit('weeks')
    }

    setShowForm(true)
  }

  const handleArchivePackage = async (id: string) => {
    if (!checkUserPermissions()) return

    if (!confirm('Are you sure you want to archive this package? It will be moved to the archived section.')) return

    try {
      setLoading(true)

      const { error } = await supabase
        .from('class_packages')
        .update({
          is_archived: true,
          is_active: false,
          archived_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      await fetchPackages()
      alert('Package archived successfully!')
    } catch (error: any) {
      console.error('Error archiving package:', error)
      alert(`Failed to archive package: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUnarchivePackage = async (id: string) => {
    if (!checkUserPermissions()) return

    if (!confirm('Are you sure you want to restore this package from the archive?')) return

    try {
      setLoading(true)

      const { error } = await supabase
        .from('class_packages')
        .update({
          is_archived: false,
          is_active: true,
          archived_at: null
        })
        .eq('id', id)

      if (error) throw error

      await fetchPackages()
      alert('Package restored successfully!')
    } catch (error: any) {
      console.error('Error restoring package:', error)
      alert(`Failed to restore package: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      difficulty_level: 'beginner',
      price: 800,
      duration_minutes: 60,
      max_participants: 20,
      is_active: true,
      is_archived: false
    })
    setPackageFormData({
      name: '',
      description: '',
      class_count: 1,
      price: 800,
      validity_days: 90,
      class_type_restrictions: [],
      is_active: true,
      is_archived: false,
      type: 'Individual',
      course_type: 'regular',
      duration: ''
    })
    setEditingClassType(null)
    setEditingPackage(null)
    setDurationNumber(1)
    setDurationUnit('weeks')
    setShowForm(false)
    setErrors({})
  }

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatPrice = (price: number) => {
    return `₹${price}`
  }

  const formatArchiveDate = (dateString?: string) => {
    if (!dateString) return 'Unknown'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Individual': return 'bg-blue-100 text-blue-800'
      case 'Corporate': return 'bg-purple-100 text-purple-800'
      case 'Private group': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCourseTypeColor = (courseType: string) => {
    switch (courseType) {
      case 'regular': return 'bg-green-100 text-green-800'
      case 'crash': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCourseType = (courseType: string) => {
    switch (courseType) {
      case 'regular': return 'Regular'
      case 'crash': return 'Crash'
      default: return courseType
    }
  }

  // Add role check for UI elements
  const canManageClasses = userProfile && userProfile.roles &&
    userProfile.roles.some((role: string) => ['yoga_acharya', 'admin', 'super_admin'].includes(role))

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Show access denied message if user doesn't have required role
  if (!canManageClasses) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Access Denied</h3>
          <p className="text-red-700">
            You need yoga_acharya, admin, or super_admin role to manage class types.
          </p>
          <p className="text-sm text-red-600 mt-2">
            Current roles: {userProfile?.roles?.join(', ') || 'No roles assigned'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center min-w-0">
          <Award className="w-6 h-6 mr-2" />
          Class & Package Manager
          <span className="ml-2 text-sm bg-blue-100 text-blue-600 px-2 py-1 rounded">
            {userProfile?.roles?.join(', ') || 'No roles'}
          </span>
        </h2>

        {/* Main Tab Navigation */}
        <div className="flex items-center space-x-2 flex-wrap">
          <div className="flex bg-gray-200 rounded-lg p-1">
            <button
              onClick={() => setMainTab('classtypes')}
              className={`px-3 sm:px-4 py-1 sm:py-2 rounded-md text-sm font-medium transition-colors ${mainTab === 'classtypes'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <Award className="w-4 h-4 mr-1 inline" />
              Class Types
            </button>
            <button
              onClick={() => setMainTab('packages')}
              className={`px-3 sm:px-4 py-1 sm:py-2 rounded-md text-sm font-medium transition-colors ${mainTab === 'packages'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <Package className="w-4 h-4 mr-1 inline" />
              Packages
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div></div>
        <div className="flex items-center space-x-2 flex-wrap">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-3 sm:px-4 py-1 sm:py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'active'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Active {mainTab === 'classtypes' ? 'Classes' : 'Packages'} ({mainTab === 'classtypes' ? classTypes.length : packages.length})
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`px-3 sm:px-4 py-1 sm:py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'archived'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <Archive className="w-4 h-4 mr-1 inline" />
              Archived ({mainTab === 'classtypes' ? archivedClassTypes.length : archivedPackages.length})
            </button>
          </div>

          {activeTab === 'active' && (
            <>
              <div className="flex items-center">
                <ResponsiveActionButton
                  onClick={() => setShowForm(true)}
                  className="hidden sm:inline-flex items-center mt-0 ml-3"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add {mainTab === 'classtypes' ? 'Class Type' : 'Package'}
                </ResponsiveActionButton>
              </div>

              {/* Mobile: centered Add button below tabs */}
              <div className="sm:hidden w-full mt-3 flex justify-center">
                <ResponsiveActionButton onClick={() => setShowForm(true)} className="inline-flex items-center px-3 py-2 text-sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add {mainTab === 'classtypes' ? 'Class Type' : 'Package'}
                </ResponsiveActionButton>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  {mainTab === 'classtypes'
                    ? (editingClassType ? 'Edit Class Type' : 'Add New Class Type')
                    : (editingPackage ? 'Edit Package' : 'Add New Package')
                  }
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={mainTab === 'classtypes' ? handleSubmit : handlePackageSubmit} className="p-6 space-y-6">
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{errors.general}</p>
                </div>
              )}

              {/* Class Type Form */}
              {mainTab === 'classtypes' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Class Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                      placeholder="e.g., Hatha Yoga, Vinyasa Flow"
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.description ? 'border-red-500' : 'border-gray-300'
                        }`}
                      placeholder="Describe the class style, benefits, and what students can expect"
                    />
                    {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Difficulty Level *
                      </label>
                      <select
                        value={formData.difficulty_level}
                        onChange={(e) => handleInputChange('difficulty_level', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {difficultyLevels.map(level => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price (₹) *
                      </label>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="1"
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.price ? 'border-red-500' : 'border-gray-300'
                          }`}
                        placeholder="800"
                      />
                      {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                      <p className="text-xs text-gray-500 mt-1">Weekly classes for ₹800/month</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duration (minutes) *
                      </label>
                      <input
                        type="number"
                        value={formData.duration_minutes}
                        onChange={(e) => handleInputChange('duration_minutes', parseInt(e.target.value) || 0)}
                        min="15"
                        max="180"
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.duration_minutes ? 'border-red-500' : 'border-gray-300'
                          }`}
                      />
                      {errors.duration_minutes && <p className="text-red-500 text-sm mt-1">{errors.duration_minutes}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Participants *
                      </label>
                      <input
                        type="number"
                        value={formData.max_participants}
                        onChange={(e) => handleInputChange('max_participants', parseInt(e.target.value) || 0)}
                        min="1"
                        max="50"
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.max_participants ? 'border-red-500' : 'border-gray-300'
                          }`}
                      />
                      {errors.max_participants && <p className="text-red-500 text-sm mt-1">{errors.max_participants}</p>}
                    </div>

                    <div className="flex items-center pt-6">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={formData.is_active}
                        onChange={(e) => handleInputChange('is_active', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                        Active Class Type
                      </label>
                    </div>
                  </div>
                </>
              )}

              {/* Package Form */}
              {mainTab === 'packages' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Package Name *
                      </label>
                      <input
                        type="text"
                        value={packageFormData.name}
                        onChange={(e) => handlePackageInputChange('name', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="e.g., Monthly Unlimited, 8-Class Package"
                      />
                      {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Package Type *
                      </label>
                      <select
                        value={packageFormData.type}
                        onChange={(e) => handlePackageInputChange('type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {packageTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={packageFormData.description || ''}
                      onChange={(e) => handlePackageInputChange('description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe the package benefits and features"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Course Type *
                      </label>
                      <select
                        value={packageFormData.course_type}
                        onChange={(e) => handlePackageInputChange('course_type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {courseTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Class Count *
                      </label>
                      <input
                        type="number"
                        value={packageFormData.class_count}
                        onChange={(e) => handlePackageInputChange('class_count', parseInt(e.target.value) || 0)}
                        min="1"
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.class_count ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.class_count && <p className="text-red-500 text-sm mt-1">{errors.class_count}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price (₹) *
                      </label>
                      <input
                        type="number"
                        value={packageFormData.price}
                        onChange={(e) => handlePackageInputChange('price', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="1"
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.price ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {packageFormData.course_type === 'regular' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Validity Days *
                        </label>
                        <input
                          type="number"
                          value={packageFormData.validity_days}
                          onChange={(e) => handlePackageInputChange('validity_days', parseInt(e.target.value) || 0)}
                          min="1"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.validity_days ? 'border-red-500' : 'border-gray-300'}`}
                          placeholder="90"
                        />
                        {errors.validity_days && <p className="text-red-500 text-sm mt-1">{errors.validity_days}</p>}
                        <p className="text-xs text-gray-500 mt-1">Number of days package remains valid</p>
                      </div>
                    )}

                    {packageFormData.course_type === 'crash' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Duration *
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={durationNumber}
                            onChange={(e) => setDurationNumber(parseInt(e.target.value) || 1)}
                            min="1"
                            className={`w-1/2 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.duration ? 'border-red-500' : 'border-gray-300'}`}
                            placeholder="1"
                          />
                          <select
                            value={durationUnit}
                            onChange={(e) => setDurationUnit(e.target.value)}
                            className={`w-1/2 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.duration ? 'border-red-500' : 'border-gray-300'}`}
                          >
                            {durationUnits.map(unit => (
                              <option key={unit.value} value={unit.value}>
                                {unit.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        {errors.duration && <p className="text-red-500 text-sm mt-1">{errors.duration}</p>}
                        <p className="text-xs text-gray-500 mt-1">Select duration number and time unit</p>
                      </div>
                    )}

                    <div className="flex items-center pt-6">
                      <input
                        type="checkbox"
                        id="package_is_active"
                        checked={packageFormData.is_active}
                        onChange={(e) => handlePackageInputChange('is_active', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="package_is_active" className="ml-2 block text-sm text-gray-900">
                        Active Package
                      </label>
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={saving}
                  className="flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' :
                    mainTab === 'classtypes'
                      ? (editingClassType ? 'Update' : 'Create')
                      : (editingPackage ? 'Update' : 'Create')
                  }
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Active Content Tab */}
      {activeTab === 'active' && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {(mainTab === 'classtypes' ? classTypes.length === 0 : packages.length === 0) ? (
            <div className="text-center py-12">
              <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No active {mainTab === 'classtypes' ? 'class types' : 'packages'}
              </h3>
              <p className="text-gray-600 mb-4">
                Create your first {mainTab === 'classtypes' ? 'class type' : 'package'} to get started.
              </p>
              <div className="flex items-center justify-center">
                <ResponsiveActionButton onClick={() => setShowForm(true)} className="hidden sm:inline-flex mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Add {mainTab === 'classtypes' ? 'Class Type' : 'Package'}
                </ResponsiveActionButton>

                <ResponsiveActionButton onClick={() => setShowForm(true)} className="sm:hidden mt-4 inline-flex items-center px-3 py-2 text-sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </ResponsiveActionButton>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 sm:p-6">
              {/* Class Types Grid */}
              {mainTab === 'classtypes' && classTypes.map((classType) => (
                <div
                  key={classType.id}
                  className={`border rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow ${classType.is_active ? 'border-gray-200' : 'border-gray-300 bg-gray-50'
                    }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{classType.name}</h3>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEdit(classType)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleArchive(classType.id!)}
                        className="text-orange-600 hover:text-orange-800 p-1"
                        title="Archive Class"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4">{classType.description}</p>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Difficulty:</span>
                      <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(classType.difficulty_level)}`}>
                        {classType.difficulty_level}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Price:</span>
                      <span className="font-semibold text-green-600">{formatPrice(classType.price)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Duration:</span>
                      <span className="text-sm">{classType.duration_minutes} min</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Max Participants:</span>
                      <span className="text-sm">{classType.max_participants}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Status:</span>
                      <span className={`px-2 py-1 rounded text-xs ${classType.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                        }`}>
                        {classType.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {classType.price === 800 && (
                    <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                      💡 Weekly classes for ₹800/month
                    </div>
                  )}
                </div>
              ))}

              {/* Packages Grid */}
              {mainTab === 'packages' && packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`border rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow ${pkg.is_active ? 'border-gray-200' : 'border-gray-300 bg-gray-50'}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{pkg.name}</h3>
                      <div className="flex space-x-2 mt-2">
                        <span className={`px-2 py-1 rounded text-xs ${getTypeColor(pkg.type || '')}`}>
                          {pkg.type}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${getCourseTypeColor(pkg.course_type || '')}`}>
                          {formatCourseType(pkg.course_type || '')}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEditPackage(pkg)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleArchivePackage(pkg.id!)}
                        className="text-orange-600 hover:text-orange-800 p-1"
                        title="Archive Package"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {pkg.description && (
                    <p className="text-gray-600 text-sm mb-4">{pkg.description}</p>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Class Count:</span>
                      <span className="font-medium">{pkg.class_count}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Price:</span>
                      <span className="font-semibold text-green-600">{formatPrice(pkg.price)}</span>
                    </div>

                    {pkg.course_type === 'regular' && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Validity:</span>
                        <span className="text-sm">{pkg.validity_days} days</span>
                      </div>
                    )}

                    {pkg.course_type === 'crash' && pkg.duration && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Duration:</span>
                        <span className="text-sm">{pkg.duration}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Status:</span>
                      <span className={`px-2 py-1 rounded text-xs ${pkg.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                        }`}>
                        {pkg.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {pkg.course_type === 'crash' && (
                    <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800">
                      ⚡ Crash Course - Intensive training program
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Archived Content Tab */}
      {activeTab === 'archived' && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {(mainTab === 'classtypes' ? archivedClassTypes.length === 0 : archivedPackages.length === 0) ? (
            <div className="text-center py-12">
              <Archive className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No archived {mainTab === 'classtypes' ? 'class types' : 'packages'}
              </h3>
              <p className="text-gray-600">
                Archived {mainTab === 'classtypes' ? 'class types' : 'packages'} will appear here for future reference.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 sm:p-6">
              {/* Archived Class Types Grid */}
              {mainTab === 'classtypes' && archivedClassTypes.map((classType) => (
                <div
                  key={classType.id}
                  className="border border-orange-200 bg-orange-50 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{classType.name}</h3>
                      <p className="text-xs text-orange-600 mt-1">
                        📦 Archived on {formatArchiveDate(classType.archived_at)}
                      </p>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEdit(classType)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleUnarchive(classType.id!)}
                        className="text-green-600 hover:text-green-800 p-1"
                        title="Restore from Archive"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4">{classType.description}</p>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Difficulty:</span>
                      <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(classType.difficulty_level)}`}>
                        {classType.difficulty_level}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Price:</span>
                      <span className="font-semibold text-green-600">{formatPrice(classType.price)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Duration:</span>
                      <span className="text-sm">{classType.duration_minutes} min</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Max Participants:</span>
                      <span className="text-sm">{classType.max_participants}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Status:</span>
                      <span className="px-2 py-1 rounded text-xs bg-orange-100 text-orange-800">
                        Archived
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 p-2 bg-orange-100 border border-orange-200 rounded text-xs text-orange-800">
                    📦 This class is archived. Click restore to make it active again.
                  </div>
                </div>
              ))}

              {/* Archived Packages Grid */}
              {mainTab === 'packages' && archivedPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="border border-orange-200 bg-orange-50 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{pkg.name}</h3>
                      <p className="text-xs text-orange-600 mt-1">
                        📦 Archived on {formatArchiveDate(pkg.archived_at)}
                      </p>
                      <div className="flex space-x-2 mt-2">
                        <span className={`px-2 py-1 rounded text-xs ${getTypeColor(pkg.type || '')}`}>
                          {pkg.type}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${getCourseTypeColor(pkg.course_type || '')}`}>
                          {formatCourseType(pkg.course_type || '')}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEditPackage(pkg)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleUnarchivePackage(pkg.id!)}
                        className="text-green-600 hover:text-green-800 p-1"
                        title="Restore from Archive"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {pkg.description && (
                    <p className="text-gray-600 text-sm mb-4">{pkg.description}</p>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Class Count:</span>
                      <span className="font-medium">{pkg.class_count}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Price:</span>
                      <span className="font-semibold text-green-600">{formatPrice(pkg.price)}</span>
                    </div>

                    {pkg.course_type === 'regular' && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Validity:</span>
                        <span className="text-sm">{pkg.validity_days} days</span>
                      </div>
                    )}

                    {pkg.course_type === 'crash' && pkg.duration && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Duration:</span>
                        <span className="text-sm">{pkg.duration}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Status:</span>
                      <span className="px-2 py-1 rounded text-xs bg-orange-100 text-orange-800">
                        Archived
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 p-2 bg-orange-100 border border-orange-200 rounded text-xs text-orange-800">
                    📦 This package is archived. Click restore to make it active again.
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ClassTypeManager;