// const util = require("util");
// const multer = require("multer");
// const maxSize = 2 * 1024 * 1024;

// let storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, __basedir + "/public/assets/company_logos/");
//   },
//   filename: (req, file, cb) => {
//     console.log(file.originalname);
//     cb(null, file.originalname);
//   },
// });

// let uploadFile = multer({
//   storage: storage,
//   limits: { fileSize: maxSize },
// }).single("file");

// let uploadFileMiddleware = util.promisify(uploadFile);
// module.exports = uploadFileMiddleware;
// Middleware
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(session({
//   secret: 'your_secret_key',
//   resave: false,
//   saveUninitialized: true
// }));

// // Multer configuration
// const storage = multer.memoryStorage();
// const company_upload = multer({ storage: storage });