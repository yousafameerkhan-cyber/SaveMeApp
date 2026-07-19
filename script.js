const button = document.getElementById("downloadBtn");
const input = document.getElementById("url");
const status = document.getElementById("status");
const progressBar = document.getElementById("progress-bar");
const progressFill = document.getElementById("progress-fill");
const btnText = document.getElementById("btnText");
const btnLoader = document.getElementById("btnLoader");
const qualitySelect = document.getElementById("qualitySelect");
const pasteBtn = document.getElementById("pasteBtn");

// ===== Paste Button =====
pasteBtn.addEventListener("click", async () => {
    try {
        const text = await navigator.clipboard.readText();
        input.value = text;
        input.style.borderColor = "#22c55e";
        setTimeout(() => {
            input.style.borderColor = "";
        }, 1500);
        showStatus("📋 URL pasted from clipboard!", "#38bdf8");
    } catch (err) {
        showStatus("❌ Cannot access clipboard. Please paste manually.", "#ef4444");
    }
});

// ===== Download Button =====
button.addEventListener("click", async () => {
    const url = input.value.trim();
    const quality = qualitySelect.value;

    if (!url) {
        showStatus("⚠ Please paste a valid URL", "#f59e0b");
        return;
    }

if (data.success) {
    showStatus("✅ Download complete!", "#22c55e");
    
    // ===== INTERSTITIAL AD SHOW =====
    if (typeof adsbygoogle !== 'undefined') {
        try {
            console.log("📢 Showing Interstitial Ad");
            // Interstitial ad trigger
            // (Note: Interstitial ads require additional SDK setup)
        } catch(e) {
            console.log("Ad error:", e);
        }
    }
    
    // Auto download
    window.location.href = data.downloadLink;
}
  
    // Check if valid (all platforms)
    const platforms = [
        'facebook.com', 'fb.watch', 'tiktok.com', 'youtube.com', 
        'youtu.be', 'instagram.com', 'twitter.com', 'x.com'
    ];
    const isValid = platforms.some(p => url.includes(p));

    if (!isValid) {
        showStatus("❌ Invalid URL. Support: FB, TikTok, YouTube, IG, Twitter", "#ef4444");
        return;
    }

    button.disabled = true;
    btnText.textContent = "⏳ Downloading...";
    btnLoader.className = "loader-visible";
    showStatus(`🔄 Fetching video (${quality})...`, "#38bdf8");
    progressBar.className = "progress-visible";
    progressFill.style.width = "20%";

    try {
        progressFill.style.width = "40%";

        const response = await fetch('/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                url: url,
                quality: quality 
            })
        });

        progressFill.style.width = "70%";
        const data = await response.json();

        if (data.success) {
            progressFill.style.width = "100%";
            showStatus(`✅ ${data.message} (${quality})`, "#22c55e");
            setTimeout(() => {
                window.location.href = data.downloadLink;
            }, 500);
        } else {
            showStatus(`❌ ${data.message}`, "#ef4444");
            progressFill.style.width = "0%";
        }
    } catch (error) {
        showStatus("❌ Server error. Please try again.", "#ef4444");
        progressFill.style.width = "0%";
    }

    button.disabled = false;
    btnText.textContent = "⬇️ Download Now";
    btnLoader.className = "loader-hidden";
    setTimeout(() => {
        progressBar.className = "progress-hidden";
    }, 3000);
});

function showStatus(message, color) {
    status.innerHTML = message;
    status.style.color = color;
    status.style.fontWeight = "500";
}

// Mobile menu toggle
function toggleMenu() {
    document.querySelector('.menu').classList.toggle('active');
}
// ===== SERVICE WORKER REGISTER =====
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(() => console.log('✅ Service Worker Registered'))
        .catch((err) => console.log('❌ Service Worker Error:', err));
}