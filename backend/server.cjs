const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");
const { createClient } = require("@supabase/supabase-js");
const XLSX = require("xlsx");
const mammoth = require("mammoth");
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
// 🔐 GOOGLE OAUTH
//////////////////////////////////////////////////////

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:5000/oauth2callback";

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const TOKEN_PATH = path.join(__dirname, "token.json");
let drive = null;

function loadSavedToken() {
  if (fs.existsSync(TOKEN_PATH)) {
    const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oauth2Client.setCredentials(tokens);

    drive = google.drive({
      version: "v3",
      auth: oauth2Client,
    });

    console.log("✅ Google Drive connected (saved token)");
  }
}

function authorize() {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/drive"],
  });

  console.log("\n🔐 Open this URL:");
  console.log(authUrl);
}

app.get("/oauth2callback", async (req, res) => {
  try {
    const code = req.query.code;

    const { tokens } = await oauth2Client.getToken(code);
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));

    oauth2Client.setCredentials(tokens);

    drive = google.drive({
      version: "v3",
      auth: oauth2Client,
    });

    console.log("✅ Google Drive connected & token saved");

    res.send("Authorization successful! Close this tab.");
  } catch (err) {
    console.error("OAuth Error:", err);
    res.send("Authorization failed");
  }
});

//////////////////////////////////////////////////////
// 🚀 GOOGLE DRIVE UPLOAD
//////////////////////////////////////////////////////

async function uploadToDrive(file) {
  if (!drive) throw new Error("Drive not authorized yet");

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
// 🔥 GET FACULTY NAME (NEW CORE FIX)
//////////////////////////////////////////////////////

async function getFacultyName(faculty_id) {
  console.log("🔍 Looking up faculty name for ID:", faculty_id);
  
  const { data, error } = await supabase
    .from("faculty")
    .select("name")
    .eq("id", faculty_id)
    .single();

  console.log("📋 Faculty lookup result:", { data, error });

  if (error) {
    console.error("❌ Faculty lookup error:", error);
    throw new Error(`Faculty lookup failed: ${error.message}`);
  }

  if (!data || !data.name) {
    console.error("❌ Faculty name not found for ID:", faculty_id);
    throw new Error(`Faculty name is empty for ID: ${faculty_id}`);
  }

  console.log("✅ Faculty name resolved:", data.name);
  return data.name;
}

//////////////////////////////////////////////////////
// 🎯 UPLOAD CONTENT (VIDEO + PDF)
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

    // 🔥 GET NAME FROM DB
    let faculty_name = "";
    try {
      faculty_name = await getFacultyName(faculty_id);
    } catch (err) {
      console.error("Faculty name resolution failed:", err.message);
      throw new Error(`Cannot resolve faculty name: ${err.message}`);
    }

    console.log("📤 Uploading with faculty_name:", faculty_name);

    const fileId = await uploadToDrive(req.file);
    fs.unlinkSync(req.file.path);

    //////////////////////////////////////////
    // VIDEO
    //////////////////////////////////////////
    if (type === "video") {
      const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
      const videoInsert = {
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
      };
      console.log("📥 Video insert payload:", videoInsert);

      await supabase.from("videos").insert([videoInsert]);

      return res.json({ success: true, embedUrl });
    }

    //////////////////////////////////////////
    // PDF
    //////////////////////////////////////////
    if (type === "pdf") {
      const fileUrl = `https://drive.google.com/uc?id=${fileId}`;
      const pdfInsert = {
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
      };
      console.log("📥 PDF insert payload:", pdfInsert);

      await supabase.from("pdfs").insert([pdfInsert]);

      return res.json({ success: true, fileUrl });
    }

    return res.status(400).json({ error: "Invalid type" });

  } catch (error) {
    console.error("Upload Error:", error.message);
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

    let faculty_name = "";
    try {
      faculty_name = await getFacultyName(faculty_id);
    } catch (err) {
      console.error("Faculty name resolution failed:", err.message);
      throw new Error(`Cannot resolve faculty name: ${err.message}`);
    }

    console.log("📤 Uploading assessment with faculty_name:", faculty_name);

    const fileId = await uploadToDrive(req.file);
    fs.unlinkSync(req.file.path);

    const assessmentInsert = {
      faculty_id,
      faculty_name,
      department,
      year,
      semester,
      subject,
      unit,
      title,
      file_id: fileId,
    };
    console.log("📥 Assessment insert payload:", assessmentInsert);

    await supabase.from("assessments").insert([assessmentInsert]);

    return res.json({
      success: true,
      message: "Assessment uploaded successfully",
    });

  } catch (error) {
    console.error("Assessment Error:", error.message);
    return res.status(500).json({ error: error.message });
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
// 🚀 START SERVER
//////////////////////////////////////////////////////

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  loadSavedToken();

  if (!drive) {
    authorize();
  }
});