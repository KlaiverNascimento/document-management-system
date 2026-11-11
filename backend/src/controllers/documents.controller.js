function sendError(res, status, code, message) {
  return res.status(status).json({ error: { code, message } });
}

function createDocumentsController(service) {
  return {
    async upload(req, res) {
      if (!req.file) {
        return sendError(res, 400, 'FILE_REQUIRED', 'Envie um arquivo no campo file.');
      }

      try {
        const document = await service.upload(req.file);
        return res.status(201).json({ document });
      } catch {
        return sendError(res, 500, 'STORAGE_ERROR', 'Não foi possível armazenar o documento.');
      }
    },

    list(req, res) {
      try {
        return res.json({ documents: service.list() });
      } catch {
        return sendError(res, 500, 'STORAGE_ERROR', 'Não foi possível listar os documentos.');
      }
    },

    async download(req, res) {
      let file;
      try {
        file = await service.getForDownload(req.params.id);
      } catch (error) {
        if (error.code === 'DOCUMENT_NOT_FOUND') {
          return sendError(res, 404, error.code, error.message);
        }
        return sendError(res, 500, 'STORAGE_ERROR', 'Não foi possível acessar o documento.');
      }

      res.set('Content-Type', 'application/octet-stream');
      return res.download(file.filePath, file.document.originalName, (error) => {
        if (!error || res.headersSent) {
          return;
        }
        if (error.code === 'ENOENT') {
          sendError(res, 404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
          return;
        }
        sendError(res, 500, 'STORAGE_ERROR', 'Não foi possível baixar o documento.');
      });
    },
  };
}

module.exports = { createDocumentsController };