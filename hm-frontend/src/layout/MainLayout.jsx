import { Link, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Package, BarChart3, Stethoscope } from "lucide-react";

export default function MainLayout() {
  const { pathname } = useLocation();

  const navItems = [
    { name: "Dashboard", icon: <LayoutDashboard size={18} />, path: "/" },
    { name: "Patients", icon: <Users size={18} />, path: "/patients" },
    { name: "Inventory", icon: <Package size={18} />, path: "/inventory" },
    { name: "Reports", icon: <BarChart3 size={18} />, path: "/reports" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md p-4 hidden md:block">
        <div className="flex items-center gap-2 mb-8 text-primary font-bold text-lg">
          <Stethoscope /> Naitiri Jambo HMS
        </div>
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 p-2 rounded-lg hover:bg-blue-100 ${pathname === item.path ? "bg-blue-100 text-primary font-semibold" : ""
                }`}
            >
              {item.icon} {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}
