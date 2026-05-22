const express = require("express");
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.static(__dirname));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },

  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage: storage });

app.post("/subir", upload.single("archivo"), (req, res) => {
  res.send({
    mensaje: "Archivo guardado correctamente",
    archivo: req.file.filename
  });
});

app.listen(PORT, () => {
  console.log(`Servidor funcionando en http://localhost:${PORT}`);
});