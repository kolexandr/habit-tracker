import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Regpage from './pages/Regpage.tsx'
import {createBrowserRouter, Navigate, RouterProvider} from "react-router-dom"
import Library from './pages/Library.tsx'
import ProfilePage from './pages/Profile.tsx'
import Dashboard from './pages/Dashboard.tsx'
import LandingPage from './pages/LandingPage.tsx'
import ProtectedLayout from './components/auth/ProtectedLayout.tsx'
import PublicOnlyRoute from './components/auth/PublicOnlyRoute.tsx'
import { AuthProvider } from './context/AuthContext.tsx'

const router = createBrowserRouter([
  {path: "/", element:<LandingPage/>},
  {path: "/auth", element:<PublicOnlyRoute><Regpage/></PublicOnlyRoute>},
  {path: "/register", element:<Navigate to="/auth" replace />},
  {path:"/", element:<ProtectedLayout/>, children:[
    {path:"app", element: <App/>},
    {path:"dashboard", element:<Dashboard/>},
    {path:"library", element:<Library/>},
    {path:"profile", element:<ProfilePage/>}
  ]}
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router}/>
    </AuthProvider>
  </StrictMode>,
)
