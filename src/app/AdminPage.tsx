import { AuthProvider, useAuth } from "../lib/authContext";
import { AdminLogin } from "../components/AdminLogin";
import { AdminDashboard } from "../components/AdminDashboard";

function AdminInner() {
  const { user, profile, loading } = useAuth();
  const isAuthenticated = !!user && !!profile && profile.active;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={() => {}} />;
  }

  return <AdminDashboard onLogout={() => {}} />;
}

export default function AdminPage() {
  return (
    <AuthProvider>
      <AdminInner />
    </AuthProvider>
  );
}
