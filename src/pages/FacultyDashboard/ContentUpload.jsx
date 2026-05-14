import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";
import { supabase } from "../../lib/supabaseClient";

// ─── Chunk size: 64 MB ───────────────────────────────────────────────────────
// Must be a multiple of 256 KB (YouTube requirement).
// 64 MB = 64 × 1024 × 1024 = 67108864 bytes.
const CHUNK_SIZE = 64 * 1024 * 1024;

// ─── Resume storage key ──────────────────────────────────────────────────────
const RESUME_KEY = "yt_upload_resume";

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

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
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
          <p className="text-lg font-semibold mb-4">
            Please log in to upload content.
          </p>
          <button
            type="button"
            onClick={() => navigate("/faculty/login")}
            className="btn-blue"
          >
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
          <h1 className="text-2xl font-semibold text-gray-800 mb-6">
            Upload Content
          </h1>

          <div className="flex gap-4 mb-6">
            {[
              { key: "video",      label: "Video Uploadings"      },
              { key: "pdf",        label: "Lecture Uploadings"     },
              { key: "assessment", label: "Assessment Uploadings"  },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg border ${
                  activeTab === tab.key
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6 h-[calc(100vh-190px)] overflow-hidden">
            <div className="bg-white rounded-2xl shadow-sm border p-6 overflow-y-auto">
              {activeTab === "video"      && <VideoForm faculty={faculty} />}
              {activeTab === "pdf"        && <PDFForm faculty={faculty} />}
              {activeTab === "assessment" && <AssessmentForm faculty={faculty} />}
            </div>

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
                <h2 className="text-3xl font-bold leading-tight mb-3">
                  Osmania University
                </h2>
                <p className="text-blue-100 text-sm leading-relaxed mb-6">
                  Upload lecture videos, academic PDFs and assessments for
                  students through the LMS faculty workspace.
                </p>
                <div className="space-y-3">
                  {[
                    { icon: "🎥", title: "Video Classes",  desc: "Upload engaging academic video content."    },
                    { icon: "📚", title: "Lecture Notes",  desc: "Organize unit-wise lecture materials."      },
                    { icon: "📝", title: "Assessments",    desc: "Share tests, assignments and evaluations."  },
                  ].map((card) => (
                    <div
                      key={card.title}
                      className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10"
                    >
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
// VIDEO FORM
// ─────────────────────────────────────────────────────────────────────────────
function VideoForm({ faculty }) {
  const [file, setFile]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);
  const [embedUrl, setEmbedUrl] = useState("");

  const [uploadPhase, setUploadPhase]     = useState("");
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [totalBytes, setTotalBytes]       = useState(0);
  const [speedMBs, setSpeedMBs]           = useState(0);
  const [etaSeconds, setEtaSeconds]       = useState(null);

  const [resumeState, setResumeState] = useState(() => {
    try {
      const raw = sessionStorage.getItem(RESUME_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  const abortRef = useRef(false);
  const xhrRef   = useRef(null);

  const [form, setForm] = useState({
    subject: "", title: "", year: "", semester: "", unit: "",
  });

  // ── Upload one chunk via backend proxy ──────────────────────────────────────
  //
  // KEY FIX: We must set Content-Length explicitly on the XHR request so the
  // backend can forward it to YouTube without buffering the body first.
  // Without Content-Length the server cannot know the chunk size until the
  // entire body has been received — forcing it to buffer everything in RAM.
  //
  const uploadChunkXHR = (uploadUrl, chunk, start, totalSize) =>
    new Promise((resolve, reject) => {
      if (abortRef.current) { reject(new Error("Upload cancelled")); return; }

      const end = start + chunk.size - 1;
      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;

      const BASE_URL = import.meta.env.VITE_API_URL.replace(/\/$/, "");
      xhr.open("POST", `${BASE_URL}/proxy-youtube-chunk`, true);

      // These three headers are everything the proxy needs
      xhr.setRequestHeader("x-upload-url",    uploadUrl);
      xhr.setRequestHeader("x-content-range", `bytes ${start}-${end}/${totalSize}`);
      xhr.setRequestHeader("Content-Type",    "application/octet-stream");
      // Content-Length is set automatically by XHR from the Blob/chunk size — ✅

      xhr.timeout = 10 * 60 * 1000; // 10 min per chunk

      xhr.onload = () => {
        if (xhr.status === 308 || xhr.status === 200 || xhr.status === 201) {
          resolve(xhr);
        } else {
          reject(new Error(`Upload failed (HTTP ${xhr.status}): ${xhr.responseText}`));
        }
      };
      xhr.onerror   = () => reject(new Error("Network error during upload — check your internet"));
      xhr.ontimeout = () => reject(new Error("Chunk timed out — connection may be unstable"));

      // Send the Blob slice directly — XHR handles Content-Length automatically
      xhr.send(chunk);
    });

  // ── Query YouTube for confirmed upload offset ───────────────────────────────
  //
  // Resume queries use "bytes */TOTAL" with no body.
  // We go through our proxy so it can set the correct auth headers.
  //
  const queryResumeOffset = (uploadUrl, totalSize) =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const BASE_URL = import.meta.env.VITE_API_URL.replace(/\/$/, "");

      xhr.open("POST", `${BASE_URL}/proxy-youtube-chunk`, true);
      xhr.setRequestHeader("x-upload-url",    uploadUrl);
      // "bytes */TOTAL" tells the proxy (and YouTube) this is a resume query
      xhr.setRequestHeader("x-content-range", `bytes */${totalSize}`);
      // No body — Content-Type still required by some servers
      xhr.setRequestHeader("Content-Type",    "application/octet-stream");

      xhr.timeout = 30_000;

      xhr.onload = () => {
        if (xhr.status === 308) {
          const range = xhr.getResponseHeader("Range");
          // Range: bytes=0-N  →  confirmed offset is N+1
          resolve(range ? parseInt(range.split("-")[1], 10) + 1 : 0);
        } else if (xhr.status === 200 || xhr.status === 201) {
          resolve(totalSize); // already complete
        } else {
          reject(new Error(`Resume query failed (HTTP ${xhr.status}): ${xhr.responseText}`));
        }
      };
      xhr.onerror = () => reject(new Error("Network error querying resume offset"));

      // Send with no body (null) — proxy detects "bytes */" and ends the request
      xhr.send(null);
    });

  // ── Main upload loop ────────────────────────────────────────────────────────
  const uploadToYouTube = async (uploadUrl, videoFile, startOffset = 0) => {
    const totalSize = videoFile.size;
    let offset    = startOffset;
    let lastBytes = startOffset;
    let lastTime  = Date.now();

    while (offset < totalSize) {
      if (abortRef.current) throw new Error("Upload cancelled");

      const chunk = videoFile.slice(offset, offset + CHUNK_SIZE);
      let xhr;

      try {
        xhr = await uploadChunkXHR(uploadUrl, chunk, offset, totalSize);
      } catch (err) {
        // On network error: wait 5 s, ask YouTube where we got to, then retry
        if (abortRef.current) throw new Error("Upload cancelled");
        await new Promise((r) => setTimeout(r, 5000));
        try {
          const confirmed = await queryResumeOffset(uploadUrl, totalSize);
          offset = confirmed;
          setUploadedBytes(offset);
          saveResumeState(uploadUrl, offset, videoFile.name, totalSize);
          continue;
        } catch {
          throw err; // re-throw original error if resume query also fails
        }
      }

      // 200 / 201 — upload complete
      if (xhr.status === 200 || xhr.status === 201) {
        const data = JSON.parse(xhr.responseText);
        if (!data.id) throw new Error("YouTube did not return a video ID");
        setUploadedBytes(totalSize);
        clearResumeState();
        return data.id;
      }

      // 308 — chunk accepted, advance offset using Range header
      const rangeHeader = xhr.getResponseHeader("Range");
      offset = rangeHeader
        ? parseInt(rangeHeader.split("-")[1], 10) + 1
        : offset + chunk.size;

      setUploadedBytes(offset);
      saveResumeState(uploadUrl, offset, videoFile.name, totalSize);

      // Speed / ETA calculation
      const now        = Date.now();
      const elapsedSec = (now - lastTime) / 1000;
      if (elapsedSec > 0) {
        const mbPerSec = (offset - lastBytes) / 1024 / 1024 / elapsedSec;
        setSpeedMBs(mbPerSec.toFixed(1));
        setEtaSeconds(Math.round((totalSize - offset) / 1024 / 1024 / mbPerSec));
      }
      lastBytes = offset;
      lastTime  = now;
    }

    throw new Error("Upload loop ended without a video ID from YouTube");
  };

  // ── Resume helpers ──────────────────────────────────────────────────────────
  const saveResumeState = (uploadUrl, offset, fileName, fileSize) => {
    const state = { uploadUrl, offset, fileName, fileSize };
    sessionStorage.setItem(RESUME_KEY, JSON.stringify(state));
    setResumeState(state);
  };
  const clearResumeState = () => {
    sessionStorage.removeItem(RESUME_KEY);
    setResumeState(null);
  };

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleUpload = (e) => { e.preventDefault(); startUpload(null); };

  const handleResume = async () => {
    if (!resumeState || !file) {
      setError("Please select the same file to resume.");
      return;
    }
    if (file.name !== resumeState.fileName || file.size !== resumeState.fileSize) {
      setError(`Select the original file "${resumeState.fileName}" to resume.`);
      return;
    }
    try {
      const confirmed = await queryResumeOffset(resumeState.uploadUrl, resumeState.fileSize);
      startUpload(resumeState.uploadUrl, confirmed);
    } catch {
      setError(
        "Could not resume — session may have expired (sessions last 6 days). Start a new upload."
      );
      clearResumeState();
    }
  };

  const handleCancel = () => {
    abortRef.current = true;
    if (xhrRef.current) xhrRef.current.abort();
    setLoading(false);
    setUploadPhase("");
    setError("Upload paused. Select the same file and click Resume to continue.");
  };

  // ── Core upload logic ───────────────────────────────────────────────────────
  const startUpload = async (existingUploadUrl, startOffset = 0) => {
    setError(""); setSuccess(false); setEmbedUrl("");
    abortRef.current = false;

    const currentFaculty =
      faculty || JSON.parse(localStorage.getItem("faculty") || "null");
    if (!currentFaculty?.id) { setError("Please login again"); return; }

    if (
      !form.subject || !form.title || !form.year || !form.unit ||
      (form.year !== "1" && !form.semester)
    ) {
      setError("Please fill all fields"); return;
    }
    if (!file) { setError("Please select a video file"); return; }

    try {
      setLoading(true);
      setTotalBytes(file.size);
      setUploadedBytes(startOffset);
      setSpeedMBs(0);
      setEtaSeconds(null);

      const BASE_URL = import.meta.env.VITE_API_URL.replace(/\/$/, "");
      let uploadUrl  = existingUploadUrl;

      // Step 1 — Create resumable upload session on YouTube (only for new uploads)
      if (!uploadUrl) {
        setUploadPhase("session");
        const sessionRes = await fetch(
          `${BASE_URL}/create-youtube-upload-session`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: form.title,
              description: `${form.subject} | Unit ${form.unit} | Year ${form.year}${
                form.semester ? " Sem " + form.semester : ""
              } | ${currentFaculty.department}`,
              tags:     ["education", "Osmania University", form.subject],
              fileSize: file.size,
              mimeType: file.type || "video/mp4",
            }),
          }
        );
        const sessionData = await sessionRes.json();
        if (!sessionRes.ok)
          throw new Error(sessionData.error || "Failed to create upload session");
        uploadUrl = sessionData.uploadUrl;
        saveResumeState(uploadUrl, 0, file.name, file.size);
      }

      // Step 2 — Stream chunks via backend proxy (zero-buffer)
      setUploadPhase("uploading");
      const videoId = await uploadToYouTube(uploadUrl, file, startOffset);

      // Step 3 — Persist metadata in Supabase
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
      if (!metaRes.ok)
        throw new Error(metaData.error || "Failed to save video metadata");

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

  // ── Display helpers ─────────────────────────────────────────────────────────
  const progressPct = totalBytes > 0
    ? Math.round((uploadedBytes / totalBytes) * 100)
    : 0;
  const uploadedMB = (uploadedBytes / 1024 / 1024).toFixed(0);
  const totalMB    = (totalBytes   / 1024 / 1024).toFixed(0);

  const formatEta = (sec) => {
    if (!sec || sec < 0) return "";
    if (sec < 60)   return `~${sec}s left`;
    if (sec < 3600) return `~${Math.round(sec / 60)}m left`;
    return `~${(sec / 3600).toFixed(1)}h left`;
  };

  // ── Render ──────────────────────────────────────────────────────────────────
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

      {/* Resume banner */}
      {resumeState && !loading && !success && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm space-y-2">
          <p className="font-semibold text-amber-800">
            ⏸ Incomplete upload: {resumeState.fileName}
          </p>
          <p className="text-amber-700 text-xs">
            {((resumeState.offset / resumeState.fileSize) * 100).toFixed(0)}% done —{" "}
            {(resumeState.offset / 1024 / 1024).toFixed(0)} MB of{" "}
            {(resumeState.fileSize / 1024 / 1024).toFixed(0)} MB
          </p>
          <p className="text-amber-600 text-xs">
            Select the same file below then click Resume.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleResume}
              className="px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700"
            >
              ▶ Resume upload
            </button>
            <button
              type="button"
              onClick={clearResumeState}
              className="px-3 py-1.5 bg-white border text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50"
            >
              Start fresh
            </button>
          </div>
        </div>
      )}

      <input
        placeholder="Subject" className="input" value={form.subject}
        disabled={loading}
        onChange={(e) => setForm({ ...form, subject: e.target.value })}
      />
      <input
        placeholder="Title" className="input" value={form.title}
        disabled={loading}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />
      <input
        placeholder="Unit (e.g. Unit 1)" className="input" value={form.unit}
        disabled={loading}
        onChange={(e) => setForm({ ...form, unit: e.target.value })}
      />

      <div className={`grid gap-4 ${form.year !== "1" ? "grid-cols-2" : "grid-cols-1"}`}>
        <select
          className="input" value={form.year} disabled={loading}
          onChange={(e) =>
            setForm({ ...form, year: e.target.value, semester: e.target.value === "1" ? "" : form.semester })
          }
        >
          <option value="">Year</option>
          {["1","2","3","4"].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        {form.year !== "1" && (
          <select
            className="input" value={form.semester} disabled={loading}
            onChange={(e) => setForm({ ...form, semester: e.target.value })}
          >
            <option value="">Semester</option>
            <option value="1">1</option>
            <option value="2">2</option>
          </select>
        )}
      </div>

      {/* File picker */}
      <div className="rounded-xl border-2 border-dashed border-gray-200 p-4">
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
            file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
            file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100 cursor-pointer"
        />
        {file && (
          <p className="text-xs text-gray-500 mt-2">
            📹 {file.name} —{" "}
            {file.size > 1024 * 1024 * 1024
              ? (file.size / 1024 / 1024 / 1024).toFixed(2) + " GB"
              : (file.size / 1024 / 1024).toFixed(1) + " MB"}
          </p>
        )}
      </div>

      {/* Upload progress */}
      {loading && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 space-y-3">
          <p className="text-sm font-semibold text-blue-800">
            {uploadPhase === "session"   && "⚙️ Creating upload session on YouTube..."}
            {uploadPhase === "uploading" && `📤 Uploading to YouTube — ${progressPct}%`}
            {uploadPhase === "saving"    && "💾 Saving metadata..."}
          </p>

          {uploadPhase === "uploading" && (
            <>
              <div className="w-full bg-blue-200 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-blue-700">
                <span>{uploadedMB} MB / {totalMB} MB</span>
                <span>{speedMBs} MB/s</span>
                <span>{formatEta(etaSeconds)}</span>
              </div>
              <p className="text-xs text-blue-500">
                Uploading in 64 MB chunks through secure backend proxy.
              </p>
            </>
          )}

          {uploadPhase !== "uploading" && (
            <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
              <div className="bg-blue-500 h-2 rounded-full animate-pulse w-1/3" />
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs text-blue-500">
              ⚠️ Keep this tab open. You can pause and resume safely.
            </p>
            <button
              type="button"
              onClick={handleCancel}
              className="text-xs text-red-500 underline ml-4"
            >
              Pause
            </button>
          </div>
        </div>
      )}

      <button
        disabled={loading}
        className="btn-blue w-full disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Uploading…" : "Upload Video"}
      </button>

      {/* Preview */}
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
// PDF FORM
// ─────────────────────────────────────────────────────────────────────────────
function PDFForm({ faculty }) {
  const [file, setFile]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm]       = useState({
    subject: "", title: "", year: "", semester: "", unit: "",
  });

  const handleUpload = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(false);

    const currentFaculty =
      faculty || JSON.parse(localStorage.getItem("faculty") || "null");
    if (!currentFaculty?.id) { setError("Please login again"); return; }
    if (!file) { setError("Please select a PDF file"); return; }
    if (
      !form.subject || !form.title || !form.year || !form.unit ||
      (form.year !== "1" && !form.semester)
    ) { setError("Please fill all fields"); return; }

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

      setSuccess(true); setFile(null);
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

      <input placeholder="Subject"       className="input" value={form.subject} disabled={loading} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
      <input placeholder="Title"         className="input" value={form.title}   disabled={loading} onChange={(e) => setForm({ ...form, title:   e.target.value })} />
      <input placeholder="Unit (Unit 1)" className="input" value={form.unit}    disabled={loading} onChange={(e) => setForm({ ...form, unit:    e.target.value })} />

      <div className={`grid gap-4 ${form.year !== "1" ? "grid-cols-2" : "grid-cols-1"}`}>
        <select
          className="input" value={form.year} disabled={loading}
          onChange={(e) =>
            setForm({ ...form, year: e.target.value, semester: e.target.value === "1" ? "" : form.semester })
          }
        >
          <option value="">Year</option>
          {["1","2","3","4"].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        {form.year !== "1" && (
          <select
            className="input" value={form.semester} disabled={loading}
            onChange={(e) => setForm({ ...form, semester: e.target.value })}
          >
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
// ASSESSMENT FORM
// ─────────────────────────────────────────────────────────────────────────────
function AssessmentForm({ faculty }) {
  const [file, setFile]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm]       = useState({
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
    setError(""); setSuccess(false);

    const currentFaculty =
      faculty || JSON.parse(localStorage.getItem("faculty") || "null");
    if (!currentFaculty?.id) { setError("Please login again"); return; }
    if (!file) { setError("Please upload the filled Excel file"); return; }
    if (
      !form.title || !form.subject || !form.year || !form.unit ||
      (form.year !== "1" && !form.semester)
    ) { setError("Fill all fields"); return; }

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

      setSuccess(true); setFile(null);
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
          <p className="text-sm font-semibold text-blue-800 mb-1">
            Step 1 — Download the MCQ Template
          </p>
          <p className="text-xs text-blue-600 mb-3 leading-relaxed">
            Fixed headers:{" "}
            <span className="font-mono bg-blue-100 px-1 rounded">
              Question | Option A | Option B | Option C | Option D | Answer
            </span>.
            Answer column accepts <strong>A, B, C or D</strong> only.
          </p>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            ⬇️ Download Template (.xlsx)
          </button>
        </div>
      </div>

      {/* Step 2 */}
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
        <p className="text-sm font-semibold text-gray-700">
          Step 2 — Fill Assessment Details
        </p>
        <input placeholder="Subject" className="input" value={form.subject} disabled={loading} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
        <input placeholder="Title"   className="input" value={form.title}   disabled={loading} onChange={(e) => setForm({ ...form, title:   e.target.value })} />
        <input placeholder="Unit"    className="input" value={form.unit}    disabled={loading} onChange={(e) => setForm({ ...form, unit:    e.target.value })} />
        <div className={`grid gap-4 ${form.year !== "1" ? "grid-cols-2" : "grid-cols-1"}`}>
          <select
            className="input" value={form.year} disabled={loading}
            onChange={(e) =>
              setForm({ ...form, year: e.target.value, semester: e.target.value === "1" ? "" : form.semester })
            }
          >
            <option value="">Year</option>
            {["1","2","3","4"].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          {form.year !== "1" && (
            <select
              className="input" value={form.semester} disabled={loading}
              onChange={(e) => setForm({ ...form, semester: e.target.value })}
            >
              <option value="">Semester</option>
              <option value="1">1</option>
              <option value="2">2</option>
            </select>
          )}
        </div>
      </div>

      {/* Step 3 */}
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
        <p className="text-sm font-semibold text-gray-700 mb-1">
          Step 3 — Upload Filled Template
        </p>
        <p className="text-xs text-gray-400 mb-3">
          Only upload the template you downloaded above (.xlsx).
        </p>
        <input
          id="assessment-file-input"
          type="file"
          accept=".xlsx,.csv,.docx,.txt"
          disabled={loading}
          onChange={(e) => setFile(e.target.files[0])}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
            file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700
            hover:file:bg-purple-100 cursor-pointer"
        />
        {file && (
          <p className="text-xs text-green-600 mt-2">
            ✓ Selected: <span className="font-medium">{file.name}</span>
          </p>
        )}
      </div>

      <button disabled={loading} className="btn-purple w-full">
        {loading ? "Uploading..." : "Upload Assessment"}
      </button>
    </form>
  );
}