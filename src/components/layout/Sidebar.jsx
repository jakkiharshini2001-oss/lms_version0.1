import {
  LayoutDashboard,
  BookOpen,
  Folder,
  Upload,
  BarChart3,
  User,
  Bell,
  LogOut
} from "lucide-react";

import { NavLink } from "react-router-dom";

const menuItems = [
  { name: "Overview", icon: LayoutDashboard, path: "/faculty/dashboard" },

  // ✅ CORE LMS ENTRY
  { name: "My Subjects", icon: BookOpen, path: "/faculty/subjects" },

  // ✅ ALL CONTENT VIEW
  { name: "Content Library", icon: Folder, path: "/faculty/content" },

  // ✅ UNIFIED UPLOAD
  { name: "Upload Content", icon: Upload, path: "/faculty/upload" },

  // ✅ ANALYTICS
  { name: "Student Performance", icon: BarChart3, path: "/faculty/performance" },
];

const accountItems = [
  { name: "Profile", icon: User, path: "/faculty/profile" },
  { name: "Notifications", icon: Bell, path: "/faculty/notifications" },
  { name: "Logout", icon: LogOut, path: "/" },
];

export default function Sidebar() {
  return (
    <div className="w-[260px] h-screen bg-white border-r border-gray-100 flex flex-col overflow-y-auto">

      {/* LOGO */}
      <div className="px-6 py-5 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-5 h-5 text-white"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 14l9-5-9-5-9 5 9 5zm0 0v6m-4-3.5l4 2 4-2"
            />
          </svg>
        </div>

        <h1 className="text-[18px] font-bold text-gray-900">
          LMS Faculty
        </h1>
      </div>

      {/* WORKSPACE TAG */}
      <div className="px-6 mb-6">
        <div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
          <span className="text-[13px] font-semibold">
            Educator workspace
          </span>
        </div>
      </div>

      {/* MAIN MENU */}
      <div className="px-3 mb-6">
        <p className="px-3 text-[11px] font-bold text-gray-400 tracking-wider mb-2">
          MANAGE
        </p>

        <nav className="flex flex-col gap-1">
          {menuItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={index}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-[14px] font-medium
                  ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  }`
                }
              >
                <Icon size={18} className="stroke-[2.5px]" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* ACCOUNT */}
      <div className="px-3 mb-6">
        <p className="px-3 text-[11px] font-bold text-gray-400 tracking-wider mb-2">
          ACCOUNT
        </p>

        <nav className="flex flex-col gap-1">
          {accountItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={index}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-[14px] font-medium
                  ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  }`
                }
              >
                <Icon size={18} className="stroke-[2.5px]" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* FOOTER */}
      <div className="mt-auto p-6">
        <p className="text-[12px] text-gray-400">
          © 2026 LMS Faculty
        </p>
      </div>
    </div>
  );
}