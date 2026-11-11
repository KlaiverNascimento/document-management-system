const crypto = require('node:crypto');
const fs = require('node:fs');
const multer = require('multer');

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function createDocumentsUploadMiddleware(storageDir) {
  const storage = multer.diskStorage({
    destination(req, file, callback) {
      fs.mkdir(storageDir, { recursive: true }, (error) => callback(error, storageDir));
    },
    filename(req, file, callback) {
      callback(null, crypto.randomUUID());
    },
  });

  return multer({
    storage,
    limits: {
      fileSize: MAX_FILE_SIZE,
      fieldNameSize: 100,
      fieldSize: 1024,
      fields: 0,
      files: 1,
      // Busboy emite partsLimit ao atingir o limite; 2 permite um único arquivo.
      parts: 2,
      headerPairs: 20,
    },
  }).single('file');
}

module.exports = { createDocumentsUploadMiddleware };