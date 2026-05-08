import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";

import {
  FileText,
  ClipboardList,
  PlayCircle,
  Trash2,
  X,
  ArrowLeft,
} from "lucide-react";

import * as XLSX from "xlsx";
import { supabase } from "../../lib/supabaseClient";

export default function SubjectDetails() {
  const navigate = useNavigate();
  const { subjectName } = useParams();
  const [searchParams] = useSearchParams();

  const subject = decodeURIComponent(subjectName || "");
  const year = searchParams.get("year");
  const semester = searchParams.get("semester");

  const [faculty, setFaculty] = useState(null);
  const [unitData, setUnitData] = useState({});
  const [loading, setLoading] = useState(true);

  const [selectedPdf, setSelectedPdf] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [assessmentRows, setAssessmentRows] = useState([]);

  useEffect(() => {
    loadSubjectDetails();
  }, [subject, year, semester]);

  const getEmbedUrl = (item) => {
    if (item.embed_url) return item.embed_url;

    if (item.file_id) {
      return `https://drive.google.com/file/d/${item.file_id}/preview?usp=sharing`;
    }

    return "#";
  };

  const getFileUrl = (item) => {
    if (item.file_url) return item.file_url;

    if (item.file_id) {
      return `https://drive.google.com/uc?id=${item.file_id}`;
    }

    return "#";
  };

  const formatUnit = (unit) => {
    if (!unit) return "Unit 1";

    if (String(unit).toLowerCase().includes("unit")) {
      return unit;
    }

    return `Unit ${unit}`;
  };

  const normalize = (item, type) => ({
    ...item,
    type,
    embed_url: getEmbedUrl(item),
    file_url: getFileUrl(item),
  });

  const loadSubjectDetails = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: facultyData, error: facultyError } = await supabase
        .from("faculty")
        .select("*")
        .eq("id", user.id)
        .single();

      if (facultyError) throw facultyError;

      setFaculty(facultyData);

      let videosQuery = supabase
        .from("videos")
        .select("*")
        .eq("faculty_id", facultyData.id)
        .eq("department", facultyData.department)
        .eq("subject", subject)
        .eq("year", year);

      let pdfsQuery = supabase
        .from("pdfs")
        .select("*")
        .eq("faculty_id", facultyData.id)
        .eq("department", facultyData.department)
        .eq("subject", subject)
        .eq("year", year);

      let assessmentsQuery = supabase
        .from("assessments")
        .select("*")
        .eq("faculty_id", facultyData.id)
        .eq("department", facultyData.department)
        .eq("subject", subject)
        .eq("year", year);

      if (year !== "1" && semester) {
        videosQuery = videosQuery.eq("semester", semester);
        pdfsQuery = pdfsQuery.eq("semester", semester);
        assessmentsQuery = assessmentsQuery.eq("semester", semester);
      }

      const { data: videos = [] } = await videosQuery.order("created_at", {
        ascending: false,
      });

      const { data: pdfs = [] } = await pdfsQuery.order("created_at", {
        ascending: false,
      });

      const { data: assessments = [] } = await assessmentsQuery.order(
        "created_at",
        { ascending: false }
      );

      const allContent = [
        ...videos.map((item) => normalize(item, "video")),
        ...pdfs.map((item) => normalize(item, "pdf")),
        ...assessments.map((item) => normalize(item, "assessment")),
      ];

      const grouped = {};

      allContent.forEach((item) => {
        const unit = formatUnit(item.unit);

        if (!grouped[unit]) {
          grouped[unit] = {
            videos: [],
            notes: [],
            assessments: [],
          };
        }

        if (item.type === "video") grouped[unit].videos.push(item);
        if (item.type === "pdf") grouped[unit].notes.push(item);
        if (item.type === "assessment") grouped[unit].assessments.push(item);
      });

      setUnitData(grouped);
    } catch (err) {
      console.error("Subject details error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${item.title}"?`
    );

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

      alert("Deleted successfully");
      loadSubjectDetails();
    } catch (err) {
      console.error("Delete error:", err);
      alert("Something went wrong while deleting");
    }
  };

  const handleAssessmentPreview = async (assessment) => {
    try {
      setSelectedAssessment(assessment);
      setAssessmentRows([]);

      const response = await fetch(assessment.file_url);
      const arrayBuffer = await response.arrayBuffer();

      const workbook = XLSX.read(arrayBuffer, {
        type: "array",
      });

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      const rows = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
      });

      setAssessmentRows(rows);
    } catch (err) {
      console.error("Assessment preview error:", err);
      alert("Unable to preview assessment file");
    }
  };

  const getTitle = () => {
    if (year === "1") return `${subject} - 1st Year`;
    return `${subject} - Year ${year}, Semester ${semester}`;
  };

  return (
    <div className="flex h-screen bg-[#f6f8fb] overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />

        <div className="flex-1 overflow-y-auto p-6">
         <button
  onClick={() => navigate("/faculty/subjects")}
  className="mb-6 flex items-center gap-2 text-gray-700 hover:text-blue-600"
>
  <ArrowLeft size={18} />
  Back to Subjects
</button>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {getTitle()}
            </h1>

            <p className="text-gray-500 text-sm">
              Unit-wise videos, lecture notes and assessments
            </p>
          </div>

          {faculty && (
            <div className="bg-white rounded-2xl border shadow-sm p-5 mb-8 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold uppercase">
                {faculty.name?.charAt(0)}
              </div>

              <div>
                <h2 className="font-bold text-gray-900 text-lg capitalize">
                  {faculty.name}
                </h2>

                <p className="text-gray-500 text-sm">{faculty.department}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="bg-white rounded-2xl p-10 text-center border shadow-sm">
              Loading subject details...
            </div>
          ) : Object.keys(unitData).length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border shadow-sm">
              No content found for this subject
            </div>
          ) : (
            <div className="space-y-6">
              {Object.keys(unitData).map((unit) => {
                const data = unitData[unit];

                return (
                  <div
                    key={unit}
                    className="bg-white rounded-2xl border shadow-sm p-6"
                  >
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      {unit}
                    </h2>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                      <div className="border rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-4 font-bold text-gray-800">
                          <PlayCircle className="text-blue-600" />
                          Videos
                        </div>

                        {data.videos.length === 0 ? (
                          <p className="text-sm text-gray-400">
                            No videos uploaded
                          </p>
                        ) : (
                          data.videos.map((video) => (
                            <div
                              key={video.id}
                              className="bg-blue-50 rounded-lg p-3 mb-3"
                            >
                              <div className="font-medium text-gray-800 mb-3">
                                🎥 {video.title}
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={() => setSelectedVideo(video)}
                                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                                >
                                  View
                                </button>

                                <button
                                  onClick={() => handleDelete(video)}
                                  className="px-3 py-1 bg-red-600 text-white rounded text-sm"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="border rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-4 font-bold text-gray-800">
                          <FileText className="text-green-600" />
                          Lecture Notes
                        </div>

                        {data.notes.length === 0 ? (
                          <p className="text-sm text-gray-400">
                            No lecture notes uploaded
                          </p>
                        ) : (
                          data.notes.map((pdf) => (
                            <div
                              key={pdf.id}
                              className="bg-green-50 rounded-lg p-3 mb-3"
                            >
                              <div className="font-medium text-gray-800 mb-3">
                                📄 {pdf.title}
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={() => setSelectedPdf(pdf)}
                                  className="px-3 py-1 bg-green-600 text-white rounded text-sm"
                                >
                                  Open
                                </button>

                                <button
                                  onClick={() => handleDelete(pdf)}
                                  className="px-3 py-1 bg-red-600 text-white rounded text-sm"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="border rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-4 font-bold text-gray-800">
                          <ClipboardList className="text-orange-500" />
                          Assessments
                        </div>

                        {data.assessments.length === 0 ? (
                          <p className="text-sm text-gray-400">
                            No assessments uploaded
                          </p>
                        ) : (
                          data.assessments.map((assessment) => (
                            <div
                              key={assessment.id}
                              className="bg-orange-50 rounded-lg p-3 mb-3"
                            >
                              <div className="font-medium text-gray-800 mb-3">
                                📝 {assessment.title}
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    handleAssessmentPreview(assessment)
                                  }
                                  className="px-3 py-1 bg-orange-500 text-white rounded text-sm"
                                >
                                  Preview
                                </button>

                                <button
                                  onClick={() => handleDelete(assessment)}
                                  className="px-3 py-1 bg-red-600 text-white rounded text-sm"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedPdf && (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-6">
          <div className="bg-[#2b2b2b] w-full h-full rounded-xl overflow-hidden shadow-2xl flex flex-col border border-gray-700">
            <div className="bg-[#06254D] px-6 py-4 flex items-center justify-between">
              <h2 className="text-white text-xl font-bold">
                {selectedPdf.title || "PDF Preview"}
              </h2>

              <div className="flex items-center gap-3">
                <a
                  href={selectedPdf.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-yellow-400 hover:bg-yellow-500 text-black px-5 py-2 rounded-lg font-bold text-sm"
                >
                  Download PDF
                </a>

                <button
                  onClick={() => setSelectedPdf(null)}
                  className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-[#202020]">
              <iframe
                src={selectedPdf.embed_url}
                title={selectedPdf.title}
                className="w-full h-full"
                allow="autoplay"
              />
            </div>
          </div>
        </div>
      )}

      {selectedVideo && (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-6">
          <div className="bg-[#2b2b2b] w-full h-full rounded-xl overflow-hidden shadow-2xl flex flex-col border border-gray-700">
            <div className="bg-[#06254D] px-6 py-4 flex items-center justify-between">
              <h2 className="text-white text-xl font-bold">
                {selectedVideo.title || "Video Preview"}
              </h2>

              <button
                onClick={() => setSelectedVideo(null)}
                className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                <X size={22} />
              </button>
            </div>

            <div className="flex-1 bg-black">
              <iframe
                src={selectedVideo.embed_url}
                title={selectedVideo.title}
                className="w-full h-full"
                allow="autoplay"
              />
            </div>
          </div>
        </div>
      )}

      {selectedAssessment && (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-6">
          <div className="bg-white w-full h-full rounded-xl overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-[#06254D] px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-white text-xl font-bold">
                  {selectedAssessment.title || "Assessment Preview"}
                </h2>

                <p className="text-blue-100 text-sm">Excel Sheet Preview</p>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={selectedAssessment.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-yellow-400 hover:bg-yellow-500 text-black px-5 py-2 rounded-lg font-bold text-sm"
                >
                  Download Excel
                </a>

                <button
                  onClick={() => {
                    setSelectedAssessment(null);
                    setAssessmentRows([]);
                  }}
                  className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-gray-100 p-6">
              {assessmentRows.length === 0 ? (
                <div className="bg-white rounded-xl p-10 text-center">
                  Loading assessment preview...
                </div>
              ) : (
                <div className="bg-white rounded-xl border shadow-sm overflow-auto">
                  <table className="min-w-full border-collapse text-sm">
                    <tbody>
                      {assessmentRows.map((row, rowIndex) => (
                        <tr
                          key={rowIndex}
                          className={
                            rowIndex === 0
                              ? "bg-gray-200 font-bold"
                              : "hover:bg-gray-50"
                          }
                        >
                          {row.map((cell, cellIndex) => (
                            <td
                              key={cellIndex}
                              className="border px-4 py-3 whitespace-nowrap"
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}