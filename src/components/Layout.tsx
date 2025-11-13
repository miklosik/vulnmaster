// src/components/Layout.tsx
import { Outlet, NavLink } from "react-router-dom";
import { Home, Upload, FileOutput, BarChart3, User, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Layout() {
  const navItems = [
    { name: "Home", icon: Home, path: "/" },
    { name: "Imports", icon: Upload, path: "/imports" },
    { name: "Exports", icon: FileOutput, path: "/exports" },
    { name: "CVE Reports", icon: BarChart3, path: "/reports" },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      {/* SIDEBAR - Styled like the reference image (Terracotta/Brown) */}
      <aside className="w-64 flex-shrink-0 bg-[#8B4513] text-white flex flex-col border-r border-[#703810]">
        
        {/* Header / Profile Area */}
        <div className="p-4 flex items-center gap-3 border-b border-[#703810]/50">
          <Avatar className="h-8 w-8 border-2 border-white/20">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>VM</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-sm font-bold leading-none">Pipeline Radar</h2>
            <p className="text-xs text-white/60 mt-1">VulnMaster Workspace</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-6 px-3 space-y-1">
          <div className="px-3 mb-2 text-xs font-medium text-white/50 uppercase tracking-wider">
            Accounts HQ
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#703810]/50 space-y-1">
          <button className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition-colors">
             <Settings className="h-4 w-4" /> Settings
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-white">
        {/* This renders the child page (Home, Imports, etc.) */}
        <Outlet />
      </main>
    </div>
  );
}