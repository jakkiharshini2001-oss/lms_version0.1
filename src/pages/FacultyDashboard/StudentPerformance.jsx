import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";

import { useState } from "react";

export default function StudentPerformance() {
  const [filter, setFilter] = useState({
    subject: "",
    unit: "",
  });

  // Dummy data (later from DB)
  const data = [
    {
      name: "Ravi Kumar",
      subject: "Thermodynamics",
      unit: "Unit 1",
      score: 8,
      total: 10,
    },
    {
      name: "Anita Sharma",
      subject: "Thermodynamics",
      unit: "Unit 1",
      score: 5,
      total: 10,
    },
    {
      name: "Rahul Reddy",
      subject: "Fluid Mechanics",
      unit: "Unit 2",
      score: 9,
      total: 10,
    },
  ];

  const getStatus = (score, total) => {
    const percent = (score / total) * 100;
    return percent >= 50 ? "Pass" : "Retry";
  };

  return (
    <div className="flex h-screen bg-[#f6f8fb]">

      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Topbar />

        <div className="p-6">

          {/* HEADER */}
          <h1 className="text-2xl font-semibold text-gray-800 mb-6">
            Student Performance
          </h1>

          {/* FILTERS */}
          <div className="bg-white border rounded-xl p-4 mb-6 flex gap-4">

            <input
              placeholder="Search subject..."
              className="border px-3 py-2 rounded-lg w-1/3"
              onChange={(e) =>
                setFilter({ ...filter, subject: e.target.value })
              }
            />

            <input
              placeholder="Search unit..."
              className="border px-3 py-2 rounded-lg w-1/3"
              onChange={(e) =>
                setFilter({ ...filter, unit: e.target.value })
              }
            />

          </div>

          {/* TABLE */}
          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">

            {/* HEADER */}
            <div className="grid grid-cols-5 bg-gray-50 px-5 py-3 text-sm font-semibold text-gray-600">
              <span>Student</span>
              <span>Subject</span>
              <span>Unit</span>
              <span>Score</span>
              <span>Status</span>
            </div>

            {/* DATA */}
            {data
              .filter((item) => {
                return (
                  (filter.subject === "" ||
                    item.subject
                      .toLowerCase()
                      .includes(filter.subject.toLowerCase())) &&
                  (filter.unit === "" ||
                    item.unit
                      .toLowerCase()
                      .includes(filter.unit.toLowerCase()))
                );
              })
              .map((item, index) => {
                const status = getStatus(item.score, item.total);

                return (
                  <div
                    key={index}
                    className="grid grid-cols-5 px-5 py-4 border-t text-sm items-center"
                  >
                    <span className="font-medium text-gray-800">
                      {item.name}
                    </span>

                    <span className="text-gray-600">
                      {item.subject}
                    </span>

                    <span className="text-gray-600">
                      {item.unit}
                    </span>

                    <span className="text-gray-700">
                      {item.score}/{item.total}
                    </span>

                    <span
                      className={`font-medium ${
                        status === "Pass"
                          ? "text-green-600"
                          : "text-red-500"
                      }`}
                    >
                      {status}
                    </span>
                  </div>
                );
              })}

          </div>

        </div>
      </div>
    </div>
  );
}