import { createBrowserRouter } from 'react-router-dom'
import App from './App'
import HomePage from './pages/HomePage'
import PlayerSearchPage from './pages/PlayerSearchPage'
import PlayerStatsPage from './pages/PlayerStatsPage'
import AdminPage from './pages/AdminPage'
import NflDfsPage from './pages/NflDfsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      // NFL: DFS home page at /sport/nfl, player search at /sport/nfl/search
      { path: 'sport/nfl', element: <NflDfsPage /> },
      { path: 'sport/nfl/search', element: <PlayerSearchPage /> },
      // All other sports
      { path: 'sport/:sportSlug', element: <PlayerSearchPage /> },
      { path: 'sport/:sportSlug/player/:playerId', element: <PlayerStatsPage /> },
      { path: 'admin', element: <AdminPage /> },
    ],
  },
])
