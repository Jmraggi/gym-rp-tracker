import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CalculatorPage } from './pages/CalculatorPage'
import { AccountPage } from './pages/AccountPage'
import { DashboardPage } from './pages/DashboardPage'
import { HistoryPage } from './pages/HistoryPage'
import { LoginPage } from './pages/LoginPage'
import { WelcomePage } from './pages/WelcomePage'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { PrivateShell } from './routes/PrivateShell'
import { PwaUpdatePrompt } from './components/PwaUpdatePrompt'
import './App.css'

function App() {
  return <>
    <PwaUpdatePrompt />
    <HashRouter>
    <Routes>
      <Route element={<WelcomePage />} path="/" />
      <Route element={<LoginPage />} path="/login" />
      <Route element={<CalculatorPage />} path="/calculator" />
      <Route element={<ProtectedRoute />}>
        <Route element={<PrivateShell />}>
          <Route element={<DashboardPage />} path="/dashboard" />
          <Route element={<AccountPage />} path="/account" />
          <Route element={<HistoryPage />} path="/history" />
        </Route>
      </Route>
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
    </HashRouter>
  </>
}

export default App
