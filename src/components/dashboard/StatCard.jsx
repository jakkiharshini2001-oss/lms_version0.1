import { TrendingUp } from "lucide-react";

export default function StatCard({ title, value, icon: Icon }) {
    return (
        <div className="bg-white rounded-xl p-5 shadow-sm border flex items-center justify-between">

            {/* LEFT */}
            <div>
                <p className="text-sm text-gray-500">{title}</p>
                <h2 className="text-2xl font-bold text-[#071b3a] mt-1">
                    {value}
                </h2>
            </div>

            {/* RIGHT ICON */}
            <div className="w-12 h-12 bg-[#eef4ff] text-[#123a78] flex items-center justify-center rounded-lg">
                {Icon && <Icon size={22} />}
            </div>

        </div>
    );
}