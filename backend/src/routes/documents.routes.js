const express = require('express');

function createDocumentsRouter(controller, uploadMiddleware) {
  const router = express.Router();

  router.post('/upload', uploadMiddleware, controller.upload);
  router.get('/documents', controller.list);
  router.get('/documents/:id/download', controller.download);

  router.use((error, req, res, next) => {
    if (res.headersSent) {
      return next(error);
    }
    if (error.name === 'MulterError') {
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