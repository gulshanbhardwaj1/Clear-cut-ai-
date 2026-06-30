// ==========================================================================
// CLEAR-CUT AI FRONTEND - CLIENT ENGINE (SECURE LAYER ATTACHED)
// ==========================================================================

// ❌ OLD EXPOSED KEY REMOVED FROM CLIENT CODE - NOW 100% SECURE ONSERVER

// Elements
const fileInput = document.getElementById('file-input');
const dropZone = document.getElementById('drop-zone');
const uploadSection = document.getElementById('upload-section');
const resultContainer = document.getElementById('result-container');
const originalPreview = document.getElementById('original-preview');
const processedImg = document.getElementById('processed-img');
const loadingSpinner = document.getElementById('loading-spinner');
const bgTools = document.getElementById('bg-editor-tools');

let processedBlobUrl = '';
let currentBackground = { type: 'none', value: '' };

// 1. Upload Logic
dropZone.onclick = () => fileInput.click();
fileInput.onchange = (e) => handleUpload(e.target.files[0]);

async function handleUpload(file) {
    if (!file) return;
    uploadSection.classList.add('hidden');
    resultContainer.classList.remove('hidden');
    loadingSpinner.classList.remove('hidden');
    originalPreview.src = URL.createObjectURL(file);

    // Backend 'image' keyword accept karta hai, isliye hum 'image' append karenge
    const formData = new FormData();
    formData.append('image', file);

    try {
        // 🔄 MODIFIED: Localhost hata kar ab hum Render ke live cloud link par request bhej rahe hain
        // ⚠️ TIP: Render par live hone ke baad jo link milega use "https://clearcut-backend.onrender.com" ki jagah daal dena
        const response = await fetch('https://clearcut-backend.onrender.com/api/remove-bg', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            // Humara naya backend JSON data bhejta hai jisme Firebase ka direct image link hota hai
            const data = await response.json();
            processedBlobUrl = data.processedImageUrl; // Firebase Storage wala direct live link
            processedImg.src = processedBlobUrl;
            loadingSpinner.classList.add('hidden');
            bgTools.classList.remove('hidden'); // Show editor tool
        } else {
            const errorData = await response.json().catch(() => ({}));
            alert("Error from secure server: " + (errorData.error || "Failed to process image"));
            loadingSpinner.classList.add('hidden');
        }
    } catch (err) { 
        console.error(err);
        alert("Could not connect to Cloud Backend. Make sure your Render service is live and active!"); 
        loadingSpinner.classList.add('hidden');
    }
}

// 2. Background Editor Logic
document.getElementById('bg-color-picker').oninput = (e) => {
    processedImg.style.backgroundImage = 'none';
    processedImg.style.backgroundColor = e.target.value;
    currentBackground = { type: 'color', value: e.target.value };
};

document.querySelectorAll('.preset-thumb').forEach(btn => {
    btn.onclick = () => {
        const bg = btn.dataset.bg;
        if(bg === 'none') {
            processedImg.style.background = 'none';
            currentBackground = { type: 'none', value: '' };
        } else {
            processedImg.style.backgroundImage = `url(${bg})`;
            processedImg.style.backgroundSize = 'cover';
            currentBackground = { type: 'image', value: bg };
        }
    };
});

document.getElementById('bg-upload').onchange = (e) => {
    const reader = new FileReader();
    reader.onload = (event) => {
        processedImg.style.backgroundImage = `url(${event.target.result})`;
        processedImg.style.backgroundSize = 'cover';
        currentBackground = { type: 'image', value: event.target.result };
    };
    reader.readAsDataURL(e.target.files[0]);
};

// 3. Download Logic (Separate Buttons)
document.getElementById('download-btn').onclick = () => {
    const link = document.createElement('a');
    link.href = processedBlobUrl;
    link.download = 'transparent-result.png';
    link.click();
};

document.getElementById('download-with-bg').onclick = async () => {
    const canvas = document.getElementById('export-canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        if (currentBackground.type === 'color') {
            ctx.fillStyle = currentBackground.value;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (currentBackground.type === 'image') {
            // Background image drawing logic can be complex due to CORS, 
            // for now it handles the main transparent image.
        }
        
        ctx.drawImage(img, 0, 0);
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = 'edited-result.png';
        link.click();
    };
    img.src = processedBlobUrl;
};

document.getElementById('reset-btn').onclick = () => location.reload();