const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();

console.log("=== SERVER STARTUP ===");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
// 🔐 GOOGLE AUTH (STABLE CONFIG)
//////////////////////////////////////////////////////

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);

// Force refresh token load
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const drive = google.drive({
  version: "v3",
  auth: oauth2Client,
});

//////////////////////////////////////////////////////
// 🧪 TEST ROUTE (VERY IMPORTANT)
//////////////////////////////////////////////////////

app.get("/test-drive", async (req, res) => {
  try {
    const token = await oauth2Client.getAccessToken();
    res.json({
      ok: true,
      accessTokenWorking: !!token?.token,
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
});

//////////////////////////////////////////////////////
// 🚀 DRIVE UPLOAD (FIXED & SAFE)
//////////////////////////////////////////////////////

async function uploadToDrive(file) {
  try {
    console.log("Uploading:", file.originalname);

    // FORCE TOKEN REFRESH (CRITICAL FIX)
    const tokenResponse = await oauth2Client.getAccessToken();

    if (!tokenResponse || !tokenResponse.token) {
      throw new Error("Google refresh token invalid or expired");
    }

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

    console.log("UPLOAD SUCCESS:", fileId);
    return fileId;

  } catch (err) {
    console.error("🔥 DRIVE ERROR:", err.response?.data || err.message);
    throw err;
  }
}

//////////////////////////////////////////////////////
// 🔥 SUPABASE HELPERS
//////////////////////////////////////////////////////

async function getFacultyName(faculty_id) {
  const { data, error } = await supabase
    .from("faculty")
    .select("name")
    .eq("id", faculty_id)
    .single();

  if (error || !data?.name) {
    throw new Error("Faculty not found");
  }

  return data.name;
}

//////////////////////////////////////////////////////
// 🎯 UPLOAD CONTENT
//////////////////////////////////////////////////////

app.post("/upload-content", upload.single("file"), async (req, res) => {
  try {
    console.log("UPLOAD HIT");

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

    if (type === "video") {
      const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;

      await supabase.from("videos").insert([{
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
      }]);

      return res.json({ success: true, embedUrl });
    }

    if (type === "pdf") {
      const fileUrl = `https://drive.google.com/uc?id=${fileId}`;

      await supabase.from("pdfs").insert([{
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
      }]);

      return res.json({ success: true, fileUrl });
    }

    return res.status(400).json({ error: "Invalid type" });

  } catch (error) {
    console.error("UPLOAD ERROR:", error.message);
    return res.status(500).json({ error: error.message });
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

    await supabase.from("assessments").insert([{
      faculty_id,
      faculty_name,
      department,
      year,
      semester,
      subject,
      unit,
      title,
      file_id: fileId,
    }]);

    return res.json({ success: true });

  } catch (error) {
    console.error("ASSESSMENT ERROR:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

//////////////////////////////////////////////////////
// ❤️ HEALTH CHECK
//////////////////////////////////////////////////////

app.get("/", (req, res) => {
  res.json({
    status: "running",
    env: {
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
      GOOGLE_REFRESH_TOKEN: !!process.env.GOOGLE_REFRESH_TOKEN,
      GOOGLE_DRIVE_FOLDER_ID: !!process.env.GOOGLE_DRIVE_FOLDER_ID,
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
    }
  });
});

//////////////////////////////////////////////////////
// 🚀 START SERVER
//////////////////////////////////////////////////////

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});