import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";
import { supabase } from "../../lib/supabaseClient";

export default function ContentUpload() {
  const [activeTab, setActiveTab] = useState("video");
  const [faculty, setFaculty] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadFaculty = async () => {
      let storedFaculty = null;
      try {
        const raw = localStorage.getItem("faculty");
        if (raw) storedFaculty = JSON.parse(raw);
      } catch (err) {
        console.error("Invalid faculty in localStorage", err);
      }

      if (storedFaculty?.id) {
        setFaculty(storedFaculty);
        setAuthChecking(false);
        return;
      }

      if (!supabase) { setAuthChecking(false); return; }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) console.error("Supabase session error", sessionError);

      if (sessionData?.session?.user?.id) {
        const { data: facultyData, error: facultyError } = await supabase
          .from("faculty")
          .select("*")
          .eq("id", sessionData.session.user.id)
          .single();

        if (facultyError) console.error("Faculty fetch error", facultyError);
        else if (facultyData) {
          setFaculty(facultyData);
          localStorage.setItem("faculty", JSON.stringify(facultyData));
        }
      }
      setAuthChecking(false);
    };
    loadFaculty();
  }, []);

  if (authChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f6f8fb]">
        <div className="rounded-xl bg-white p-8 shadow-lg text-center">
          <p className="text-lg font-medium">Verifying login...</p>
        </div>
      </div>
    );
  }

  if (!faculty) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f6f8fb]">
        <div className="rounded-xl bg-white p-8 shadow-lg text-center">
          <p className="text-lg font-semibold mb-4">Please log in to upload content.</p>
          <button type="button" onClick={() => navigate("/faculty/login")} className="btn-blue">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f6f8fb]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <div className="p-6">
          <h1 className="text-2xl font-semibold text-gray-800 mb-6">Upload Content</h1>

          <div className="flex gap-4 mb-6">
            {[
              { key: "video", label: "Video Uploadings" },
              { key: "pdf", label: "Lecture Uploadings" },
              { key: "assessment", label: "Assessment Uploadings" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg border ${
                  activeTab === tab.key ? "bg-blue-600 text-white" : "bg-white text-gray-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6 h-[calc(100vh-190px)] overflow-hidden">
            {/* LEFT FORM */}
            <div className="bg-white rounded-2xl shadow-sm border p-6 overflow-y-auto">
              {activeTab === "video"      && <VideoForm faculty={faculty} />}
              {activeTab === "pdf"        && <PDFForm faculty={faculty} />}
              {activeTab === "assessment" && <AssessmentForm faculty={faculty} />}
            </div>

            {/* RIGHT IMAGE PANEL */}
            <div className="hidden xl:block relative overflow-hidden rounded-2xl shadow-sm border h-full">
              <img
                src="https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=1200&auto=format&fit=crop"
                alt="Osmania University"
                className="absolute inset-0 w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#06254D]/20 via-[#06254D]/45 to-[#06254D]/95" />
              <div className="absolute inset-0 flex flex-col justify-end p-8 text-white">
                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-3xl mb-5">
                  🎓
                </div>
                <h2 className="text-3xl font-bold leading-tight mb-3">Osmania University</h2>
                <p className="text-blue-100 text-sm leading-relaxed mb-6">
                  Upload lecture videos, academic PDFs and assessments for students through the LMS faculty workspace.
                </p>
                <div className="space-y-3">
                  {[
                    { icon: "🎥", title: "Video Classes",  desc: "Upload engaging academic video content." },
                    { icon: "📚", title: "Lecture Notes",  desc: "Organize unit-wise lecture materials." },
                    { icon: "📝", title: "Assessments",    desc: "Share tests, assignments and evaluations." },
                  ].map((card) => (
                    <div key={card.title} className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                      <h3 className="font-semibold mb-1">{card.icon} {card.title}</h3>
                      <p className="text-xs text-blue-100">{card.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VIDEO FORM — direct YouTube resumable upload (never touches Render)
// ─────────────────────────────────────────────────────────────────────────────
const CHUNK_SIZE = 8 * 1024 * 1024; // 8 MB — must be a multiple of 256 KB per YouTube spec

function VideoForm({ faculty }) {
  const [file, setFile]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);
  const [embedUrl, setEmbedUrl] = useState("");

  // Progress state
  const [uploadPhase, setUploadPhase]   = useState(""); // "session" | "uploading" | "saving"
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [totalBytes, setTotalBytes]       = useState(0);

  // Allow cancellation
  const abortRef = useRef(false);

  const [form, setForm] = useState({
    subject: "", title: "", year: "", semester: "", unit: "",
  });

  // ── helper: upload one chunk, return the raw Response ──────────────────────
  const uploadChunk = async (uploadUrl, chunk, start, totalSize) => {
    const end = start + chunk.size - 1;
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Range": `bytes ${start}-${end}/${totalSize}`,
        "Content-Type": "video/*",
      },
      body: chunk,
    });
    return response;
  };

  // ── main upload orchestrator ────────────────────────────────────────────────
  const uploadToYouTube = async (uploadUrl, videoFile) => {
    let offset = 0;
    const totalSize = videoFile.size;

    while (offset < totalSize) {
      if (abortRef.current) throw new Error("Upload cancelled");

      const chunk = videoFile.slice(offset, offset + CHUNK_SIZE);
      const response = await uploadChunk(uploadUrl, chunk, offset, totalSize);

      // 308 Resume Incomplete — chunk accepted, continue
      if (response.status === 308) {
        const rangeHeader = response.headers.get("Range");
        if (rangeHeader) {
          // Range: bytes=0-N  → next byte is N+1
          offset = parseInt(rangeHeader.split("-")[1], 10) + 1;
        } else {
          // YouTube didn't echo Range yet (very first chunk sometimes) — advance manually
          offset += chunk.size;
        }
        setUploadedBytes(offset);
        continue;
      }

      // 200 or 201 — upload complete, response body contains the video resource
      if (response.status === 200 || response.status === 201) {
        const data = await response.json();
        // YouTube returns the video resource: { id, snippet, status, … }
        const videoId = data.id;
        if (!videoId) throw new Error("YouTube did not return a video ID");
        setUploadedBytes(totalSize);
        return videoId;
      }

      // Any other status is an error
      const errText = await response.text();
      throw new Error(`YouTube upload error (HTTP ${response.status}): ${errText}`);
    }

    throw new Error("Upload loop ended without receiving a video ID from YouTube");
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setEmbedUrl("");
    abortRef.current = false;

    const currentFaculty = faculty || JSON.parse(localStorage.getItem("faculty") || "null");
    if (!currentFaculty?.id) { setError("Please login again"); return; }

    if (!form.subject || !form.title || !form.year || !form.unit ||
        (form.year !== "1" && !form.semester)) {
      setError("Please fill all fields");
      return;
    }
    if (!file) { setError("Please select a video file"); return; }

    try {
      setLoading(true);
      setTotalBytes(file.size);
      setUploadedBytes(0);

      const BASE_URL = import.meta.env.VITE_API_URL.replace(/\/$/, "");

      // ── Step 1: Ask backend to create a YouTube resumable session ──────────
      setUploadPhase("session");
      const sessionRes = await fetch(`${BASE_URL}/create-youtube-upload-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:    form.title,
          description: `${form.subject} | Unit ${form.unit} | Year ${form.year}${form.semester ? " Sem " + form.semester : ""} | ${currentFaculty.department}`,
          tags:     ["education", "Osmania University", form.subject],
          fileSize: file.size,
          mimeType: file.type || "video/*",
        }),
      });

      const sessionData = await sessionRes.json();
      if (!sessionRes.ok) throw new Error(sessionData.error || "Failed to create upload session");

      const { uploadUrl } = sessionData;

      // ── Step 2: Upload directly from browser to YouTube ────────────────────
      setUploadPhase("uploading");
      const videoId = await uploadToYouTube(uploadUrl, file);

      // ── Step 3: Save metadata in Supabase via backend ──────────────────────
      setUploadPhase("saving");
      const metaRes = await fetch(`${BASE_URL}/save-video-metadata`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          faculty_id:   currentFaculty.id,
          faculty_name: currentFaculty.name || "",
          department:   currentFaculty.department,
          year:         form.year,
          semester:     form.semester || null,
          subject:      form.subject,
          unit:         form.unit,
          title:        form.title,
        }),
      });

      const metaData = await metaRes.json();
      if (!metaRes.ok) throw new Error(metaData.error || "Failed to save video metadata");

      setEmbedUrl(`https://www.youtube.com/embed/${videoId}`);
      setSuccess(true);
      setFile(null);
      setForm({ subject: "", title: "", year: "", semester: "", unit: "" });

    } catch (err) {
      if (!abortRef.current) setError(err.message || "Upload failed");
    } finally {
      setLoading(false);
      setUploadPhase("");
    }
  };

  const handleCancel = () => {
    abortRef.current = true;
    setLoading(false);
    setUploadPhase("");
    setError("Upload cancelled.");
  };

  // ── progress % ──────────────────────────────────────────────────────────────
  const progressPct = totalBytes > 0 ? Math.round((uploadedBytes / totalBytes) * 100) : 0;
  const uploadedMB  = (uploadedBytes / 1024 / 1024).toFixed(1);
  const totalMB     = (totalBytes    / 1024 / 1024).toFixed(1);

  return (
    <form className="space-y-4" onSubmit={handleUpload}>
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          ✅ Video uploaded successfully to YouTube
        </div>
      )}

      <input
        placeholder="Subject"
        className="input"
        value={form.subject}
        onChange={(e) => setForm({ ...form, subject: e.target.value })}
        disabled={loading}
      />
      <input
        placeholder="Title"
        className="input"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        disabled={loading}
      />
      <input
        placeholder="Unit (e.g. Unit 1)"
        className="input"
        value={form.unit}
        onChange={(e) => setForm({ ...form, unit: e.target.value })}
        disabled={loading}
      />

      <div className={`grid gap-4 ${form.year !== "1" ? "grid-cols-2" : "grid-cols-1"}`}>
        <select
          className="input"
          value={form.year}
          disabled={loading}
          onChange={(e) =>
            setForm({ ...form, year: e.target.value, semester: e.target.value === "1" ? "" : form.semester })
          }
        >
          <option value="">Year</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
        </select>

        {form.year !== "1" && (
          <select
            className="input"
            value={form.semester}
            disabled={loading}
            onChange={(e) => setForm({ ...form, semester: e.target.value })}
          >
            <option value="">Semester</option>
            <option value="1">1</option>
            <option value="2">2</option>
          </select>
        )}
      </div>

      {/* File picker */}
      <div className="rounded-xl border-2 border-dashed border-gray-200 p-4 text-center">
        <input
          type="file"
          accept="video/*"
          disabled={loading}
          onChange={(e) => {
            setFile(e.target.files[0] || null);
            setSuccess(false);
            setError("");
          }}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-medium
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100 cursor-pointer"
        />
        {file && (
          <p className="text-xs text-gray-500 mt-2">
            📹 {file.name} — {(file.size / 1024 / 1024).toFixed(1)} MB
          </p>
        )}
      </div>

      {/* Upload progress — shown while loading */}
      {loading && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 space-y-3">
          {/* Phase label */}
          <p className="text-sm font-semibold text-blue-800">
            {uploadPhase === "session"   && "⚙️  Creating upload session..."}
            {uploadPhase === "uploading" && `📤 Uploading to YouTube — ${progressPct}%`}
            {uploadPhase === "saving"    && "💾  Saving metadata..."}
          </p>

          {/* Progress bar — only meaningful during actual upload */}
          {uploadPhase === "uploading" && (
            <>
              <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-xs text-blue-600">
                {uploadedMB} MB / {totalMB} MB uploaded
              </p>
            </>
          )}

          {/* Indeterminate spinner for non-upload phases */}
          {uploadPhase !== "uploading" && (
            <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
              <div className="bg-blue-500 h-2 rounded-full animate-pulse w-1/2" />
            </div>
          )}

          <p className="text-xs text-blue-500">
            ⚠️ Do not close or refresh this tab while uploading.
          </p>

          <button
            type="button"
            onClick={handleCancel}
            className="text-xs text-red-500 underline"
          >
            Cancel upload
          </button>
        </div>
      )}

      <button
        disabled={loading}
        className="btn-blue w-full disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Uploading…" : "Upload Video"}
      </button>

      {/* Preview after success */}
      {embedUrl && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-600 mb-2">Preview:</p>
          <div className="rounded-xl overflow-hidden border border-gray-200">
            <iframe
              src={embedUrl}
              width="100%"
              height="220"
              allow="autoplay; encrypted-media"
              allowFullScreen
              title="Video Preview"
              style={{ display: "block" }}
            />
          </div>
        </div>
      )}
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF FORM — unchanged behaviour
// ─────────────────────────────────────────────────────────────────────────────
function PDFForm({ faculty }) {
  const [file, setFile]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    subject: "", title: "", year: "", semester: "", unit: "",
  });

  const handleUpload = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const currentFaculty = faculty || JSON.parse(localStorage.getItem("faculty") || "null");
    if (!currentFaculty?.id) { setError("Please login again"); return; }
    if (!file) { setError("Please select a PDF file"); return; }
    if (!form.subject || !form.title || !form.year || !form.unit ||
        (form.year !== "1" && !form.semester)) {
      setError("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file",         file);
      formData.append("type",         "pdf");
      formData.append("faculty_id",   currentFaculty.id);
      formData.append("faculty_name", currentFaculty.name || "");
      formData.append("department",   currentFaculty.department);
      formData.append("year",         form.year);
      if (form.year !== "1") formData.append("semester", form.semester);
      formData.append("subject", form.subject);
      formData.append("unit",    form.unit);
      formData.append("title",   form.title);

      const BASE_URL = import.meta.env.VITE_API_URL.replace(/\/$/, "");
      const res  = await fetch(`${BASE_URL}/upload-content`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setSuccess(true);
      setFile(null);
      setForm({ subject: "", title: "", year: "", semester: "", unit: "" });
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleUpload}>
      {error   && <div className="p-4 bg-red-50   border border-red-200   text-red-700   rounded-lg text-sm">{error}</div>}
      {success && <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">✅ PDF uploaded successfully</div>}

      <input placeholder="Subject" className="input" value={form.subject} disabled={loading}
        onChange={(e) => setForm({ ...form, subject: e.target.value })} />
      <input placeholder="Title"   className="input" value={form.title}   disabled={loading}
        onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <input placeholder="Unit (Unit 1)" className="input" value={form.unit} disabled={loading}
        onChange={(e) => setForm({ ...form, unit: e.target.value })} />

      <div className={`grid gap-4 ${form.year !== "1" ? "grid-cols-2" : "grid-cols-1"}`}>
        <select className="input" value={form.year} disabled={loading}
          onChange={(e) => setForm({ ...form, year: e.target.value, semester: e.target.value === "1" ? "" : form.semester })}>
          <option value="">Year</option>
          {["1","2","3","4"].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        {form.year !== "1" && (
          <select className="input" value={form.semester} disabled={loading}
            onChange={(e) => setForm({ ...form, semester: e.target.value })}>
            <option value="">Semester</option>
            <option value="1">1</option>
            <option value="2">2</option>
          </select>
        )}
      </div>

      <input type="file" accept="application/pdf" disabled={loading}
        onChange={(e) => setFile(e.target.files[0])} />

      <button disabled={loading} className="btn-green">
        {loading ? "Uploading..." : "Upload PDF"}
      </button>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ASSESSMENT FORM — unchanged behaviour
// ─────────────────────────────────────────────────────────────────────────────
function AssessmentForm({ faculty }) {
  const [file, setFile]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    title: "", subject: "", year: "", semester: "", unit: "",
  });

  const handleDownloadTemplate = () => {
    const link = document.createElement("a");
    link.href     = "/sample_mcq_template.xlsx";
    link.download = "sample_mcq_template.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const currentFaculty = faculty || JSON.parse(localStorage.getItem("faculty") || "null");
    if (!currentFaculty?.id) { setError("Please login again"); return; }
    if (!file) { setError("Please upload the filled Excel file"); return; }
    if (!form.title || !form.subject || !form.year || !form.unit ||
        (form.year !== "1" && !form.semester)) {
      setError("Fill all fields");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file",         file);
      formData.append("faculty_id",   currentFaculty.id);
      formData.append("faculty_name", currentFaculty.name || "");
      formData.append("department",   currentFaculty.department);
      formData.append("year",         form.year);
      if (form.year !== "1") formData.append("semester", form.semester);
      formData.append("subject", form.subject);
      formData.append("unit",    form.unit);
      formData.append("title",   form.title);

      const BASE_URL = import.meta.env.VITE_API_URL.replace(/\/$/, "");
      const res  = await fetch(`${BASE_URL}/upload-assessment`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setSuccess(true);
      setFile(null);
      setForm({ title: "", subject: "", year: "", semester: "", unit: "" });
      const fi = document.getElementById("assessment-file-input");
      if (fi) fi.value = "";
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleUpload}>
      {error   && <div className="p-4 bg-red-50   border border-red-200   text-red-700   rounded-lg text-sm">{error}</div>}
      {success && <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">✅ Assessment uploaded successfully</div>}

      {/* Step 1 */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 flex items-start gap-3">
        <span className="text-2xl mt-0.5">📥</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-blue-800 mb-1">Step 1 — Download the MCQ Template</p>
          <p className="text-xs text-blue-600 mb-3 leading-relaxed">
            Fixed headers:{" "}
            <span className="font-mono bg-blue-100 px-1 rounded">
              Question | Option A | Option B | Option C | Option D | Answer
            </span>
            . Answer column accepts <strong>A, B, C or D</strong> only.
          </p>
          <button type="button" onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            ⬇️ Download Template (.xlsx)
          </button>
        </div>
      </div>

      {/* Step 2 */}
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
        <p className="text-sm font-semibold text-gray-700">Step 2 — Fill Assessment Details</p>
        <input placeholder="Subject" className="input" value={form.subject} disabled={loading}
          onChange={(e) => setForm({ ...form, subject: e.target.value })} />
        <input placeholder="Title"   className="input" value={form.title}   disabled={loading}
          onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input placeholder="Unit"    className="input" value={form.unit}    disabled={loading}
          onChange={(e) => setForm({ ...form, unit: e.target.value })} />

        <div className={`grid gap-4 ${form.year !== "1" ? "grid-cols-2" : "grid-cols-1"}`}>
          <select className="input" value={form.year} disabled={loading}
            onChange={(e) => setForm({ ...form, year: e.target.value, semester: e.target.value === "1" ? "" : form.semester })}>
            <option value="">Year</option>
            {["1","2","3","4"].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {form.year !== "1" && (
            <select className="input" value={form.semester} disabled={loading}
              onChange={(e) => setForm({ ...form, semester: e.target.value })}>
              <option value="">Semester</option>
              <option value="1">1</option>
              <option value="2">2</option>
            </select>
          )}
        </div>
      </div>

      {/* Step 3 */}
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
        <p className="text-sm font-semibold text-gray-700 mb-1">Step 3 — Upload Filled Template</p>
        <p className="text-xs text-gray-400 mb-3">Only upload the template you downloaded above (.xlsx).</p>
        <input
          id="assessment-file-input"
          type="file"
          accept=".xlsx,.csv,.docx,.txt"
          disabled={loading}
          onChange={(e) => setFile(e.target.files[0])}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-medium
            file:bg-purple-50 file:text-purple-700
            hover:file:bg-purple-100 cursor-pointer"
        />
        {file && <p className="text-xs text-green-600 mt-2">✓ Selected: <span className="font-medium">{file.name}</span></p>}
      </div>

      <button disabled={loading} className="btn-purple w-full">
        {loading ? "Uploading..." : "Upload Assessment"}
      </button>
    </form>
  );
}