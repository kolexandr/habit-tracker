import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Regpage from './pages/Regpage.tsx'
import {createBrowserRouter, RouterProvider} from "react-router-dom"
import AppLayout from './components/layout/AppLayout.tsx'
import Library from './pages/Library.tsx'
import ProfilePage from './pages/Profile.tsx'
import Dashboard from './pages/Dashboard.tsx'

const router = createBrowserRouter([
  {path: "/register", element:<Regpage/>},
  {path:"/", element:<AppLayout/>, children:[
    {index:true, element: <App/>},
    {path:"dashboard", element:<Dashboard/>},
    {path:"library", element:<Library/>},
    {path:"profile", element:<ProfilePage/>}
  ]}
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router}/>
  </StrictMode>,
)
