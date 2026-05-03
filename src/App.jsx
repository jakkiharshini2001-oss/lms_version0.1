import { BrowserRouter, Routes, Route } from "react-router-dom";

import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";

import HomePage from "./pages/HomePage/HomePage";
import FacultySignup from "./pages/auth/FacultySignup";
import FacultyLogin from "./pages/auth/FacultyLogin";

import FacultyDashboard from "./pages/FacultyDashboard/FacultyDashboard";
import ContentUpload from "./pages/FacultyDashboard/ContentUpload";
import MySubjects from "./pages/FacultyDashboard/MySubjects";

// 👉 (create these next / or keep placeholders for now)
import SubjectDetail from "./pages/FacultyDashboard/SubjectDetail";
import ContentLibrary from "./pages/FacultyDashboard/ContentLibrary";
import StudentPerformance from "./pages/FacultyDashboard/StudentPerformance";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* PUBLIC HOME */}
        <Route
          path="/"
          element={
            <>
              <Header />
              <main className="main-content">
                <HomePage />
              </main>
              <Footer />
            </>
          }
        />

        {/* AUTH */}
        <Route path="/faculty/signup" element={<FacultySignup />} />
        <Route path="/faculty/login" element={<FacultyLogin />} />

        {/* DASHBOARD */}
        <Route path="/faculty/dashboard" element={<FacultyDashboard />} />

        {/* SUBJECT STRUCTURE */}
        <Route path="/faculty/subjects" element={<MySubjects />} />
        <Route path="/faculty/subject/:name" element={<SubjectDetail />} />

        {/* CONTENT */}
        <Route path="/faculty/upload" element={<ContentUpload />} />
        <Route path="/faculty/content" element={<ContentLibrary />} />

        {/* PERFORMANCE */}
        <Route path="/faculty/performance" element={<StudentPerformance />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;