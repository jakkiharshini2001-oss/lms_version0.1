import { useState, useEffect } from "react";
import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";
import { supabase } from "../../lib/supabaseClient";

export default function ContentLibrary() {
  const [faculty, setFaculty] = useState(null);
  const [allGroupedData, setAllGroupedData] = useState({});
  const [groupedData, setGroupedData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState("All Years");
  const [selectedSemester, setSelectedSemester] = useState("All Semesters");
  const [semestersByYear, setSemestersByYear] = useState({});
  const [dropdownOpen, setDropdownOpen] = useState(false);

  //////////////////////////////////////////////////////
  // LOAD FACULTY & CONTENT
  //////////////////////////////////////////////////////
  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);

        // Get logged-in user
        const { data: authData } = await supabase.auth.getUser();

        if (!authData?.user?.email) {
          console.log("No logged-in user");
          setLoading(false);
          return;
        }

        // Fetch correct faculty row
        const { data: facultyData, error: facultyError } = await supabase
          .from("faculty")
          .select("*")
          .eq("email", authData.user.email)
          .single();

        if (facultyError || !facultyData) {
          console.log("Faculty fetch error:", facultyError);
          setLoading(false);
          return;
        }

        setFaculty(facultyData);

        // Fetch all content types
        const { data: videos } = await supabase
          .from("videos")
          .select("*")
          .eq("faculty_id", facultyData.id);

        const { data: pdfs } = await supabase
          .from("pdfs")
          .select("*")
          .eq("faculty_id", facultyData.id);

        const { data: assessments } = await supabase
          .from("assessments")
          .select("*")
          .eq("faculty_id", facultyData.id);

        // Normalize data
        const normalize = (item, type) => ({
          ...item,
          type,
          embed_url: item.file_id
            ? `https://drive.google.com/file/d/${item.file_id}/preview`
            : null,
          file_url: item.file_id
            ? `https://drive.google.com/uc?id=${item.file_id}`
            : null,
        });

        const all = [
          ...(videos || []).map((i) => normalize(i, "video")),
          ...(pdfs || []).map((i) => normalize(i, "pdf")),
          ...(assessments || []).map((i) => normalize(i, "assessment")),
        ];

        // Group by subject and unit
        const grouped = {};

        const formatUnit = (unit) => {
          if (!unit) return "Unit 1";
          if (unit.toLowerCase().includes("unit")) return unit;
          return `Unit ${unit}`;
        };

        all.forEach((item) => {
          const subject = item.subject || "Unknown";
          const unit = formatUnit(item.unit);

          if (!grouped[subject]) grouped[subject] = {};
          if (!grouped[subject][unit]) {
            grouped[subject][unit] = {
              videos: [],
              pdfs: [],
              assessments: [],
            };
          }

          if (item.type === "video") grouped[subject][unit].videos.push(item);
          if (item.type === "pdf") grouped[subject][unit].pdfs.push(item);
          if (item.type === "assessment")
            grouped[subject][unit].assessments.push(item);
        });

        // Get unique semesters and organize by year
        const byYear = {
          "1": [],
          "2": [],
          "3": [],
          "4": [],
        };

        const semesterSet = new Set();

        all.forEach((item) => {
          if (item.semester) {
            const semesterStr = String(item.semester).trim();
            semesterSet.add(semesterStr);

            let year, semNum;
            if (semesterStr.includes("-")) {
              [year, semNum] = semesterStr.split("-");
            } else {
              const num = parseInt(semesterStr);
              year = Math.ceil(num / 2);
              semNum = ((num - 1) % 2) + 1;
            }

            if (byYear[year] && !byYear[year].includes(semesterStr)) {
              byYear[year].push(semesterStr);
            }
          }
        });

        // Sort semesters within each year
        Object.keys(byYear).forEach((year) => {
          byYear[year] = byYear[year].sort((a, b) => {
            const aNum = parseInt(String(a).split("-")[1] || a);
            const bNum = parseInt(String(b).split("-")[1] || b);
            return aNum - bNum;
          });
        });

        console.log("Semesters by year:", byYear);
        setSemestersByYear(byYear);

        setAllGroupedData(grouped);
        setGroupedData(grouped);
        setLoading(false);
      } catch (err) {
        console.error("Error loading content:", err);
        setLoading(false);
      }
    };

    loadContent();
  }, []);

  //////////////////////////////////////////////////////
  // FILTER DATA BASED ON SEARCH, YEAR & SEMESTER
  //////////////////////////////////////////////////////
  useEffect(() => {
    let filtered = {};

    Object.keys(allGroupedData).forEach((subject) => {
      // Check if subject matches search query
      if (
        subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        searchQuery === ""
      ) {
        filtered[subject] = {};

        Object.keys(allGroupedData[subject]).forEach((unit) => {
          const items = [
            ...allGroupedData[subject][unit].videos,
            ...allGroupedData[subject][unit].pdfs,
            ...allGroupedData[subject][unit].assessments,
          ];

        const filteredItems = items.filter((item) => {
  const itemYear = String(item.year);
  const itemSem = String(item.semester);

  // 🟡 YEAR FILTER
  if (selectedYear !== "All Years") {
    if (itemYear !== selectedYear) return false;
  }

  // 🟡 SEMESTER FILTER
  if (selectedSemester !== "All Semesters") {
    const [year, sem] = selectedSemester.split("-");

    if (itemYear !== year || itemSem !== sem) return false;
  }

  return true;
});

          // Only add unit if it has items after filtering
          if (filteredItems.length > 0) {
            filtered[subject][unit] = {
              videos: filteredItems.filter((i) => i.type === "video"),
              pdfs: filteredItems.filter((i) => i.type === "pdf"),
              assessments: filteredItems.filter((i) => i.type === "assessment"),
            };
          }
        });

        // Remove subject if it has no units after filtering
        if (Object.keys(filtered[subject]).length === 0) {
          delete filtered[subject];
        }
      }
    });

    setGroupedData(filtered);
  }, [searchQuery, selectedYear, selectedSemester, allGroupedData]);

  //////////////////////////////////////////////////////
  // HANDLE YEAR CHANGE
  //////////////////////////////////////////////////////
  const handleYearChange = (year) => {
    setSelectedYear(year);
    setSelectedSemester("All Semesters");
    setDropdownOpen(false);
  };

  //////////////////////////////////////////////////////
  // HANDLE SEMESTER CHANGE
  //////////////////////////////////////////////////////
 const handleSemesterChange = (semester) => {
  setSelectedSemester(semester);

  const [year] = semester.split("-");
  setSelectedYear(year);

  setDropdownOpen(false);
};

  //////////////////////////////////////////////////////
  // ACTIONS
  //////////////////////////////////////////////////////
  const handleView = (item) => {
    if (item.type === "video") {
      setSelectedVideo(item.embed_url);
    } else if (item.type === "pdf") {
      window.open(item.file_url, "_blank");
    } else {
      alert("Assessment handled on student side");
    }
  };

