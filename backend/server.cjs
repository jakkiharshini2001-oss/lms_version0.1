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
// 🔐 GOOGLE DRIVE AUTH (for PDFs + Assessments)
//////////////////////////////////////////////////////

const driveOAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);

driveOAuth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const drive = google.drive({
  version: "v3",
  auth: driveOAuth2Client,
});

//////////////////////////////////////////////////////
// 🔐 YOUTUBE AUTH (Central LMS YouTube channel)
//    Uses a SEPARATE OAuth2 client with the dedicated
//    YouTube account credentials + refresh token.
//////////////////////////////////////////////////////

const youtubeOAuth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground" // same redirect used when generating the token
);

youtubeOAuth2Client.setCredentials({
  refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
});

//////////////////////////////////////////////////////
// 🛠️ HELPERS
//////////////////////////////////////////////////////

/**
 * Get a fresh YouTube access token using the central account's refresh token.
 * Called on every upload session request so the token is never stale.
 */
async function getYouTubeAccessToken() {
  const { token } = await youtubeOAuth2Client.getAccessToken();
  if (!token) throw new Error("Failed to obtain YouTube access token");
  return token;
}

/**
 * Upload a file to Google Drive and return its file ID.
 */
async function uploadToDrive(file) {
  const fileMetadata = {
    name: file.originalname,
    parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
  };

  const media = {
    mimeType: file.mimetype,
    body: fs.createReadStream(file.path),
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: "id",
  });

  // Make the file publicly readable so students can access it
  await drive.permissions.create({
    fileId: response.data.id,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  });

  return response.data.id;
}

/**
 * Fetch the display name of a faculty member from Supabase.
 */
async function getFacultyName(faculty_id) {
  const { data, error } = await supabase
    .from("faculty")
    .select("name")
    .eq("id", faculty_id)
    .single();

  if (error || !data) return "Unknown Faculty";
  return data.name;
}

//////////////////////////////////////////////////////
// 🧪 TEST ROUTES
//////////////////////////////////////////////////////

app.get("/", (req, res) => {
  res.json({
    status: "running",
    env: {
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
      GOOGLE_REFRESH_TOKEN: !!process.env.GOOGLE_REFRESH_TOKEN,
      GOOGLE_DRIVE_FOLDER_ID: !!process.env.GOOGLE_DRIVE_FOLDER_ID,
      YOUTUBE_CLIENT_ID: !!process.env.YOUTUBE_CLIENT_ID,
      YOUTUBE_CLIENT_SECRET: !!process.env.YOUTUBE_CLIENT_SECRET,
      YOUTUBE_REFRESH_TOKEN: !!process.env.YOUTUBE_REFRESH_TOKEN,
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
    },
  });
});

