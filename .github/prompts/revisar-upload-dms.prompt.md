---
name: revisar-upload-dms
description: "Revisa alterações no upload, armazenamento local e APIs de documentos do DMS com foco em segurança e contrato."
argument-hint: "escopo opcional (por exemplo backend/src/routes)"
agent: code-reviewer
---

# Revisar fluxo de documentos do DMS

Revise as alterações em `${input:escopo:arquivos alterados relacionados a upload ou documentos}`. Se o escopo não for informado, use as alterações atuais e os arquivos diretamente relacionados.

Leia `docs/specs/dms-spec.md`, `.github/copilot-instructions.md`, a implementação pertinente e seus testes antes de concluir. Siga os dados entre arquivos; não trate uma busca por padrões como prova de vulnerabilidade.

## Verificações

- Rastreie o arquivo multipart e os parâmetros da rota desde `routes` e `controllers` por `services` até `repositories`, filesystem e resposta HTTP.
- Confira `multer` com `diskStorage`, limite de 10 MiB, nome físico gerado e que `originalName` nunca seja usado como caminho.
- Confira os paths e respostas de `POST /upload`, `GET /documents` e `GET /documents/:id/download` contra a especificação, incluindo erros, metadados expostos e `Content-Disposition`.
- Verifique tratamento de falha parcial de gravação, arquivo ausente, erros do Multer e mensagens que poderiam expor detalhes internos.
- Confira se os testes cobrem os comportamentos relevantes e sinalize verificações que não puderam ser confirmadas no código.
- Considere que a especificação define protótipo local de usuário único, `owner: default`, metadados em memória e nenhuma autenticação. Não classifique essas decisões explicitamente documentadas como defeitos fora de contexto.

## Regras da revisão

- Não edite arquivos nem aplique correções.
- Reporte apenas defeitos apoiados por evidência no código; reabra cada trecho para descartar validações ou proteções existentes antes de concluir.
- Não afirme que um teste foi executado sem evidência de execução.
- Priorize os achados por severidade: crítico, alto, médio ou baixo.

## Formato de saída

Comece pelos achados. Para cada achado, informe:

- Severidade e título curto.
- Arquivo e símbolo ou linha relevante.
- Evidência observada.
- Impacto concreto.
- Menor correção recomendada.

Se não encontrar defeitos confirmados, declare isso claramente e liste as lacunas de validação restantes. Termine com um resumo curto do escopo revisado.

## Referência de adaptação

Adaptado para este projeto a partir da abordagem de fluxo de dados, auto-verificação e priorização do [security-review](https://github.com/github/awesome-copilot/tree/main/skills/security-review) em `github/awesome-copilot`. O conteúdo foi ajustado ao contrato e às restrições do DMS.
