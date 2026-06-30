// ==========================================================================
// BG REMOVER SECURE CLOUD BACKEND WITH FIREBASE SYNC - PRODUCTION READY
// ==========================================================================

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const admin = require('firebase-admin'); // Firebase Admin SDK core
require('dotenv').config();

const app = express();

// Multer configured to hold uploaded files in system memory buffer
const upload = multer({ storage: multer.memoryStorage() });

// CORS config allowing universal frontend connectivity
app.use(cors({ origin: '*' })); 
app.use(express.json());

// --- 🔥 SAFE FIREBASE ADMINISTRATION SETUP ---
try {
    // Render Dashboard se environment variable read karna
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    
    // Extracting project ID automatically to map storage bucket safely
    const projectId = serviceAccount.project_id;

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: `${projectId}.appspot.com` // Auto-mapping default Firebase bucket
    });
    console.log("🎯 [FIREBASE STATUS]: Firebase Cloud Services Connected Successfully.");
} catch (fbError) {
    console.error("❌ [FIREBASE CONFIG ERROR]: Check your FIREBASE_SERVICE_ACCOUNT_JSON inside Render Dashboard.");
    console.error(fbError.message);
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

// --- 🔥 SECURE BACKGROUND REMOVE & CLOUD STORAGE ENDPOINT ---
app.post('/api/remove-bg', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: "No image file uploaded." });
        }

        console.log(`📸 [IMAGE RECEIVED]: Cloud processing initiated for: ${req.file.originalname}`);

        const apiKey = process.env.BG_REMOVER_API_KEY;
        
        // Form data packaging for the official remove.bg API Gateway
        const formData = new FormData();
        const imageBlob = new Blob([req.file.buffer], { type: req.file.mimetype });
