import { Outlet, NavLink } from "react-router-dom";
import { Home, Upload, FileOutput, BarChart3, Settings, ShieldAlert } from "lucide-react";

export default function Layout() {
  const navItems = [
    { name: "Home", icon: Home, path: "/" },
    { name: "Imports", icon: Upload, path: "/imports" },
    { name: "Exports", icon: FileOutput, path: "/exports" },
    { name: "CVE Reports", icon: BarChart3, path: "/reports" },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-stone-50 font-sans text-stone-900">
      {/* SIDEBAR: Fixed width, dark styling for contrast */}
      <aside className="w-64 flex-shrink-0 bg-[#2D2D2D] text-stone-300 flex flex-col border-r border-stone-800">
        
        {/* Header: Clean, Text-based Logo */}
        <div className="h-16 flex items-center px-6 border-b border-stone-700/50">
          <ShieldAlert className="h-6 w-6 text-orange-500 mr-2" />
          <span className="font-bold text-white tracking-tight text-lg">VulnMaster</span>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 py-6 px-3 space-y-1">
          <div className="px-3 mb-2 text-xs font-semibold text-stone-500 uppercase tracking-wider">
            Workspace
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-orange-600 text-white shadow-md" // Active State
                    : "hover:bg-stone-700 hover:text-white" // Hover State
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Footer: Settings */}
        <div className="p-4 border-t border-stone-700/50">
          <button className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm font-medium hover:bg-stone-700 hover:text-white transition-colors text-left">
             <Settings className="h-4 w-4" /> Application Settings
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA: Scrollable, Light Background */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-white relative">
        <div className="flex-1 overflow-y-auto">
          {/* The 'Outlet' is where Home.tsx or DatasetView.tsx will appear */}
          <Outlet />
        </div>
      </main>
    </div>
  );
}
