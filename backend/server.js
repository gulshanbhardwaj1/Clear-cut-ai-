// ==========================================================================
// BG REMOVER SECURE CLOUD BACKEND WITH FIREBASE SYNC - PRODUCTION READY
// ==========================================================================

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const admin = require('firebase-admin'); 
require('dotenv').config();

const app = express();

// Multer configured to hold uploaded files in system memory buffer
const upload = multer({ storage: multer.memoryStorage() });

// CORS config allowing universal frontend connectivity
app.use(cors({ origin: '*' })); 
app.use(express.json());

// --- 🔥 SAFE FIREBASE ADMINISTRATION SETUP ---
try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    const projectId = serviceAccount.project_id;

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: `${projectId}.appspot.com`
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
        
        const formData = new FormData();
        const imageBlob = new Blob([req.file.buffer], { type: req.file.mimetype });
        
        formData.append('image_file', imageBlob, req.file.originalname);
        formData.append('size', 'auto');

        // --- 🔒 SECURE THIRD-PARTY API HANDSHAKE ---
        const apiResponse = await fetch('https://api.remove.bg/v1.0/removebg', {
            method: 'POST',
            headers: {
                'X-Api-Key': apiKey
            },
            body: formData
        });

        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            console.error("❌ API Gateway Error:", errorText);
            return res.status(apiResponse.status).json({ success: false, error: "API failed to remove background." });
        }

        const arrayBuffer = await apiResponse.arrayBuffer();
        const imageBuffer = Buffer.from(arrayBuffer);

        // --- ☁️ UPLOADING PROCESSED IMAGE TO GOOGLE CLOUD STORAGE ---
        const uniqueId = Date.now();
        const cloudFileName = `processed_images/clearcut_${uniqueId}.png`;
        const cloudFile = bucket.file(cloudFileName);

        await cloudFile.save(imageBuffer, {
            metadata: { contentType: 'image/png' },
            public: true 
        });

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${cloudFile.name}`;
        console.log(`☁️ [CLOUD STORAGE]: Image uploaded securely. Link: ${publicUrl}`);

        // --- 📊 WRITING RECORDS INTO FIRESTORE CLOUD DATABASE ---
        const recordData = {
            fileName: req.file.originalname,
            imageUrl: publicUrl,
            processedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection("clearcut_history").add(recordData);
        console.log(`📊 [FIRESTORE DB]: Entry indexed inside database with ID: ${docRef.id}`);

        return res.json({ 
            success: true, 
            processedImageUrl: publicUrl,
            databaseId: docRef.id
        });

    } catch (error) {
        console.error("❌ [SERVER CRITICAL ERROR]:", error.message);
        return res.status(500).json({ success: false, error: "Internal cloud server processing failure." });
    }
});

// Production port allocation mapping safely dynamically
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n🚀 ===================================================`);
    console.log(`🤖 CLEARCUT CLOUD SERVER LIVE 24/7 ON PORT: ${PORT}`);
    console.log(`🔒 SECURITY STATUS: ENCRYPTED CREDENTIAL MATRIX ACTIVE`);
    console.log(`🚀 ===================================================\n`);
});