const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();
console.log("REFRESH TOKEN:", process.env.GOOGLE_REFRESH_TOKEN);

const app = express();

// ✅ FIX 1: ADD BOTH BODY PARSERS
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
  } catch (err) {
    console.error("Drive Upload Error:", err);
    throw err;
  }
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
    console.log("UPLOAD HIT ✅");
    console.log("BODY:", req.body);

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
    console.error("UPLOAD ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
});

//////////////////////////////////////////////////////
// 📊 ASSESSMENT UPLOAD
//////////////////////////////////////////////////////

app.post("/upload-assessment", upload.single("file"), async (req, res) => {
  try {
    console.log("ASSESSMENT UPLOAD HIT ✅");

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

    return res.json({ success: true });
  } catch (error) {
    console.error("ASSESSMENT ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
});

//////////////////////////////////////////////////////
// 🔐 RESET PASSWORD (DUMMY EMAIL SUPPORT)
//////////////////////////////////////////////////////

app.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        error: "Email and new password required",
      });
    }

    //////////////////////////////////////////////////////
    // FIND USER
    //////////////////////////////////////////////////////

    const {
      data: { users },
      error: listError,
    } = await supabase.auth.admin.listUsers();

    if (listError) {
      throw listError;
    }

    const user = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      return res.status(404).json({
        error: "Faculty account not found",
      });
    }

    //////////////////////////////////////////////////////
    // UPDATE PASSWORD
    //////////////////////////////////////////////////////

    const { error: updateError } =
      await supabase.auth.admin.updateUserById(user.id, {
        password: newPassword,
      });

    if (updateError) {
      throw updateError;
    }

    return res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);

    return res.status(500).json({
      error: err.message,
    });
  }
});

//////////////////////////////////////////////////////
// ❤️ HEALTH CHECK
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