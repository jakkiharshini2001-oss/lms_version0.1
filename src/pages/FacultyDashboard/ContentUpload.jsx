import { useState, useEffect } from "react";
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

      if (!supabase) {
        setAuthChecking(false);
        return;
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Supabase session error", sessionError);
      }

      if (sessionData?.session?.user?.id) {
        const { data: facultyData, error: facultyError } = await supabase
          .from("faculty")
          .select("*")
          .eq("id", sessionData.session.user.id)
          .single();

        if (facultyError) {
          console.error("Faculty fetch error", facultyError);
        } else if (facultyData) {
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
              { key: "video", label: "Video Uploadings" },
              { key: "pdf", label: "Lecture Uploadings" },
              { key: "assessment", label: "Assessment Uploadings" },
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
  {/* LEFT FORM — scrollable so preview stays inside */}
  <div className="bg-white rounded-2xl shadow-sm border p-6 overflow-y-auto">
    {activeTab === "video" && <VideoForm faculty={faculty} />}
    {activeTab === "pdf" && <PDFForm faculty={faculty} />}
    {activeTab === "assessment" && <AssessmentForm faculty={faculty} />}
  </div>

  {/* RIGHT SIDE IMAGE PANEL */}
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
        Upload lecture videos, academic PDFs and assessments for students
        through the LMS faculty workspace.
      </p>

      <div className="space-y-3">
      
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
          <h3 className="font-semibold mb-1">🎥 Video Classes</h3>
          <p className="text-xs text-blue-100">
            Upload engaging academic video content.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
          <h3 className="font-semibold mb-1">📚 Lecture Notes</h3>
          <p className="text-xs text-blue-100">
            Organize unit-wise lecture materials.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
          <h3 className="font-semibold mb-1">📝 Assessments</h3>
          <p className="text-xs text-blue-100">
            Share tests, assignments and evaluations.
          </p>
        </div>
      </div>
    </div>
  </div>
</div>
        </div>
      </div>
    </div>
  );
}

function VideoForm({ faculty }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState("");

  const [form, setForm] = useState({
    subject: "",
    title: "",
    year: "",
    semester: "",
    unit: "",
  });

  const handleUpload = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setUploadedUrl("");

    const currentFaculty =
      faculty || JSON.parse(localStorage.getItem("faculty") || "null");

    if (!currentFaculty || !currentFaculty.id) {
      setError("Please login again");
      return;
    }

    if (!form.subject || !form.title || !form.year || !form.unit || (form.year !== "1" && !form.semester)) {
      setError("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "video");
      formData.append("faculty_id", currentFaculty.id);
      formData.append("faculty_name", currentFaculty.name || "");
      formData.append("department", currentFaculty.department);
      formData.append("year", form.year);
      if (form.year !== "1") {
        formData.append("semester", form.semester);
      }
      formData.append("subject", form.subject);
      formData.append("unit", form.unit);
      formData.append("title", form.title);

      const BASE_URL = import.meta.env.VITE_API_URL.replace(/\/$/, "");

const res = await fetch(`${BASE_URL}/upload-content`, {
  method: "POST",
  body: formData,
});

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setSuccess(true);
      setUploadedUrl(data.embedUrl);
      setFile(null);
      setForm({
        subject: "",
        title: "",
        year: "",
        semester: "",
        unit: "",
      });
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleUpload}>
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          ✅ Video uploaded successfully
        </div>
      )}

      <input
        placeholder="Subject"
        className="input"
        value={form.subject}
        onChange={(e) => setForm({ ...form, subject: e.target.value })}
      />

      <input
        placeholder="Title"
        className="input"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />

      <input
        placeholder="Unit (Unit 1)"
        className="input"
        value={form.unit}
        onChange={(e) => setForm({ ...form, unit: e.target.value })}
      />

      <div className={`grid gap-4 ${form.year !== "1" ? "grid-cols-2" : "grid-cols-1"}`}>
        <select
          className="input"
          value={form.year}
          onChange={(e) =>
            setForm({
              ...form,
              year: e.target.value,
              semester: e.target.value === "1" ? "" : form.semester,
            })
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
            onChange={(e) => setForm({ ...form, semester: e.target.value })}
          >
            <option value="">Semester</option>
            <option value="1">1</option>
            <option value="2">2</option>
          </select>
        )}
      </div>

      <input
        type="file"
        accept="video/*"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <button disabled={loading} className="btn-blue">
        {loading ? "Uploading..." : "Upload Video"}
      </button>

      {uploadedUrl && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-600 mb-2">Preview:</p>
          <div className="rounded-xl overflow-hidden border border-gray-200">
            <iframe
              src={uploadedUrl}
              width="100%"
              height="220"
              allow="autoplay"
              title="Video Preview"
              style={{ display: "block" }}
            />
          </div>
        </div>
      )}
    </form>
  );
}

