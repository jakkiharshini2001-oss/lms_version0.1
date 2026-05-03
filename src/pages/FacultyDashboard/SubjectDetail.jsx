import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";

import { useParams } from "react-router-dom";
import { useState } from "react";
import { ChevronDown, ChevronRight, Video, FileText, ClipboardList } from "lucide-react";

export default function SubjectDetail() {
  const { name } = useParams();

  const [openUnit, setOpenUnit] = useState(null);

  // Dummy Units (later from DB)
  const units = [
    {
      title: "Unit 1: Basic Concepts",
      videos: 3,
      pdfs: 2,
      mcqs: 1,
    },
    {
      title: "Unit 2: Laws of Thermodynamics",
      videos: 4,
      pdfs: 2,
      mcqs: 2,
    },
    {
      title: "Unit 3: Heat Transfer",
      videos: 2,
      pdfs: 1,
      mcqs: 1,
    },
  ];

  return (
    <div className="flex h-screen bg-[#f6f8fb]">

      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Topbar />

        <div className="p-6">

          {/* HEADER */}
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">
            {name}
          </h1>
          <p className="text-gray-500 mb-6">
            Manage units and content (Video, Notes, Assessments)
          </p>

          {/* UNITS */}
          <div className="bg-white rounded-xl border shadow-sm p-5">

            {units.map((unit, index) => (
              <div key={index} className="mb-4">

                {/* UNIT HEADER */}
                <div
                  onClick={() =>
                    setOpenUnit(openUnit === index ? null : index)
                  }
                  className="flex items-center justify-between cursor-pointer px-4 py-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    {openUnit === index ? (
                      <ChevronDown size={18} />
                    ) : (
                      <ChevronRight size={18} />
                    )}
                    <span className="font-medium text-gray-800">
                      {unit.title}
                    </span>
                  </div>

                  {/* COUNTS */}
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Video size={14} /> {unit.videos}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText size={14} /> {unit.pdfs}
                    </span>
                    <span className="flex items-center gap-1">
                      <ClipboardList size={14} /> {unit.mcqs}
                    </span>
                  </div>
                </div>

                {/* UNIT CONTENT */}
                {openUnit === index && (
                  <div className="ml-6 mt-3 space-y-2">

                    {/* VIDEO */}
                    <div className="flex justify-between bg-blue-50 px-4 py-2 rounded-lg">
                      <span>📹 Videos</span>
                      <button className="text-blue-600 text-sm">
                        View / Add
                      </button>
                    </div>

                    {/* PDF */}
                    <div className="flex justify-between bg-green-50 px-4 py-2 rounded-lg">
                      <span>📄 Notes</span>
                      <button className="text-green-600 text-sm">
                        View / Add
                      </button>
                    </div>

                    {/* MCQ */}
                    <div className="flex justify-between bg-purple-50 px-4 py-2 rounded-lg">
                      <span>📝 Assessments</span>
                      <button className="text-purple-600 text-sm">
                        View / Add
                      </button>
                    </div>

                  </div>
                )}

              </div>
            ))}

          </div>

        </div>
      </div>
    </div>
  );
}