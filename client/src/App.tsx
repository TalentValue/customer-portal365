import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useUIStore } from '@/store/uiStore'
import { Toaster } from '@/components/ui/toaster'
import { useSessionRestore } from '@/hooks/useSessionRestore'

// Layouts
import { AuthLayout } from '@/layouts/AuthLayout'
import { AdminLayout } from '@/layouts/AdminLayout'
import { ClientLayout } from '@/layouts/ClientLayout'

// Auth pages
import Login from '@/pages/auth/Login'
import AcceptInvite from '@/pages/auth/AcceptInvite'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import ResetPassword from '@/pages/auth/ResetPassword'

// Admin pages
import Dashboard from '@/pages/admin/Dashboard'
import Companies from '@/pages/admin/Companies'
import CompanyDetail from '@/pages/admin/CompanyDetail'
import Contacts from '@/pages/admin/Contacts'
import ContactDetail from '@/pages/admin/ContactDetail'
import Tickets from '@/pages/admin/Tickets'
import TicketDetail from '@/pages/admin/TicketDetail'
import Analytics from '@/pages/admin/Analytics'
import Notifications from '@/pages/admin/Notifications'
import Settings from '@/pages/admin/Settings'
import AuditLogs from '@/pages/admin/AuditLogs'
import Team from '@/pages/admin/Team'
import Templates from '@/pages/admin/Templates'

// Client pages
import ClientDashboard from '@/pages/client/ClientDashboard'
import ClientTickets from '@/pages/client/ClientTickets'
import ClientProfile from '@/pages/client/ClientProfile'

export default function App() {
  const { theme } = useUIStore()
  useSessionRestore()

  useEffect(() => {
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', isDark)
  }, [theme])

  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/accept-invite" element={<AcceptInvite />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        {/* Admin routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="companies" element={<Companies />} />
          <Route path="companies/:id" element={<CompanyDetail />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="contacts/:id" element={<ContactDetail />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="tickets/:id" element={<TicketDetail />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="settings" element={<Settings />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="team" element={<Team />} />
          <Route path="templates" element={<Templates />} />
        </Route>

        {/* Client portal routes */}
        <Route path="/portal" element={<ClientLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ClientDashboard />} />
          <Route path="tickets" element={<ClientTickets />} />
          <Route path="tickets/:id" element={<TicketDetail />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<ClientProfile />} />
        </Route>

        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  )
}
