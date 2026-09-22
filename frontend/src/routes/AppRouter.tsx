import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { LoginPage } from '../pages/LoginPage'
import { InspectorRoutePage } from '../pages/InspectorRoutePage'
import { AdminDashboardPage } from '../pages/AdminDashboardPage'
import { AdminUsersPage } from '../pages/AdminUsersPage'
import { AdminCatalogPage } from '../pages/AdminCatalogPage'
import { AdminRecordsPage } from '../pages/AdminRecordsPage'
import { RootRedirect } from '../pages/RootRedirect'
import { NotFoundPage } from '../pages/NotFoundPage'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/mi-ruta"
          element={
            <ProtectedRoute allowedRoles={['inspector']}>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<InspectorRoutePage />} />
        </Route>

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="usuarios" element={<AdminUsersPage />} />
          <Route path="catalogo" element={<AdminCatalogPage />} />
          <Route path="registros" element={<AdminRecordsPage />} />
        </Route>

        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
