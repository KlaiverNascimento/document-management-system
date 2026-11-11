const crypto = require('node:crypto');
const fs = require('node:fs');
const express = require('express');
const multer = require('multer');

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function createDocumentsRouter(controller, storageDir) {
  const router = express.Router();
  const storage = multer.diskStorage({
    destination(req, file, callback) {
      fs.mkdir(storageDir, { recursive: true }, (error) => callback(error, storageDir));
    },
    filename(req, file, callback) {
      callback(null, crypto.randomUUID());
    },
  });
  const upload = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  });

  router.post('/upload', upload.single('file'), controller.upload);
  router.get('/documents', controller.list);
  router.get('/documents/:id/download', controller.download);

  router.use((error, req, res, next) => {
    if (res.headersSent) {
      return next(error);
    }
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          error: { code: 'FILE_TOO_LARGE', message: 'O arquivo excede o limite de 10 MiB.' },
        });
      }
      return res.status(400).json({
        error: { code: 'INVALID_UPLOAD', message: 'A requisição de upload é inválida.' },
      });
    }
    return res.status(500).json({
      error: { code: 'STORAGE_ERROR', message: 'Não foi possível armazenar o documento.' },
    });
  });

  return router;
}

module.exports = { createDocumentsRouter };