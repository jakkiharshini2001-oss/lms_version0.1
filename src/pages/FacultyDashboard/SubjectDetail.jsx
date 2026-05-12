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
  ExternalLink,
  Download,
} from "lucide-react";

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
  const [assessmentError, setAssessmentError] = useState(false);
  const [pdfError, setPdfError] = useState(false);

  useEffect(() => {
    loadSubjectDetails();
  }, [subject, year, semester]);

  useEffect(() => {
    setPdfError(false);
  }, [selectedPdf]);

  useEffect(() => {
    setAssessmentError(false);
  }, [selectedAssessment]);

  /**
   * Drive /preview works for both PDFs and videos.
   * We prefer an explicit embed_url from the DB; fall back to file_id.
   * For PDFs, appending ?embedded=true suppresses Drive's top toolbar
   * and avoids the accounts.google.com auth-redirect noise in the console.
   */
  const getEmbedUrl = (item, type) => {
    if (item.embed_url) return item.embed_url;
    if (item.file_id) {
      const base = `https://drive.google.com/file/d/${item.file_id}/preview`;
      return type === "pdf" ? `${base}?embedded=true` : base;
    }
    return null;
  };

  const getFileUrl = (item) => {
    if (item.file_url) return item.file_url;
    if (item.file_id)
      return `https://drive.google.com/file/d/${item.file_id}/view`;
    return null;
  };

  const getDownloadUrl = (item) => {
    if (item.file_id)
      return `https://drive.google.com/uc?export=download&id=${item.file_id}`;
    if (item.file_url) return item.file_url;
    return null;
  };

  const formatUnit = (unit) => {
    if (!unit) return "Unit 1";
    if (String(unit).toLowerCase().includes("unit")) return unit;
    return `Unit ${unit}`;
  };

  const normalize = (item, type) => ({
    ...item,
    type,
    embed_url: getEmbedUrl(item, type),
    file_url: getFileUrl(item),
    download_url: getDownloadUrl(item),
  });

  const loadSubjectDetails = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: facultyData, error: facultyError } = await supabase
        .from("faculty").select("*").eq("id", user.id).single();
      if (facultyError) throw facultyError;

      setFaculty(facultyData);

      const base = (table) =>
        supabase.from(table).select("*")
          .eq("faculty_id", facultyData.id)
          .eq("subject", subject)
          .eq("year", year);

      let videosQ = base("videos");
      let pdfsQ = base("pdfs");
      let assessQ = base("assessments");

      if (year !== "1" && semester) {
        videosQ = videosQ.eq("semester", semester);
        pdfsQ = pdfsQ.eq("semester", semester);
        assessQ = assessQ.eq("semester", semester);
      }

      const { data: videos = [] } = await videosQ.order("created_at", { ascending: false });
      const { data: pdfs = [] } = await pdfsQ.order("created_at", { ascending: false });
      const { data: assessments = [] } = await assessQ.order("created_at", { ascending: false });

      const allContent = [
        ...videos.map((i) => normalize(i, "video")),
        ...pdfs.map((i) => normalize(i, "pdf")),
        ...assessments.map((i) => normalize(i, "assessment")),
      ];

      const grouped = {};
      allContent.forEach((item) => {
        const unit = formatUnit(item.unit);
        if (!grouped[unit]) grouped[unit] = { videos: [], notes: [], assessments: [] };
        if (item.type === "video") grouped[unit].videos.push(item);
        if (item.type === "pdf") grouped[unit].notes.push(item);
        if (item.type === "assessment") grouped[unit].assessments.push(item);
      });

      setUnitData(grouped);
    } catch {
      // Intentionally not logging — error objects may contain auth tokens or URLs
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(`Delete "${item.title}"?`);
    if (!confirmed) return;

    const table =
      item.type === "video" ? "videos" :
        item.type === "pdf" ? "pdfs" : "assessments";

    const { error } = await supabase.from(table).delete().eq("id", item.id);
    if (error) {
      alert("Delete failed. Please try again.");
      return;
    }

    setUnitData((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((unit) => {
        next[unit] = {
          videos: next[unit].videos.filter((v) => v.id !== item.id),
          notes: next[unit].notes.filter((n) => n.id !== item.id),
          assessments: next[unit].assessments.filter((a) => a.id !== item.id),
        };
      });
      Object.keys(next).forEach((unit) => {
        if (
          next[unit].videos.length === 0 &&
          next[unit].notes.length === 0 &&
          next[unit].assessments.length === 0
        ) {
          delete next[unit];
        }
      });
      return next;
    });
  };

  const handleAssessmentPreview = (assessment) => {
    setSelectedAssessment(assessment);
  };

  const getTitle = () => {
    if (year === "1") return `${subject} — 1st Year`;
    return `${subject} — Year ${year}, Semester ${semester}`;
  };

  return (
    <div className="flex h-screen bg-[#f6f8fb] overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />

        <div className="flex-1 overflow-y-auto p-6">
          <button
            onClick={() => navigate("/faculty/subjects")}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft size={18} />
            Back to Subjects
          </button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 capitalize">
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
                <h2 className="font-bold text-gray-900 text-lg capitalize">{faculty.name}</h2>
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
              <div className="text-5xl mb-4">📭</div>
              <p className="text-gray-500">No content found for this subject.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.keys(unitData).map((unit) => {
                const data = unitData[unit];
                return (
                  <div key={unit} className="bg-white rounded-2xl border shadow-sm p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">{unit}</h2>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                      {/* VIDEOS */}
                      <div className="border rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-4 font-bold text-gray-800">
                          <PlayCircle className="text-blue-600" size={20} />
                          Videos
                        </div>
                        {data.videos.length === 0 ? (
                          <p className="text-sm text-gray-400">No videos uploaded</p>
                        ) : (
                          data.videos.map((video) => (
                            <div key={video.id} className="bg-blue-50 rounded-lg p-3 mb-3">
                              <div className="font-medium text-gray-800 mb-3">🎥 {video.title}</div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setSelectedVideo(video)}
                                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => handleDelete(video)}
                                  className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 flex items-center"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* LECTURE NOTES */}
                      <div className="border rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-4 font-bold text-gray-800">
                          <FileText className="text-green-600" size={20} />
                          Lecture Notes
                        </div>
                        {data.notes.length === 0 ? (
                          <p className="text-sm text-gray-400">No lecture notes uploaded</p>
                        ) : (
                          data.notes.map((pdf) => (
                            <div key={pdf.id} className="bg-green-50 rounded-lg p-3 mb-3">
                              <div className="font-medium text-gray-800 mb-3">📄 {pdf.title}</div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setSelectedPdf(pdf)}
                                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                >
                                  Open
                                </button>
                                <button
                                  onClick={() => handleDelete(pdf)}
                                  className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 flex items-center"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* ASSESSMENTS */}
                      <div className="border rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-4 font-bold text-gray-800">
                          <ClipboardList className="text-orange-500" size={20} />
                          Assessments
                        </div>
                        {data.assessments.length === 0 ? (
                          <p className="text-sm text-gray-400">No assessments uploaded</p>
                        ) : (
                          data.assessments.map((assessment) => (
                            <div key={assessment.id} className="bg-orange-50 rounded-lg p-3 mb-3">
                              <div className="font-medium text-gray-800 mb-3">📝 {assessment.title}</div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleAssessmentPreview(assessment)}
                                  className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
                                >
                                  Preview
                                </button>
                                <button
                                  onClick={() => handleDelete(assessment)}
                                  className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 flex items-center"
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

      {/* ── PDF VIEWER MODAL ── */}
      {selectedPdf && (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4">
          <div
            className="w-full h-full rounded-xl overflow-hidden flex flex-col"
            style={{ background: "#2b2b2b", border: "1px solid #444" }}
          >
            <div
              className="flex items-center justify-between px-6 py-4 flex-shrink-0"
              style={{ background: "#06254D" }}
            >
              <h2 className="text-white text-xl font-bold truncate pr-4">
                {selectedPdf.title || "PDF Preview"}
              </h2>
              <div className="flex items-center gap-3 flex-shrink-0">
                {selectedPdf.file_url && (
                  <a
                    href={selectedPdf.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <ExternalLink size={15} />
                    Open in Drive
                  </a>
                )}
                {selectedPdf.download_url && (
                  <a
                    href={selectedPdf.download_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                  >
                    <Download size={15} />
                    Download PDF
                  </a>
                )}
                <button
                  onClick={() => { setSelectedPdf(null); setPdfError(false); }}
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white transition-colors"
                  style={{ background: "rgba(255,255,255,0.1)" }}
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden" style={{ background: "#202020" }}>
              {pdfError ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-6 text-white p-8">
                  <div className="text-6xl">📄</div>
                  <p className="text-xl font-semibold text-center">Preview unavailable</p>
                  <p className="text-gray-400 text-center max-w-md">
                    The file requires Google sign-in to preview. Use the buttons below to open or download it.
                  </p>
                  <div className="flex gap-4 flex-wrap justify-center">
                    {selectedPdf.file_url && (
                      <a
                        href={selectedPdf.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                      >
                        <ExternalLink size={18} />
                        Open in Google Drive
                      </a>
                    )}
                    {selectedPdf.download_url && (
                      <a
                        href={selectedPdf.download_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-3 rounded-xl font-bold transition-colors"
                      >
                        <Download size={18} />
                        Download PDF
                      </a>
                    )}
                  </div>
                </div>
              ) : selectedPdf.embed_url ? (
                <iframe
                  key={selectedPdf.id}
                  src={selectedPdf.embed_url}
                  title={selectedPdf.title}
                  className="w-full h-full"
                  allow="autoplay"
                  onError={() => setPdfError(true)}
                  style={{ border: "none" }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-white">
                  <p className="text-gray-400">No preview URL available.</p>
                  {selectedPdf.file_url && (
                    <a
                      href={selectedPdf.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold"
                    >
                      Open in Drive
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── VIDEO VIEWER MODAL ── */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4">
          <div
            className="w-full h-full rounded-xl overflow-hidden flex flex-col"
            style={{ background: "#2b2b2b", border: "1px solid #444" }}
          >
            <div
              className="flex items-center justify-between px-6 py-4 flex-shrink-0"
              style={{ background: "#06254D" }}
            >
              <h2 className="text-white text-xl font-bold truncate pr-4">
                {selectedVideo.title || "Video Preview"}
              </h2>
              <button
                onClick={() => setSelectedVideo(null)}
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                style={{ background: "rgba(255,255,255,0.1)" }}
              >
                <X size={22} />
              </button>
            </div>
            <div className="flex-1 bg-black">
              <iframe
                key={selectedVideo.id}
                src={selectedVideo.embed_url}
                title={selectedVideo.title}
                className="w-full h-full"
                allow="autoplay"
                style={{ border: "none" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── ASSESSMENT PREVIEW MODAL ── */}
      {selectedAssessment && (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4">
          <div
            className="w-full h-full rounded-xl overflow-hidden flex flex-col"
            style={{ background: "#2b2b2b", border: "1px solid #444" }}
          >
            <div
              className="flex items-center justify-between px-6 py-4 flex-shrink-0"
              style={{ background: "#06254D" }}
            >
              <div>
                <h2 className="text-white text-xl font-bold">
                  {selectedAssessment.title || "Assessment Preview"}
                </h2>
                <p className="text-blue-200 text-sm">Excel Sheet Preview</p>
              </div>
              <div className="flex items-center gap-3">
                {selectedAssessment.file_url && (
                  <a
                    href={selectedAssessment.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <ExternalLink size={15} />
                    Open in Drive
                  </a>
                )}
                {selectedAssessment.download_url && (
                  <a
                    href={selectedAssessment.download_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold text-sm"
                  >
                    <Download size={15} />
                    Download Excel
                  </a>
                )}
                <button
                  onClick={() => { setSelectedAssessment(null); setAssessmentError(false); }}
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                  style={{ background: "rgba(255,255,255,0.1)" }}
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden" style={{ background: "#202020" }}>
              {assessmentError ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-6 text-white p-8">
                  <div className="text-6xl">📝</div>
                  <p className="text-xl font-semibold text-center">Preview unavailable</p>
                  <p className="text-gray-400 text-center max-w-md">
                    The file requires Google sign-in to preview or could not be embedded. Use the buttons below to open or download it.
                  </p>
                  <div className="flex gap-4 flex-wrap justify-center">
                    {selectedAssessment.file_url && (
                      <a
                        href={selectedAssessment.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                      >
                        <ExternalLink size={18} />
                        Open in Google Drive
                      </a>
                    )}
                    {selectedAssessment.download_url && (
                      <a
                        href={selectedAssessment.download_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-3 rounded-xl font-bold transition-colors"
                      >
                        <Download size={18} />
                        Download Excel
                      </a>
                    )}
                  </div>
                </div>
              ) : selectedAssessment.embed_url ? (
                <iframe
                  key={selectedAssessment.id}
                  src={selectedAssessment.embed_url}
                  title={selectedAssessment.title}
                  className="w-full h-full bg-white"
                  allow="autoplay"
                  onError={() => setAssessmentError(true)}
                  style={{ border: "none" }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-white">
                  <p className="text-gray-400">No preview URL available.</p>
                  {selectedAssessment.file_url && (
                    <a
                      href={selectedAssessment.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold"
                    >
                      Open in Drive
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}