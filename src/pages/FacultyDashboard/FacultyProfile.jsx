import React, { useEffect, useRef, useState } from "react";
import {
  User,
  Mail,
  Building2,
  Briefcase,
  Shield,
  Lock,
  Clock3,
  BookOpen,
  LogOut,
  Save,
  Camera,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

const FacultyProfile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [facultyId, setFacultyId] = useState(null);

  const [profile, setProfile] = useState({
    name: "",
    employee_id: "",
    email: "",
    department: "",
    phone: "",
    designation: "",
    qualification: "",
    experience: "",
    profile_photo: "",
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState({ type: "", text: "" }); // type: "success" | "error"

  const [activityLog, setActivityLog] = useState([
    {
      action: "Logged into faculty portal",
      time: "Current session",
    },
    {
      action: "Profile settings accessed",
      time: "Now",
    },
  ]);

  const assignedSubjects = [];
  const assignedYears = [];
  const assignedSemesters = [];

  useEffect(() => {
    fetchFacultyProfile();
  }, []);

  const fetchFacultyProfile = async () => {
    try {
      const storedFaculty = localStorage.getItem("faculty");

      if (!storedFaculty) {
        navigate("/faculty/login");
        return;
      }

      const facultyData = JSON.parse(storedFaculty);

      const { data, error } = await supabase
        .from("faculty")
        .select("*")
        .eq("email", facultyData.email)
        .single();

      if (error) {
        console.error("Fetch error:", error);
        alert(error.message);
        return;
      }

      setFacultyId(data.id);

      setProfile({
        name: data.name || "",
        employee_id: data.employee_id || "",
        email: data.email || "",
        department: data.department || "",
        phone: data.phone || "",
        designation: data.designation || "",
        qualification: data.qualification || "",
        experience: data.experience || "",
        profile_photo: data.profile_photo || "",
      });
    } catch (err) {
      console.error(err);
      alert("Failed to load faculty profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    setProfile((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handlePasswordChange = (e) => {
    setPasswords((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handlePhotoUpload = async (event) => {
    try {
      const file = event.target.files[0];

      if (!file || !facultyId) return;

      const fileExt = file.name.split(".").pop();
      const filePath = `${facultyId}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("faculty-profile-photos")
        .upload(filePath, file, {
          upsert: true,
        });

      if (uploadError) {
        console.error(uploadError);
        alert(uploadError.message);
        return;
      }

      const { data } = supabase.storage
        .from("faculty-profile-photos")
        .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;

      const { error: updateError } = await supabase
        .from("faculty")
        .update({
          profile_photo: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", facultyId);

      if (updateError) {
        console.error(updateError);
        alert(updateError.message);
        return;
      }

      setProfile((prev) => ({
        ...prev,
        profile_photo: publicUrl,
      }));

      setActivityLog((prev) => [
        {
          action: "Updated profile photo",
          time: new Date().toLocaleString(),
        },
        ...prev,
      ]);

      alert("Profile photo updated successfully.");
    } catch (err) {
      console.error(err);
      alert("Photo upload failed.");
    }
  };

  const handleSaveProfile = async () => {
    try {
      if (!facultyId) {
        alert("Faculty ID not found.");
        return;
      }

      const { data, error } = await supabase
        .from("faculty")
        .update({
          name: profile.name,
          phone: profile.phone,
          designation: profile.designation,
          qualification: profile.qualification,
          experience: profile.experience,
          updated_at: new Date().toISOString(),
        })
        .eq("id", facultyId)
        .select();

      if (error) {
        console.error("Update error:", error);
        alert(error.message);
        return;
      }

      console.log("Updated faculty:", data);

      const updatedFaculty = {
        ...JSON.parse(localStorage.getItem("faculty")),
        name: profile.name,
        phone: profile.phone,
      };

      localStorage.setItem("faculty", JSON.stringify(updatedFaculty));

      setActivityLog((prev) => [
        {
          action: "Updated profile information",
          time: new Date().toLocaleString(),
        },
        ...prev,
      ]);

      alert("Profile updated successfully.");

      fetchFacultyProfile();
    } catch (err) {
      console.error(err);
      alert("Update failed.");
    }
  };

  const handlePasswordUpdate = async () => {
    setPwdMsg({ type: "", text: "" });

    if (
      !passwords.currentPassword ||
      !passwords.newPassword ||
      !passwords.confirmPassword
    ) {
      setPwdMsg({ type: "error", text: "Please fill all password fields." });
      return;
    }

    if (passwords.newPassword.length < 6) {
      setPwdMsg({ type: "error", text: "New password must be at least 6 characters." });
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPwdMsg({ type: "error", text: "New passwords do not match." });
      return;
    }

    try {
      setPwdLoading(true);

      // Step 1: Re-authenticate to verify the current password is correct
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: passwords.currentPassword,
      });

      if (signInError) {
        setPwdMsg({ type: "error", text: "Current password is incorrect." });
        return;
      }

      // Step 2: Update to the new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwords.newPassword,
      });

      if (updateError) {
        setPwdMsg({ type: "error", text: updateError.message || "Password update failed." });
        return;
      }

      // Success
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPwdMsg({ type: "success", text: "Password updated successfully!" });

      setActivityLog((prev) => [
        { action: "Password updated successfully", time: new Date().toLocaleString() },
        ...prev,
      ]);
    } catch (err) {
      console.error("Password update error:", err);
      setPwdMsg({ type: "error", text: err.message || "Something went wrong." });
    } finally {
      setPwdLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("faculty");
    sessionStorage.clear();
    navigate("/faculty/login");
  };

  const handleBack = () => {
    navigate("/faculty/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg font-semibold">
        Loading faculty profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] p-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-[#0f172a]">
            Profile Settings
          </h1>
          <p className="text-gray-500 mt-2">
            Manage your faculty profile, academic details, and account settings.
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* LEFT PROFILE CARD */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sticky top-6">
            <div className="flex flex-col items-center">
              <div className="relative">
                {profile.profile_photo ? (
                  <img
                    src={profile.profile_photo}
                    alt="Faculty"
                    className="w-28 h-28 rounded-full object-cover border"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-blue-100 flex items-center justify-center">
                    <User size={48} className="text-blue-600" />
                  </div>
                )}

                <button
                  onClick={() => fileInputRef.current.click()}
                  className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700"
                >
                  <Camera size={16} />
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>

              <h2 className="text-2xl font-bold mt-4">{profile.name}</h2>
              <p className="text-gray-500">{profile.employee_id}</p>

              <div className="mt-6 space-y-4 w-full">
                <InfoRow
                  icon={<Building2 size={18} />}
                  text={profile.department}
                />
                <InfoRow
                  icon={<Briefcase size={18} />}
                  text={profile.designation || "Faculty"}
                />
                <InfoRow
                  icon={<Mail size={18} />}
                  text={profile.email}
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div className="xl:col-span-3 space-y-6">
          {/* PROFILE INFO */}
          <SectionCard title="Profile Information" icon={<User size={20} />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputField
                label="Full Name"
                name="name"
                value={profile.name}
                onChange={handleProfileChange}
              />

              <InputField
                label="Employee ID"
                value={profile.employee_id}
                readOnly
              />

              <InputField
                label="Official Email"
                value={profile.email}
                readOnly
              />

              <InputField
                label="Phone Number"
                name="phone"
                value={profile.phone}
                onChange={handleProfileChange}
              />

              <InputField
                label="Department"
                value={profile.department}
                readOnly
              />

              <InputField
                label="Designation"
                name="designation"
                value={profile.designation}
                onChange={handleProfileChange}
              />

              <InputField
                label="Qualification"
                name="qualification"
                value={profile.qualification}
                onChange={handleProfileChange}
              />

              <InputField
                label="Experience"
                name="experience"
                value={profile.experience}
                onChange={handleProfileChange}
              />
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveProfile}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2"
              >
                <Save size={18} />
                Save Changes
              </button>
            </div>
          </SectionCard>

          {/* TEACHING ASSIGNMENTS */}
          <SectionCard title="Teaching Assignments" icon={<BookOpen size={20} />}>
            <AssignmentGroup title="Assigned Subjects" items={assignedSubjects} />
            <AssignmentGroup title="Assigned Years" items={assignedYears} />
            <AssignmentGroup
              title="Assigned Semesters"
              items={assignedSemesters}
            />
          </SectionCard>

          {/* ACCOUNT SECURITY */}
          <SectionCard title="Account Security" icon={<Shield size={20} />}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <InputField
                label="Current Password"
                type="password"
                name="currentPassword"
                value={passwords.currentPassword}
                onChange={handlePasswordChange}
              />

              <InputField
                label="New Password"
                type="password"
                name="newPassword"
                value={passwords.newPassword}
                onChange={handlePasswordChange}
              />

              <InputField
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                value={passwords.confirmPassword}
                onChange={handlePasswordChange}
              />
            </div>

            <div className="mt-6 flex flex-col gap-3">
              {pwdMsg.text && (
                <div
                  className={`px-4 py-3 rounded-xl text-sm font-medium ${
                    pwdMsg.type === "success"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {pwdMsg.type === "success" ? "✅ " : "⚠️ "}{pwdMsg.text}
                </div>
              )}
              <div>
                <button
                  onClick={handlePasswordUpdate}
                  disabled={pwdLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all"
                >
                  <Lock size={18} />
                  {pwdLoading ? "Updating…" : "Update Password"}
                </button>
              </div>
            </div>
          </SectionCard>

          {/* ACTIVITY LOG */}
          <SectionCard title="Activity Log" icon={<Clock3 size={20} />}>
            <div className="space-y-4">
              {activityLog.map((item, index) => (
                <div
                  key={index}
                  className="border border-gray-100 rounded-2xl p-4 bg-gray-50"
                >
                  <p className="font-medium">{item.action}</p>
                  <p className="text-sm text-gray-500 mt-1">{item.time}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

const SectionCard = ({ title, icon, children }) => (
  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
    <div className="flex items-center gap-3 mb-6">
      <div className="bg-blue-50 p-2 rounded-xl text-blue-600">{icon}</div>
      <h2 className="text-xl font-bold">{title}</h2>
    </div>
    {children}
  </div>
);

const InputField = ({
  label,
  name,
  value,
  onChange,
  readOnly = false,
  type = "text",
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label}
    </label>
    <input
      type={type}
      name={name}
      value={value || ""}
      onChange={onChange}
      readOnly={readOnly}
      className={`w-full px-4 py-3 rounded-xl border ${
        readOnly ? "bg-gray-100 text-gray-500" : "bg-white"
      } border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500`}
    />
  </div>
);

const InfoRow = ({ icon, text }) => (
  <div className="flex items-center gap-3 text-gray-600">
    <div className="text-blue-600">{icon}</div>
    <span>{text}</span>
  </div>
);

const AssignmentGroup = ({ title, items }) => (
  <div className="mb-6">
    <h3 className="font-semibold mb-3">{title}</h3>
    <div className="flex flex-wrap gap-3">
      {items.length > 0 ? (
        items.map((item, index) => (
          <span
            key={index}
            className="px-4 py-2 rounded-full bg-blue-50 text-blue-700 font-medium text-sm"
          >
            {item}
          </span>
        ))
      ) : (
        <span className="text-gray-400">No assignments available</span>
      )}
    </div>
  </div>
);

export default FacultyProfile;