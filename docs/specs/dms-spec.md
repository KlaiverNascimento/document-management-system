# Especificação - Document Management System

## 1. Objetivo

Entregar uma aplicação web simples para que um usuário envie documentos, consulte os documentos enviados e baixe cada arquivo, mantendo os binários exclusivamente no filesystem local da aplicação.

## 2. Escopo

### Dentro do escopo

- Envio de um arquivo por requisição.
- Listagem dos metadados dos documentos disponíveis para o usuário local.
- Download de um documento pelo identificador.
- Identificação do dono nos metadados, usando o usuário único `default` nesta fase.
- Interface React para upload, listagem e download, integrada ao backend por `fetch`.
- Endpoint de saúde `GET /health` já presente no seed.

### Fora do escopo

- Autenticação, autorização multiusuário ou gestão de contas.
- Armazenamento em nuvem, banco de dados ou provedores externos.
- Persistência dos metadados após reinício do processo.
- Versionamento, edição, exclusão, busca, compartilhamento ou pré-visualização de documentos.
- Restrições por extensão ou tipo MIME. O limite de tamanho continua obrigatório.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O usuário pode enviar um arquivo usando `multipart/form-data`, no campo `file`. |
| RF-02 | O sistema aceita qualquer tipo de arquivo, limitado a 10 MiB (10.485.760 bytes) por arquivo; rejeita requisição sem arquivo ou acima do limite. |
| RF-03 | Ao aceitar um upload, o sistema grava o binário no filesystem local, atribui um identificador único e registra os metadados em memória. |
| RF-04 | O nome original é preservado nos metadados e usado no nome de download; ele não é usado como caminho de gravação. |
| RF-05 | O usuário pode listar os metadados de todos os documentos registrados na instância. A lista é ordenada do mais recente para o mais antigo. |
| RF-06 | O usuário pode baixar um documento existente pelo identificador. O conteúdo é enviado como anexo, com o nome original. |
| RF-07 | Para um identificador inexistente ou cujo arquivo não esteja disponível, o sistema retorna `404` com erro JSON. |
| RF-08 | Erros de validação, tamanho excedido e falha interna são retornados em formato JSON consistente, sem expor caminhos internos ou stack traces. |
| RF-09 | A interface permite selecionar e enviar um arquivo, apresentar estado de envio e erros, atualizar/exibir a lista e iniciar o download de um documento. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | O backend é Node.js + Express, em CommonJS; o frontend é React + Vite, em ES Modules. |
| RNF-02 | Uploads são gravados somente em disco local por `multer` configurado com `diskStorage`. Não usar armazenamento externo. |
| RNF-03 | O diretório de armazenamento é configurável pela variável `STORAGE_DIR`; o padrão é `backend/storage`. O processo deve garantir que o diretório exista antes de gravar. |
| RNF-04 | Metadados são mantidos em memória nesta fase. Eles são perdidos ao reiniciar o backend; os arquivos no disco não são automaticamente removidos. |
| RNF-05 | A configuração operacional deve usar variáveis de ambiente: `PORT` (padrão `3000`), `HOST` (padrão `127.0.0.1`) e `STORAGE_DIR`. O backend deve escutar apenas em loopback por padrão porque esta fase não tem autenticação. |
| RNF-06 | O nome físico do arquivo é gerado pelo sistema a partir de um identificador seguro e único. Nunca concatenar o nome original diretamente ao caminho de armazenamento. |
| RNF-07 | O serviço frontend chama `/api`; no desenvolvimento, o proxy Vite direciona para `http://localhost:3000` e remove o prefixo antes de encaminhar ao backend. |
| RNF-08 | As rotas HTTP não contêm regras de negócio nem persistência. A direção das dependências é `routes -> controllers -> services -> repositories`. |
| RNF-09 | O frontend deve informar falhas de rede e respostas de erro sem deixar a interface em estado de carregamento permanente. |

## 5. Modelo de dados (metadados do documento)

### Representação pública

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | string | Sim | Identificador único e opaco do documento. |
| `originalName` | string | Sim | Nome original fornecido no upload, apresentado ao usuário. |
| `size` | number | Sim | Tamanho do arquivo em bytes. |
| `uploadedAt` | string | Sim | Data e hora do upload em ISO 8601 UTC. |
| `owner` | string | Sim | Identificador do dono; nesta fase sempre `default`. |

### Dados internos de armazenamento

O repositório pode manter, além da representação pública, o nome físico gerado e o caminho do arquivo para localizar o binário. Esses valores são internos e não devem ser serializados nas respostas HTTP. O arquivo não deve ser nomeado com `originalName`.

O repositório de metadados é em memória e indexado por `id`. A aplicação nesta fase é de usuário único e não oferece isolamento ou autenticação; `owner` é apenas metadado, não uma fronteira de segurança.

## 6. Contratos de API

Os paths abaixo são os paths do backend. O frontend usa o prefixo `/api` no ambiente Vite; por exemplo, `/api/documents` é encaminhado como `/documents`.

### Formato de erro

Todas as respostas de erro previstas usam `Content-Type: application/json` e o formato:

```json
{
  "error": {
    "code": "FILE_REQUIRED",
    "message": "Envie um arquivo no campo file."
  }
}
```

`code` é estável para tratamento pelo frontend; `message` é uma mensagem legível em português. Não incluir stack trace, diretórios locais ou detalhes internos.

### POST /upload

Envia um arquivo para armazenamento local.

