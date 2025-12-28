const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const fs = require('fs');
        const dir = 'uploads/menu/';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'menu-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedExts = /jpeg|jpg|png|webp/;
    const allowedMime = /image\/jpeg|image\/jpg|image\/png|image\/webp/;

    const extname = allowedExts.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedMime.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error(`File format ${path.extname(file.originalname)} (${file.mimetype}) tidak didukung. Gunakan JPG/PNG.`));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: fileFilter
});

module.exports = upload;
