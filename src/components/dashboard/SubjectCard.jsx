import { Video, FileText, ClipboardList } from "lucide-react";

export default function SubjectCard({ subject }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">

            {/* HEADER */}
            <div className="p-4 border-b">
                <h3 className="text-lg font-bold text-[#071b3a]">
                    {subject.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                    Year {subject.year} • Semester {subject.semester}
                </p>
            </div>

            {/* BODY */}
            <div className="p-4 flex flex-col gap-3">

                {/* Videos */}
                <button className="flex items-center justify-between bg-blue-50 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-100 transition">
                    <div className="flex items-center gap-2">
                        <Video size={18} />
                        <span>Videos</span>
                    </div>
                    <span className="text-sm">{subject.videos || 0}</span>
                </button>

                {/* Notes */}
                <button className="flex items-center justify-between bg-green-50 text-green-700 px-4 py-2 rounded-lg hover:bg-green-100 transition">
                    <div className="flex items-center gap-2">
                        <FileText size={18} />
                        <span>Notes</span>
                    </div>
                    <span className="text-sm">{subject.notes || 0}</span>
                </button>

                {/* MCQs */}
                <button className="flex items-center justify-between bg-purple-50 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-100 transition">
                    <div className="flex items-center gap-2">
                        <ClipboardList size={18} />
                        <span>Assessments</span>
                    </div>
                    <span className="text-sm">{subject.assessments || 0}</span>
                </button>

            </div>
        </div>
    );
}