import { useState, useRef, useEffect } from "react";
import { Search, Bell, Plus, ChevronDown, User, HelpCircle, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Topbar() {
    const navigate = useNavigate();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="h-16 bg-white border-b flex items-center justify-between px-6 relative z-10">

            {/* SEARCH */}
            <div className="flex items-center bg-gray-100 px-4 py-2 rounded-lg w-[400px]">
                <Search size={18} className="text-gray-500" />
                <input
                    type="text"
                    placeholder="Search lectures, subjects..."
                    className="ml-2 bg-transparent outline-none w-full text-sm"
                />
            </div>

            {/* RIGHT SIDE */}
            <div className="flex items-center gap-4">

                {/* ✅ UPLOAD BUTTON (CONNECTED) */}
                <button
                    onClick={() => navigate("/faculty/upload")}
                    className="flex items-center gap-2 bg-[#123a78] text-white px-4 py-2 rounded-lg hover:bg-[#0f2f63] transition"
                >
                    <Plus size={16} />
                    Upload Lecture
                </button>

                {/* NOTIFICATION */}
                <div className="relative cursor-pointer">
                    <Bell size={20} className="text-gray-600" />
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                        2
                    </span>
                </div>

                {/* PROFILE */}
                <div className="relative" ref={dropdownRef}>
                    <div 
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded-lg transition"
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                    >
                        <div className="w-9 h-9 bg-[#123a78] text-white flex items-center justify-center rounded-full">
                            F
                        </div>
                        <div className="text-sm">
                            <p className="font-semibold">Faculty</p>
                            <p className="text-gray-500 text-xs">Mechanical</p>
                        </div>
                        <ChevronDown size={14} className={`text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                    </div>

                    {/* DROPDOWN MENU */}
                    {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border rounded-xl shadow-lg overflow-hidden py-1 z-50">
                            <button 
                                onClick={() => {
                                    setIsProfileOpen(false);
                                    navigate("/faculty/profile");
                                }} 
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                            >
                                <User size={16} className="text-gray-400" />
                                Profile Settings
                            </button>
                            
                            <button 
                                onClick={() => {
                                    setIsProfileOpen(false);
                                    navigate("/faculty/help");
                                }} 
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                            >
                                <HelpCircle size={16} className="text-gray-400" />
                                Help
                            </button>
                            
                            <div className="border-t border-gray-100 my-1"></div>
                            
                            <button 
                                onClick={() => {
                                    setIsProfileOpen(false);
                                    navigate("/faculty/login");
                                }} 
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition font-medium"
                            >
                                <LogOut size={16} />
                                Logout
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}