import React, { useState } from "react";
import {
  Bell,
  Mail,
  Shield,
  BookOpen,
  MessageSquare,
  ClipboardCheck,
  Settings,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const FacultyNotifications = () => {
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    quizAlerts: true,
    assignmentAlerts: true,
    studentMessages: true,
    contentUpdates: true,
    securityAlerts: true,
    emailNotifications: true,
    systemAnnouncements: true,
  });

  const notifications = [
    {
      title: "Quiz Attempt Completed",
      message: "A student completed the DBMS Quiz assessment.",
      time: "10 minutes ago",
      icon: ClipboardCheck,
    },
    {
      title: "New Student Message",
      message: "You received a question from a student in Operating Systems.",
      time: "35 minutes ago",
      icon: MessageSquare,
    },
    {
      title: "Assignment Submitted",
      message: "A new assignment submission was received for Data Structures.",
      time: "1 hour ago",
      icon: BookOpen,
    },
    {
      title: "Security Alert",
      message: "A login was detected from a new browser session.",
      time: "Today • 8:20 AM",
      icon: Shield,
    },
    {
      title: "System Announcement",
      message: "LMS maintenance scheduled for tonight.",
      time: "Yesterday",
      icon: Settings,
    },
  ];

  const toggleSetting = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleBack = () => {
    navigate("/faculty/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#f7f8fc] p-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-[#0f172a]">Notifications</h1>
          <p className="text-gray-500 mt-2">
            Manage notification preferences and view recent updates.
          </p>
        </div>

        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium w-fit"
        >
          <ArrowLeft size={18} />
          Back
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LEFT SETTINGS */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sticky top-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-50 p-3 rounded-xl">
                <Bell size={22} className="text-blue-600" />
              </div>

              <h2 className="text-xl font-bold text-[#0f172a]">
                Notification Settings
              </h2>
            </div>

            <div className="space-y-5">
              <ToggleItem
                label="Quiz Alerts"
                checked={settings.quizAlerts}
                onChange={() => toggleSetting("quizAlerts")}
              />

              <ToggleItem
                label="Assignment Alerts"
                checked={settings.assignmentAlerts}
                onChange={() => toggleSetting("assignmentAlerts")}
              />

              <ToggleItem
                label="Student Messages"
                checked={settings.studentMessages}
                onChange={() => toggleSetting("studentMessages")}
              />

              <ToggleItem
                label="Content Updates"
                checked={settings.contentUpdates}
                onChange={() => toggleSetting("contentUpdates")}
              />

              <ToggleItem
                label="Security Alerts"
                checked={settings.securityAlerts}
                onChange={() => toggleSetting("securityAlerts")}
              />

              <ToggleItem
                label="Email Notifications"
                checked={settings.emailNotifications}
                onChange={() => toggleSetting("emailNotifications")}
              />

              <ToggleItem
                label="System Announcements"
                checked={settings.systemAnnouncements}
                onChange={() => toggleSetting("systemAnnouncements")}
              />
            </div>
          </div>
        </div>

        {/* RIGHT NOTIFICATIONS */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-50 p-3 rounded-xl">
                <Mail size={22} className="text-blue-600" />
              </div>

              <h2 className="text-xl font-bold text-[#0f172a]">
                Recent Notifications
              </h2>
            </div>

            <div className="space-y-4">
              {notifications.map((item, index) => {
                const Icon = item.icon;

                return (
                  <div
                    key={index}
                    className="border border-gray-100 rounded-2xl p-5 hover:shadow-sm transition"
                  >
                    <div className="flex items-start gap-4">
                      <div className="bg-blue-50 p-3 rounded-xl">
                        <Icon size={20} className="text-blue-600" />
                      </div>

                      <div className="flex-1">
                        <h3 className="font-semibold text-[#0f172a]">
                          {item.title}
                        </h3>

                        <p className="text-gray-600 mt-1 text-sm">
                          {item.message}
                        </p>

                        <p className="text-xs text-gray-400 mt-2">
                          {item.time}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ToggleItem = ({ label, checked, onChange }) => {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-700 font-medium">{label}</span>

      <button
        onClick={onChange}
        className={`w-14 h-8 rounded-full transition relative ${
          checked ? "bg-blue-600" : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition ${
            checked ? "right-1" : "left-1"
          }`}
        />
      </button>
    </div>
  );
};

export default FacultyNotifications;