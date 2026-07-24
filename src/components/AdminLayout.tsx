import { ReactNode } from "react";
import { Package, ShoppingCart, BarChart3, LogOut, Users, User, ChevronDown } from "lucide-react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import logo from "@/imports/ChatGPT_Image_24_juil._2026__05_40_23-removebg-preview.png";
import { useAuth } from "../lib/authContext";

export type AdminView = "products" | "orders" | "dashboard" | "users" | "profile";

interface AdminLayoutProps {
  children: ReactNode;
  currentView: AdminView;
  onViewChange: (view: AdminView) => void;
  // kept for backward-compat but ignored — use useAuth().signOut instead
  onLogout?: () => void;
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

export function AdminLayout({ children, currentView, onViewChange }: AdminLayoutProps) {
  const { profile, isAdmin, signOut } = useAuth();

  const adminNav: { id: AdminView; label: string; icon: typeof BarChart3 }[] = [
    { id: "dashboard", label: "Tableau de bord", icon: BarChart3 },
    { id: "orders",    label: "Commandes",        icon: ShoppingCart },
    { id: "products",  label: "Produits",          icon: Package },
    { id: "users",     label: "Utilisateurs",      icon: Users },
  ];

  const employeeNav: { id: AdminView; label: string; icon: typeof BarChart3 }[] = [
    { id: "orders",   label: "Commandes", icon: ShoppingCart },
    { id: "products", label: "Produits",  icon: Package },
  ];

  const navItems = isAdmin ? adminNav : employeeNav;
  const roleLabel = isAdmin ? "Administrateur" : "Employé";
  const roleBadgeClass = isAdmin
    ? "bg-blue-50 text-blue-700 ring-blue-200"
    : "bg-emerald-50 text-emerald-700 ring-emerald-200";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ImageWithFallback src={logo} alt="IEKE" className="h-7 w-auto object-contain" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">Admin</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onViewChange("profile")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors ${currentView === "profile" ? "bg-gray-100" : ""}`}
            >
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                {profile ? initials(profile.full_name) : <User className="w-4 h-4" />}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-medium text-gray-900 leading-tight">{profile?.full_name ?? "…"}</div>
                <div className={`text-xs font-medium px-1.5 py-0.5 rounded-full ring-1 ring-inset inline-block ${roleBadgeClass}`}>
                  {roleLabel}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
            </button>

            <button
              onClick={signOut}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50"
              title="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      {/* Nav tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1">
            {navItems.map(({ id, label, icon: Icon }) => {
              const active = currentView === id;
              return (
                <button
                  key={id}
                  onClick={() => onViewChange(id)}
                  className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    active
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-200"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {children}
      </main>
    </div>
  );
}