function PDFForm({ faculty }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    subject: "",
    title: "",
    year: "",
    semester: "",
    unit: "",
  });

  const handleUpload = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const currentFaculty =
      faculty || JSON.parse(localStorage.getItem("faculty") || "null");

    if (!currentFaculty || !currentFaculty.id) {
      setError("Please login again");
      return;
    }

    if (!file) {
      setError("Please select a PDF file");
      return;
    }

    if (!form.subject || !form.title || !form.year || !form.unit || (form.year !== "1" && !form.semester)) {
      setError("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "pdf");
      formData.append("faculty_id", currentFaculty.id);
      formData.append("faculty_name", currentFaculty.name || "");
      formData.append("department", currentFaculty.department);
      formData.append("year", form.year);
      if (form.year !== "1") {
        formData.append("semester", form.semester);
      }
      formData.append("subject", form.subject);
      formData.append("unit", form.unit);
      formData.append("title", form.title);

 const BASE_URL = import.meta.env.VITE_API_URL.replace(/\/$/, "");

const res = await fetch(`${BASE_URL}/upload-content`, {
  method: "POST",
  body: formData,
});

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setSuccess(true);
      setFile(null);
      setForm({
        subject: "",
        title: "",
        year: "",
        semester: "",
        unit: "",
      });
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleUpload}>
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          ✅ PDF uploaded successfully
        </div>
      )}

      <input
        placeholder="Subject"
        className="input"
        value={form.subject}
        onChange={(e) => setForm({ ...form, subject: e.target.value })}
      />

      <input
        placeholder="Title"
        className="input"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />

      <input
        placeholder="Unit (Unit 1)"
        className="input"
        value={form.unit}
        onChange={(e) => setForm({ ...form, unit: e.target.value })}
      />

      <div className={`grid gap-4 ${form.year !== "1" ? "grid-cols-2" : "grid-cols-1"}`}>
        <select
          className="input"
          value={form.year}
          onChange={(e) =>
            setForm({
              ...form,
              year: e.target.value,
              semester: e.target.value === "1" ? "" : form.semester,
            })
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
            onChange={(e) => setForm({ ...form, semester: e.target.value })}
          >
            <option value="">Semester</option>
            <option value="1">1</option>
            <option value="2">2</option>
          </select>
        )}
      </div>

      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <button disabled={loading} className="btn-green">
        {loading ? "Uploading..." : "Upload PDF"}
      </button>
    </form>
  );
}

function AssessmentForm({ faculty }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    title: "",
    subject: "",
    year: "",
    semester: "",
    unit: "",
  });

  const handleUpload = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const currentFaculty =
      faculty || JSON.parse(localStorage.getItem("faculty") || "null");

    if (!currentFaculty || !currentFaculty.id) {
      setError("Please login again");
      return;
    }

    if (!file) {
      setError("Please upload Excel / DOCX / TXT file");
      return;
    }

    if (!form.title || !form.subject || !form.year || !form.unit || (form.year !== "1" && !form.semester)) {
      setError("Fill all fields");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("faculty_id", currentFaculty.id);
      formData.append("faculty_name", currentFaculty.name || "");
      formData.append("department", currentFaculty.department);
      formData.append("year", form.year);
      if (form.year !== "1") {
        formData.append("semester", form.semester);
      }
      formData.append("subject", form.subject);
      formData.append("unit", form.unit);
      formData.append("title", form.title);

    const BASE_URL = import.meta.env.VITE_API_URL.replace(/\/$/, "");

const res = await fetch(`${BASE_URL}/upload-assessment`, {
  method: "POST",
  body: formData,
});

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setSuccess(true);
      setFile(null);
      setForm({
        title: "",
        subject: "",
        year: "",
        semester: "",
        unit: "",
      });

    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleUpload}>
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          ✅ Assessment uploaded successfully
        </div>
      )}

      <input
        placeholder="Subject"
        className="input"
        value={form.subject}
        onChange={(e) => setForm({ ...form, subject: e.target.value })}
      />
       <input
        placeholder="Title"
        className="input"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />

      <input
        placeholder="Unit"
        className="input"
        value={form.unit}
        onChange={(e) => setForm({ ...form, unit: e.target.value })}
      />

      <div className={`grid gap-4 ${form.year !== "1" ? "grid-cols-2" : "grid-cols-1"}`}>
        <select
          className="input"
          value={form.year}
          onChange={(e) =>
            setForm({
              ...form,
              year: e.target.value,
              semester: e.target.value === "1" ? "" : form.semester,
            })
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
            onChange={(e) => setForm({ ...form, semester: e.target.value })}
          >
            <option value="">Semester</option>
            <option value="1">1</option>
            <option value="2">2</option>
          </select>
        )}
      </div>

      <input
        type="file"
        accept=".xlsx,.csv,.docx,.txt"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <button disabled={loading} className="btn-purple">
        {loading ? "Uploading..." : "Upload Assessment"}
      </button>
    </form>
  );
}