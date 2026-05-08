import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  BriefcaseBusiness,
  ChevronDown,
  ArrowLeft,
  CheckCircle2,
  BookOpen,
  GraduationCap,
  FileText,
  Award,
  Users,
  TrendingUp,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import "../../App.css";
import oulogo from "../../assets/images/Eng_college_log.png";

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

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

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

    const isValidDomain = allowedDomains.some((domain) =>
      email.endsWith(domain)
    );

    if (!isValidDomain) {
      alert(
        "Only @osmania.ac.in, @uceou.edu, or @gmail.com emails are allowed."
      );
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: {
          data: {
            role: "faculty",
            name: form.name,
            department: form.department,
          },
          emailRedirectTo: `${window.location.origin}/faculty/login`,
        },
      });

      if (error) throw error;

      const user = data.user ?? data.session?.user;

      if (!user) {
        alert(
          "Account already exists or email verification required. Please login."
        );
        navigate("/faculty/login");
        return;
      }

      const { error: insertError } = await supabase.from("faculty").insert([
        {
          id: user.id,
          name: form.name,
          email: email,
          employee_id: form.employeeId,
          department: form.department,
        },
      ]);

      if (insertError) {
        console.error("Insert error:", insertError);
        throw new Error("Unable to save faculty profile");
      }

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

  return (
    <div className="w-full min-h-screen flex bg-white">
      {/* LEFT PANEL - SCROLLABLE FORM */}
      <div className="w-full lg:w-1/2 flex flex-col bg-[#fdfcfb]">
        {/* STICKY HEADER */}
        <div className="sticky top-0 z-20 bg-[#fdfcfb]/95 backdrop-blur-sm border-b border-slate-100 px-6 sm:px-12 py-6">
          <div className="flex items-center justify-between max-w-[520px]">
            <div className="flex items-center gap-3">
              <img
                src={oulogo}
                alt="OU Logo"
                className="w-11 h-11 rounded-lg"
              />
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500 mb-0.5">
                  LMS · Osmania University
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  Faculty Portal
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-12 py-8">
          <div className="max-w-[520px]">
            {/* HEADING */}
            <div className="mb-10">
              <h1 className="text-[42px] font-extrabold text-slate-950 leading-tight mb-3">
                Create account
              </h1>
              <p className="text-base text-slate-500 leading-relaxed">
                Sign up with your university email and unlock branch-aware
                lectures, notes, and instant-graded MCQs.
              </p>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <InputField
                icon={User}
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Dr. John Doe"
                label="Name"
              />

              <InputField
                icon={Mail}
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@uceou.edu"
                label="Email"
                type="email"
              />

              <InputField
                icon={BriefcaseBusiness}
                name="employeeId"
                value={form.employeeId}
                onChange={handleChange}
                placeholder="EMP12345"
                label="Employee ID"
              />

              {/* DEPARTMENT */}
              <div>
                <label className="font-semibold mb-2 block text-slate-800">
                  Department
                </label>
                <div className="relative">
                  <select
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    required
                    className="w-full h-[52px] pl-4 pr-10 border border-slate-200 rounded-2xl bg-white text-slate-900 outline-none focus:border-[#173f82] focus:ring-2 focus:ring-[#173f82]/10 appearance-none"
                  >
                    <option value="">Select department</option>
                    {departments.map((dept, i) => (
                      <option key={i}>{dept}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                </div>
              </div>

              <InputField
                icon={Lock}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••"
                label="Password"
                type="password"
              />

              <InputField
                icon={Lock}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="••••••"
                label="Confirm Password"
                type="password"
              />

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[55px] rounded-2xl bg-gradient-to-r from-[#173f82] to-[#1d4ed8] text-white font-semibold text-base shadow-lg shadow-slate-200/30 transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70 active:scale-[0.98]"
              >
                {loading ? "Creating..." : "Create Account"}
              </button>

              {/* LOGIN LINK */}
              <p className="text-center text-sm text-slate-500 mt-6">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/faculty/login")}
                  className="font-semibold text-[#173f82] hover:text-[#1d4ed8]"
                >
                  Sign in
                </button>
              </p>
            </form>

            {/* FOOTER */}
            <p className="text-center text-xs text-slate-400 mt-12">
              © 2026 LMS · Osmania University
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - FIXED ILLUSTRATION */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0b2f66] relative overflow-hidden items-center justify-center p-12">
        {/* BACKGROUND DECORATIONS */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] bg-repeat"></div>
        </div>

        {/* CONTENT CONTAINER */}
        <div className="relative z-10 w-full max-w-xl">
          {/* TOP TEXT SECTION */}
          <div className="mb-10">
            <p className="text-sm uppercase tracking-[0.28em] text-slate-200/80 mb-4">
              Official campus LMS
            </p>
            <h2 className="text-5xl font-extrabold leading-tight tracking-[-0.04em] mb-5 text-white">
              The official LMS for Osmania University.
            </h2>
            <p className="text-base text-slate-200/90 max-w-lg">
              Lectures, notes, and instant-graded MCQs — all branch-aware.
            </p>
          </div>

          {/* ILLUSTRATION CARD - EXACT MATCH */}
          <div className="relative rounded-[32px] bg-white/10 border border-white/15 p-8 overflow-hidden shadow-[0_40px_120px_rgba(15,23,42,0.18)]">
            {/* DECORATIVE BLURS */}
            <div className="absolute -left-16 -top-16 w-44 h-44 rounded-full bg-white/10 blur-3xl"></div>
            <div className="absolute -right-12 bottom-10 w-36 h-36 rounded-full bg-[#2563eb]/20 blur-3xl"></div>

            <div className="relative z-10">
              {/* MAIN VIDEO/CONTENT CARD */}
              <div className="rounded-[28px] bg-[#e8f2ff] p-6 shadow-xl mb-6">
                <div className="relative h-52 rounded-[30px] overflow-hidden bg-[#d9e7ff]">
                  {/* Small white card - top left */}
                  <div className="absolute left-6 top-6 w-20 h-12 rounded-2xl bg-white/80 shadow-sm"></div>

                  {/* Large dark blue card - bottom left */}
                  <div className="absolute left-6 bottom-6 w-36 h-24 rounded-[24px] bg-[#163a8a] shadow-xl"></div>

                  {/* Medium blue card - top right */}
                  <div className="absolute right-8 top-10 w-20 h-16 rounded-[18px] bg-[#1d4ed8] shadow-lg"></div>

                  {/* White outlined card - middle left */}
                  <div className="absolute left-10 top-20 w-20 h-20 rounded-3xl bg-[#eff6ff] border border-slate-200 shadow-sm"></div>

                  {/* Play button circle - bottom right */}
                  <div className="absolute right-10 bottom-8 w-16 h-16 rounded-full bg-[#0ea5e9] grid place-items-center text-white text-lg font-bold shadow-lg">
                    ▶
                  </div>
                </div>
              </div>

              {/* BOTTOM TWO CARDS */}
              <div className="grid gap-4 grid-cols-2">
                {/* LEFT CARD - Certificate */}
                <div className="rounded-3xl bg-white/10 p-4 shadow-xl backdrop-blur-sm">
                  <div className="text-[11px] uppercase tracking-[0.24em] text-slate-300 mb-3 font-semibold">
                    Certificate
                  </div>
                  <div className="rounded-3xl bg-white/10 p-4 space-y-3">
                    <div className="h-2.5 rounded-full bg-slate-300/70 w-3/4"></div>
                    <div className="h-2.5 rounded-full bg-slate-300/70 w-1/2"></div>
                    <div className="h-2.5 rounded-full bg-slate-300/70 w-2/3"></div>
                  </div>
                </div>

                {/* RIGHT CARD - Resources */}
                <div className="rounded-3xl bg-white/10 p-4 shadow-xl backdrop-blur-sm">
                  <div className="text-[11px] uppercase tracking-[0.24em] text-slate-300 mb-3 font-semibold">
                    Resources
                  </div>
                  <div className="rounded-3xl bg-white/10 p-4 space-y-3">
                    <div className="h-2.5 rounded-full bg-slate-300/70 w-2/3"></div>
                    <div className="h-2.5 rounded-full bg-slate-300/70 w-3/4"></div>
                    <div className="h-2.5 rounded-full bg-slate-300/70 w-1/2"></div>
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

/* INPUT COMPONENT */
function InputField({ icon: Icon, label, type = "text", ...props }) {
  return (
    <div>
      <label className="font-semibold mb-2 block text-slate-800">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input
          type={type}
          {...props}
          required
          className="w-full h-[52px] pl-10 pr-4 border border-slate-200 rounded-2xl bg-slate-50 text-slate-900 outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10 transition-all"
        />
      </div>
    </div>
  );
}