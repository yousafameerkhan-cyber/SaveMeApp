const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

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

app.post('/download', (req, res) => {
    const { url, quality } = req.body;
    if (!url) return res.json({ success: false, message: 'URL is required' });

    const selectedQuality = quality || 'best';
    const format = qualityMap[selectedQuality] || 'best';
    console.log("📥 Downloading:", url);

    // Render ke liye downloads folder
    const downloadDir = path.join(__dirname, 'downloads');
    if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
    }
    const uniqueId = Date.now();

    const command = `python3 -c "
import yt_dlp
import sys
import os

url = '${url}'
download_dir = '${downloadDir}'
format = '${format}'

ydl_opts = {
    'outtmpl': os.path.join(download_dir, 'video_${uniqueId}_%(id)s.%(ext)s'),
    'format': format,
    'quiet': False,
    'no_warnings': False,
    'ignoreerrors': True,
    'extract_flat': False,
    'prefer_insecure': True,
    'geo_bypass': True,
    'user_agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36'
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
        console.log("stdout:", stdout);
        if (error && !stdout.includes('SUCCESS:')) {
            return res.json({ success: false, message: 'Download failed: ' + stderr });
        }
        if (stdout.includes('SUCCESS:')) {
            const filename = stdout.split('SUCCESS:')[1].trim();
            // Sirf filename bhejo (path nahi)
            const fileBase = path.basename(filename);
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

app.get('/download-file/:filename', (req, res) => {
    const filename = decodeURIComponent(req.params.filename);
    const downloadDir = path.join(__dirname, 'downloads');
    const filePath = path.join(downloadDir, filename);
    
    if (fs.existsSync(filePath)) {
        res.download(filePath, (err) => { 
            if (err) console.error(err); 
        });
    } else {
        res.status(404).send('File not found');
    }
});

app.listen(PORT, () => {
    console.log('✅ Server running on http://localhost:' + PORT);
});