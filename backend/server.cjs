const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

console.log("=== SERVER STARTUP ===");
console.log("REFRESH TOKEN present:", !!process.env.GOOGLE_REFRESH_TOKEN);
console.log("CLIENT ID present:", !!process.env.GOOGLE_CLIENT_ID);
console.log("CLIENT SECRET present:", !!process.env.GOOGLE_CLIENT_SECRET);
console.log("DRIVE FOLDER ID present:", !!process.env.GOOGLE_DRIVE_FOLDER_ID);
console.log("SUPABASE URL present:", !!process.env.SUPABASE_URL);
console.log("SUPABASE SERVICE KEY present:", !!process.env.SUPABASE_SERVICE_KEY);

const app = express();

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
// 🔐 GOOGLE DRIVE AUTH
//////////////////////////////////////////////////////

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

//////////////////////////////////////////////////////
// 🚀 GOOGLE DRIVE UPLOAD
//////////////////////////////////////////////////////

async function uploadToDrive(file) {
  try {
    console.log("uploadToDrive: starting for file:", file.originalname);

    // Test token refresh before uploading
    const tokenResponse = await oauth2Client.getAccessToken();
    console.log("uploadToDrive: access token obtained:", !!tokenResponse.token);

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
    console.log("uploadToDrive: file created with ID:", fileId);

    await drive.permissions.create({
      fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    console.log("uploadToDrive: permissions set for fileId:", fileId);
    return fileId;

  } catch (err) {
    console.error("uploadToDrive ERROR:", err.message);
    console.error("uploadToDrive ERROR code:", err.code);
    console.error("uploadToDrive ERROR status:", err.status);
    if (err.response?.data) {
      console.error("uploadToDrive ERROR response data:", JSON.stringify(err.response.data));
    }
    throw err;
  }
}

//////////////////////////////////////////////////////
// 🔥 GET FACULTY NAME
//////////////////////////////////////////////////////

async function getFacultyName(faculty_id) {
  console.log("getFacultyName: looking up faculty_id:", faculty_id);

  const { data, error } = await supabase
    .from("faculty")
    .select("name")
    .eq("id", faculty_id)
    .single();

  if (error) {
    console.error("getFacultyName ERROR:", error.message, "code:", error.code);
    throw new Error("Faculty name not found: " + error.message);
  }

  if (!data?.name) {
    console.error("getFacultyName: no name found for faculty_id:", faculty_id);
    throw new Error("Faculty name is empty for id: " + faculty_id);
  }

  console.log("getFacultyName: found name:", data.name);
  return data.name;
}

//////////////////////////////////////////////////////
// 🎯 UPLOAD CONTENT
//////////////////////////////////////////////////////

app.post("/upload-content", upload.single("file"), async (req, res) => {
  console.log("\n=== /upload-content HIT ===");
  console.log("Body:", req.body);
  console.log("File:", req.file ? { name: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype } : "NO FILE");

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
      console.error("upload-content: no file in request");
      return res.status(400).json({ error: "No file uploaded" });
    }

    if (!faculty_id) {
      console.error("upload-content: missing faculty_id");
      return res.status(400).json({ error: "faculty_id is required" });
    }

    if (!type) {
      console.error("upload-content: missing type");
      return res.status(400).json({ error: "type is required" });
    }

    let faculty_name;
    try {
      faculty_name = await getFacultyName(faculty_id);
    } catch (err) {
      // Clean up temp file
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(500).json({ error: "Faculty lookup failed: " + err.message });
    }

    let fileId;
    try {
      fileId = await uploadToDrive(req.file);
    } catch (err) {
      // Clean up temp file
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(500).json({ error: "Google Drive upload failed: " + err.message });
    }

    // Clean up temp file after successful upload
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    if (type === "video") {
      const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;

      const { error: dbError } = await supabase.from("videos").insert([{
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

      if (dbError) {
        console.error("upload-content: videos insert error:", dbError.message);
        return res.status(500).json({ error: "Database insert failed: " + dbError.message });
      }

      console.log("upload-content: video inserted successfully");
      return res.json({ success: true, embedUrl });
    }

    if (type === "pdf") {
      const fileUrl = `https://drive.google.com/uc?id=${fileId}`;

      const { error: dbError } = await supabase.from("pdfs").insert([{
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

      if (dbError) {
        console.error("upload-content: pdfs insert error:", dbError.message);
        return res.status(500).json({ error: "Database insert failed: " + dbError.message });
      }

      console.log("upload-content: pdf inserted successfully");
      return res.json({ success: true, fileUrl });
    }

    return res.status(400).json({ error: "Invalid type: " + type });

  } catch (error) {
    console.error("upload-content UNHANDLED ERROR:", error.message);
    console.error("Stack:", error.stack);

    // Clean up temp file if still exists
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
    }

    return res.status(500).json({ error: error.message || "Unknown server error" });
  }
});

//////////////////////////////////////////////////////
// 📊 ASSESSMENT UPLOAD
//////////////////////////////////////////////////////

app.post("/upload-assessment", upload.single("file"), async (req, res) => {
  console.log("\n=== /upload-assessment HIT ===");
  console.log("Body:", req.body);
  console.log("File:", req.file ? { name: req.file.originalname, size: req.file.size } : "NO FILE");

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

    let faculty_name;
    try {
      faculty_name = await getFacultyName(faculty_id);
    } catch (err) {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(500).json({ error: "Faculty lookup failed: " + err.message });
    }

    let fileId;
    try {
      fileId = await uploadToDrive(req.file);
    } catch (err) {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(500).json({ error: "Google Drive upload failed: " + err.message });
    }

    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    const { error: dbError } = await supabase.from("assessments").insert([{
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

    if (dbError) {
      console.error("upload-assessment: insert error:", dbError.message);
      return res.status(500).json({ error: "Database insert failed: " + dbError.message });
    }

    console.log("upload-assessment: inserted successfully");
    return res.json({ success: true });

  } catch (error) {
    console.error("upload-assessment UNHANDLED ERROR:", error.message);
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
    }
    return res.status(500).json({ error: error.message || "Unknown server error" });
  }
});

//////////////////////////////////////////////////////
// 🔐 RESET PASSWORD
//////////////////////////////////////////////////////

app.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ error: "Email and new password required" });
    }

    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(404).json({ error: "Faculty account not found" });
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });

    if (updateError) throw updateError;

    return res.json({ success: true, message: "Password updated successfully" });

  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
});

//////////////////////////////////////////////////////
// ❤️ HEALTH CHECK — shows env var status
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
  console.log(`Server running on port ${PORT}`);
});
