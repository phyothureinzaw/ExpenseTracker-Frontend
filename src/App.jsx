import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedLayout } from './components/ProtectedLayout'
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute'
import { PageNotFound } from './components/RouteStates'
import { DashboardPage } from './pages/DashboardPage'
import { HealthPage } from './pages/HealthPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { CategoriesPage } from './pages/CategoriesPage'
import { ExpensesPage } from './pages/ExpensesPage'
import { BudgetsPage } from './pages/BudgetsPage'
import { SettingsPage } from './pages/SettingsPage'
import { RecurringPage } from './pages/RecurringPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<ProtectedLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="budgets" element={<BudgetsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="recurring" element={<RecurringPage />} />
          </Route>
        </Route>

        <Route path="/health" element={<HealthPage />} />
        <Route path="/404" element={<PageNotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
