// server/server.js
const express = require("express")
const cors = require("cors")
const admin = require("firebase-admin")
require("dotenv").config() // Load environment variables from .env if running locally

const path = require("path") // path is still useful for other things, but not for service account json directly

// --- START: Firebase Admin SDK Initialization ---
// IMPORTANT: For Vercel deployment, you must set the FIREBASE_SERVICE_ACCOUNT_KEY
// environment variable in your Vercel project settings.
// The value should be the *entire JSON content* of your service account key file,
// stringified into a single line.
let serviceAccount
if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  } catch (e) {
    console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:", e)
    process.exit(1) // Exit if the key is malformed
  }
} else {
  // Fallback for local development if you prefer to keep the file locally
  // For production, this block should ideally not be hit.
  try {
    serviceAccount = require(path.resolve(
      __dirname,
      "./diemsattendancesystem-firebase-adminsdk-fbsvc-8774144c2c.json"
    ))
    console.warn(
      "Using local Firebase service account file. Ensure FIREBASE_SERVICE_ACCOUNT_KEY is set in production."
    )
  } catch (e) {
    console.error(
      "Firebase service account key not found. Please set FIREBASE_SERVICE_ACCOUNT_KEY environment variable or provide local file.",
      e
    )
    process.exit(1) // Exit if no key is found
  }
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})
// --- END: Firebase Admin SDK Initialization ---

const app = express()
const PORT = process.env.PORT || 5000

// CORS config - allow Vite dev server on localhost:5173
// For production, you might want to adjust this to your Vercel domain
app.use(
  cors({
    origin: ["http://localhost:5173", "https://smartaiml.vercel.app"], // Add your Vercel domain here
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
)

app.use(express.json())

// Example Route (uncomment and use as needed)
// app.use("/api/drivers", require("./routes/drivers"));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
