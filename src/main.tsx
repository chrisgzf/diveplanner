import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App'
import PlannerPage from './routes/PlannerPage'
import LocationsPage from './routes/LocationsPage'
import SharePage from './routes/SharePage'
import './index.css'

const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { path: '/', element: <PlannerPage /> },
      { path: '/locations', element: <LocationsPage /> },
    ],
  },
  { path: '/share/:hash', element: <SharePage /> },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
