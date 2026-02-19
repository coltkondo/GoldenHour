import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth, AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import Dashboard from './pages/dashboard'
import VenueList from './pages/Venues/VenueList'
import VenueForm from './pages/Venues/VenueForm'
import DealList from './pages/Deals/DealList'
import DealForm from './pages/Deals/DealForm'
import PendingReview from './pages/Submissions/PendingReview'
import ReviewDetail from './pages/Submissions/ReviewDetail'
import LoginPage from './pages/auth/LoginPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/venues" element={<VenueList />} />
        <Route path="/venues/new" element={<VenueForm />} />
        <Route path="/venues/:id/edit" element={<VenueForm />} />
        <Route path="/deals" element={<DealList />} />
        <Route path="/deals/new" element={<DealForm />} />
        <Route path="/deals/:id/edit" element={<DealForm />} />
        <Route path="/submissions" element={<PendingReview />} />
        <Route path="/submissions/:id" element={<ReviewDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
