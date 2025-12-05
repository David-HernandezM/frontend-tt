// Se importan los modulos que se utilizaran para 
// "compilar" el frontend a un formato adecuado para 
// que los usuarios accedan desde su navegador
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import routes from './routes/index.tsx'
import './index.css'

// Funcion que inyectara el "código" compilado de react a un archivo 
// html
createRoot(document.getElementById('root')!).render(
  // Etiqueta de react para asegurar el correcto funcionamiento de react
  <StrictMode>
    {/* Etiqueta que junta todas las rutas a las cuales podra acceder el usuario */}
    <RouterProvider router={routes} />
  </StrictMode>,
)

