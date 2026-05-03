import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";

import { useState } from "react";

export default function UploadVideo() {
    const [form, setForm] = useState({
        subject: "",
        title: "",
        description: "",
        year: "",
        semester: "",
        file: null,
    });

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setForm({
            ...form,
            [name]: files ? files[0] : value,
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        console.log("Upload Video Data:", form);

        // Backend integration later
    };

    return (
        <div className="flex h-screen bg-[#f6f8fb]">

            {/* SIDEBAR */}
            <Sidebar />

            {/* MAIN */}
            <div className="flex-1 flex flex-col">

                {/* TOPBAR */}
                <Topbar />

                {/* CONTENT */}
                <div className="p-6">

                    {/* HEADER */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-semibold text-gray-800">
                            Upload Lecture Video
                        </h1>
                        <p className="text-gray-500 text-sm">
                            Add new lecture video for your students
                        </p>
                    </div>

                    {/* FORM CARD */}
                    <div className="bg-white rounded-xl shadow-sm border p-6 max-w-3xl">

                        <form onSubmit={handleSubmit} className="space-y-5">

                            {/* SUBJECT */}
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Subject
                                </label>
                                <input
                                    type="text"
                                    name="subject"
                                    placeholder="e.g Thermodynamics"
                                    onChange={handleChange}
                                    className="mt-1 w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            {/* TITLE */}
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    placeholder="Lecture title"
                                    onChange={handleChange}
                                    className="mt-1 w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            {/* DESCRIPTION */}
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    placeholder="Short description..."
                                    onChange={handleChange}
                                    className="mt-1 w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* YEAR + SEM */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">
                                        Year
                                    </label>
                                    <select
                                        name="year"
                                        onChange={handleChange}
                                        className="mt-1 w-full border rounded-lg px-3 py-2"
                                        required
                                    >
                                        <option value="">Select Year</option>
                                        <option>1</option>
                                        <option>2</option>
                                        <option>3</option>
                                        <option>4</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700">
                                        Semester
                                    </label>
                                    <select
                                        name="semester"
                                        onChange={handleChange}
                                        className="mt-1 w-full border rounded-lg px-3 py-2"
                                        required
                                    >
                                        <option value="">Select Semester</option>
                                        <option>1</option>
                                        <option>2</option>
                                    </select>
                                </div>
                            </div>

                            {/* FILE UPLOAD */}
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Upload Video File
                                </label>
                                <input
                                    type="file"
                                    name="file"
                                    accept="video/*"
                                    onChange={handleChange}
                                    className="mt-2 w-full"
                                    required
                                />
                            </div>

                            {/* BUTTON */}
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition"
                            >
                                Upload Video
                            </button>

                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}