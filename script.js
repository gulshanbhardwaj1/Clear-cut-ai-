const API_KEY = 'asaSNgjtgfU8tjLDvN4D6XHA';

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

    const formData = new FormData();
    formData.append('image_file', file);

    try {
        const response = await fetch('https://api.remove.bg/v1.0/removebg', {
            method: 'POST',
            headers: { 'X-Api-Key': API_KEY },
            body: formData
        });

        if (response.ok) {
            const blob = await response.blob();
            processedBlobUrl = URL.createObjectURL(blob);
            processedImg.src = processedBlobUrl;
            loadingSpinner.classList.add('hidden');
            bgTools.classList.remove('hidden'); // Show editor tool
        }
    } catch (err) { alert("Error connecting to API"); }
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