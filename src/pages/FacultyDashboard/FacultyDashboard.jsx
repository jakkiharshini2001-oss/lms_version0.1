import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";

import { Upload, Plus, BookOpen, FileText, ClipboardList, Users } from "lucide-react";
import { stats, subjects, activity } from "../../data/dummyData";

// Assign random images from the public folder to the subjects
const courseImages = [
  "/course_tech.png",
  "/course_group.png",
  "/course_lab.png"
];

export default function FacultyDashboard() {
  return (
    <div className="flex h-screen bg-[#f8f9fc] font-sans">

      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* TOPBAR */}
        <Topbar />

        {/* CONTENT */}
        <div className="p-8 overflow-y-auto">

          {/* HEADER */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-[26px] font-bold text-gray-900 mb-1">
                Welcome back, faculty 👋
              </h1>
              <p className="text-gray-500 text-[14px]">
                Here's what's happening with your courses today.
              </p>
            </div>

            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 bg-white hover:bg-gray-50 font-medium text-[14px] shadow-sm">
                <Upload size={16} className="text-gray-500" />
                Upload Course
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-[14px] shadow-sm shadow-blue-200">
                <Plus size={16} />
                Add Content
              </button>
            </div>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-4 gap-5 mb-10">
            <StatBox title="Total Lectures" value={stats[0].value} trend="+12.4%" trendColor="text-green-600 bg-green-50" iconColor="text-green-600 bg-green-50" icon={<BookOpen size={20} />} />
            <StatBox title="Total Notes" value={stats[1].value} trend="+8.1%" trendColor="text-blue-600 bg-blue-50" iconColor="text-blue-600 bg-blue-50" icon={<FileText size={20} />} />
            <StatBox title="Assessments" value={stats[2].value} trend="+24.8%" trendColor="text-orange-500 bg-orange-50" iconColor="text-orange-500 bg-orange-50" icon={<ClipboardList size={20} />} />
            <StatBox title="Students" value={stats[3].value} trend="+3.2%" trendColor="text-emerald-600 bg-emerald-50" iconColor="text-pink-500 bg-pink-50" icon={<Users size={20} />} />
          </div>

          {/* MY COURSES SECTION */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-[18px] font-bold text-gray-900">My Courses</h2>
                <p className="text-gray-500 text-[13px]">Manage and track your published lectures.</p>
              </div>
              <div className="flex gap-3">
                <select className="border border-gray-200 text-gray-700 text-[13px] font-medium rounded-lg px-3 py-2 outline-none hover:bg-gray-50">
                  <option>Sort by Latest</option>
                  <option>Oldest</option>
                </select>
                <select className="border border-gray-200 text-gray-700 text-[13px] font-medium rounded-lg px-3 py-2 outline-none hover:bg-gray-50">
                  <option>All Category</option>
                  <option>Engineering</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {subjects.map((sub, i) => (
                <SubjectBox key={i} subject={sub} image={courseImages[i % courseImages.length]} />
              ))}
            </div>
          </div>

          {/* BOTTOM ROW */}
          <div className="grid grid-cols-3 gap-6">
            
            {/* LEFT: ACTIVITY */}
            <div className="col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-[18px] font-bold text-gray-900 mb-6">Recent enrollments</h2>

              <div className="flex flex-col gap-0">
                {activity.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-4 border-b border-gray-50 last:border-none">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[13px]">
                        {item.charAt(0)}
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-gray-900">{item.substring(0, 15)}...</p>
                        <p className="text-[12px] text-gray-500">{item}</p>
                      </div>
                    </div>
                    <span className="text-[12px] text-gray-400 font-medium">Just now</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: PROMO CARD */}
            <div className="bg-blue-500 rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden shadow-lg shadow-blue-200">
              <div className="absolute top-0 right-0 p-4 opacity-50">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                </svg>
              </div>

              <div className="relative z-10">
                <h2 className="text-[20px] font-bold text-white mb-2 leading-tight">
                  Upgrade to Educator Pro
                </h2>
                <p className="text-blue-100 text-[13px] leading-relaxed mb-6">
                  Earn 85% revenue, unlock branded certificates and advanced learner analytics.
                </p>
                <button className="bg-white text-gray-900 font-semibold text-[13px] px-5 py-2.5 rounded-lg w-max flex items-center gap-2 hover:bg-gray-50 transition">
                  See plans
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

// 🔷 STAT BOX
function StatBox({ title, value, trend, icon, iconColor, trendColor }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconColor}`}>
          {icon}
        </div>
        <div className={`px-2 py-1 rounded text-[11px] font-bold ${trendColor}`}>
          {trend}
        </div>
      </div>
      <div>
        <h2 className="text-[28px] font-black text-gray-900 leading-none mb-1">{value}</h2>
        <p className="text-gray-400 text-[12px] font-medium">{title}</p>
      </div>
    </div>
  );
}

// 🔷 SUBJECT BOX
function SubjectBox({ subject, image }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-gray-200/50 transition-all flex flex-col group cursor-pointer">
      
      {/* IMAGE */}
      <div className="h-[180px] w-full overflow-hidden relative">
        <img src={image} alt={subject.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
      </div>

      <div className="p-5 flex flex-col flex-1">
        
        {/* TAG & RATING */}
        <div className="flex justify-between items-center mb-3">
          <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-black tracking-wider uppercase rounded">
            Engineering
          </span>
          <div className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-orange-400 fill-current" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-[12px] font-bold text-gray-700">4.8</span>
          </div>
        </div>

        {/* TITLE */}
        <h3 className="font-bold text-gray-900 text-[16px] leading-snug mb-2 flex-1">
          {subject.name}
        </h3>

        {/* META & METRICS */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
          <div className="flex items-center gap-1.5 text-gray-500">
            <Users size={14} />
            <span className="text-[12px] font-semibold">{subject.year}nd Year • Sem {subject.semester}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-blue-600 font-bold text-[14px]">{subject.videos + subject.notes} Items</span>
          </div>
        </div>

      </div>

    </div>
  );
}