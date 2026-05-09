import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
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
    <div className="min-h-screen w-full flex font-sans">
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-between bg-white px-10 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={oulogo} alt="OU Logo" className="w-12 h-12 rounded-xl" />

            <div>
              <h2 className="text-[20px] font-bold text-gray-900">LMS</h2>
              <p className="text-[13px] text-gray-500">Osmania University</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            ← Back
          </button>
        </div>

        <div className="w-full max-w-[420px] mx-auto">
          {!showForgotPassword ? (
            <>
              <h1 className="text-[38px] font-extrabold text-gray-900 leading-tight mb-2">
                Welcome back
              </h1>

              <p className="text-[15px] text-gray-500 mb-10">
                Sign in with your faculty email to continue.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                      placeholder="faculty@osmania.ac.in"
                      className="w-full h-[50px] pl-11 pr-4 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                      placeholder="Enter password"
                      className="w-full h-[50px] pl-11 pr-4 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div className="flex justify-end mb-7">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-blue-600 font-medium hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[52px] bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl font-semibold text-[15px] transition shadow-lg shadow-blue-200"
                >
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-[36px] font-extrabold text-gray-900 leading-tight mb-2">
                Forgot Password
              </h1>

              <form onSubmit={handleForgotPassword}>
                <div className="mb-7">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Faculty Email
                  </label>

                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      placeholder="faculty@osmania.ac.in"
                      className="w-full h-[50px] pl-11 pr-4 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full h-[52px] bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl font-semibold text-[15px]"
                >
                  {resetLoading ? "Updating..." : "Reset Password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}