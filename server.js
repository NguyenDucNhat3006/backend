require('dotenv').config();

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver'); // <== Thêm dòng này để tạo file .zip

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: 'https://24521252-uit-ducnhat.vercel.app'
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Tạo thư mục uploads nếu chưa có
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// ✅ Cấu hình lưu file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// ✅ API nhận nội dung tố cáo
app.post('/api/report', upload.single('file'), (req, res) => {
  const { message } = req.body;
  const fileInfo = req.file;

  if (!message) {
    return res.status(400).json({ success: false, message: 'Thiếu nội dung tố cáo.' });
  }

  const data = {
    message,
    filePath: fileInfo ? fileInfo.path : null,
    createdAt: new Date().toISOString()
  };

  try {
    fs.appendFileSync('reports.json', JSON.stringify(data) + '\n');
    res.json({ success: true, message: '✅ Tố cáo đã được ghi nhận.' });
  } catch (err) {
    console.error('Lỗi khi ghi file:', err);
    res.status(500).json({ success: false, message: '❌ Ghi dữ liệu thất bại.' });
  }
});

// ✅ API tải toàn bộ nội dung tố cáo dưới dạng .zip
app.get('/api/reports', (req, res) => {
  const archive = archiver('zip', { zlib: { level: 9 } });

  res.attachment('to-cao-data.zip');
  archive.pipe(res);

  if (fs.existsSync('reports.json')) {
    archive.file('reports.json', { name: 'reports.json' });
  }

  if (fs.existsSync('uploads')) {
    archive.directory('uploads/', 'uploads');
  }

  archive.finalize();
});

app.listen(PORT, () => {
  console.log(`🚀 Server chạy tại: http://localhost:${PORT}`);
});
