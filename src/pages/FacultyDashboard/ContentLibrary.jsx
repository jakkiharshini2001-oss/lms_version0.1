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
  const [selectedPdf, setSelectedPdf] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        setLoading(false);
        return;
      }

      const { data: facultyData, error: facultyError } = await supabase
        .from("faculty")
        .select("*")
        .eq("email", user.email)
        .single();

      if (facultyError || !facultyData) {
        console.log(facultyError);
        setLoading(false);
        return;
      }

      setFaculty(facultyData);

      const { data: videos = [] } = await supabase
        .from("videos")
        .select("*")
        .eq("faculty_id", facultyData.id);

      const { data: pdfs = [] } = await supabase
        .from("pdfs")
        .select("*")
        .eq("faculty_id", facultyData.id);

      const { data: assessments = [] } = await supabase
        .from("assessments")
        .select("*")
        .eq("faculty_id", facultyData.id);

      const normalize = (item, type) => ({
        ...item,
        type,

        embed_url: item.file_id
          ? `https://drive.google.com/file/d/${item.file_id}/preview?usp=sharing`
          : null,

        file_url: item.file_id
          ? `https://drive.google.com/uc?id=${item.file_id}`
          : null,
      });

      const allContent = [
        ...(videos || []).map((i) => normalize(i, "video")),
        ...(pdfs || []).map((i) => normalize(i, "pdf")),
        ...(assessments || []).map((i) => normalize(i, "assessment")),
      ];

      const grouped = {};

      const formatUnit = (unit) => {
        if (!unit) return "Unit 1";

        if (String(unit).toLowerCase().includes("unit")) {
          return unit;
        }

        return `Unit ${unit}`;
      };

      allContent.forEach((item) => {
        const subject = item.subject || "Unknown Subject";
        const unit = formatUnit(item.unit);

        if (!grouped[subject]) {
          grouped[subject] = {};
        }

        if (!grouped[subject][unit]) {
          grouped[subject][unit] = {
            videos: [],
            pdfs: [],
            assessments: [],
          };
        }

        if (item.type === "video") {
          grouped[subject][unit].videos.push(item);
        }

        if (item.type === "pdf") {
          grouped[subject][unit].pdfs.push(item);
        }

        if (item.type === "assessment") {
          grouped[subject][unit].assessments.push(item);
        }
      });

      setAllGroupedData(grouped);
      setGroupedData(grouped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = {};

    Object.keys(allGroupedData).forEach((subject) => {
      if (
        searchQuery === "" ||
        subject.toLowerCase().includes(searchQuery.toLowerCase())
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
            const itemSemester = item.semester ? String(item.semester) : "";

            if (selectedFilter === "All") {
              return true;
            }

            if (selectedFilter === "1") {
              return itemYear === "1";
            }

            const [year, semester] = selectedFilter.split("-");

            return itemYear === year && itemSemester === semester;
          });

          if (filteredItems.length > 0) {
            filtered[subject][unit] = {
              videos: filteredItems.filter((i) => i.type === "video"),
              pdfs: filteredItems.filter((i) => i.type === "pdf"),
              assessments: filteredItems.filter(
                (i) => i.type === "assessment"
              ),
            };
          }
        });

        if (Object.keys(filtered[subject]).length === 0) {
          delete filtered[subject];
        }
      }
    });

    setGroupedData(filtered);
  }, [searchQuery, selectedFilter, allGroupedData]);

  const handleView = (item) => {
    if (item.type === "video") {
      setSelectedVideo(item.embed_url);
    } else if (item.type === "pdf") {
      setSelectedPdf(item);
    } else {
      alert("Assessment preview coming soon");
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

      const { error } = await supabase.from(table).delete().eq("id", item.id);

      if (error) {
        alert("Delete failed");
        return;
      }

      loadContent();
      alert("Deleted successfully");
    } catch (err) {
      console.error(err);
    }
  };

  const colorMap = {
    mech: "from-cyan-500 to-cyan-600",
    maths: "from-pink-500 to-pink-600",
    lica: "from-orange-500 to-orange-600",
    dsp: "from-blue-500 to-blue-600",
  };

  const getColorClass = (subject) => {
    const key = subject.toLowerCase();

    return colorMap[key] || "from-indigo-500 to-indigo-600";
  };

  return (
    <div className="flex h-screen bg-[#f6f8fb]">
      <Sidebar />

      <div className="flex-1 overflow-y-auto">
        <Topbar />

        <div className="p-6 md:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Content Library
            </h1>

            <p className="text-gray-500">
              Manage all uploaded academic resources
            </p>
          </div>

          <div className="mb-8 flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search subjects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-3 border rounded-xl bg-white"
            />

            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-4 py-3 border rounded-xl bg-white"
            >
              <option value="All">All Years</option>

              <option value="1">1st Year</option>

              <option value="2-1">2nd Year - Semester 1</option>
              <option value="2-2">2nd Year - Semester 2</option>

              <option value="3-1">3rd Year - Semester 1</option>
              <option value="3-2">3rd Year - Semester 2</option>

              <option value="4-1">4th Year - Semester 1</option>
              <option value="4-2">4th Year - Semester 2</option>
            </select>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl p-10 text-center">
              Loading...
            </div>
          ) : Object.keys(groupedData).length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center">
              No content found
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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

                return (
                  <div
                    key={subject}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm border"
                  >
                    <div
                      className={`bg-gradient-to-r ${getColorClass(
                        subject
                      )} h-40 flex items-center justify-center`}
                    >
                      <div className="text-center text-white">
                        <div className="text-5xl mb-3">📚</div>

                        <h2 className="text-2xl font-bold capitalize">
                          {subject}
                        </h2>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="space-y-3 mb-6">
                        <div>🎥 {videoCount} Videos</div>
                        <div>📄 {pdfCount} Lectures</div>
                        <div>📝 {assessmentCount} Assessments</div>
                      </div>

                      <div className="space-y-6">
                        {Object.keys(subjectData).map((unit) => {
                          const unitData = subjectData[unit];

                          return (
                            <div key={unit} className="border rounded-xl p-4">
                              <h3 className="font-bold text-gray-800 mb-4">
                                {unit}
                              </h3>

                              {unitData.videos.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between mb-3 bg-blue-50 p-3 rounded-lg"
                                >
                                  <div>🎥 {item.title}</div>

                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleView(item)}
                                      className="px-3 py-1 bg-blue-500 text-white rounded"
                                    >
                                      View
                                    </button>

                                    <button
                                      onClick={() => handleDelete(item)}
                                      className="px-3 py-1 bg-red-500 text-white rounded"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              ))}

                              {unitData.pdfs.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between mb-3 bg-red-50 p-3 rounded-lg"
                                >
                                  <div>📄 {item.title}</div>

                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleView(item)}
                                      className="px-3 py-1 bg-red-500 text-white rounded"
                                    >
                                      Open
                                    </button>

                                    <button
                                      onClick={() => handleDelete(item)}
                                      className="px-3 py-1 bg-red-700 text-white rounded"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              ))}

                              {unitData.assessments.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between mb-3 bg-green-50 p-3 rounded-lg"
                                >
                                  <div>📝 {item.title}</div>

                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleView(item)}
                                      className="px-3 py-1 bg-green-500 text-white rounded"
                                    >
                                      View
                                    </button>

                                    <button
                                      onClick={() => handleDelete(item)}
                                      className="px-3 py-1 bg-red-500 text-white rounded"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedVideo && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="bg-white rounded-2xl w-[90%] h-[80%] p-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute top-4 right-4 text-2xl"
            >
              ✕
            </button>

            <iframe
              src={selectedVideo}
              className="w-full h-full rounded-xl"
              allow="autoplay"
            />
          </div>
        </div>
      )}

      {selectedPdf && (
        <div
          className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4"
          onClick={() => setSelectedPdf(null)}
        >
          <div
            className="bg-[#1f1f1f] rounded-2xl overflow-hidden w-full max-w-[1600px] h-[94vh] shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#08275c] px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-white text-2xl font-bold">
                  {selectedPdf.title}
                </h2>

                <p className="text-blue-100 text-sm mt-1">
                  Lecture Notes PDF
                </p>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={selectedPdf.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-yellow-400 hover:bg-yellow-500 text-black px-5 py-2.5 rounded-xl font-semibold"
                >
                  Download PDF
                </a>

                <button
                  onClick={() => setSelectedPdf(null)}
                  className="w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 text-white text-2xl flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 bg-black">
              <iframe
                src={selectedPdf.embed_url}
                title={selectedPdf.title}
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}