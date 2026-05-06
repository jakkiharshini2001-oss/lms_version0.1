import { useEffect, useState } from "react";
import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";
import { supabase } from "../../lib/supabaseClient";

export default function StudentPerformance() {
  const [filter, setFilter] = useState({
    subject: "",
    unit: "",
  });

  const [data, setData] = useState([]);

  useEffect(() => {
    fetchPerformance();
  }, []);

  const fetchPerformance = async () => {
  try {
    // 1. Get logged-in faculty
    const { data: authData } = await supabase.auth.getUser();
    const facultyId = authData?.user?.id;

    if (!facultyId) return;

    // 2. Get assessments created by this faculty
    const { data: assessments, error: aError } = await supabase
      .from("assessments")
      .select("id, subject, unit, department, year, semester")
      .eq("faculty_id", facultyId);

    if (aError) throw aError;

    const assessmentIds = assessments.map((a) => a.id);

    if (assessmentIds.length === 0) {
      setData([]);
      return;
    }

    // 3. Get attempts for those assessments
    const { data: attempts, error } = await supabase
      .from("student_attempts")
      .select(`
        id,
        score,
        total,
        student_id,
        assessment_id,
        students(full_name, department, year, semester)
      `)
      .in("assessment_id", assessmentIds);

    if (error) throw error;

    // 4. Merge assessment data
    const formatted = attempts.map((item) => {
      const assessment = assessments.find(
        (a) => a.id === item.assessment_id
      );

      return {
        name: item.students?.full_name || "Unknown",
        subject: assessment?.subject || "N/A",
        unit: assessment?.unit || "N/A",
        department: assessment?.department,
        year: assessment?.year,
        semester: assessment?.semester,
        score: item.score,
        total: item.total,
      };
    });

    setData(formatted);

  } catch (err) {
    console.error("Error fetching performance:", err);
  }
};
  const getStatus = (score, total) => {
    const percent = (score / total) * 100;
    return percent >= 50 ? "Pass" : "fail";
  };

  return (
    <div className="flex h-screen bg-[#f6f8fb]">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Topbar />

        <div className="p-6">
          <h1 className="text-2xl font-semibold text-gray-800 mb-6">
            Student Performance
          </h1>

          {/* FILTERS */}
          <div className="bg-white border rounded-xl p-4 mb-6 flex gap-4">
            <input
              placeholder="Search subject..."
              className="border px-3 py-2 rounded-lg w-1/3"
              onChange={(e) =>
                setFilter({ ...filter, subject: e.target.value })
              }
            />

            <input
              placeholder="Search unit..."
              className="border px-3 py-2 rounded-lg w-1/3"
              onChange={(e) =>
                setFilter({ ...filter, unit: e.target.value })
              }
            />
          </div>

          {/* TABLE */}
          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            <div className="grid grid-cols-5 bg-gray-50 px-5 py-3 text-sm font-semibold text-gray-600">
              <span>Student</span>
              <span>Subject</span>
              <span>Unit</span>
              <span>Score</span>
              <span>Status</span>
            </div>

            {data
              .filter((item) => {
                return (
                  (filter.subject === "" ||
                    item.subject
                      .toLowerCase()
                      .includes(filter.subject.toLowerCase())) &&
                  (filter.unit === "" ||
                    item.unit
                      .toLowerCase()
                      .includes(filter.unit.toLowerCase()))
                );
              })
              .map((item, index) => {
                const status = getStatus(item.score, item.total);

                return (
                  <div
                    key={index}
                    className="grid grid-cols-5 px-5 py-4 border-t text-sm items-center"
                  >
                    <span className="font-medium text-gray-800">
                      {item.name}
                    </span>

                    <span className="text-gray-600">
                      {item.subject}
                    </span>

                    <span className="text-gray-600">
                      {item.unit}
                    </span>

                    <span className="text-gray-700">
                      {item.score}/{item.total}
                    </span>

                    <span
                      className={`font-medium ${
                        status === "Pass"
                          ? "text-green-600"
                          : "text-red-500"
                      }`}
                    >
                      {status}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}