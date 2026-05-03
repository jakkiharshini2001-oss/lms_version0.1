import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  BriefcaseBusiness,
  ChevronDown,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import "../../App.css";

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

    // 🔒 VALIDATION
    if (!form.name || !form.email || !form.employeeId || !form.department || !form.password || !form.confirmPassword) {
      alert("Please fill all fields");
      return;
    }

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const email = form.email.toLowerCase().trim();

    const allowedDomains = [
      "@osmania.ac.in",
      "@uceou.edu",
      "@gmail.com",
    ];

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

      //////////////////////////////////////////////////////
      // 🔐 STEP 1: SIGN UP (UPDATED FORMAT)
      //////////////////////////////////////////////////////

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

      //////////////////////////////////////////////////////
      // 🧠 STEP 2: HANDLE EMAIL CONFIRMATION CASE
      //////////////////////////////////////////////////////

      const user = data.user ?? data.session?.user;

     if (!user) {
  alert("Account already exists or email verification required. Please login.");
  navigate("/faculty/login");
  return;
}

      //////////////////////////////////////////////////////
      // 📊 STEP 3: SAVE FACULTY PROFILE VIA BACKEND
      //////////////////////////////////////////////////////

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

      //////////////////////////////////////////////////////
      // ✅ SUCCESS
      //////////////////////////////////////////////////////

      alert("Account created successfully!");
      navigate("/faculty/login");

    } catch (err) {
      console.error("Signup Error:", err);

    if (err.message?.includes("User already registered")) {
  alert("User already exists. Please login.");
  navigate("/faculty/login");
  return;
}
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#f8f4ee] font-serif">

      {/* LEFT SIDE */}
      <div className="w-full lg:w-1/2 flex justify-center">
        <div className="w-full max-w-[590px] px-10 py-9">

          {/* HEADER */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full border border-[#071b3a] flex items-center justify-center text-[#071b3a] font-bold">
                OU
              </div>
              <h2 className="text-[20px] font-bold text-[#071b3a]">
                LMS · Osmania University
              </h2>
            </div>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-sm text-[#5d5043] hover:text-[#071b3a]"
            >
              ← Back
            </button>
          </div>

          {/* TITLE */}
          <h1 className="text-[34px] font-extrabold text-[#071b3a] mb-2">
            Faculty Registration
          </h1>

          <p className="text-[#5d5043] mb-8">
            Only authorized faculty members can register.
          </p>

          {/* FORM */}
          <form onSubmit={handleSubmit}>

            {/* NAME */}
            <InputField icon={User} name="name" value={form.name} onChange={handleChange} placeholder="Dr. John Doe" label="Name" />

            {/* EMAIL */}
            <InputField icon={Mail} name="email" value={form.email} onChange={handleChange} placeholder="you@uceou.edu" label="Email" type="email" />

            {/* EMPLOYEE ID */}
            <InputField icon={BriefcaseBusiness} name="employeeId" value={form.employeeId} onChange={handleChange} placeholder="EMP12345" label="Employee ID" />

            {/* DEPARTMENT */}
            <div className="mb-5">
              <label className="font-semibold mb-2 block">Department</label>
              <div className="relative">
                <select
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  required
                  className="w-full h-[52px] px-4 border border-[#d8cdbc] bg-[#f8f4ee]"
                >
                  <option value="">Select department</option>
                  {departments.map((dept, i) => (
                    <option key={i}>{dept}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* PASSWORD */}
            <InputField icon={Lock} name="password" value={form.password} onChange={handleChange} placeholder="••••••" label="Password" type="password" />

            {/* CONFIRM PASSWORD */}
            <InputField icon={Lock} name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="••••••" label="Confirm Password" type="password" />

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[55px] bg-[#173f82] text-white font-bold rounded mt-3"
            >
              {loading ? "Creating..." : "Create Account"}
            </button>

            {/* LOGIN */}
            <p className="text-center mt-6">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/faculty/login")}
                className="font-bold text-[#071b3a]"
              >
                Sign in
              </button>
            </p>
          </form>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="hidden lg:flex w-1/2 bg-blue-800 text-white items-center justify-center">
        <h1 className="text-3xl font-bold">Faculty Portal</h1>
      </div>
    </div>
  );
}

/* 🔹 Reusable Input Component */
function InputField({ icon: Icon, label, ...props }) {
  return (
    <div className="mb-5">
      <label className="font-semibold mb-2 block">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          {...props}
          required
          className="w-full h-[52px] pl-10 border border-[#d8cdbc] bg-[#f8f4ee]"
        />
      </div>
    </div>
  );
}