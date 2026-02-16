import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { PostProvider } from './context/PostContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Explore } from './pages/Explore';
import { Notifications } from './pages/Notifications';
import { AiInsights } from './pages/AiInsights';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { AdminDashboard } from './pages/AdminDashboard';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ResetPassword } from './pages/ResetPassword';
import { ProtectedRoute } from './components/ProtectedRoute';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <PostProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="explore" element={<Explore />} />

                  {/* Protected Routes */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="notifications" element={<Notifications />} />
                    <Route path="ai-insights" element={<AiInsights />} />
                    <Route path="profile/:handle?" element={<Profile />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="admin" element={<AdminDashboard />} />
                  </Route>

                  <Route path="*" element={<Home />} />
                </Route>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/reset-password" element={<ResetPassword />} />
              </Routes>
            </BrowserRouter>
          </PostProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
