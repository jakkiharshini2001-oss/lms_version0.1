export default function ActivityCard({ activities }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border p-5">

            {/* HEADER */}
            <h2 className="text-lg font-semibold text-[#071b3a] mb-4">
                Student Activity
            </h2>

            {/* LIST */}
            <div className="flex flex-col gap-3">
                {activities.length > 0 ? (
                    activities.map((item, index) => (
                        <div
                            key={index}
                            className="flex items-start gap-3 border-b pb-2 last:border-none"
                        >
                            {/* Indicator */}
                            <div className="w-2 h-2 mt-2 bg-[#123a78] rounded-full"></div>

                            {/* Text */}
                            <p className="text-sm text-gray-700">
                                {item}
                            </p>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-gray-400">
                        No recent activity
                    </p>
                )}
            </div>

        </div>
    );
}