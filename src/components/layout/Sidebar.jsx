import {
  LayoutDashboard,
  BookOpen,
  Folder,
  Upload,
  BarChart3,
  User,
  Bell,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import { NavLink } from "react-router-dom";
import { useState } from "react";

import oulogo from "../../assets/images/Eng_college_log.png";

//////////////////////////////////////////////////////
// MENU ITEMS
//////////////////////////////////////////////////////

const menuItems = [
  { name: "Overview", icon: LayoutDashboard, path: "/faculty/dashboard" },

  // CORE LMS ENTRY
  { name: "My Subjects", icon: BookOpen, path: "/faculty/subjects" },

  // UNIFIED UPLOAD
  { name: "Upload Content", icon: Upload, path: "/faculty/upload" },

  // ANALYTICS
  {
    name: "Student Performance",
    icon: BarChart3,
    path: "/faculty/performance",
  },
];

//////////////////////////////////////////////////////
// ACCOUNT ITEMS
//////////////////////////////////////////////////////

const accountItems = [
  { name: "Profile", icon: User, path: "/faculty/profile" },

  { name: "Notifications", icon: Bell, path: "/faculty/notifications" },

  { name: "Logout", icon: LogOut, path: "/" },
];

//////////////////////////////////////////////////////
// SIDEBAR
//////////////////////////////////////////////////////

export default function Sidebar() {
  //////////////////////////////////////////////////////
  // STATES
  //////////////////////////////////////////////////////

  const [collapsed, setCollapsed] = useState(false);

  //////////////////////////////////////////////////////
  // TOGGLE
  //////////////////////////////////////////////////////

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  //////////////////////////////////////////////////////
  // UI
  //////////////////////////////////////////////////////

  return (
    <div
      className={`h-screen bg-white border-r border-gray-100 flex flex-col overflow-y-auto transition-all duration-300 ease-in-out
      ${collapsed ? "w-[88px]" : "w-[260px]"}`}
    >
      {/* LOGO */}
      <div
        onClick={toggleSidebar}
        className={`px-5 py-5 flex items-center cursor-pointer select-none border-b border-gray-50
        ${collapsed ? "justify-center" : "justify-between"}`}
      >
        {/* LEFT */}
        <div
          className={`flex items-center transition-all duration-300
          ${collapsed ? "justify-center" : "gap-3"}`}
        >
          <img
            src={oulogo}
            alt="OU Logo"
            className="w-11 h-11 object-contain"
          />

          {!collapsed && (
            <div>
              <h1 className="text-[18px] font-bold text-gray-900 leading-tight">
                LMS Faculty
              </h1>

              <p className="text-[11px] text-gray-400">
                Osmania University
              </p>
            </div>
          )}
        </div>

        {/* TOGGLE ICON */}
        {!collapsed ? (
          <PanelLeftClose
            size={20}
            className="text-gray-500 shrink-0"
          />
        ) : (
          <PanelLeftOpen
            size={20}
            className="text-gray-500 absolute top-8"
          />
        )}
      </div>

      {/* WORKSPACE TAG */}
      <div
        className={`mb-6 mt-5 transition-all duration-300
        ${collapsed ? "px-2" : "px-6"}`}
      >
        <div
          className={`flex items-center rounded-xl bg-blue-50 text-blue-700
          ${collapsed ? "justify-center px-2 py-3" : "gap-2 px-3 py-2.5"}`}
        >
          <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />

          {!collapsed && (
            <span className="text-[13px] font-semibold">
              Educator workspace
            </span>
          )}
        </div>
      </div>

      {/* MAIN MENU */}
      <div
        className={`mb-6 transition-all duration-300
        ${collapsed ? "px-2" : "px-3"}`}
      >
        {!collapsed && (
          <p className="px-3 text-[11px] font-bold text-gray-400 tracking-wider mb-2">
            MANAGE
          </p>
        )}

        <nav className="flex flex-col gap-1">
          {menuItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={index}
                to={item.path}
                title={collapsed ? item.name : ""}
                className={({ isActive }) =>
                  `flex items-center rounded-xl transition-all duration-200 text-[14px] font-medium group
                  
                  ${
                    collapsed
                      ? "justify-center px-3 py-3"
                      : "gap-3 px-3 py-2.5"
                  }

                  ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  }`
                }
              >
                <Icon
                  size={18}
                  className="stroke-[2.5px] shrink-0"
                />

                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* ACCOUNT */}
      <div
        className={`mb-6 transition-all duration-300
        ${collapsed ? "px-2" : "px-3"}`}
      >
        {!collapsed && (
          <p className="px-3 text-[11px] font-bold text-gray-400 tracking-wider mb-2">
            ACCOUNT
          </p>
        )}

        <nav className="flex flex-col gap-1">
          {accountItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={index}
                to={item.path}
                title={collapsed ? item.name : ""}
                className={({ isActive }) =>
                  `flex items-center rounded-xl transition-all duration-200 text-[14px] font-medium
                  
                  ${
                    collapsed
                      ? "justify-center px-3 py-3"
                      : "gap-3 px-3 py-2.5"
                  }

                  ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  }`
                }
              >
                <Icon
                  size={18}
                  className="stroke-[2.5px] shrink-0"
                />

                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* FOOTER */}
      <div
        className={`mt-auto border-t border-gray-50 transition-all duration-300
        ${collapsed ? "p-3" : "p-6"}`}
      >
        {collapsed ? (
          <div className="flex justify-center">
            <img
              src={oulogo}
              alt="OU Logo"
              className="w-8 h-8 object-contain opacity-70"
            />
          </div>
        ) : (
          <div>
            <p className="text-[12px] text-gray-400">
              © 2026 LMS Faculty
            </p>

            <p className="text-[11px] text-gray-300 mt-1">
              Osmania University
            </p>
          </div>
        )}
      </div>
    </div>
  );
}