import { useState, useRef, useEffect } from "react";
import { Search, Bell, Plus, ChevronDown, User, HelpCircle, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import oulogo from "../../assets/images/Eng_college_log.png";

export default function Topbar() {
    const navigate = useNavigate();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dropdownRef = useRef(null);

    const [faculty, setFaculty] = useState(null);

    // 🔹 Fetch logged-in faculty
    useEffect(() => {
        const fetchFaculty = async () => {
            const { data: userData } = await supabase.auth.getUser();

            if (userData?.user) {
                const { data, error } = await supabase
                    .from("faculty") // 👈 make sure table name matches
                    .select("*")
                    .eq("id", userData.user.id)
                    .single();

                if (!error) {
                    setFaculty(data);
                }
            }
        };

        fetchFaculty();
    }, []);

    // Close dropdown
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
        <div className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">

            {/* SEARCH */}
            <div className="flex items-center bg-gray-100 px-5 py-3 rounded-xl w-[400px]">
                <Search size={20} className="text-gray-500" />
                <input
                    type="text"
                    placeholder="Search lectures, subjects..."
                    className="ml-3 bg-transparent outline-none w-full text-base"
                />
            </div>

            {/* RIGHT SIDE */}
            <div className="flex items-center gap-4">

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
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded-lg"
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                    >
                        <img src={oulogo} alt="OU Logo" className="w-11 h-11 rounded-full" />
                        <div className="text-base">
                            <p className="font-semibold">
                                {faculty?.name || "Loading..."}
                            </p>
                            <p className="text-gray-500 text-sm">
                                {faculty?.department || ""}
                            </p>
                        </div>

                        <ChevronDown size={14} />
                    </div>

                    {/* DROPDOWN */}
                    {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border rounded-xl shadow-lg">
                            <button onClick={() => navigate("/faculty/profile")} className="w-full px-4 py-2 text-left">
                                Profile Settings
                            </button>

                            <button
                                onClick={async () => {
                                    await supabase.auth.signOut();
                                    navigate("/faculty/login");
                                }}
                                className="w-full px-4 py-2 text-left text-red-600"
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}