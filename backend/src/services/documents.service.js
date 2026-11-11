const path = require('node:path');

function createDocumentRecord(file) {
  return {
    id: file.filename,
    filename: file.filename,
    originalName: path.basename(file.originalname.replace(/\\/g, '/')) || 'document',
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner: 'default',
  };
}

function createDocumentsService(repository) {
  return {
    upload(file) {
      return repository.save(createDocumentRecord(file));
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