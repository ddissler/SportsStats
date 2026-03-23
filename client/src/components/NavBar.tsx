import { Link, useLocation } from 'react-router-dom'

export default function NavBar() {
  const location = useLocation()

  return (
    <nav className="bg-gray-900 border-b border-gray-700 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-white font-bold text-xl tracking-tight hover:text-blue-400 transition-colors">
          <span className="text-2xl">🏆</span>
          <span>SportsStats</span>
        </Link>
        <div className="flex items-center gap-6 text-sm text-gray-400">
          <Link
            to="/admin"
            className={`hover:text-white transition-colors ${location.pathname === '/admin' ? 'text-white font-medium' : ''}`}
          >
            Admin
          </Link>
        </div>
      </div>
    </nav>
  )
}
