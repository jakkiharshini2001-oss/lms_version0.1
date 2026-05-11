import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";

import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";

import { supabase } from "../../lib/supabaseClient";

export default function MySubjects() {
  const navigate = useNavigate();

  const [faculty, setFaculty] = useState(null);
  const [allSubjects, setAllSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingKey, setDeletingKey] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");

  useEffect(() => {
    loadSubjects();
  }, []);

  useEffect(() => {
    filterSubjects();
  }, [searchQuery, selectedFilter, allSubjects]);

  const getEmbedUrl = (item) => {
    if (item.embed_url) return item.embed_url;
    if (item.file_id)
      return `https://drive.google.com/file/d/${item.file_id}/preview?usp=sharing`;
    return "#";
  };

  const getFileUrl = (item) => {
    if (item.file_url) return item.file_url;
    if (item.file_id) return `https://drive.google.com/uc?id=${item.file_id}`;
    return "#";
  };

  const normalize = (item, type) => ({
    ...item,
    type,
    embed_url: getEmbedUrl(item),
    file_url: getFileUrl(item),
  });

  // Returns grouped subjects array directly (doesn't touch state)
  const fetchAndGroup = async (facultyId) => {
    const { data: videos = [] } = await supabase
      .from("videos")
      .select("*")
      .eq("faculty_id", facultyId)
      .order("created_at", { ascending: false });

    const { data: pdfs = [] } = await supabase
      .from("pdfs")
      .select("*")
      .eq("faculty_id", facultyId)
      .order("created_at", { ascending: false });

    const { data: assessments = [] } = await supabase
      .from("assessments")
      .select("*")
      .eq("faculty_id", facultyId)
      .order("created_at", { ascending: false });

    const allContent = [
      ...videos.map((i) => normalize(i, "video")),
      ...pdfs.map((i) => normalize(i, "pdf")),
      ...assessments.map((i) => normalize(i, "assessment")),
    ];

    const grouped = {};
    allContent.forEach((i) => {
      const subject = i.subject || "Unknown Subject";
      const year = String(i.year);
      const semester =
        i.semester === null || i.semester === undefined
          ? null
          : String(i.semester);
      const key = `${year}__${semester}__${subject}`;

      if (!grouped[key]) {
        grouped[key] = { subject, year, semester, videos: 0, notes: 0, assessments: 0 };
      }
      if (i.type === "video") grouped[key].videos += 1;
      if (i.type === "pdf") grouped[key].notes += 1;
      if (i.type === "assessment") grouped[key].assessments += 1;
    });

    return Object.values(grouped);
  };

  const loadSubjects = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: facultyData, error: facultyError } = await supabase
        .from("faculty")
        .select("*")
        .eq("id", user.id)
        .single();
      if (facultyError) throw facultyError;

      setFaculty(facultyData);

      const grouped = await fetchAndGroup(facultyData.id);
      setAllSubjects(grouped);
    } catch (err) {
      console.error("Load subjects error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterSubjects = () => {
    let result = [...allSubjects];

    if (searchQuery.trim() !== "") {
      result = result.filter((item) =>
        item.subject.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedFilter !== "All") {
      if (selectedFilter === "1") {
        result = result.filter((item) => item.year === "1" && item.semester === null);
      } else {
        const [year, semester] = selectedFilter.split("-");
        result = result.filter((item) => item.year === year && item.semester === semester);
      }
    }

    setFilteredSubjects(result);
  };

  const deleteSubject = async (item) => {
    const label = getYearLabel(item);
    const confirmed = window.confirm(
      `Delete ALL content for "${item.subject}" (${label})?\n\n` +
      `• ${item.videos} Videos\n` +
      `• ${item.notes} Lecture Notes\n` +
      `• ${item.assessments} Assessments\n\n` +
      `This cannot be undone.`
    );
    if (!confirmed) return;

    const key = getItemKey(item);
    setDeletingKey(key);

    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) throw new Error("Not authenticated");

      const { data: facultyData, error: facErr } = await supabase
        .from("faculty")
        .select("id")
        .eq("id", user.id)
        .single();
      if (facErr) throw new Error("Could not verify faculty: " + facErr.message);

      const facultyId = facultyData.id;
      const targetSubject = item.subject;
      const targetYear = Number(item.year);
      const targetSemester = item.semester === null ? null : Number(item.semester);

      console.log("🗑️ Deleting:", { facultyId, subject: targetSubject, year: targetYear, semester: targetSemester });

      const deleteFrom = async (table) => {
        let query = supabase
          .from(table)
          .delete()
          .eq("faculty_id", facultyId)
          .eq("subject", targetSubject)
          .eq("year", targetYear);

        query = targetSemester === null
          ? query.is("semester", null)
          : query.eq("semester", targetSemester);

        const { error } = await query;
        if (error) throw new Error(`${table}: ${error.message}`);
        console.log(`✅ ${table} deleted`);
      };

      await deleteFrom("videos");
      await deleteFrom("pdfs");
      await deleteFrom("assessments");

      // ── Update UI immediately without waiting for a full reload ──
      // Remove the deleted card from state directly
      setAllSubjects((prev) => prev.filter((s) => getItemKey(s) !== key));
      setFilteredSubjects((prev) => prev.filter((s) => getItemKey(s) !== key));

      // Then silently refresh from DB in the background to stay in sync
      fetchAndGroup(facultyId).then((fresh) => {
        setAllSubjects(fresh);
      });

    } catch (err) {
      console.error("Delete error:", err);
      alert(`Error: ${err.message}`);
      // On error, reload to restore correct state
      await loadSubjects();
    } finally {
      setDeletingKey(null);
    }
  };

  const getItemKey = (item) => `${item.year}__${item.semester}__${item.subject}`;

  const getYearLabel = (item) => {
    if (item.year === "1") return "1st Year";
    if (item.year === "2") return `2nd Year - Semester ${item.semester}`;
    if (item.year === "3") return `3rd Year - Semester ${item.semester}`;
    if (item.year === "4") return `4th Year - Semester ${item.semester}`;
    return `Year ${item.year}`;
  };

  const getColorClass = (subject) => {
    const key = subject.toLowerCase();
    const colorMap = {
      mech: "from-cyan-500 to-cyan-600",
      maths: "from-pink-500 to-pink-600",
      lica: "from-orange-500 to-orange-600",
      dsp: "from-blue-500 to-blue-600",
    };
    return colorMap[key] || "from-indigo-500 to-indigo-600";
  };

  const openDetails = (item) => {
    navigate(
      `/faculty/my-subjects/${encodeURIComponent(item.subject)}?year=${item.year}&semester=${item.semester ?? ""}`
    );
  };

  return (
    <div className="flex h-screen bg-[#f6f8fb] overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Subjects</h1>
            <p className="text-gray-500 text-sm">Manage subject-wise academic content</p>
          </div>

          {faculty && (
            <div className="bg-white rounded-2xl border shadow-sm p-5 mb-8 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold uppercase">
                {faculty.name?.charAt(0)}
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg capitalize">{faculty.name}</h2>
                <p className="text-gray-500 text-sm">{faculty.department}</p>
              </div>
            </div>
          )}

          <div className="mb-8 flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search subjects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-3 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-4 py-3 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500"
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
            <div className="bg-white rounded-2xl p-10 text-center border shadow-sm">
              Loading subjects...
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border shadow-sm">
              <div className="text-5xl mb-4">📚</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">No Subjects Found</h2>
              <p className="text-gray-500 mb-6">Upload videos, lecture notes and assessments.</p>
              <button
                onClick={() => navigate("/faculty/upload")}
                className="px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
              >
                Upload Content
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredSubjects.map((item) => {
                const key = getItemKey(item);
                const isDeleting = deletingKey === key;

                return (
                  <div
                    key={key}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm border"
                    style={{ position: "relative" }}
                  >
                    {/* Delete button */}
                    <button
                      type="button"
                      title="Delete subject"
                      disabled={isDeleting}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSubject(item);
                      }}
                      style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        zIndex: 50,
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        border: "none",
                        backgroundColor: isDeleting ? "#fca5a5" : "#ef4444",
                        color: "#fff",
                        cursor: isDeleting ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                      }}
                    >
                      {isDeleting ? (
                        <div style={{
                          width: 16, height: 16,
                          border: "2px solid #fff",
                          borderTopColor: "transparent",
                          borderRadius: "50%",
                          animation: "spin 0.7s linear infinite",
                        }} />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>

                    {/* Gradient header — pointer-events none so it never blocks the button */}
                    <div
                      className={`bg-gradient-to-r ${getColorClass(item.subject)} h-40 flex items-center justify-center`}
                      style={{ pointerEvents: "none" }}
                    >
                      <div className="text-center text-white">
                        <div className="text-5xl mb-3">📚</div>
                        <h2 className="text-2xl font-bold capitalize">{item.subject}</h2>
                        <p className="text-sm mt-2 opacity-90">{getYearLabel(item)}</p>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="space-y-3 mb-6 text-gray-700">
                        <div>🎥 {item.videos} Videos</div>
                        <div>📄 {item.notes} Lecture Notes</div>
                        <div>📝 {item.assessments} Assessments</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => openDetails(item)}
                        className="w-full px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-colors"
                      >
                        Open Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}