const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();

// ===================== MIDDLEWARE =====================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===================== LOCAL STORAGE =====================
const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use("/uploads", express.static(uploadDir));

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 100 * 1024 * 1024 },
});

// ===================== SUPABASE =====================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ===================== GOOGLE AUTH =====================
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const drive = google.drive({
  version: "v3",
  auth: oauth2Client,
});

// ===================== 🔥 CRITICAL FIX =====================
// Force refresh token BEFORE every Drive call
async function refreshToken() {
  try {
    await oauth2Client.getAccessToken();
  } catch (err) {
    console.error("Google Token Refresh Failed:", err.message);
    throw err;
  }
}

// ===================== DRIVE UPLOAD =====================
async function uploadToDrive(file) {
  try {
    await refreshToken();

    const response = await drive.files.create({
      requestBody: {
        name: file.originalname,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
      },
      media: {
        mimeType: file.mimetype || "application/octet-stream",
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
  } catch (err) {
    console.error(
      "🔥 DRIVE UPLOAD ERROR:",
      err?.response?.data || err.message || err
    );
    throw err;
  }
}

// ===================== FACULTY =====================
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

// ===================== UPLOAD CONTENT =====================
app.post("/upload-content", upload.single("file"), async (req, res) => {
  try {
    console.log("UPLOAD HIT");
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

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

    const faculty_name = await getFacultyName(faculty_id);

    const fileId = await uploadToDrive(req.file);

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

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
    console.error("UPLOAD ERROR FULL:", error?.response?.data || error);
    return res.status(500).json({ error: error.message });
  }
});

// ===================== ASSESSMENT =====================
app.post("/upload-assessment", upload.single("file"), async (req, res) => {
  try {
    console.log("ASSESSMENT UPLOAD HIT");
    console.log("FILE:", req.file);

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const {
      faculty_id,
      department,
      year,
      semester,
      subject,
      unit,
      title,
    } = req.body;

    const faculty_name = await getFacultyName(faculty_id);

    const fileId = await uploadToDrive(req.file);

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

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

    return res.json({ success: true });
  } catch (error) {
    console.error("ASSESSMENT ERROR FULL:", error?.response?.data || error);
    return res.status(500).json({ error: error.message });
  }
});

// ===================== RESET PASSWORD =====================
app.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const {
      data: { users },
      error,
    } = await supabase.auth.admin.listUsers();

    if (error) throw error;

    const user = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { error: updateError } =
      await supabase.auth.admin.updateUserById(user.id, {
        password: newPassword,
      });

    if (updateError) throw updateError;

    return res.json({
      success: true,
      message: "Password updated",
    });
  } catch (err) {
    console.error("RESET ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ===================== HEALTH =====================
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// ===================== SERVER =====================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});