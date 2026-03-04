import React, { useContext, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useSidebar } from "../context/SidebarContext";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Package,
  DollarSign,
  UsersIcon,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  Info,
  ClipboardList,
  Cog,
  Pill,
  BarChart3,
  Microscope,
  Database,
} from "lucide-react";

const Sidebar = () => {
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const { isCollapsed, isMobileMenuOpen, toggleSidebar, closeMobileMenu } = useSidebar();
  const role = user?.role || localStorage.getItem("role");

  const [hoveredItem, setHoveredItem] = useState(null);
  const [queueCount, setQueueCount] = useState(0);

  // Fetch queue count for badge
  useEffect(() => {
    const fetchQueueCount = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/queue`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json",
          },
        });

        if (res.ok) {
          const data = await res.json();
          // Count only "waiting" status
          const waitingCount = data.filter(item => item.status === 'waiting').length;
          setQueueCount(waitingCount);
        }
      } catch (err) {
        console.error("Error fetching queue count:", err);
      }
    };

    fetchQueueCount();
    // No polling - manual refresh only for cost optimization
  }, []);

  const menu = [
    {
      name: "Dashboard",
      path: "/dashboard",
      roles: ["admin", "doctor", "reception"],
      icon: <LayoutDashboard className="w-5 h-5" />
    },
    {
      name: "Queue",
      path: "/queue",
      roles: ["admin", "doctor", "reception", "facility_clerk"],
      icon: <ClipboardList className="w-5 h-5" />,
      badge: queueCount
    },
    {
      name: "Appointments",
      path: "/appointments",
      roles: ["admin", "doctor", "facility_clerk"],
      icon: <Calendar className="w-5 h-5" />
    },
    {
      name: "Patients",
      path: "/patients",
      roles: ["admin", "doctor", "reception", "facility_clerk"],
      icon: <Users className="w-5 h-5" />
    },
    {
      name: "Add Patient",
      path: "/patients/add",
      roles: ["admin", "doctor", "reception", "facility_clerk"],
      icon: <UserPlus className="w-5 h-5" />
    },
    {
      name: "Item Store",
      path: "/inventory",
      roles: ["admin"],
      icon: <Package className="w-5 h-5" />
    },
    {
      name: "Main Drug Store",
      path: "/main-store/drugs",
      roles: ["admin"],
      icon: <Pill className="w-5 h-5" />
    },
    {
      name: "Billing",
      path: "/billing",
      roles: ["admin", "facility_clerk", "pharmacist"],
      icon: <DollarSign className="w-5 h-5" />
    },
    {
      name: "Staff",
      path: "/staff",
      roles: ["admin"],
      icon: <UsersIcon className="w-5 h-5" />
    },
    {
      name: "Pharmacy",
      path: "/pharmacy/review",
      roles: ["admin", "pharmacist"],
      icon: <Pill className="w-5 h-5" />
    },
    {
      name: "Pharmacy Reports",
      path: "/pharmacy/reports",
      roles: ["admin", "facility_clerk", "pharmacist"],
      icon: <BarChart3 className="w-5 h-5" />
    },
    {
      name: "Pharmacy Store",
      path: "/pharmacy/drugs",
      roles: ["admin", "pharmacist"],
      icon: <Pill className="w-5 h-5" />
    },
    {
      name: "Suppliers",
      path: "/suppliers",
      roles: ["admin"],
      icon: <Package className="w-5 h-5" />
    },
    {
      name: "Lab Queue",
      path: "/lab/queue",
      roles: ["admin", "labtech"],
      icon: <Microscope className="w-5 h-5" />
    },
    {
      name: "System Settings",
      path: "/system-settings",
      roles: ["admin"],
      icon: <Cog className="w-5 h-5" />
    },
    {
      name: "Database Management",
      path: "/database-management",
      roles: ["admin"],
      icon: <Database className="w-5 h-5" />
    },
  ];

  const filteredMenu = menu.filter((i) => i.roles.includes(role));

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed md:sticky top-16 h-[calc(100vh-4rem)]
          bg-white shadow-xl border-r border-gray-200
          transition-all duration-300 ease-in-out z-50
          flex flex-col
          ${isCollapsed ? 'w-20' : 'w-64'}
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className={`
          text-center py-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white
          transition-all duration-300 relative
        `}>
          {/* Close button for mobile */}
          <button
            onClick={closeMobileMenu}
            className="md:hidden absolute top-4 right-4 text-white hover:bg-blue-800 rounded-lg p-1"
          >
            <X className="w-5 h-5" />
          </button>

          {!isCollapsed ? (
            <div className="px-4">
              <div className="text-2xl font-bold">🏥 Naitiri Jambo HMS</div>
              <div className="text-xs text-blue-100 mt-1">Healthcare Excellence</div>
            </div>
          ) : (
            <div className="text-3xl">🏥</div>
          )}
        </div>

        {/* Toggle Button (Desktop only) - Improved Design */}
        <button
          onClick={toggleSidebar}
          className={`
            hidden md:flex items-center justify-center
            absolute -right-4 top-24
            w-8 h-8 bg-white border-2 border-blue-600 text-blue-600 rounded-full
            hover:bg-blue-600 hover:text-white transition-all shadow-lg
            z-10 group
          `}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
          {/* Tooltip */}
          <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {isCollapsed ? "Expand" : "Collapse"}
          </span>
        </button>

        {/* Navigation */}
        <nav className="py-4 px-3 flex-1 overflow-y-auto">
          {filteredMenu.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <div
                key={item.path}
                className="relative"
                onMouseEnter={() => setHoveredItem(item.path)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <Link
                  to={item.path}
                  onClick={() => closeMobileMenu()}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg mb-2
                    font-medium transition-all
                    ${isCollapsed ? 'justify-center' : ''}
                    ${isActive
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                    }
                  `}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!isCollapsed && (
                    <span className="flex-1">{item.name}</span>
                  )}
                  {!isCollapsed && item.badge > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </Link>

                {/* Tooltip for collapsed state */}
                {isCollapsed && hoveredItem === item.path && (
                  <div className="
                    absolute left-full ml-2 top-1/2 -translate-y-1/2
                    bg-gray-900 text-white text-sm px-3 py-2 rounded-lg
                    whitespace-nowrap z-50 pointer-events-none
                  ">
                    {item.name}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 
                      border-4 border-transparent border-r-gray-900" />
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Settings Button */}
        <div className="px-3 pb-2 border-t border-gray-200 pt-2">
          <div
            className="relative"
            onMouseEnter={() => setHoveredItem('/settings')}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <Link
              to="/settings"
              onClick={() => closeMobileMenu()}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg mb-2
                font-medium transition-all
                ${isCollapsed ? 'justify-center' : ''}
                ${location.pathname === "/settings"
                  ? "bg-gray-800 text-white shadow-md"
                  : "text-gray-700 hover:bg-gray-100"
                }
              `}
            >
              <Settings className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>Settings</span>}
            </Link>

            {/* Tooltip for collapsed state */}
            {isCollapsed && hoveredItem === '/settings' && (
              <div className="
                absolute left-full ml-2 top-1/2 -translate-y-1/2
                bg-gray-900 text-white text-sm px-3 py-2 rounded-lg
                whitespace-nowrap z-50 pointer-events-none
              ">
                Settings
                <div className="absolute right-full top-1/2 -translate-y-1/2 
                  border-4 border-transparent border-r-gray-900" />
              </div>
            )}
          </div>

          {/* Updates/Info Button */}
          <div
            className="relative"
            onMouseEnter={() => setHoveredItem('/updates')}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <Link
              to="/updates"
              onClick={() => closeMobileMenu()}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg mb-3
                font-medium transition-all
                ${isCollapsed ? 'justify-center' : ''}
                ${location.pathname === "/updates"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                }
              `}
            >
              <Info className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>Documentation</span>}
            </Link>

            {/* Tooltip for collapsed state */}
            {isCollapsed && hoveredItem === '/updates' && (
              <div className="
                absolute left-full ml-2 top-1/2 -translate-y-1/2
                bg-gray-900 text-white text-sm px-3 py-2 rounded-lg
                whitespace-nowrap z-50 pointer-events-none
              ">
                Updates
                <div className="absolute right-full top-1/2 -translate-y-1/2 
                  border-4 border-transparent border-r-gray-900" />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {!isCollapsed && (
          <div className="px-4 py-3 text-center text-xs text-gray-500 border-t border-gray-200 bg-gray-50">
            <p>© 2025 Naitiri Jambo HMS</p>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;