app.get("/test-drive", async (req, res) => {
  try {
    const token = await driveOAuth2Client.getAccessToken();
    res.json({ ok: true, accessTokenWorking: !!token?.token });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/test-youtube", async (req, res) => {
  try {
    const token = await getYouTubeAccessToken();
    res.json({ ok: true, accessTokenWorking: !!token });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

//////////////////////////////////////////////////////
// 🚀 YOUTUBE — Create resumable upload session
//
// The frontend calls this FIRST to get a one-time
// resumable upload URL from YouTube. The video bytes
// are then streamed DIRECTLY from the browser to
// YouTube — they never touch Render.
//
// Flow:
//   Frontend → POST /create-youtube-upload-session
//   Backend  → YouTube resumable upload API (init)
//   Backend  → returns { uploadUrl } to frontend
//   Frontend → PUT chunks directly to uploadUrl
//   YouTube  → returns videoId when done
//   Frontend → POST /save-video-metadata
//////////////////////////////////////////////////////

app.post("/create-youtube-upload-session", async (req, res) => {
  try {
    const { title, description = "", tags = [], fileSize, mimeType = "video/*" } = req.body;

    if (!title || !fileSize) {
      return res.status(400).json({ error: "title and fileSize are required" });
    }

    // Step 1: get a fresh access token for the central YouTube account
    const accessToken = await getYouTubeAccessToken();

    // Step 2: hit the YouTube resumable upload API directly.
    //         The googleapis JS client does NOT expose the raw resumable
    //         upload URL — we must call the HTTP endpoint ourselves.
    const initResponse = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Upload-Content-Length": fileSize.toString(),
          "X-Upload-Content-Type": mimeType,
        },
        body: JSON.stringify({
          snippet: {
            title,
            description,
            tags,
            categoryId: "27", // Education
          },
          status: {
            privacyStatus: "unlisted", // Change to "public" if you want open access
            selfDeclaredMadeForKids: false,
          },
        }),
      }
    );

    if (!initResponse.ok) {
      const errText = await initResponse.text();
      console.error("YouTube init error:", errText);
      return res.status(500).json({ error: "YouTube rejected the upload session", detail: errText });
    }

    // YouTube returns the resumable upload URL in the Location header
    const uploadUrl = initResponse.headers.get("location");

    if (!uploadUrl) {
      return res.status(500).json({ error: "YouTube did not return an upload URL" });
    }

    console.log("✅ YouTube resumable session created");
    return res.json({ uploadUrl });

  } catch (error) {
    console.error("CREATE YOUTUBE SESSION ERROR:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

//////////////////////////////////////////////////////
// 💾 YOUTUBE — Save video metadata after upload
//
// After the frontend finishes uploading directly to
// YouTube and receives the videoId, it calls this
// endpoint to persist metadata in Supabase.
// Schema stays EXACTLY as-is (no changes required).
//////////////////////////////////////////////////////

app.post("/save-video-metadata", async (req, res) => {
  try {
    const {
      videoId,
      faculty_id,
      faculty_name,
      department,
      year,
      semester,
      subject,
      unit,
      title,
    } = req.body;

    // Validate required fields
    if (!videoId || !faculty_id || !title) {
      return res.status(400).json({ error: "videoId, faculty_id, and title are required" });
    }

    const embedUrl = `https://www.youtube.com/embed/${videoId}`;

    const { error } = await supabase.from("videos").insert([
      {
        faculty_id,
        faculty_name: faculty_name || (await getFacultyName(faculty_id)),
        department,
        year: Number(year),
        semester: Number(semester),
        subject,
        unit,
        title,
        file_id: videoId,       // YouTube video ID stored here (matches existing schema)
        embed_url: embedUrl,    // YouTube embed URL (existing iframe still works)
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) throw error;

    console.log("✅ Video metadata saved:", videoId);
    return res.status(200).json({ success: true, embedUrl });

  } catch (error) {
    console.error("SAVE METADATA ERROR:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

//////////////////////////////////////////////////////
// 🔀 YOUTUBE — Proxy chunk upload
//
// Browser cannot PUT directly to googleapis.com —
// YouTube's resumable upload endpoint blocks cross-origin
// requests (no CORS headers on their upload API).
//
// Solution: browser sends each chunk to THIS endpoint,
// which streams it straight to YouTube.
// Render never buffers the whole file — it pipes each
// chunk as it arrives, so memory stays low.
//
// Request headers the frontend must send:
//   x-upload-url   : the resumable uploadUrl from /create-youtube-upload-session
//   x-content-range: bytes START-END/TOTAL  (e.g. bytes 0-8388607/104857600)
//   content-type   : video/*  (or actual mime type)
//
// Response mirrors YouTube's response:
//   308  → chunk accepted, Range header tells next offset
//   200/201 → upload complete, body has { id, ... }
//////////////////////////////////////////////////////

app.post("/proxy-youtube-chunk", express.raw({ type: "*/*", limit: "12mb" }), async (req, res) => {
  try {
    const uploadUrl    = req.headers["x-upload-url"];
    const contentRange = req.headers["x-content-range"];
    const contentType  = req.headers["content-type"] || "video/*";

    if (!uploadUrl || !contentRange) {
      return res.status(400).json({ error: "x-upload-url and x-content-range headers are required" });
    }

    const ytResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Range": contentRange,
        "Content-Type":  contentType,
        "Content-Length": req.body.length.toString(),
      },
      body: req.body,  // raw Buffer — piped straight to YouTube
    });

    // Forward YouTube's response status + headers back to browser
    const rangeHeader = ytResponse.headers.get("Range");
    if (rangeHeader) res.setHeader("Range", rangeHeader);

    if (ytResponse.status === 308) {
      return res.status(308).end();
    }

    if (ytResponse.status === 200 || ytResponse.status === 201) {
      const data = await ytResponse.json();
      return res.status(200).json(data);
    }

    // Unexpected status — forward it
    const errText = await ytResponse.text();
    console.error("YouTube chunk error:", ytResponse.status, errText);
    return res.status(ytResponse.status).send(errText);

  } catch (error) {
    console.error("PROXY CHUNK ERROR:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

//////////////////////////////////////////////////////
// 🎯 UPLOAD CONTENT — PDFs only (video removed)
//
// Videos now bypass Render entirely via YouTube
// resumable upload. This route handles PDFs only.
// Passing type="video" will return a 400 error to
// prevent accidental large file uploads through Render.
//////////////////////////////////////////////////////

app.post("/upload-content", upload.single("file"), async (req, res) => {
  try {
    console.log("UPLOAD HIT");

    const { faculty_id, type, department, year, semester, subject, unit, title } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Guard: videos must use the YouTube flow, not this route
    if (type === "video") {
      fs.unlinkSync(req.file.path); // clean up temp file
      return res.status(400).json({
        error: "Video uploads are not handled here. Use /create-youtube-upload-session instead.",
      });
    }

    if (type === "pdf") {
      const faculty_name = await getFacultyName(faculty_id);
      const fileId = await uploadToDrive(req.file);

      fs.unlinkSync(req.file.path);

      const fileUrl = `https://drive.google.com/uc?id=${fileId}`;

      const { error } = await supabase.from("pdfs").insert([
        {
          faculty_id,
          faculty_name,
          department,
          year: Number(year),
          semester: Number(semester),
          subject,
          unit,
          title,
          file_id: fileId,
          file_url: fileUrl,
        },
      ]);

      if (error) throw error;

      return res.json({ success: true, fileUrl });
    }

    // Clean up if type is unrecognised
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: "Invalid type. Supported types: pdf" });

  } catch (error) {
    // Ensure temp file is cleaned up on any error
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error("UPLOAD ERROR:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

//////////////////////////////////////////////////////
// 📊 ASSESSMENT UPLOAD — unchanged
//////////////////////////////////////////////////////

app.post("/upload-assessment", upload.single("file"), async (req, res) => {
  try {
    const { faculty_id, department, year, semester, subject, unit, title } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const faculty_name = await getFacultyName(faculty_id);
    const fileId = await uploadToDrive(req.file);

    fs.unlinkSync(req.file.path);

    const { error } = await supabase.from("assessments").insert([
      {
        faculty_id,
        faculty_name,
        department,
        year: Number(year),
        semester: Number(semester),
        subject,
        unit,
        title,
        file_id: fileId,
      },
    ]);

    if (error) throw error;

    return res.json({ success: true });

  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error("ASSESSMENT ERROR:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

//////////////////////////////////////////////////////
// 🚀 START SERVER
//////////////////////////////////////////////////////

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
