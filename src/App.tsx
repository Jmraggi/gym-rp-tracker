import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CalculatorPage } from './pages/CalculatorPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { WelcomePage } from './pages/WelcomePage'
import { ProtectedRoute } from './routes/ProtectedRoute'
import './App.css'

function App() {
  return <HashRouter>
    <Routes>
      <Route element={<WelcomePage />} path="/" />
      <Route element={<LoginPage />} path="/login" />
      <Route element={<CalculatorPage />} path="/calculator" />
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardPage />} path="/dashboard" />
      </Route>
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  </HashRouter>
}

export default App
