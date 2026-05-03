import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { supabase } from "../../lib/supabaseClient"; // ✅ ADDED

export default function FacultyLogin() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false); // ✅ ADDED

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ UPDATED LOGIN LOGIC
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 🔐 LOGIN WITH SUPABASE
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (error) throw error;

      const user = data.user;

      // 📊 FETCH FACULTY DATA
      const { data: facultyData, error: dbError } = await supabase
        .from("faculty")
        .select("*")
        .eq("id", user.id)
        .single();

      if (dbError) throw dbError;
      if (!facultyData) throw new Error("Faculty profile not found.");

      console.log("Faculty:", facultyData);

      // 🔐 SAVE AUTH STATE FOR DASHBOARD ACTIONS
      localStorage.setItem("faculty", JSON.stringify(facultyData));

      alert("Login successful");

      // 🚀 REDIRECT
      navigate("/faculty/dashboard");

    } catch (err) {
      console.error("Login Error:", err.message);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex font-sans">
      {/* Left Panel */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-between bg-white px-10 py-8">
        
        {/* LOGO */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-[#2563eb] flex items-center justify-center shadow-md">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0v6m-4-3.5l4 2 4-2" />
              </svg>
            </div>
            <span className="text-[15px] font-semibold text-gray-800 tracking-tight">
              Lerno · Osmania University
            </span>
          </div>

          {/* BACK BUTTON */}
          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>

        {/* FORM */}
        <div className="w-full max-w-[400px] mx-auto">
          <h1 className="text-[32px] font-extrabold text-gray-900 mb-1 leading-tight">
            Welcome back
          </h1>
          <p className="text-[14px] text-gray-500 mb-8">
            Sign in with your faculty email.
          </p>

          <form onSubmit={handleSubmit} noValidate>

            {/* EMAIL */}
            <div className="mb-5">
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                University Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full h-[46px] pl-10 pr-4 border border-gray-200 rounded-lg text-[14px] focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10"
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="mb-6">
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full h-[46px] pl-10 pr-4 border border-gray-200 rounded-lg text-[14px] focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10"
                />
              </div>
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[46px] bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white text-[15px] font-semibold rounded-lg shadow"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

            {/* SIGNUP */}
            <p className="text-center text-[13px] text-gray-500 mt-6">
              New here?{" "}
              <button
                type="button"
                onClick={() => navigate("/faculty/signup")}
                className="text-[#2563eb] font-semibold hover:underline"
              >
                Create an account
              </button>
            </p>
          </form>
        </div>

        {/* FOOTER */}
        <p className="text-center text-[11px] text-gray-400">
          © 2026 Lerno · Osmania University
        </p>
      </div>

      {/* Right Panel (UNCHANGED UI) */}
      <div className="hidden lg:flex w-1/2 min-h-screen bg-gradient-to-br from-[#1d4ed8] via-[#2563eb] to-[#3b82f6]"></div>
    </div>
  );
}