- Request: `multipart/form-data`, exatamente um arquivo no campo `file`.
- Limite: 10.485.760 bytes por arquivo; qualquer tipo é aceito.
- Sucesso: `201 Created`, `Content-Type: application/json`.

```json
{
  "document": {
    "id": "<id-opaco>",
    "originalName": "relatorio.pdf",
    "size": 24576,
    "uploadedAt": "2026-11-11T12:00:00.000Z",
    "owner": "default"
  }
}
```

- `400 Bad Request`: campo `file` ausente ou requisição multipart inválida (`FILE_REQUIRED` ou `INVALID_UPLOAD`).
- `413 Payload Too Large`: arquivo excede o limite (`FILE_TOO_LARGE`).
- `500 Internal Server Error`: falha ao gravar arquivo ou registrar metadados (`STORAGE_ERROR`).

Se a gravação do arquivo ocorrer, mas o registro de metadados falhar, a implementação deve tentar remover o arquivo parcial para evitar órfãos.

### GET /documents

Lista os metadados dos documentos registrados na instância atual.

- Request: sem corpo.
- Sucesso: `200 OK`, `Content-Type: application/json`; inclui lista vazia quando não há documentos.

```json
{
  "documents": [
    {
      "id": "<id-opaco>",
      "originalName": "relatorio.pdf",
      "size": 24576,
      "uploadedAt": "2026-11-11T12:00:00.000Z",
      "owner": "default"
    }
  ]
}
```

A ordenação é decrescente por `uploadedAt`. Não incluir caminhos ou nomes físicos de armazenamento.

### GET /documents/:id/download

Baixa o conteúdo binário de um documento.

- Request: identificador no parâmetro `id`; sem corpo.
- Sucesso: `200 OK`, corpo binário, `Content-Disposition: attachment` com o nome original e `Content-Type: application/octet-stream`.
- `404 Not Found`: metadado ou arquivo inexistente (`DOCUMENT_NOT_FOUND`).
- `500 Internal Server Error`: falha de leitura não causada por ausência do arquivo (`STORAGE_ERROR`).

O nome fornecido em `Content-Disposition` deve ser tratado como valor de cabeçalho, não como caminho; usar mecanismo seguro do Express para envio de arquivo e evitar injeção de cabeçalho.

### GET /health

Endpoint de saúde já presente no seed. Mantém `200 OK` e a resposta `{ "status": "ok" }` enquanto o processo estiver disponível.

## 7. Decisões arquiteturais

### Backend

- `routes/`: registra paths, métodos e middleware de upload do Multer; delega o tratamento ao controller.
- `controllers/`: interpreta parâmetros e dados HTTP, aplica validações de borda e traduz resultados/erros para status e JSON ou resposta binária.
- `services/`: concentra regras de negócio, como limite de tamanho, associação ao dono `default`, geração de metadados e coordenação do upload, listagem e download.
- `repositories/`: abstrai o registro em memória e o acesso aos arquivos no filesystem local. Não conhece Express.
- O Multer usa `diskStorage` e um nome físico gerado pelo sistema. O middleware fornece ao fluxo interno informações do arquivo temporário/local; não decide regras de negócio.
- O processo configura `STORAGE_DIR` e `PORT` por ambiente. Não introduzir banco de dados nem serviços externos.

### Frontend

- Componentes funcionais React separados por responsabilidade: envio, lista e ação de download.
- Um serviço centraliza chamadas `fetch` para `/api/upload`, `/api/documents` e `/api/documents/:id/download`.
- A interface mostra estados de carregamento, sucesso, lista vazia e erro; após upload bem-sucedido, atualiza a lista.
- Download trata a resposta como binário e utiliza o nome recebido nos headers quando disponível.

### Limites conhecidos

- A lista existe apenas na memória do processo: reiniciar o backend deixa arquivos no disco sem metadados recuperáveis nesta fase.
- O modelo `default` não fornece autenticação nem privacidade entre usuários; não deve ser apresentado como multiusuário seguro.
- Esta fase não define limpeza automática de arquivos órfãos nem operação com múltiplas instâncias do backend.

## 8. Plano de execução

As etapas abaixo descrevem trabalho futuro. Esta especificação não executa nem modifica arquivos de backend ou frontend.

1. Preparar configuração de ambiente, criação/validação do diretório local e configuração Multer `diskStorage` com nome físico gerado e limite de 10 MiB.
2. Implementar repositórios para gravação/leitura de arquivos locais e armazenamento em memória dos metadados, incluindo compensação em caso de falha parcial.
3. Implementar serviços de upload, listagem e recuperação para download, aplicando as regras de identificador, dono padrão, ordenação e erros de domínio.
4. Implementar controllers e routes para os contratos descritos, mantendo o endpoint `/health` e convertendo erros do Multer e de storage para as respostas padronizadas.
5. Criar testes backend para sucesso de upload/listagem/download e casos de arquivo ausente, limite excedido, ID inexistente e falha de armazenamento; usar diretório temporário nos testes e limpá-lo ao final.
6. Implementar o serviço frontend de API e os componentes de upload, lista e download com estados de carregamento, erro e lista vazia.
7. Integrar frontend e backend via proxy `/api`, testar o fluxo ponta a ponta e validar que nenhum arquivo seja salvo fora do diretório local configurado.
8. Executar a suíte backend e o build frontend; revisar os contratos, limites de upload, tratamento de nomes e a documentação operacional.
