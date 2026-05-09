import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowLeft } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import oulogo from "../../assets/images/Eng_college_log.png";

export default function FacultyLogin() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const email = form.email.trim().toLowerCase();

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: form.password,
      });

      if (error) {
        throw new Error("Invalid email or password");
      }

      const user = data?.user;

      if (!user?.id) {
        throw new Error("Login failed. User not found.");
      }

      const { data: facultyData, error: dbError } = await supabase
        .from("faculty")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (dbError) {
        throw new Error("Unable to fetch faculty profile");
      }

      if (!facultyData) {
        await supabase.auth.signOut();
        throw new Error(
          "Faculty profile not found. Ensure faculty.id matches auth user id."
        );
      }

      localStorage.setItem("faculty", JSON.stringify(facultyData));

      navigate("/faculty/dashboard");
    } catch (err) {
      console.error("Faculty login error:", err);
      alert(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    if (!resetEmail.trim()) {
      alert("Please enter your email");
      return;
    }

    const newPassword = prompt(
      "Enter your new password (minimum 6 characters)"
    );

    if (!newPassword) return;

    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    setResetLoading(true);

    try {
      const BASE_URL = (
        import.meta.env.VITE_API_URL || "http://localhost:5000"
      ).replace(/\/$/, "");

      const response = await fetch(`${BASE_URL}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: resetEmail.trim().toLowerCase(),
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Reset failed");
      }

      alert("Password updated successfully");
      setShowForgotPassword(false);
      setResetEmail("");
    } catch (err) {
      console.error("Reset password error:", err);
      alert(err.message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="w-full h-screen flex overflow-hidden">
      {/* LEFT PANEL - LOGIN FORM */}
      <div className="w-full lg:w-1/2 flex flex-col bg-white overflow-y-auto">
        <div className="flex-1 px-8 sm:px-16 py-8">
          <div className="max-w-[480px] mx-auto">
            {/* HEADER */}
            <div className="flex items-center justify-between mb-20">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <img
                  src={oulogo}
                  alt="OU Logo"
                  className="w-12 h-12 rounded-lg"
                />
                <div className="text-left">
                  <p className="text-lg font-bold text-gray-900">LMS · Osmania University</p>
                </div>
              </button>
            </div>

            {!showForgotPassword ? (
              <>
                {/* WELCOME TEXT */}
                <div className="mb-12">
                  <h1 className="text-[40px] font-bold text-gray-900 leading-tight mb-3">
                    Welcome back
                  </h1>
                  <p className="text-base text-gray-600 leading-relaxed">
                    Sign in with your university email.
                  </p>
                </div>

                {/* LOGIN FORM */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* EMAIL */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      University Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        placeholder="you@osmania.ac.in"
                        className="w-full h-14 pl-12 pr-4 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus:bg-white transition-all placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  {/* PASSWORD */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        required
                        placeholder="••••••"
                        className="w-full h-14 pl-12 pr-4 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus:bg-white transition-all placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  {/* FORGOT PASSWORD LINK */}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-blue-600 font-semibold hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  {/* SUBMIT BUTTON */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 rounded-xl bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 text-white font-semibold text-base transition-all disabled:cursor-not-allowed disabled:opacity-70 shadow-sm active:scale-[0.99] mt-2"
                  >
                    {loading ? "Signing in..." : "Sign in"}
                  </button>
                </form>

                {/* NEW HERE LINK */}
                <p className="text-center text-sm text-gray-600 mt-8">
                  New here?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/faculty/signup")}
                    className="font-semibold text-gray-900 hover:underline"
                  >
                    Create an account
                  </button>
                </p>
              </>
            ) : (
              <>
                {/* FORGOT PASSWORD */}
                <div className="mb-12">
                  <h1 className="text-[40px] font-bold text-gray-900 leading-tight mb-3">
                    Forgot Password
                  </h1>
                  <p className="text-base text-gray-600 leading-relaxed">
                    Enter your email to reset your password.
                  </p>
                </div>

                <form onSubmit={handleForgotPassword} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Faculty Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                        placeholder="you@osmania.ac.in"
                        className="w-full h-14 pl-12 pr-4 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus:bg-white transition-all placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full h-14 rounded-xl bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 text-white font-semibold text-base transition-all disabled:cursor-not-allowed disabled:opacity-70 shadow-sm active:scale-[0.99] mt-4"
                  >
                    {resetLoading ? "Updating..." : "Reset Password"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="w-full text-sm text-gray-600 hover:text-gray-900 font-semibold hover:underline mt-4"
                  >
                    ← Back to login
                  </button>
                </form>
              </>
            )}

            {/* FOOTER */}
            <p className="text-center text-xs text-gray-400 mt-16">
              © 2026 LMS · Osmania University
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - ILLUSTRATION */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#2c5282] flex-col">
        {/* TOP SECTION WITH TEXT */}
        <div className="flex-1 flex flex-col justify-center px-12 xl:px-16">
          <div className="max-w-xl">
            <h2 className="text-[48px] font-bold text-white leading-tight mb-6">
              The official LMS for Osmania University.
            </h2>
            <p className="text-lg text-blue-100 leading-relaxed mb-12">
              Lectures, notes, and instant-graded MCQs — all branch-aware.
            </p>

            {/* ILLUSTRATION */}
            <div className="relative w-full max-w-md mx-auto">
              {/* Light blue background container */}
              <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-3xl p-8 relative overflow-visible">
                {/* Video Player Card */}
                <div className="relative bg-[#1e40af] rounded-2xl p-6 shadow-2xl mb-6 overflow-visible">
                  {/* Video screen */}
                  <div className="bg-[#2563eb] rounded-xl h-32 mb-4 relative overflow-hidden">
                    {/* Play button */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-[#06b6d4] rounded-full flex items-center justify-center shadow-lg">
                      <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-white border-b-[8px] border-b-transparent ml-1"></div>
                    </div>

                    {/* Progress bar */}
                    <div className="absolute bottom-3 left-4 right-4">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-white rounded flex items-center justify-center text-[8px] text-blue-600">▶</div>
                        <div className="w-4 h-4 bg-white rounded flex items-center justify-center text-[8px] text-blue-600">❚❚</div>
                        <div className="flex-1 h-1 bg-white/30 rounded-full">
                          <div className="w-1/2 h-full bg-white rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Graduation cap - positioned to overflow */}
                  <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#1e40af] rounded-lg shadow-xl transform rotate-12 flex items-center justify-center">
                    <div className="w-20 h-20 relative">
                      {/* Cap top */}
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-blue-300 rounded-full"></div>
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-4 bg-[#2563eb] transform -skew-y-12 rounded"></div>
                      {/* Cap base */}
                      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-8 h-10 bg-[#1e40af] rounded-t-full border-2 border-blue-300"></div>
                      {/* Tassel */}
                      <div className="absolute top-1 right-2 w-1 h-6 bg-blue-300"></div>
                      <div className="absolute top-6 right-1.5 w-2 h-2 bg-blue-300 rounded-full"></div>
                    </div>
                  </div>
                </div>

                {/* Books Stack - Bottom Left */}
                <div className="absolute -bottom-4 -left-4 flex flex-col gap-1">
                  <div className="w-24 h-8 bg-[#1e40af] rounded-lg shadow-xl transform -rotate-3"></div>
                  <div className="w-28 h-8 bg-[#2563eb] rounded-lg shadow-xl transform rotate-2"></div>
                </div>

                {/* Chat/Message Icon - Left Side */}
                <div className="absolute top-1/3 -left-6 w-16 h-12 bg-[#06b6d4] rounded-2xl shadow-xl flex items-center justify-center">
                  <div className="space-y-1">
                    <div className="h-1.5 w-8 bg-white rounded-full"></div>
                    <div className="h-1.5 w-6 bg-white rounded-full"></div>
                  </div>
                </div>

                {/* Certificate Card - Right Side */}
                <div className="absolute top-1/2 -right-8 w-32 h-40 bg-white rounded-2xl shadow-2xl p-4 transform rotate-6">
                  <div className="text-center">
                    <div className="text-xs font-bold text-gray-800 mb-2">Certificate</div>
                    <div className="w-12 h-12 mx-auto bg-yellow-400 rounded-full flex items-center justify-center mb-2">
                      <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <div className="space-y-1">
                      <div className="h-1 bg-gray-200 rounded"></div>
                      <div className="h-1 bg-gray-200 rounded w-3/4 mx-auto"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM GRADIENT SECTION */}
        <div className="h-32 bg-gradient-to-b from-[#2c5282] to-[#bfdbfe]"></div>
      </div>
    </div>
  );
}