const handleDelete = async (item) => {
  const confirmDelete = window.confirm("Are you sure you want to delete?");
  if (!confirmDelete) return;

  try {
    const table =
      item.type === "video"
        ? "videos"
        : item.type === "pdf"
        ? "pdfs"
        : "assessments";

    // 🔴 DELETE FROM SUPABASE
    const { error } = await supabase
      .from(table)
      .delete()
      .eq("id", item.id);

    if (error) {
      console.error("Delete error:", error);
      alert("Failed to delete");
      return;
    }

    // 🟢 UPDATE UI (REMOVE ITEM CLEANLY)
    setAllGroupedData((prev) => {
      const updated = {};

      Object.keys(prev).forEach((subject) => {
        Object.keys(prev[subject]).forEach((unit) => {
          const unitData = prev[subject][unit];

          const newVideos = unitData.videos.filter((v) => v.id !== item.id);
          const newPdfs = unitData.pdfs.filter((p) => p.id !== item.id);
          const newAssessments = unitData.assessments.filter(
            (a) => a.id !== item.id
          );

          // only keep if something exists
          if (
            newVideos.length ||
            newPdfs.length ||
            newAssessments.length
          ) {
            if (!updated[subject]) updated[subject] = {};
            updated[subject][unit] = {
              videos: newVideos,
              pdfs: newPdfs,
              assessments: newAssessments,
            };
          }
        });

        // remove subject if empty
        if (updated[subject] && Object.keys(updated[subject]).length === 0) {
          delete updated[subject];
        }
      });

      return updated;
    });

    alert("Deleted successfully ✅");
  } catch (err) {
    console.error(err);
    alert("Something went wrong");
  }
};

  //////////////////////////////////////////////////////
  // COLORS FOR SUBJECT CARDS
  //////////////////////////////////////////////////////
  const colorMap = {
    dsp: "from-blue-500 to-blue-600",
    integrations: "from-green-500 to-green-600",
    lica: "from-orange-500 to-orange-600",
    maths: "from-pink-500 to-pink-600",
    mech: "from-cyan-500 to-cyan-600",
    "signal processing": "from-blue-600 to-blue-700",
    thermodynamics: "from-green-600 to-green-700",
    "surface hardening process": "from-purple-500 to-purple-600",
  };

  const getColorClass = (subject) => {
    const key = subject.toLowerCase();
    return colorMap[key] || "from-indigo-500 to-indigo-600";
  };

  //////////////////////////////////////////////////////
  // GET DISPLAY TEXT FOR FILTER
  //////////////////////////////////////////////////////
  const getFilterDisplayText = () => {
    if (selectedSemester !== "All Semesters") {
      return selectedSemester;
    }
    if (selectedYear !== "All Years") {
      return `${selectedYear}${
        selectedYear === "1"
          ? "st"
          : selectedYear === "2"
          ? "nd"
          : selectedYear === "3"
          ? "rd"
          : "th"
      } Year`;
    }
    return "All Semesters";
  };

  //////////////////////////////////////////////////////
  // UI
  //////////////////////////////////////////////////////
  return (
    <div className="flex h-screen bg-[#f6f8fb]">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <Topbar />

        <div className="p-6 md:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              My Materials
            </h1>
            {faculty && (
              <p className="text-gray-600 text-sm">
                Showing content for{" "}
                <span className="font-semibold">
                  {faculty.subject || "Faculty"}
                </span>{" "}
                | Year {faculty.year || "—"} | Semester {faculty.semester || "—"}
              </p>
            )}
          </div>

          {/* SEARCH & FILTER BAR */}
          <div className="mb-8 flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            {/* Year & Semester Filter Dropdown */}
            <div className="md:w-56 relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-left flex items-center justify-between"
              >
                <span>{getFilterDisplayText()}</span>
                <svg
                  className={`w-5 h-5 transition-transform ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

       {/* Dropdown Menu */}
{dropdownOpen && (
  <div className="absolute top-full mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-50 overflow-hidden">

    {/* All Semesters */}
    <div
      onClick={() => {
        setSelectedYear("All Years");
        setSelectedSemester("All Semesters");
        setDropdownOpen(false);
      }}
      className={`px-4 py-3 cursor-pointer border-b ${
        selectedYear === "All Years" &&
        selectedSemester === "All Semesters"
          ? "bg-yellow-500 text-white font-semibold"
          : "hover:bg-gray-100"
      }`}
    >
      All Semesters
    </div>

    {/* 1st Year */}
    <div
      onClick={() => handleYearChange("1")}
      className={`px-4 py-3 font-semibold cursor-pointer border-b ${
        selectedYear === "1" && selectedSemester === "All Semesters"
          ? "bg-yellow-500 text-white"
          : "hover:bg-gray-100"
      }`}
    >
      1st Year
    </div>

    {/* 2nd Year */}
    <div className="px-4 py-2 font-semibold text-gray-700">2nd Year</div>

    <div
      onClick={() => handleSemesterChange("2-1")}
      className={`pl-8 py-2 cursor-pointer ${
        selectedSemester === "2-1"
          ? "bg-yellow-500 text-white"
          : "hover:bg-gray-100"
      }`}
    >
      2-1
    </div>

    <div
      onClick={() => handleSemesterChange("2-2")}
      className={`pl-8 py-2 cursor-pointer border-b ${
        selectedSemester === "2-2"
          ? "bg-yellow-500 text-white"
          : "hover:bg-gray-100"
      }`}
    >
      2-2
    </div>

    {/* 3rd Year */}
    <div className="px-4 py-2 font-semibold text-gray-700">3rd Year</div>

    <div
      onClick={() => handleSemesterChange("3-1")}
      className={`pl-8 py-2 cursor-pointer ${
        selectedSemester === "3-1"
          ? "bg-yellow-500 text-white"
          : "hover:bg-gray-100"
      }`}
    >
      3-1
    </div>

    <div
      onClick={() => handleSemesterChange("3-2")}
      className={`pl-8 py-2 cursor-pointer border-b ${
        selectedSemester === "3-2"
          ? "bg-yellow-500 text-white"
          : "hover:bg-gray-100"
      }`}
    >
      3-2
    </div>

    {/* 4th Year */}
    <div className="px-4 py-2 font-semibold text-gray-700">4th Year</div>

    <div
      onClick={() => handleSemesterChange("4-1")}
      className={`pl-8 py-2 cursor-pointer ${
        selectedSemester === "4-1"
          ? "bg-yellow-500 text-white"
          : "hover:bg-gray-100"
      }`}
    >
      4-1
    </div>

    <div
      onClick={() => handleSemesterChange("4-2")}
      className={`pl-8 py-2 cursor-pointer ${
        selectedSemester === "4-2"
          ? "bg-yellow-500 text-white"
          : "hover:bg-gray-100"
      }`}
    >
      4-2
    </div>

  </div>
)}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-500">Loading materials...</p>
            </div>
          ) : Object.keys(groupedData).length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center">
              <p className="text-gray-500">
                No content found for the selected filters
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.keys(groupedData).map((subject) => {
                const subjectData = groupedData[subject];
                const videoCount = Object.values(subjectData).reduce(
                  (sum, unit) => sum + unit.videos.length,
                  0
                );
                const pdfCount = Object.values(subjectData).reduce(
                  (sum, unit) => sum + unit.pdfs.length,
                  0
                );
                const assessmentCount = Object.values(subjectData).reduce(
                  (sum, unit) => sum + unit.assessments.length,
                  0
                );
                const totalUnits = Object.keys(subjectData).length;

                return (
                  <div
                    key={subject}
                    className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer group"
                    onClick={() => {
                      const modal = document.getElementById(`modal-${subject}`);
                      if (modal) modal.classList.remove("hidden");
                    }}
                  >
                    {/* Header Background */}
                    <div
                      className={`bg-gradient-to-r ${getColorClass(
                        subject
                      )} h-40 flex items-center justify-center relative overflow-hidden`}
                    >
                      <div className="text-white text-center relative z-10">
                        <div className="text-4xl mb-2">📚</div>
                        <h2 className="text-xl font-bold capitalize">
                          {subject}
                        </h2>
                      </div>
                      <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"></div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      {/* Stats */}
                      <div className="space-y-2 mb-6">
                        <div className="flex items-center text-sm text-gray-700">
                          <span className="text-blue-500 mr-2">🎥</span>
                          <span>
                            {videoCount} Video{videoCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-700">
                          <span className="text-red-500 mr-2">📄</span>
                          <span>
                            {pdfCount} Lecture{pdfCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-700">
                          <span className="text-green-500 mr-2">✓</span>
                          <span>
                            {assessmentCount} Assessment
                            {assessmentCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 mb-4">
                        {totalUnits} unit{totalUnits !== 1 ? "s" : ""} •{" "}
                        {videoCount + pdfCount + assessmentCount} material
                        {videoCount + pdfCount + assessmentCount !== 1
                          ? "s"
                          : ""}
                      </div>

                      {/* Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const modal = document.getElementById(
                            `modal-${subject}`
                          );
                          if (modal) modal.classList.remove("hidden");
                        }}
                        className={`w-full py-2 rounded-lg font-semibold text-white bg-gradient-to-r ${getColorClass(
                          subject
                        )} hover:opacity-90 transition-opacity flex items-center justify-center`}
                      >
                        View Details <span className="ml-2">→</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MODALS FOR EACH SUBJECT */}
      {Object.keys(groupedData).map((subject) => (
        <div
          key={`modal-${subject}`}
          id={`modal-${subject}`}
          className="hidden fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
          onClick={() => {
            document.getElementById(`modal-${subject}`).classList.add("hidden");
          }}
        >
          <div
            className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className={`bg-gradient-to-r ${getColorClass(
                subject
              )} text-white p-6 flex justify-between items-center sticky top-0 z-10`}
            >
              <h2 className="text-2xl font-bold capitalize">{subject}</h2>
              <button
                onClick={() => {
                  document
                    .getElementById(`modal-${subject}`)
                    .classList.add("hidden");
                }}
                className="text-2xl hover:bg-white hover:bg-opacity-20 w-10 h-10 rounded-full flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Modal Content - Unit by Unit */}
            <div className="p-6">
              {Object.keys(groupedData[subject])
                .sort((a, b) => {
                  const numA = parseInt(a.replace(/\D/g, "")) || 0;
                  const numB = parseInt(b.replace(/\D/g, "")) || 0;
                  return numA - numB;
                })
                .map((unit) => {
                  const unitData = groupedData[subject][unit];
                  const hasContent =
                    unitData.videos.length > 0 ||
                    unitData.pdfs.length > 0 ||
                    unitData.assessments.length > 0;

                  if (!hasContent) return null;

                  return (
                    <div key={unit} className="mb-8 last:mb-0">
                      <div className="bg-gray-100 px-4 py-3 rounded-lg mb-4">
                        <h3 className="text-lg font-bold text-gray-800 capitalize">
                          {unit}
                        </h3>
                      </div>

                      {/* Videos Section */}
                      {unitData.videos.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-sm font-semibold text-gray-600 uppercase mb-3 flex items-center">
                            <span className="text-blue-500 mr-2">🎥</span>
                            Videos ({unitData.videos.length})
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {unitData.videos.map((item) => (
                              <div
                                key={item.id}
                                className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <span className="text-2xl">🎥</span>
                                  <span className="text-xs font-semibold text-blue-600 uppercase">
                                    Video
                                  </span>
                                </div>

                                <p className="font-semibold text-gray-800 mb-3 line-clamp-2 text-sm">
                                  {item.title}
                                </p>

                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleView(item)}
                                    className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded hover:bg-blue-600 transition"
                                  >
                                    Play
                                  </button>
                                  <button
                                    onClick={() => handleDelete(item)}
                                    className="px-3 py-2 bg-red-100 text-red-600 text-sm font-medium rounded hover:bg-red-200 transition"
                                  >
                                    🗑
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Lectures (PDFs) Section */}
                      {unitData.pdfs.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-sm font-semibold text-gray-600 uppercase mb-3 flex items-center">
                            <span className="text-red-500 mr-2">📄</span>
                            Lectures ({unitData.pdfs.length})
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {unitData.pdfs.map((item) => (
                              <div
                                key={item.id}
                                className="bg-red-50 border border-red-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <span className="text-2xl">📄</span>
                                  <span className="text-xs font-semibold text-red-600 uppercase">
                                    PDF
                                  </span>
                                </div>

                                <p className="font-semibold text-gray-800 mb-3 line-clamp-2 text-sm">
                                  {item.title}
                                </p>

                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleView(item)}
                                    className="flex-1 px-3 py-2 bg-red-500 text-white text-sm font-medium rounded hover:bg-red-600 transition"
                                  >
                                    Open
                                  </button>
                                  <button
                                    onClick={() => handleDelete(item)}
                                    className="px-3 py-2 bg-red-100 text-red-600 text-sm font-medium rounded hover:bg-red-200 transition"
                                  >
                                    🗑
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Assessments Section */}
                      {unitData.assessments.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-sm font-semibold text-gray-600 uppercase mb-3 flex items-center">
                            <span className="text-green-500 mr-2">✓</span>
                            Assessments ({unitData.assessments.length})
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {unitData.assessments.map((item) => (
                              <div
                                key={item.id}
                                className="bg-green-50 border border-green-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <span className="text-2xl">✓</span>
                                  <span className="text-xs font-semibold text-green-600 uppercase">
                                    Assessment
                                  </span>
                                </div>

                                <p className="font-semibold text-gray-800 mb-3 line-clamp-2 text-sm">
                                  {item.title}
                                </p>

                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleView(item)}
                                    className="flex-1 px-3 py-2 bg-green-500 text-white text-sm font-medium rounded hover:bg-green-600 transition"
                                  >
                                    View
                                  </button>
                                  <button
                                    onClick={() => handleDelete(item)}
                                    className="px-3 py-2 bg-red-100 text-red-600 text-sm font-medium rounded hover:bg-red-200 transition"
                                  >
                                    🗑
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      ))}

      {/* VIDEO MODAL */}
      {selectedVideo && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="bg-white p-4 rounded-xl w-[90%] md:w-[80%] h-[70%] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute -top-12 right-0 text-white text-2xl hover:bg-white hover:bg-opacity-20 w-10 h-10 rounded-full flex items-center justify-center"
            >
              ✕
            </button>

            <iframe
              src={selectedVideo}
              className="w-full h-full rounded-lg"
              allow="autoplay"
            ></iframe>
          </div>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {dropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setDropdownOpen(false)}
        ></div>
      )}
    </div>
  );
}