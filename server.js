const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// ===== CORS ENABLE (Sabhi Browsers/VPN Ke Liye) =====
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// ===== PRE-FLIGHT OPTIONS HANDLE =====
app.options('*', cors());

// ===== VPN/DNS BYPASS HEADERS =====
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('.'));

// ===== QUALITY MAPPING =====
const qualityMap = {
    '144p': 'best[height<=144]',
    '240p': 'best[height<=240]',
    '360p': 'best[height<=360]',
    '480p': 'best[height<=480]',
    '720p': 'best[height<=720]',
    '1080p': 'best[height<=1080]',
    '1440p': 'best[height<=1440]',
    '2160p': 'best[height<=2160]',
    'best': 'best'
};

// ===== KEEP ALIVE (Render Sleep Se Bachne Ke Liye) =====
setInterval(() => {
    console.log('🔄 Server is alive at:', new Date().toISOString());
}, 60000);

// ===== DOWNLOAD ENDPOINT =====
app.post('/download', (req, res) => {
    const { url, quality } = req.body;
    console.log("📥 Received URL:", url);
    console.log("📥 Received Quality:", quality);
    
    if (!url) {
        console.log("❌ No URL provided");
        return res.json({ success: false, message: 'URL is required' });
    }

    const selectedQuality = quality || 'best';
    const format = qualityMap[selectedQuality] || 'best';
    
    const downloadDir = path.join(__dirname, 'downloads');
    if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
    }
    const uniqueId = Date.now();

    // ===== PLATFORM DETECTION =====
    let isTikTok = url.includes('tiktok.com');
    let isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
    let isInstagram = url.includes('instagram.com');
    let isFacebook = url.includes('facebook.com') || url.includes('fb.watch');
    let isTwitter = url.includes('twitter.com') || url.includes('x.com');

    // ===== VPN FRIENDLY USER-AGENT =====
    let userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    
    let extraOpts = '';
    if (isTikTok) {
        extraOpts = `,
        'headers': {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-us,en;q=0.5',
            'Referer': 'https://www.tiktok.com/',
            'User-Agent': '${userAgent}'
        },
        'cookiefile': '/tmp/cookies.txt'`;
    }
    if (isYouTube) {
        extraOpts = `,
        'headers': {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-us,en;q=0.5',
            'User-Agent': '${userAgent}'
        },
        'format_sort': ['res', 'codec']`;
    }
    if (isInstagram) {
        extraOpts = `,
        'headers': {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-us,en;q=0.5',
            'User-Agent': '${userAgent}'
        }`;
    }
    if (isFacebook) {
        extraOpts = `,
        'headers': {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-us,en;q=0.5',
            'User-Agent': '${userAgent}'
        }`;
    }
    if (isTwitter) {
        extraOpts = `,
        'headers': {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-us,en;q=0.5',
            'User-Agent': '${userAgent}'
        }`;
    }

    const command = `python3 -c "
import yt_dlp
import sys
import os

url = '${url}'
download_dir = '${downloadDir}'
format = '${format}'
unique_id = '${uniqueId}'

ydl_opts = {
    'outtmpl': os.path.join(download_dir, f'video_{unique_id}_%(id)s.%(ext)s'),
    'format': format,
    'quiet': False,
    'no_warnings': False,
    'ignoreerrors': True,
    'extract_flat': False,
    'prefer_insecure': True,
    'geo_bypass': True,
    'user_agent': '${userAgent}'
    ${extraOpts}
}

try:
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        if info:
            filename = ydl.prepare_filename(info)
            print('SUCCESS:' + filename)
        else:
            print('ERROR: No video found')
except Exception as e:
    print('ERROR:' + str(e))
"`;

    exec(command, (error, stdout, stderr) => {
        console.log("📤 stdout:", stdout);
        console.log("⚠️ stderr:", stderr);

        if (error && !stdout.includes('SUCCESS:')) {
            console.error("❌ Error:", error);
            return res.json({ success: false, message: 'Download failed: ' + stderr });
        }
        if (stdout.includes('SUCCESS:')) {
            const filename = stdout.split('SUCCESS:')[1].trim();
            const fileBase = path.basename(filename);
            console.log("✅ File saved:", fileBase);
            res.json({
                success: true,
                message: '✅ Download complete!',
                file: fileBase,
                downloadLink: '/download-file/' + encodeURIComponent(fileBase)
            });
        } else {
            res.json({ success: false, message: '❌ Download failed: ' + stdout });
        }
    });
});

// ===== SERVE DOWNLOADED FILE =====
app.get('/download-file/:filename', (req, res) => {
    const filename = decodeURIComponent(req.params.filename);
    const downloadDir = path.join(__dirname, 'downloads');
    const filePath = path.join(downloadDir, filename);
    
    console.log("📥 File requested:", filePath);
    
    if (fs.existsSync(filePath)) {
        res.download(filePath, (err) => { 
            if (err) console.error(err); 
        });
    } else {
        console.log("❌ File not found:", filePath);
        res.status(404).send('File not found');
    }
});

// ===== HEALTH CHECK =====
app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// ===== START SERVER =====
app.listen(PORT, () => {
    console.log('✅ Server running on http://localhost:' + PORT);
});