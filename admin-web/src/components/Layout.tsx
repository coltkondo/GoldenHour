import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/venues', label: 'Bars' },
  { to: '/deals', label: 'Deals' },
]

export default function Layout() {
  return (
    <div className="layout">
      <nav className="sidebar">
        <div className="sidebar-brand">
          <h2>Golden Hour</h2>
          <span className="sidebar-subtitle">Admin</span>
        </div>
        <ul className="nav-list">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="sidebar-footer">
          <a href="/api/v1/admin/export/venues.csv" className="export-link">Export Bars CSV</a>
          <a href="/api/v1/admin/export/deals.csv" className="export-link">Export Deals CSV</a>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
