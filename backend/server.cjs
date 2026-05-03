const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

//////////////////////////////////////////////////////
// 📁 LOCAL STORAGE
//////////////////////////////////////////////////////

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use("/uploads", express.static(uploadDir));
const upload = multer({ dest: "uploads/" });

//////////////////////////////////////////////////////
// 🔐 SUPABASE
//////////////////////////////////////////////////////

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

//////////////////////////////////////////////////////
// 🔐 GOOGLE DRIVE AUTH (FIXED FOR PRODUCTION)
//////////////////////////////////////////////////////

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

// ✅ Use refresh token from ENV
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const drive = google.drive({
  version: "v3",
  auth: oauth2Client,
});

//////////////////////////////////////////////////////
// 🚀 GOOGLE DRIVE UPLOAD
//////////////////////////////////////////////////////

async function uploadToDrive(file) {
  const response = await drive.files.create({
    requestBody: {
      name: file.originalname,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
    },
    media: {
      mimeType: file.mimetype,
      body: fs.createReadStream(file.path),
    },
  });

  const fileId = response.data.id;

  await drive.permissions.create({
    fileId,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  });

  return fileId;
}

//////////////////////////////////////////////////////
// 🔥 GET FACULTY NAME
//////////////////////////////////////////////////////

async function getFacultyName(faculty_id) {
  const { data, error } = await supabase
    .from("faculty")
    .select("name")
    .eq("id", faculty_id)
    .single();

  if (error || !data?.name) {
    throw new Error("Faculty name not found");
  }

  return data.name;
}

//////////////////////////////////////////////////////
// 🎯 UPLOAD CONTENT
//////////////////////////////////////////////////////

app.post("/upload-content", upload.single("file"), async (req, res) => {
  try {
    const {
      faculty_id,
      type,
      department,
      year,
      semester,
      subject,
      unit,
      title,
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const faculty_name = await getFacultyName(faculty_id);

    const fileId = await uploadToDrive(req.file);
    fs.unlinkSync(req.file.path);

    // VIDEO
    if (type === "video") {
      const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;

      await supabase.from("videos").insert([
        {
          faculty_id,
          faculty_name,
          department,
          year,
          semester,
          subject,
          unit,
          title,
          file_id: fileId,
          embed_url: embedUrl,
        },
      ]);

      return res.json({ success: true, embedUrl });
    }

    // PDF
    if (type === "pdf") {
      const fileUrl = `https://drive.google.com/uc?id=${fileId}`;

      await supabase.from("pdfs").insert([
        {
          faculty_id,
          faculty_name,
          department,
          year,
          semester,
          subject,
          unit,
          title,
          file_id: fileId,
          file_url: fileUrl,
        },
      ]);

      return res.json({ success: true, fileUrl });
    }

    return res.status(400).json({ error: "Invalid type" });
  } catch (error) {
    console.error("Upload Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

//////////////////////////////////////////////////////
// 📊 ASSESSMENT UPLOAD
//////////////////////////////////////////////////////

app.post("/upload-assessment", upload.single("file"), async (req, res) => {
  try {
    const {
      faculty_id,
      department,
      year,
      semester,
      subject,
      unit,
      title,
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const faculty_name = await getFacultyName(faculty_id);

    const fileId = await uploadToDrive(req.file);
    fs.unlinkSync(req.file.path);

    await supabase.from("assessments").insert([
      {
        faculty_id,
        faculty_name,
        department,
        year,
        semester,
        subject,
        unit,
        title,
        file_id: fileId,
      },
    ]);

    res.json({ success: true });
  } catch (error) {
    console.error("Assessment Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

//////////////////////////////////////////////////////
// 📥 FETCH CONTENT
//////////////////////////////////////////////////////

app.get("/faculty-content/:faculty_id", async (req, res) => {
  const { faculty_id } = req.params;

  const { data: videos } = await supabase
    .from("videos")
    .select("*")
    .eq("faculty_id", faculty_id);

  const { data: pdfs } = await supabase
    .from("pdfs")
    .select("*")
    .eq("faculty_id", faculty_id);

  const { data: assessments } = await supabase
    .from("assessments")
    .select("*")
    .eq("faculty_id", faculty_id);

  res.json({ videos, pdfs, assessments });
});

//////////////////////////////////////////////////////
// 🗑 DELETE
//////////////////////////////////////////////////////

app.delete("/delete-content/:type/:id", async (req, res) => {
  const map = {
    video: "videos",
    pdf: "pdfs",
    assessment: "assessments",
  };

  const table = map[req.params.type];

  await supabase.from(table).delete().eq("id", req.params.id);

  res.json({ success: true });
});

//////////////////////////////////////////////////////
// ❤️ HEALTH CHECK (IMPORTANT FOR RENDER)
//////////////////////////////////////////////////////

app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

//////////////////////////////////////////////////////
// 🚀 START SERVER
//////////////////////////////////////////////////////

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});