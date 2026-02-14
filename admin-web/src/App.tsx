import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/dashboard'
import VenueList from './pages/Venues/VenueList'
import VenueForm from './pages/Venues/VenueForm'
import DealList from './pages/Deals/DealList'
import DealForm from './pages/Deals/DealForm'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/venues" element={<VenueList />} />
        <Route path="/venues/new" element={<VenueForm />} />
        <Route path="/venues/:id/edit" element={<VenueForm />} />
        <Route path="/deals" element={<DealList />} />
        <Route path="/deals/new" element={<DealForm />} />
        <Route path="/deals/:id/edit" element={<DealForm />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
