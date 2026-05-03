import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function MySubjects() {
  const navigate = useNavigate();

  // Expand states
  const [openYear, setOpenYear] = useState(null);
  const [openSem, setOpenSem] = useState(null);

  // Dummy academic structure (later from DB)
  const data = [
    {
      year: "Year 1",
      semesters: [
        {
          sem: "Semester 1",
          subjects: ["Mathematics 1", "Physics", "Chemistry"],
        },
        {
          sem: "Semester 2",
          subjects: ["Mathematics 2", "Basic Electrical", "Engineering Mechanics"],
        },
      ],
    },
    {
      year: "Year 2",
      semesters: [
        {
          sem: "Semester 1",
          subjects: ["Thermodynamics", "Mechanics of Solids"],
        },
        {
          sem: "Semester 2",
          subjects: ["Fluid Mechanics", "Kinematics"],
        },
      ],
    },
  ];

  return (
    <div className="flex h-screen bg-[#f6f8fb]">

      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Topbar />

        <div className="p-6">

          {/* HEADER */}
          <h1 className="text-2xl font-semibold text-gray-800 mb-6">
            My Subjects
          </h1>

          {/* CONTENT */}
          <div className="bg-white rounded-xl border shadow-sm p-5">

            {data.map((yearData, yIndex) => (
              <div key={yIndex} className="mb-4">

                {/* YEAR */}
                <div
                  onClick={() =>
                    setOpenYear(openYear === yIndex ? null : yIndex)
                  }
                  className="flex items-center gap-2 cursor-pointer text-lg font-semibold text-gray-800"
                >
                  {openYear === yIndex ? (
                    <ChevronDown size={18} />
                  ) : (
                    <ChevronRight size={18} />
                  )}
                  {yearData.year}
                </div>

                {/* SEMESTERS */}
                {openYear === yIndex && (
                  <div className="ml-6 mt-3">

                    {yearData.semesters.map((semData, sIndex) => (
                      <div key={sIndex} className="mb-3">

                        {/* SEM */}
                        <div
                          onClick={() =>
                            setOpenSem(
                              openSem === `${yIndex}-${sIndex}`
                                ? null
                                : `${yIndex}-${sIndex}`
                            )
                          }
                          className="flex items-center gap-2 cursor-pointer text-md font-medium text-gray-700"
                        >
                          {openSem === `${yIndex}-${sIndex}` ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )}
                          {semData.sem}
                        </div>

                        {/* SUBJECTS */}
                        {openSem === `${yIndex}-${sIndex}` && (
                          <div className="ml-6 mt-2 flex flex-col gap-2">

                            {semData.subjects.map((subject, index) => (
                              <div
                                key={index}
                                onClick={() =>
                                  navigate(`/faculty/subject/${subject}`)
                                }
                                className="cursor-pointer px-3 py-2 rounded-lg hover:bg-gray-100 text-sm text-gray-600"
                              >
                                {subject}
                              </div>
                            ))}

                          </div>
                        )}
                      </div>
                    ))}

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