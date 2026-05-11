import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  BriefcaseBusiness,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import "../../App.css";
import oulogo from "../../assets/images/Eng_college_log.png";

/* ─── Inject global styles once ─── */
(function injectStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("fs-global")) return;
  const s = document.createElement("style");
  s.id = "fs-global";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    @keyframes fs-spin { to { transform: rotate(360deg); } }

    /* right panel: hidden by default, visible on ≥1024 px */
    .fs-right-panel { display: none !important; }
    @media (min-width: 1024px) {
      .fs-right-panel { display: flex !important; }
    }

    /* input / select focus rings via CSS so we don't fight inline styles */
    .fs-input:focus {
      border-color: #2563eb !important;
      box-shadow: 0 0 0 3px rgba(37,99,235,0.15) !important;
      background-color: #fff !important;
      outline: none;
    }
    .fs-select:focus {
      border-color: #2563eb !important;
      box-shadow: 0 0 0 3px rgba(37,99,235,0.15) !important;
      background-color: #fff !important;
      outline: none;
    }

    /* submit button hover */
    .fs-submit:not(:disabled):hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(37,99,235,0.38) !important;
    }
    .fs-submit:not(:disabled):active { transform: translateY(0); }

    /* brand link hover */
    .fs-brand:hover { opacity: 0.8; }
  `;
  document.head.appendChild(s);
})();

/* ─── Departments ─── */
const departments = [
  "Biomedical Engineering",
  "Civil Engineering",
  "Computer Science & Engg.",
  "Electronics & Communication Engg.",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Mining Engineering",
  "Chemistry",
  "Physics",
  "English",
  "Mathematics",
  "Physical Education",
];

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════ */
export default function FacultySignup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    employeeId: "",
    department: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !form.name ||
      !form.email ||
      !form.employeeId ||
      !form.department ||
      !form.password ||
      !form.confirmPassword
    ) {
      alert("Please fill all fields");
      return;
    }
    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    const email = form.email.toLowerCase().trim();
    const allowedDomains = ["@osmania.ac.in", "@uceou.edu", "@gmail.com"];
    if (!allowedDomains.some((d) => email.endsWith(d))) {
      alert("Only @osmania.ac.in, @uceou.edu, or @gmail.com emails are allowed.");
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: {
          data: { role: "faculty", name: form.name, department: form.department },
          emailRedirectTo: `${window.location.origin}/faculty/login`,
        },
      });
      if (error) throw error;
      const user = data.user ?? data.session?.user;
      if (!user) {
        alert("Account already exists or email verification required. Please login.");
        navigate("/faculty/login");
        return;
      }
      const { error: insertError } = await supabase.from("faculty").insert([
        {
          id: user.id,
          name: form.name,
          email,
          employee_id: form.employeeId,
          department: form.department,
        },
      ]);
      if (insertError) throw new Error("Unable to save faculty profile");
      alert("Account created successfully!");
      navigate("/faculty/login");
    } catch (err) {
      console.error("Signup Error:", err);
      if (err.message?.includes("User already registered")) {
        alert("User already exists. Please login.");
        navigate("/faculty/login");
        return;
      }
      alert(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  /* ── JSX ── */
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        backgroundColor: "#fff",
      }}
    >

      {/* ══════════ LEFT PANEL – FORM ══════════ */}
      <div
        style={{
          flex: "1 1 0",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#fff",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            padding: "44px 28px",
          }}
        >
          <div style={{ width: "100%", maxWidth: "440px" }}>

            {/* BRAND */}
            <button
              type="button"
              onClick={() => navigate("/")}
              className="fs-brand"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                marginBottom: "42px",
                transition: "opacity 0.2s",
              }}
            >
              <img
                src={oulogo}
                alt="OU Logo"
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "10px",
                  objectFit: "cover",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                }}
              />
              <div>
                <p
                  style={{
                    fontSize: "10px",
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: "#6b7280",
                    fontWeight: 600,
                    marginBottom: "2px",
                  }}
                >
                  LMS · Osmania University
                </p>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "#111827" }}>
                  Faculty Portal
                </p>
              </div>
            </button>

            {/* HEADING */}
            <div style={{ marginBottom: "30px" }}>
              <h1
                style={{
                  fontSize: "clamp(26px,4vw,34px)",
                  fontWeight: 800,
                  color: "#111827",
                  lineHeight: 1.15,
                  marginBottom: "10px",
                  letterSpacing: "-0.4px",
                }}
              >
                Create your account
              </h1>
              <p style={{ fontSize: "14px", color: "#6b7280", lineHeight: 1.65 }}>
                Sign up with your university email to access branch-aware
                lectures, notes, and instant-graded MCQs.
              </p>
            </div>

            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              noValidate
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <Field icon={User} name="name" value={form.name} onChange={handleChange}
                placeholder="Dr. John Doe" label="Full Name" />

              <Field icon={Mail} name="email" value={form.email} onChange={handleChange}
                placeholder="you@uceou.edu" label="University Email" type="email" />

              <Field icon={BriefcaseBusiness} name="employeeId" value={form.employeeId}
                onChange={handleChange} placeholder="EMP12345" label="Employee ID" />

              {/* DEPARTMENT */}
              <div>
                <label style={lbl}>Department</label>
                <div style={{ position: "relative" }}>
                  <select
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    required
                    className="fs-select"
                    style={selectBase}
                  >
                    <option value="">Select department</option>
                    {departments.map((d, i) => <option key={i}>{d}</option>)}
                  </select>
                  <ChevronDown
                    size={17}
                    style={{
                      position: "absolute", right: "13px", top: "50%",
                      transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none",
                    }}
                  />
                </div>
              </div>

              <Field icon={Lock} name="password" value={form.password} onChange={handleChange}
                placeholder="Min. 8 characters" label="Password" type="password" />

              <Field icon={Lock} name="confirmPassword" value={form.confirmPassword}
                onChange={handleChange} placeholder="Re-enter password"
                label="Confirm Password" type="password" />

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={loading}
                className="fs-submit"
                style={{
                  width: "100%",
                  height: "50px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "15px",
                  border: "none",
                  marginTop: "6px",
                  boxShadow: "0 4px 14px rgba(37,99,235,0.30)",
                  transition: "transform 0.18s, box-shadow 0.18s",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.72 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                }}
              >
                {loading && (
                  <span
                    style={{
                      width: "16px", height: "16px",
                      border: "2px solid rgba(255,255,255,0.35)",
                      borderTopColor: "#fff", borderRadius: "50%",
                      display: "inline-block",
                      animation: "fs-spin 0.7s linear infinite",
                    }}
                  />
                )}
                {loading ? "Creating account…" : "Create Account"}
              </button>

              {/* SIGN-IN */}
              <p style={{ textAlign: "center", fontSize: "13px", color: "#6b7280" }}>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/faculty/login")}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontWeight: 700, color: "#1e3a8a", fontSize: "13px",
                    textDecoration: "underline", textUnderlineOffset: "2px",
                  }}
                >
                  Sign in
                </button>
              </p>
            </form>

            {/* FOOTER */}
            <p
              style={{
                textAlign: "center", fontSize: "11px",
                color: "#9ca3af", marginTop: "32px",
              }}
            >
              © 2026 LMS · Osmania University
            </p>
          </div>
        </div>
      </div>

      {/* ══════════ RIGHT PANEL – BLUE ILLUSTRATION ══════════ */}
      {/*
        .fs-right-panel is display:none by default;
        at ≥1024 px the injected CSS overrides it to display:flex.
        We do NOT set display inline so the CSS can win.
      */}
      <div
        className="fs-right-panel"
        style={{
          flex: "0 0 48%",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          background:
            "linear-gradient(145deg,#0f2167 0%,#1e40af 52%,#0369a1 100%)",
          minHeight: "100vh",
          padding: "48px 40px",
          boxSizing: "border-box",
        }}
      >
        {/* grid texture */}
        <div
          style={{
            position: "absolute", inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px)," +
              "linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            pointerEvents: "none",
          }}
        />
        {/* decorative blobs */}
        <div style={{
          position: "absolute", top: "-140px", left: "-140px",
          width: "400px", height: "400px", borderRadius: "50%",
          background: "rgba(255,255,255,0.06)", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "-110px", right: "-110px",
          width: "320px", height: "320px", borderRadius: "50%",
          background: "rgba(255,255,255,0.05)", pointerEvents: "none",
        }} />

        {/* CONTENT (z above decorations) */}
        <div
          style={{
            position: "relative", zIndex: 1,
            display: "flex", flexDirection: "column",
            alignItems: "center",
            width: "100%", maxWidth: "420px",
          }}
        >
          {/* badge */}
          <span
            style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              background: "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: "999px", padding: "5px 14px",
              fontSize: "11px", color: "#bfdbfe",
              fontWeight: 600, letterSpacing: "0.06em",
              textTransform: "uppercase", marginBottom: "20px",
            }}
          >
            <ShieldCheck size={13} style={{ color: "#93c5fd" }} />
            Official Faculty Portal
          </span>

          {/* headline */}
          <h2
            style={{
              fontSize: "clamp(22px,2.6vw,32px)", fontWeight: 800,
              color: "#fff", textAlign: "center",
              lineHeight: 1.2, letterSpacing: "-0.3px",
              marginBottom: "12px",
            }}
          >
            The official LMS for<br />Osmania University
          </h2>
          <p
            style={{
              fontSize: "14px", color: "#bfdbfe",
              textAlign: "center", lineHeight: 1.7,
              maxWidth: "340px", marginBottom: "28px",
            }}
          >
            Manage lectures, share notes, and grade MCQs — all in one
            branch-aware platform built for faculty.
          </p>

          {/* ── SVG ILLUSTRATION
              viewBox 800×520  →  800/520 ≈ 1.538 aspect ratio
              display:block + lineHeight:0 removes all ghost spacing
          ── */}
          <div style={{ width: "100%", lineHeight: 0 }}>
            <svg
              viewBox="0 0 800 520"
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: "100%", height: "auto", display: "block" }}
            >
              {/* Monitor frame */}
              <rect x="220" y="50" width="360" height="248" rx="14" fill="#1e40af" opacity="0.75" />
              {/* Screen */}
              <rect x="236" y="66" width="328" height="216" rx="8" fill="#1d4ed8" />
              {/* Play circle */}
              <circle cx="400" cy="180" r="40" fill="#06b6d4" opacity="0.92" />
              <polygon points="391,163 391,197 423,180" fill="#fff" />
              {/* Progress track */}
              <rect x="274" y="264" width="252" height="5" rx="2.5" fill="#1e3a8a" />
              <rect x="274" y="264" width="150" height="5" rx="2.5" fill="#38bdf8" />
              {/* Controls */}
              <polygon points="280,276 280,288 290,282" fill="#93c5fd" />
              <rect x="296" y="276" width="3" height="12" rx="1.5" fill="#93c5fd" />
              <rect x="303" y="276" width="3" height="12" rx="1.5" fill="#93c5fd" />
              {/* Stand */}
              <rect x="370" y="298" width="60" height="14" rx="4" fill="#1e3a8a" />
              <rect x="348" y="312" width="104" height="8" rx="4" fill="#1e3a8a" />

              {/* Books – bottom left */}
              <g transform="translate(70,360)">
                <rect x="0" y="30" width="140" height="46" rx="8" fill="#0891b2" transform="rotate(-3 70 53)" />
                <rect x="10" y="36" width="5" height="36" fill="#0e7490" transform="rotate(-3 12.5 53)" />
                <rect x="0" y="0" width="150" height="40" rx="8" fill="#fff" opacity="0.82" transform="rotate(2 75 20)" />
                <rect x="10" y="5" width="5" height="30" fill="#d1d5db" transform="rotate(2 12.5 20)" />
                <rect x="10" y="-26" width="135" height="38" rx="8" fill="#1e40af" transform="rotate(-2 77.5 -7)" />
                <rect x="20" y="-21" width="5" height="28" fill="#1e3a8a" transform="rotate(-2 22.5 -7)" />
              </g>

              {/* Graduation cap – top right */}
              <g transform="translate(600,90)">
                <rect x="-30" y="0" width="100" height="8" rx="2" fill="#38bdf8" transform="rotate(-15 20 4)" />
                <polygon points="0,8 40,8 50,-8 -10,-8" fill="#0ea5e9" transform="rotate(-15 20 0)" />
                <ellipse cx="20" cy="15" rx="25" ry="8" fill="#0ea5e9" />
                <rect x="15" y="15" width="10" height="28" rx="5" fill="#0ea5e9" />
                <ellipse cx="20" cy="43" rx="8" ry="5" fill="#0369a1" />
                <line x1="45" y1="-5" x2="45" y2="20" stroke="#67e8f9" strokeWidth="2" />
                <circle cx="45" cy="22" r="4" fill="#67e8f9" />
              </g>

              {/* Chat bubble – left */}
              <g transform="translate(60,195)">
                <rect x="0" y="0" width="105" height="68" rx="14" fill="#0891b2" opacity="0.82" />
                <polygon points="14,68 28,68 10,86" fill="#0891b2" opacity="0.82" />
                <rect x="14" y="17" width="68" height="5" rx="2.5" fill="#fff" opacity="0.75" />
                <rect x="14" y="29" width="55" height="5" rx="2.5" fill="#fff" opacity="0.75" />
                <rect x="14" y="41" width="62" height="5" rx="2.5" fill="#fff" opacity="0.75" />
              </g>

              {/* Certificate – right */}
              <g transform="translate(618,290)">
                <rect x="0" y="0" width="148" height="192" rx="12" fill="rgba(255,255,255,0.09)" transform="rotate(6 74 96)" />
                <rect x="5" y="5" width="138" height="182" rx="10" fill="rgba(239,246,255,0.12)" transform="rotate(6 74 96)" />
                <text x="74" y="40" textAnchor="middle" fill="#bfdbfe" fontSize="17" fontWeight="700" transform="rotate(6 74 96)">Certificate</text>
                <circle cx="74" cy="90" r="24" fill="#fbbf24" opacity="0.9" transform="rotate(6 74 96)" />
                <polygon points="74,76 77,86 87,87 80,94 82,104 74,99 66,104 68,94 61,87 71,86" fill="#f59e0b" transform="rotate(6 74 96)" />
                <rect x="22" y="128" width="104" height="4" rx="2" fill="#bfdbfe" opacity="0.35" transform="rotate(6 74 96)" />
                <rect x="32" y="142" width="84" height="4" rx="2" fill="#bfdbfe" opacity="0.35" transform="rotate(6 74 96)" />
                <rect x="38" y="156" width="68" height="4" rx="2" fill="#bfdbfe" opacity="0.35" transform="rotate(6 74 96)" />
              </g>
            </svg>
          </div>
          {/* END SVG — no extra element or padding after this */}

          {/* feature pills */}
          <div
            style={{
              display: "flex", flexWrap: "wrap", gap: "8px",
              justifyContent: "center", marginTop: "22px",
            }}
          >
            {["Branch-aware content", "Instant MCQ grading", "Secure portal"].map(
              (t) => (
                <span
                  key={t}
                  style={{
                    background: "rgba(255,255,255,0.11)",
                    border: "1px solid rgba(255,255,255,0.20)",
                    borderRadius: "999px", padding: "5px 14px",
                    fontSize: "12px", color: "#e0f2fe", fontWeight: 500,
                  }}
                >
                  {t}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════ INPUT FIELD COMPONENT ══════════ */
const lbl = {
  display: "block",
  fontSize: "13px",
  fontWeight: 600,
  color: "#374151",
  marginBottom: "6px",
};

const selectBase = {
  width: "100%",
  height: "48px",
  paddingLeft: "14px",
  paddingRight: "36px",
  border: "1.5px solid #e5e7eb",
  borderRadius: "10px",
  backgroundColor: "#f9fafb",
  color: "#111827",
  fontSize: "14px",
  appearance: "none",
  boxSizing: "border-box",
  cursor: "pointer",
  transition: "border-color 0.2s, box-shadow 0.2s, background-color 0.2s",
};

function Field({ icon: Icon, label, type = "text", ...props }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      <div style={{ position: "relative" }}>
        <Icon
          size={17}
          style={{
            position: "absolute",
            left: "14px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#9ca3af",
            pointerEvents: "none",
          }}
        />
        <input
          type={type}
          {...props}
          required
          className="fs-input"
          style={{
            width: "100%",
            height: "48px",
            paddingLeft: "42px",
            paddingRight: "14px",
            border: "1.5px solid #e5e7eb",
            borderRadius: "10px",
            backgroundColor: "#f9fafb",
            color: "#111827",
            fontSize: "14px",
            boxSizing: "border-box",
            transition: "border-color 0.2s, box-shadow 0.2s, background-color 0.2s",
          }}
        />
      </div>
    </div>
  );
}