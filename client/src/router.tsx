import { createBrowserRouter } from 'react-router-dom'
import App from './App'
import HomePage from './pages/HomePage'
import PlayerSearchPage from './pages/PlayerSearchPage'
import PlayerStatsPage from './pages/PlayerStatsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'sport/:sportSlug', element: <PlayerSearchPage /> },
      { path: 'sport/:sportSlug/player/:playerId', element: <PlayerStatsPage /> },
    ],
  },
])
