// src/shared/components/navigation/RoleBasedNavigation.tsx

import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getModulesForRole, ModuleConfig } from '../../config/roleConfig'
import { User } from '../../types/user'

interface RoleBasedNavigationProps {
  user: User
  className?: string
}

const RoleBasedNavigation: React.FC<RoleBasedNavigationProps> = ({ user, className = '' }) => {
  const location = useLocation()

  // Support multiple assigned roles on the user: aggregate modules (union, dedupe, ordered)
  const roles: string[] = (user as any).roles && (user as any).roles.length > 0 ? (user as any).roles : [user.role]

  const modulesById: Record<string, ModuleConfig> = {}
  roles.forEach((r: string) => {
    getModulesForRole(r as any).forEach((m: ModuleConfig) => {
      if (!modulesById[m.id] || m.order < modulesById[m.id].order) {
        modulesById[m.id] = m
      }
    })
  })

  const modules: ModuleConfig[] = Object.values(modulesById).sort((a, b) => a.order - b.order)

  const isActive = (moduleId: string): boolean => {
    const currentPath = location.pathname
    return currentPath.includes(`/dashboard/${moduleId}`)
  }

  const getIconElement = (iconName?: string) => {
    const iconMap: Record<string, string> = {
      dashboard: '📊',
      users: '👥',
      attendance: '📝',
      teacher: '🧑‍🏫',
      'credit-card': '💳',
      settings: '⚙️',
      edit: '✏️',
      user: '👤',
      calendar: '📅',
      schedule: '🗓️',
      'bar-chart': '📈',
      'file-text': '📄',
      'message-square': '💬',
      mail: '📧',
      'dollar-sign': '💰',
      book: '📚',
      layers: '📋',
      'graduation-cap': '🎓',
      'check-circle': '✅'
    }

    return iconMap[iconName || 'dashboard'] || '📋'
  }

  return (
    <nav className={`role-based-navigation ${className}`}>
      {/* Header for larger screens */}
      <div className="hidden sm:block mb-6">
        <div className="px-4">
          <h3 className="text-xl font-bold">Dashboard</h3>
          <div className="text-xs text-gray-500 mt-1">{user.role.replace('_', ' ').toUpperCase()}</div>
        </div>
      </div>

      {/* Mobile: filled, pill-style horizontal tabs */}
      <div className="block sm:hidden bg-white shadow-sm sticky top-0 z-30">
        <div className="px-3 py-2 overflow-x-auto">
          <div className="flex gap-2">
            {modules.map((module: ModuleConfig) => {
              const active = isActive(module.id)
              return (
                <Link
                  key={module.id}
                  to={`/dashboard/${module.id}`}
                  className={`flex items-center gap-3 whitespace-nowrap px-4 py-2 rounded-full transition-colors duration-200 ${active ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  <span className={`inline-flex items-center justify-center h-6 w-6 rounded-md ${active ? 'bg-white/20' : 'bg-transparent'}`}>
                    <span className="text-sm">{getIconElement(module.icon)}</span>
                  </span>
                  <span className="text-sm font-medium">{module.title}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Desktop: vertical navigation */}
      <div className="hidden sm:block">
        <ul className="space-y-1">
          {modules.map((module: ModuleConfig) => {
            const active = isActive(module.id)
            return (
              <li key={module.id}>
                <Link
                  to={`/dashboard/${module.id}`}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors duration-150 ${active ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-600' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <span className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-gray-100 text-sm">
                    {getIconElement(module.icon)}
                  </span>
                  <span className="font-medium">{module.title}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}

export default RoleBasedNavigation
