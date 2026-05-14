import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";
import { supabase } from "../../lib/supabaseClient";

export default function StudentPerformance() {
  const [filter, setFilter] = useState({
    yearSemester: "all",
    subject: "",
    unit: "",
    status: "all",
  });

  const [faculty, setFaculty] = useState(null);
  const [students, setStudents] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  const yearSemesterOptions = [
    { label: "All Years", value: "all", year: "", semester: "" },
    { label: "1st Year", value: "1-1", year: "1", semester: "1" },
    { label: "2nd Year - Semester 1", value: "2-1", year: "2", semester: "1" },
    { label: "2nd Year - Semester 2", value: "2-2", year: "2", semester: "2" },
    { label: "3rd Year - Semester 1", value: "3-1", year: "3", semester: "1" },
    { label: "3rd Year - Semester 2", value: "3-2", year: "3", semester: "2" },
    { label: "4th Year - Semester 1", value: "4-1", year: "4", semester: "1" },
    { label: "4th Year - Semester 2", value: "4-2", year: "4", semester: "2" },
  ];

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const selectedYearSemester = useMemo(() => {
    return (
      yearSemesterOptions.find((item) => item.value === filter.yearSemester) ||
      yearSemesterOptions[0]
    );
  }, [filter.yearSemester]);

  const isYearSemesterSelected = filter.yearSemester !== "all";

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);

      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;

      const authUserId = authData?.user?.id;

      if (!authUserId) {
        setLoading(false);
        return;
      }

      const { data: facultyData, error: facultyError } = await supabase
        .from("faculty")
        .select("*")
        .eq("id", authUserId)
        .single();

      if (facultyError) throw facultyError;

      setFaculty(facultyData);

      const { data: assessmentData = [], error: assessmentError } =
        await supabase
          .from("assessments")
          .select(
            "id, title, subject, unit, department, year, semester, faculty_id"
          )
          .eq("faculty_id", authUserId)
          .eq("department", facultyData.department);

      if (assessmentError) throw assessmentError;

      setAssessments(assessmentData);

      const { data: studentData = [], error: studentError } = await supabase
        .from("students")
        .select(
          "id, full_name, email, hall_ticket, course, department, year, semester"
        )
        .eq("department", facultyData.department)
        .order("full_name", { ascending: true });

      if (studentError) throw studentError;

      setStudents(studentData);

      const assessmentIds = assessmentData.map((item) => item.id);

      if (assessmentIds.length === 0) {
        setAttempts([]);
        return;
      }

      const { data: attemptData = [], error: attemptError } = await supabase
        .from("student_attempts")
        .select(
          `
          id,
          student_id,
          assessment_id,
          answers_json,
          score,
          total,
          submitted_at,
          department,
          year,
          semester,
          subject,
          unit
        `
        )
        .in("assessment_id", assessmentIds)
        .eq("department", facultyData.department);

      if (attemptError) throw attemptError;

      setAttempts(attemptData);
    } catch (error) {
      console.error("Error fetching student performance:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (score, total) => {
    if (
      score === null ||
      score === undefined ||
      total === null ||
      total === undefined ||
      Number(total) === 0
    ) {
      return "Not Attempted";
    }

    const percentage = (Number(score) / Number(total)) * 100;
    return percentage >= 50 ? "Pass" : "Fail";
  };

  const getStatusClass = (status) => {
    if (status === "Pass") {
      return "bg-green-50 text-green-700 border-green-200";
    }

    if (status === "Fail") {
      return "bg-red-50 text-red-700 border-red-200";
    }

    return "bg-gray-100 text-gray-600 border-gray-200";
  };

  const normalizeText = (value) => {
    return String(value || "").trim().toLowerCase();
  };

  const filteredAssessments = useMemo(() => {
    return assessments.filter((assessment) => {
      const assessmentYear = String(assessment.year || "");
      const assessmentSemester = String(assessment.semester || "");

      const matchesYearSemester =
        filter.yearSemester === "all" ||
        (assessmentYear === selectedYearSemester.year &&
          assessmentSemester === selectedYearSemester.semester);

      const matchesSubject =
        filter.subject === "" ||
        normalizeText(assessment.subject).includes(
          normalizeText(filter.subject)
        );

      const matchesUnit =
        filter.unit === "" ||
        normalizeText(assessment.unit).includes(normalizeText(filter.unit));

      return matchesYearSemester && matchesSubject && matchesUnit;
    });
  }, [
    assessments,
    filter.yearSemester,
    filter.subject,
    filter.unit,
    selectedYearSemester,
  ]);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const studentYear = String(student.year || "");
      const studentSemester = String(student.semester || "");

      if (filter.yearSemester === "all") {
        return true;
      }

      return (
        studentYear === selectedYearSemester.year &&
        studentSemester === selectedYearSemester.semester
      );
    });
  }, [students, filter.yearSemester, selectedYearSemester]);

  const performanceRows = useMemo(() => {
    const rows = [];

    filteredStudents.forEach((student) => {
      filteredAssessments.forEach((assessment) => {
        const matchedAttempt = attempts.find((attempt) => {
          return (
            String(attempt.student_id) === String(student.id) &&
            String(attempt.assessment_id) === String(assessment.id)
          );
        });

        const score = matchedAttempt?.score ?? null;
        const total = matchedAttempt?.total ?? null;
        const status = getStatus(score, total);

        rows.push({
          studentId: student.id,
          studentName: student.full_name || "Unknown",
          email: student.email || "-",
          hallTicket: student.hall_ticket || "-",
          course: student.course || "-",
          department: student.department || "-",
          year: student.year || assessment.year || "-",
          semester: student.semester || assessment.semester || "-",
          assessmentId: assessment.id,
          assessmentTitle: assessment.title || "Assessment",
          subject: matchedAttempt?.subject || assessment.subject || "N/A",
          unit: matchedAttempt?.unit || assessment.unit || "N/A",
          attemptId: matchedAttempt?.id || null,
          score,
          total,
          submittedAt: matchedAttempt?.submitted_at || null,
          answersJson: matchedAttempt?.answers_json || null,
          status,
        });
      });
    });

    return rows.filter((row) => {
      const matchesStatus =
        !isYearSemesterSelected ||
        filter.status === "all" ||
        row.status === filter.status;

      return matchesStatus;
    });
  }, [
    filteredStudents,
    filteredAssessments,
    attempts,
    filter.status,
    isYearSemesterSelected,
  ]);

  const summary = useMemo(() => {
    return {
      total: performanceRows.length,
      pass: performanceRows.filter((item) => item.status === "Pass").length,
      fail: performanceRows.filter((item) => item.status === "Fail").length,
      notAttempted: performanceRows.filter(
        (item) => item.status === "Not Attempted"
      ).length,
    };
  }, [performanceRows]);

  const formatSubmittedDate = (dateValue) => {
    if (!dateValue) return "-";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const clearFilters = () => {
    setFilter({
      yearSemester: "all",
      subject: "",
      unit: "",
      status: "all",
    });
  };

  return (
    <div className="flex h-screen bg-[#f6f8fb] overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-5">
            <h1 className="text-2xl font-semibold text-gray-800">
              Student Performance
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Track pass, fail, and not attempted students using assessment
              attempts.
            </p>
          </div>

          {/* COMPACT FILTER BAR */}
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-5 shadow-sm">
            <div className="flex flex-col xl:flex-row xl:items-center gap-3">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <select
                  value={filter.yearSemester}
                  onChange={(e) =>
                    setFilter({
                      ...filter,
                      yearSemester: e.target.value,
                      status: "all",
                    })
                  }
                  className="h-10 w-full border border-gray-300 px-3 rounded-lg text-sm outline-none bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {yearSemesterOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>

                <input
                  placeholder="Search subject"
                  value={filter.subject}
                  onChange={(e) =>
                    setFilter({ ...filter, subject: e.target.value })
                  }
                  className="h-10 w-full border border-gray-300 px-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />

                <input
                  placeholder="Search unit"
                  value={filter.unit}
                  onChange={(e) =>
                    setFilter({ ...filter, unit: e.target.value })
                  }
                  className="h-10 w-full border border-gray-300 px-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />

                <select
                  value={filter.status}
                  disabled={!isYearSemesterSelected}
                  onChange={(e) =>
                    setFilter({ ...filter, status: e.target.value })
                  }
                  className={`h-10 w-full border px-3 rounded-lg text-sm outline-none ${isYearSemesterSelected
                      ? "bg-white border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                >
                  <option value="all">All Status</option>
                  <option value="Pass">Pass</option>
                  <option value="Fail">Fail</option>
                  <option value="Not Attempted">Not Attempted</option>
                </select>
              </div>

              <button
                onClick={clearFilters}
                className="h-10 px-4 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition whitespace-nowrap"
              >
                Clear
              </button>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
              <span>
                Department:{" "}
                <strong className="text-gray-700">
                  {faculty?.department || "Loading..."}
                </strong>
              </span>

              <span>
                Students:{" "}
                <strong className="text-gray-700">
                  {filteredStudents.length}
                </strong>
              </span>

              <span>
                Assessments:{" "}
                <strong className="text-gray-700">
                  {filteredAssessments.length}
                </strong>
              </span>

              <span>
                Attempts:{" "}
                <strong className="text-gray-700">{attempts.length}</strong>
              </span>

              {!isYearSemesterSelected && (
                <span className="text-amber-600 font-medium">
                  Select year/semester to enable status filter
                </span>
              )}
            </div>
          </div>

          {/* SUMMARY */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-5">
            <SummaryCard
              label="Total Records"
              value={summary.total}
              className="border-blue-100 bg-blue-50 text-blue-700"
            />

            <SummaryCard
              label="Pass"
              value={summary.pass}
              className="border-green-100 bg-green-50 text-green-700"
            />

            <SummaryCard
              label="Fail"
              value={summary.fail}
              className="border-red-100 bg-red-50 text-red-700"
            />

            <SummaryCard
              label="Not Attempted"
              value={summary.notAttempted}
              className="border-gray-200 bg-gray-50 text-gray-700"
            />
          </div>

          {/* TABLE */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[1250px]">
                <div className="grid grid-cols-[1.5fr_1.1fr_0.6fr_0.8fr_1fr_0.8fr_0.8fr_1fr_1.2fr] bg-gray-50 px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  <span>Student</span>
                  <span>Hall Ticket</span>
                  <span>Year</span>
                  <span>Semester</span>
                  <span>Subject</span>
                  <span>Unit</span>
                  <span>Score</span>
                  <span>Status</span>
                  <span>Submitted At</span>
                </div>

                {loading ? (
                  <div className="px-5 py-10 text-center text-sm text-gray-500">
                    Loading student performance...
                  </div>
                ) : performanceRows.length === 0 ? (
                  <div className="px-5 py-10 text-center text-sm text-gray-500">
                    No records found for the selected filters.
                  </div>
                ) : (
                  performanceRows.map((item, index) => (
                    <div
                      key={`${item.studentId}-${item.assessmentId}-${index}`}
                      className="grid grid-cols-[1.5fr_1.1fr_0.6fr_0.8fr_1fr_0.8fr_0.8fr_1fr_1.2fr] px-5 py-4 border-t border-gray-100 text-sm items-center hover:bg-gray-50"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 truncate">
                          {item.studentName}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {item.email}
                        </p>
                      </div>

                      <span className="text-gray-600">
                        {item.hallTicket}
                      </span>

                      <span className="text-gray-600">{item.year}</span>

                      <span className="text-gray-600">{item.semester}</span>

                      <span className="text-gray-600 truncate pr-2">
                        {item.subject}
                      </span>

                      <span className="text-gray-600 truncate pr-2">
                        {item.unit}
                      </span>

                      <span className="text-gray-700 font-medium">
                        {item.score !== null && item.total !== null
                          ? `${item.score}/${item.total}`
                          : "-"}
                      </span>

                      <span
                        className={`inline-flex items-center justify-center px-3 py-1 rounded-full border text-xs font-semibold w-fit ${getStatusClass(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>

                      <span className="text-gray-600">
                        {formatSubmittedDate(item.submittedAt)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, className }) {
  return (
    <div className={`border rounded-xl px-4 py-3 shadow-sm ${className}`}>
      <p className="text-xl font-bold leading-none">{value}</p>
      <p className="text-xs font-medium mt-1.5">{label}</p>
    </div>
  );
}