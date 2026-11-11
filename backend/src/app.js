// Seed do servidor backend do Document Management System.
//
// Este arquivo é apenas um ponto de partida mínimo. Ao longo do workshop você
// vai usar o Agent Mode do GitHub Copilot para construir as camadas:
//   - routes/       (definição das rotas)
//   - controllers/  (entrada HTTP e validação)
//   - services/     (regras de negócio)
//   - repositories/ (persistência: arquivos locais + metadados em memória)
//
// Restrição do projeto: uploads são gravados no filesystem local da aplicação
// usando multer com diskStorage. Não utilize provedores externos.

const express = require('express');
const { createDocumentsController } = require('./controllers/documents.controller');
const { createDocumentsRepository } = require('./repositories/documents.repository');
const { createDocumentsRouter } = require('./routes/documents.routes');
const { createDocumentsService } = require('./services/documents.service');
const { createDocumentsUploadMiddleware } = require('./middleware/documents-upload.middleware');

function createApp(options = {}) {
  const app = express();
  const repository = createDocumentsRepository(options.storageDir);
  const service = createDocumentsService(repository);
  const controller = createDocumentsController(service);
  const uploadMiddleware = createDocumentsUploadMiddleware(repository.storageDir);

  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(createDocumentsRouter(controller, uploadMiddleware));

  return app;
}

const app = createApp();

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  const HOST = process.env.HOST || '127.0.0.1';
  app.listen(PORT, HOST, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
module.exports.createApp = createApp;
