const path = require('node:path');

function createDocumentsService(repository) {
  return {
    async upload(file) {
      const document = {
        id: file.filename,
        filename: file.filename,
        originalName: path.basename(file.originalname.replace(/\\/g, '/')) || 'document',
        size: file.size,
        uploadedAt: new Date().toISOString(),
        owner: 'default',
      };

      try {
        return repository.save(document);
      } catch (error) {
        await repository.removeFile(file.filename).catch(() => {});
        throw error;
      }
    },

    list() {
      return repository.list();
    },

    async getForDownload(id) {
      const file = await repository.findFileById(id);
      if (!file) {
        const error = new Error('Documento não encontrado.');
        error.code = 'DOCUMENT_NOT_FOUND';
        throw error;
      }
      return file;
    },
  };
}

module.exports = { createDocumentsService };