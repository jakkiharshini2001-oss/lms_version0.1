import React from 'react';
import './Courses.css';

const CoursesPage = () => {
  return (
    <div className="courses-page">
      <h1>Courses</h1>
      <p>This page will contain:</p>
      <ul>
        <li>Course Catalog</li>
        <li>Course Filters and Search</li>
        <li>Course Details</li>
        <li>Enrollment System</li>
        <li>Instructor Information</li>
        <li>Course Reviews and Ratings</li>
      </ul>
      <p style={{ marginTop: '2rem', color: '#666' }}>Coming Soon...</p>
    </div>
  );
};

export default CoursesPage;
