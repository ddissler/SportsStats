import { Outlet } from 'react-router-dom'
import NavBar from './components/NavBar'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <NavBar />
      <main className="container mx-auto px-4 py-10">
        <Outlet />
      </main>
    </div>
  )
}
