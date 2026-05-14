import { useState, useRef, useEffect } from "react";
import {
    Bell,
    ChevronDown,
    User,
    HelpCircle,
    LogOut,
    Settings,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

export default function Topbar() {
    const navigate = useNavigate();

    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [faculty, setFaculty] = useState(null);
    const [loading, setLoading] = useState(true);

    const dropdownRef = useRef(null);

    useEffect(() => {
        fetchFaculty();
    }, []);

    const fetchFaculty = async () => {
        try {
            setLoading(true);

            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) throw userError;

            if (!user) {
                navigate("/faculty/login");
                return;
            }

            const { data, error } = await supabase
                .from("faculty")
                .select(
                    "id, name, email, department, designation, employee_id, profile_photo"
                )
                .eq("id", user.id)
                .single();

            if (error) throw error;

            setFaculty(data);
        } catch (error) {
            console.error("Error fetching faculty:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setIsProfileOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();

            localStorage.removeItem("faculty");
            sessionStorage.clear();

            navigate("/faculty/login");
        } catch (error) {
            console.error("Logout error:", error);
            navigate("/faculty/login");
        }
    };

    const getInitial = () => {
        if (faculty?.name) return faculty.name.charAt(0).toUpperCase();
        if (faculty?.email) return faculty.email.charAt(0).toUpperCase();
        return "F";
    };

    return (
        <div className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
            {/* LEFT SIDE */}
            <div>
                <h2 className="text-lg font-bold text-gray-800">
                    Faculty Portal
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                    Osmania University Learning Management System
                </p>
            </div>

            {/* RIGHT SIDE */}
            <div className="flex items-center gap-4">
                {/* NOTIFICATION */}
                <button
                    type="button"
                    className="relative w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition"
                    title="Notifications"
                >
                    <Bell size={19} className="text-gray-600" />

                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] min-w-4 h-4 px-1 flex items-center justify-center rounded-full">
                        2
                    </span>
                </button>

                {/* PROFILE */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        type="button"
                        className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 px-2 py-1.5 rounded-xl transition"
                        onClick={() => setIsProfileOpen((prev) => !prev)}
                    >
                        {faculty?.profile_photo ? (
                            <img
                                src={faculty.profile_photo}
                                alt={faculty?.name || "Faculty"}
                                className="w-11 h-11 rounded-full object-cover border border-gray-200"
                                onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                }}
                            />
                        ) : (
                            <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold border border-blue-100">
                                {getInitial()}
                            </div>
                        )}

                        <div className="hidden sm:block text-left max-w-[190px]">
                            <p className="font-semibold text-sm text-gray-800 truncate">
                                {loading ? "Loading..." : faculty?.name || "Faculty"}
                            </p>

                            <p className="text-gray-500 text-xs truncate">
                                {faculty?.department || "Department"}
                            </p>
                        </div>

                        <ChevronDown
                            size={15}
                            className={`text-gray-500 transition-transform ${isProfileOpen ? "rotate-180" : ""
                                }`}
                        />
                    </button>

                    {/* DROPDOWN */}
                    {isProfileOpen && (
                        <div className="absolute right-0 mt-3 w-64 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-50">
                            <div className="px-4 py-4 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    {faculty?.profile_photo ? (
                                        <img
                                            src={faculty.profile_photo}
                                            alt={faculty?.name || "Faculty"}
                                            className="w-12 h-12 rounded-full object-cover border border-gray-200"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                                            {getInitial()}
                                        </div>
                                    )}

                                    <div className="min-w-0">
                                        <p className="font-bold text-sm text-gray-800 truncate">
                                            {faculty?.name || "Faculty"}
                                        </p>

                                        <p className="text-xs text-gray-500 truncate">
                                            {faculty?.email || ""}
                                        </p>
                                    </div>
                                </div>

                                {faculty?.designation && (
                                    <p className="mt-3 text-xs text-gray-500">
                                        {faculty.designation}
                                    </p>
                                )}
                            </div>

                            <button
                                onClick={() => {
                                    setIsProfileOpen(false);
                                    navigate("/faculty/profile");
                                }}
                                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                            >
                                <User size={16} className="text-gray-500" />
                                Profile Settings
                            </button>

                            <button
                                onClick={() => {
                                    setIsProfileOpen(false);
                                    navigate("/faculty/profile");
                                }}
                                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                            >
                                <Settings size={16} className="text-gray-500" />
                                Account Settings
                            </button>

                            <button
                                onClick={() => {
                                    setIsProfileOpen(false);
                                }}
                                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                            >
                                <HelpCircle size={16} className="text-gray-500" />
                                Help & Support
                            </button>

                            <div className="border-t border-gray-100">
                                <button
                                    onClick={handleLogout}
                                    className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                                >
                                    <LogOut size={16} />
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}