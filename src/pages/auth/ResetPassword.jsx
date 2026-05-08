import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!form.password || !form.confirmPassword) {
      alert("Please fill all fields");
      return;
    }

    if (form.password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: form.password,
      });

      if (error) throw error;

      alert("Password updated successfully. Please login again.");

      await supabase.auth.signOut();
      localStorage.removeItem("faculty");

      navigate("/faculty/login");
    } catch (err) {
      console.error(err);
      alert(err.message || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f6f8fb] px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border p-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
          Reset Password
        </h1>

        <p className="text-gray-500 text-sm mb-8">
          Enter your new password below.
        </p>

        <form onSubmit={handleResetPassword}>
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              New Password
            </label>

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="Enter new password"
                className="w-full h-[50px] pl-11 pr-4 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="mb-7">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Confirm Password
            </label>

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm new password"
                className="w-full h-[50px] pl-11 pr-4 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[52px] bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl font-semibold text-[15px] transition shadow-lg shadow-blue-200"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/faculty/login")}
            className="w-full mt-4 h-[50px] border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition"
          >
            Back to Login
          </button>
        </form>
      </div>
    </div>
  );
}