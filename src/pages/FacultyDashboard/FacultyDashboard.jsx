import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";

import {
  Upload,
  Plus,
  BookOpen,
  FileText,
  ClipboardList,
  Users,
} from "lucide-react";

import { supabase } from "../../lib/supabaseClient";

// KEEP EXISTING IMAGES
const courseImages = [
  "/course_tech.png",
  "/course_group.png",
  "/course_lab.png",
];

export default function FacultyDashboard() {
  const navigate = useNavigate();

  //////////////////////////////////////////////////////
  // STATES
  //////////////////////////////////////////////////////

  const [faculty, setFaculty] = useState(null);

  const [stats, setStats] = useState({
    lectures: 0,
    notes: 0,
    assessments: 0,
    students: 0,
  });

  const [subjects, setSubjects] = useState([]);

  const [recentActivity, setRecentActivity] = useState([]);

  const [loading, setLoading] = useState(true);

  //////////////////////////////////////////////////////
  // LOAD DASHBOARD
  //////////////////////////////////////////////////////

  useEffect(() => {
    loadDashboard();
  }, []);

  //////////////////////////////////////////////////////
  // MAIN FUNCTION
  //////////////////////////////////////////////////////

  const loadDashboard = async () => {
    try {
      setLoading(true);

      //////////////////////////////////////////////////////
      // GET AUTH USER
      //////////////////////////////////////////////////////

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/faculty/login");
        return;
      }

      //////////////////////////////////////////////////////
      // GET FACULTY DETAILS
      //////////////////////////////////////////////////////

      const { data: facultyData, error: facultyError } = await supabase
        .from("faculty")
        .select("*")
        .eq("id", user.id)
        .single();

      if (facultyError || !facultyData) {
        console.error("Faculty fetch error:", facultyError);
        return;
      }

      setFaculty(facultyData);

      //////////////////////////////////////////////////////
      // FETCH VIDEOS
      //////////////////////////////////////////////////////

      const { data: videos = [] } = await supabase
        .from("videos")
        .select("*")
        .eq("faculty_id", facultyData.id)
        .eq("department", facultyData.department)
        .order("created_at", { ascending: false });

      //////////////////////////////////////////////////////
      // FETCH PDFS
      //////////////////////////////////////////////////////

      const { data: pdfs = [] } = await supabase
        .from("pdfs")
        .select("*")
        .eq("faculty_id", facultyData.id)
        .eq("department", facultyData.department)
        .order("created_at", { ascending: false });

      //////////////////////////////////////////////////////
      // FETCH ASSESSMENTS
      //////////////////////////////////////////////////////

      const { data: assessments = [] } = await supabase
        .from("assessments")
        .select("*")
        .eq("faculty_id", facultyData.id)
        .eq("department", facultyData.department)
        .order("created_at", { ascending: false });

      //////////////////////////////////////////////////////
      // FETCH STUDENTS COUNT
      //////////////////////////////////////////////////////

      const { count: studentsCount, error: studentError } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("department", facultyData.department);

      if (studentError) {
        console.error("Student count error:", studentError);
      }

      //////////////////////////////////////////////////////
      // STATS
      //////////////////////////////////////////////////////

      setStats({
        lectures: videos.length,
        notes: pdfs.length,
        assessments: assessments.length,
        students: studentsCount || 0,
      });

      //////////////////////////////////////////////////////
      // CREATE SUBJECTS DYNAMICALLY
      //////////////////////////////////////////////////////

      const subjectMap = new Map();

      const addSubject = (item, type) => {
        const subjectName = item.subject || "Unknown Subject";
        const year = String(item.year || "");
        const semester = item.semester ? String(item.semester) : "";

        const key = `${subjectName}-${year}-${semester}`;

        if (!subjectMap.has(key)) {
          subjectMap.set(key, {
            name: subjectName,
            year,
            semester,
            department: item.department,
            videos: 0,
            notes: 0,
            assessments: 0,
            latestDate: item.created_at,
          });
        }

        const subject = subjectMap.get(key);

        //////////////////////////////////////////////////////
        // VIDEO COUNT
        //////////////////////////////////////////////////////

        if (type === "video") {
          subject.videos += 1;
        }

        //////////////////////////////////////////////////////
        // PDF COUNT
        //////////////////////////////////////////////////////

        if (type === "pdf") {
          subject.notes += 1;
        }

        //////////////////////////////////////////////////////
        // ASSESSMENT COUNT
        //////////////////////////////////////////////////////

        if (type === "assessment") {
          subject.assessments += 1;
        }

        //////////////////////////////////////////////////////
        // RECENT DATE
        //////////////////////////////////////////////////////

        if (new Date(item.created_at) > new Date(subject.latestDate)) {
          subject.latestDate = item.created_at;
        }
      };

      videos.forEach((item) => addSubject(item, "video"));
      pdfs.forEach((item) => addSubject(item, "pdf"));
      assessments.forEach((item) => addSubject(item, "assessment"));

      //////////////////////////////////////////////////////
      // SORT RECENT SUBJECTS FIRST
      //////////////////////////////////////////////////////

      const sortedSubjects = Array.from(subjectMap.values()).sort(
        (a, b) => new Date(b.latestDate) - new Date(a.latestDate)
      );

      setSubjects(sortedSubjects);

      //////////////////////////////////////////////////////
      // RECENT ACTIVITY
      //////////////////////////////////////////////////////

      const allActivity = [
        ...videos.map((v) => ({
          type: "Video uploaded",
          title: v.title,
          created_at: v.created_at,
        })),

        ...pdfs.map((p) => ({
          type: "PDF uploaded",
          title: p.title,
          created_at: p.created_at,
        })),

        ...assessments.map((a) => ({
          type: "Assessment created",
          title: a.title,
          created_at: a.created_at,
        })),
      ];

      //////////////////////////////////////////////////////
      // SORT RECENT FIRST
      //////////////////////////////////////////////////////

      allActivity.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      setRecentActivity(allActivity.slice(0, 8));
    } catch (err) {
      console.error("Dashboard Error:", err);
    } finally {
      setLoading(false);
    }
  };

  //////////////////////////////////////////////////////
  // OPEN SUBJECT DETAILS
  //////////////////////////////////////////////////////

  const openSubjectDetails = (subject) => {
    navigate(
      `/faculty/my-subjects/${encodeURIComponent(subject.name)}?year=${subject.year
      }&semester=${subject.semester || ""}`
    );
  };

  //////////////////////////////////////////////////////
  // LOADING
  //////////////////////////////////////////////////////

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#f8f9fc]">
        <p className="text-gray-500 text-lg">Loading dashboard...</p>
      </div>
    );
  }

  //////////////////////////////////////////////////////
  // SHOW ONLY FEW SUBJECTS
  //////////////////////////////////////////////////////

  const displayedSubjects = subjects.slice(0, 3);

  //////////////////////////////////////////////////////
  // UI
  //////////////////////////////////////////////////////

  return (
    <div className="flex h-screen bg-[#f8f9fc] font-sans">
      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TOPBAR */}
        <Topbar />

        {/* CONTENT */}
        <div className="p-8 overflow-y-auto">
          {/* HEADER */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-[28px] font-bold text-gray-900 mb-1">
                Welcome back, {faculty?.name} 👋
              </h1>

              <p className="text-gray-500 text-[14px]">
                {faculty?.department} • Faculty Workspace
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate("/faculty/upload")}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 bg-white hover:bg-gray-50 font-medium text-[14px] shadow-sm"
              >
                <Upload size={16} className="text-gray-500" />
                Upload Course
              </button>

            </div>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-4 gap-5 mb-10">
            <StatBox
              title="Total Videos"
              value={stats.lectures}
              trend="+12.4%"
              trendColor="text-green-600 bg-green-50"
              iconColor="text-green-600 bg-green-50"
              icon={<BookOpen size={20} />}
            />

            <StatBox
              title="Total Lecture Notes"
              value={stats.notes}
              trend="+8.1%"
              trendColor="text-blue-600 bg-blue-50"
              iconColor="text-blue-600 bg-blue-50"
              icon={<FileText size={20} />}
            />

            <StatBox
              title="Assessments"
              value={stats.assessments}
              trend="+24.8%"
              trendColor="text-orange-500 bg-orange-50"
              iconColor="text-orange-500 bg-orange-50"
              icon={<ClipboardList size={20} />}
            />

            <StatBox
              title="Students"
              value={stats.students}
              trend="+3.2%"
              trendColor="text-emerald-600 bg-emerald-50"
              iconColor="text-pink-500 bg-pink-50"
              icon={<Users size={20} />}
            />
          </div>

          {/* MY COURSES */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-[18px] font-bold text-gray-900">
                  My Courses
                </h2>

                <p className="text-gray-500 text-[13px]">
                  Recently uploaded department subjects.
                </p>
              </div>

              {subjects.length > 3 && (
                <button
                  onClick={() => navigate("/faculty/subjects")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-[13px] font-semibold"
                >
                  View All
                </button>
              )}
            </div>

            {subjects.length === 0 ? (
              <div className="py-16 text-center">
                <div className="text-5xl mb-4">📚</div>

                <h2 className="text-xl font-bold text-gray-700 mb-2">
                  No Courses Yet
                </h2>

                <p className="text-gray-500 mb-6">
                  Upload lectures, PDFs or assessments to create courses.
                </p>

                <button
                  onClick={() => navigate("/faculty/upload")}
                  className="px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                >
                  Upload Content
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-6">
                {displayedSubjects.map((sub, i) => (
                  <SubjectBox
                    key={`${sub.name}-${sub.year}-${sub.semester}`}
                    subject={sub}
                    image={courseImages[i % courseImages.length]}
                    onClick={() => openSubjectDetails(sub)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* BOTTOM SECTION */}
          <div className="grid grid-cols-3 gap-6">
            {/* RECENT ACTIVITY */}
            <div className="col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-[18px] font-bold text-gray-900 mb-6">
                Recent Activity
              </h2>

              <div className="flex flex-col gap-0">
                {recentActivity.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    No recent activity found.
                  </p>
                ) : (
                  recentActivity.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-4 border-b border-gray-50 last:border-none"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[13px]">
                          {item.title?.charAt(0)}
                        </div>

                        <div>
                          <p className="text-[14px] font-bold text-gray-900">
                            {item.title}
                          </p>

                          <p className="text-[12px] text-gray-500">
                            {item.type}
                          </p>
                        </div>
                      </div>

                      <span className="text-[12px] text-gray-400 font-medium">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* RIGHT CARD */}
            <div className="bg-blue-500 rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden shadow-lg shadow-blue-200">
              <div className="relative z-10">
                <h2 className="text-[20px] font-bold text-white mb-2 leading-tight">
                  {faculty?.department}
                </h2>

                <p className="text-blue-100 text-[13px] leading-relaxed mb-6">
                  Your dashboard displays only your department content,
                  uploaded academic resources and student count.
                </p>

                <button className="bg-white text-gray-900 font-semibold text-[13px] px-5 py-2.5 rounded-lg w-max">
                  Faculty Workspace
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

//////////////////////////////////////////////////////
// STAT BOX
//////////////////////////////////////////////////////

function StatBox({
  title,
  value,
  trend,
  icon,
  iconColor,
  trendColor,
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${iconColor}`}
        >
          {icon}
        </div>

        <div
          className={`px-2 py-1 rounded text-[11px] font-bold ${trendColor}`}
        >
          {trend}
        </div>
      </div>

      <div>
        <h2 className="text-[28px] font-black text-gray-900 leading-none mb-1">
          {value}
        </h2>

        <p className="text-gray-400 text-[12px] font-medium">{title}</p>
      </div>
    </div>
  );
}

//////////////////////////////////////////////////////
// SUBJECT BOX
//////////////////////////////////////////////////////

function SubjectBox({ subject, image, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-gray-200/50 transition-all flex flex-col group cursor-pointer"
    >
      {/* IMAGE */}
      <div className="h-[180px] w-full overflow-hidden relative">
        <img
          src={image}
          alt={subject.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
      </div>

      {/* CONTENT */}
      <div className="p-5 flex flex-col flex-1">
        {/* TOP */}
        <div className="flex justify-between items-center mb-3">
          <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-black tracking-wider uppercase rounded">
            {subject.department}
          </span>

          <span className="text-[12px] font-bold text-gray-600">
            Year {subject.year}
          </span>
        </div>

        {/* TITLE */}
        <h3 className="font-bold text-gray-900 text-[16px] leading-snug mb-2 flex-1">
          {subject.name}
        </h3>

        {/* FOOTER */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
          <div className="flex items-center gap-1.5 text-gray-500">
            <Users size={14} />

            <span className="text-[12px] font-semibold">
              {subject.year === "1"
                ? "No Semester"
                : `Semester ${subject.semester || "-"}`}
            </span>
          </div>

          <div className="flex gap-2">
            <span className="text-blue-600 font-bold text-[14px]">
              {subject.videos +
                subject.notes +
                subject.assessments}{" "}
              Items
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}