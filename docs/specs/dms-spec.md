# Especificação - Document Management System

## 1. Objetivo

Permitir que usuários enviem, consultem e baixem seus documentos por uma aplicação web, com arquivos armazenados localmente e metadados mantidos em memória.

## 2. Escopo

### Dentro do escopo

- Envio de um documento por requisição.
- Listagem dos documentos associados ao usuário solicitante.
- Download de um documento pelo identificador.
- Associação de cada documento a um usuário.
- Interface web para envio, listagem e download.
- Armazenamento de arquivos no filesystem local em `backend/storage`, usando `multer` com `diskStorage`.
- Armazenamento dos metadados em memória.

### Fora do escopo

- Armazenamento externo ou em nuvem.
- Banco de dados ou persistência durável dos metadados.
- Autenticação, autorização baseada em papéis ou cadastro de usuários.
- Versionamento, edição, exclusão ou compartilhamento de documentos.
- Visualização ou conversão do conteúdo dos arquivos.
- Upload simultâneo de múltiplos arquivos na mesma requisição.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O usuário pode enviar um arquivo usando formulário `multipart/form-data`, no campo `file`. |
| RF-02 | O sistema rejeita requisições sem arquivo ou com mais de um arquivo. |
| RF-03 | O sistema gera um identificador único para cada documento. |
| RF-04 | O sistema grava o arquivo em `backend/storage` com nome gerado pelo sistema, sem usar o nome original como caminho. |
| RF-05 | O sistema registra os metadados do documento em memória após a gravação bem-sucedida do arquivo. |
| RF-06 | O sistema associa o documento ao usuário indicado na requisição. |
| RF-07 | O usuário pode listar somente os documentos associados à sua identidade. |
| RF-08 | A listagem apresenta metadados públicos e não expõe caminhos internos do filesystem. |
| RF-09 | A listagem é ordenada por data de envio, da mais recente para a mais antiga. |
| RF-10 | O usuário pode baixar um documento pelo identificador se o documento pertencer a ele. |
| RF-11 | O sistema responde `404` para documento inexistente ou pertencente a outro usuário, sem revelar sua existência. |
| RF-12 | A interface apresenta estados de carregamento, sucesso e erro para upload, listagem e download. |
| RF-13 | A interface atualiza a listagem após um upload bem-sucedido. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos são armazenados exclusivamente no filesystem local da aplicação, usando `multer` com `diskStorage`. |
| RNF-02 | Os metadados permanecem em memória. Ao reiniciar o backend, podem desaparecer mesmo que os arquivos permaneçam no disco. |
| RNF-03 | Configurações operacionais são obtidas por variáveis de ambiente, seguindo o princípio 12-Factor. |
| RNF-04 | O backend usa Node.js, Express e CommonJS; o frontend usa React, Vite e módulos ES. |
| RNF-05 | O código permanece em JavaScript, sem TypeScript nesta fase. |
| RNF-06 | O backend mantém a separação `routes -> controllers -> services -> repositories`. |
| RNF-07 | Erros de entrada, filesystem e persistência são tratados sem expor stack traces ao cliente. |
| RNF-08 | O nome original do arquivo não é usado para construir caminhos no filesystem. |
| RNF-09 | O tamanho máximo do upload é configurável; o padrão é 10 MiB. |
| RNF-10 | O frontend consome a API com `fetch` usando o prefixo `/api`; o proxy Vite remove esse prefixo ao encaminhar ao backend. |

## 5. Modelo de dados (metadados do documento)

### Metadados públicos

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | string | Sim | Identificador único gerado pelo servidor. |
| `originalName` | string | Sim | Nome original enviado pelo cliente, tratado como texto e nunca como caminho. |
| `size` | number | Sim | Tamanho do arquivo em bytes. |
| `uploadedAt` | string | Sim | Data e hora do upload em ISO 8601 UTC. |
| `owner` | string | Sim | Identificador do usuário proprietário. |
| `mimeType` | string ou null | Sim | Tipo MIME declarado pelo upload, quando disponível. |

### Dados internos de armazenamento

O repositório mantém a referência necessária para localizar o arquivo, mas esses dados não são enviados nas respostas da API.

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `storageName` | string | Nome interno, aleatório e gerado pelo servidor para o arquivo. |
| Caminho resolvido | string | Caminho local calculado durante a operação de leitura; não é exposto ao cliente. |

Os metadados são indexados por `id`. As listagens e consultas de download filtram pelo campo `owner`.

### Identificação do usuário

Como o projeto ainda não implementa autenticação, o MVP usa `X-User-Id` como identificador fornecido pelo cliente. Esse mecanismo é apenas demonstrativo: não autentica o solicitante e não deve ser considerado controle de acesso seguro em produção. Requisições sem valor não vazio recebem `400 Bad Request`.

## 6. Contratos de API

O backend expõe `/upload`, `/documents` e `/documents/:id/download`. O frontend chama `/api/upload`, `/api/documents` e `/api/documents/:id/download`; o proxy de desenvolvimento do Vite remove `/api` ao encaminhar as chamadas.

As rotas de documentos exigem:

```http
X-User-Id: identificador-do-usuario
```

### Formato de erro

Erros são retornados como JSON:

```json
{
  "error": {
    "code": "INVALID_FILE",
    "message": "Mensagem em português para o usuário."
  }
}
```

### `POST /upload`

- Entrada: `multipart/form-data`, com um arquivo no campo `file`.
- Cabeçalho obrigatório: `X-User-Id`.
- Limite padrão: 10 MiB, configurável por ambiente.
- Sucesso: `201 Created`, corpo JSON contendo metadados públicos do documento.
- Erros: `400` para usuário ausente ou arquivo ausente/inválido; `413` para arquivo acima do limite; `500` para falha inesperada de gravação ou registro.
- Se o registro dos metadados falhar após a gravação, o serviço tenta remover o arquivo recém-criado.

Exemplo de resposta:

```json
{
  "id": "identificador-gerado",
  "originalName": "relatorio.pdf",
  "size": 24576,
  "uploadedAt": "2026-11-10T12:00:00.000Z",
  "owner": "identificador-do-usuario",
  "mimeType": "application/pdf"
}
```

### `GET /documents`

- Cabeçalho obrigatório: `X-User-Id`.
- Sucesso: `200 OK`, lista JSON de metadados públicos pertencentes ao usuário.
- Usuário sem documentos recebe `[]`.
- Erros: `400` para usuário ausente; `500` para falha inesperada ao consultar o repositório.

### `GET /documents/:id/download`

- Cabeçalho obrigatório: `X-User-Id`.
- Sucesso: `200 OK`, conteúdo binário do arquivo com `Content-Disposition: attachment` e nome original tratado com segurança.
- Erros: `400` para usuário ausente; `404` para documento inexistente, de outro usuário ou arquivo não encontrado no disco; `500` para falha de leitura inesperada.

### `GET /health`

- Sucesso: `200 OK`, corpo JSON `{ "status": "ok" }`.
- Não exige identidade de usuário.

### Variáveis de ambiente

| Variável | Padrão | Uso |
| --- | --- | --- |
| `PORT` | `3000` | Porta HTTP do backend. |
| `STORAGE_DIR` | `backend/storage` | Diretório local de arquivos. |
| `MAX_FILE_SIZE_BYTES` | `10485760` | Tamanho máximo de upload em bytes. |

## 7. Decisões arquiteturais

- `routes/` declara caminhos e encaminha para controllers; `controllers/` valida a entrada HTTP e monta respostas; `services/` aplica as regras de negócio; `repositories/` acessa o filesystem e mantém metadados em memória.
- Multer com `diskStorage` grava arquivos no diretório local configurado. O nome físico é gerado pelo servidor; o nome original é preservado apenas nos metadados.
- O repositório de metadados e o acesso a arquivos são responsabilidades de persistência. Não se usa banco de dados ou provedor externo nesta fase.
- O frontend React usa `fetch`; as chamadas usam `/api` para integrar com o proxy Vite.
- O cabeçalho `X-User-Id` não autentica o solicitante. O isolamento por proprietário no MVP não é uma fronteira de segurança para exposição pública.
- Metadados em memória são perdidos ao reiniciar o processo. Os arquivos podem permanecer no disco sem referência; persistência durável e reconciliação de arquivos órfãos estão fora do escopo.
- O MIME type é declarado pelo cliente e não prova que o conteúdo seja seguro. Não há inspeção antivírus nesta fase.
- O backend cria o diretório de armazenamento quando necessário e não retorna caminhos internos nas respostas.

## 8. Plano de execução

1. **Formalizar contratos e critérios**
   - Artefato: `docs/specs/dms-spec.md`.
   - Aceite: escopo, requisitos, modelo de dados, rotas, erros, limites e premissas de identidade documentados.

2. **Preparar a composição do backend**
   - Módulos: `backend/src/app.js`, `backend/src/routes/`, `backend/src/controllers/` e `backend/src/config.js`.
   - Aceite: app registra health check e rotas de documentos; controllers validam a entrada HTTP e delegam regras ao service.

3. **Implementar upload e persistência local**
   - Módulos: `backend/src/middleware/`, `backend/src/services/` e `backend/src/repositories/`.
   - Aceite: multer usa `diskStorage`; nome interno é gerado; tamanho é limitado; metadados ficam em memória; falhas de registro tentam remover arquivo recém-gravado.

4. **Implementar listagem e download**
   - Módulos: services, repositories, controllers e rotas de documentos.
   - Aceite: listagem filtra pelo proprietário e ordena por data; download verifica propriedade; caminho interno não é exposto.

5. **Construir a interface React**
   - Módulos: `frontend/src/App.jsx`, `frontend/src/components/` e `frontend/src/services/`.
   - Aceite: interface permite upload, listagem e download; mostra estados de carregamento, sucesso, lista vazia e erro; chamadas usam `/api`.

6. **Validar contratos e integração**
   - Testes: `backend/test/app.test.js` usando `node:test`.
   - Aceite: testes cobrem health check, usuário ausente, arquivo ausente, upload válido, tamanho máximo, isolamento por usuário e download autorizado/não autorizado; `npm test` no backend e `npm run build` no frontend passam.

## 9. Estado da implementação

As etapas 1 a 6 foram implementadas. A suíte automatizada atual cobre health check, validações de usuário e arquivo, upload válido, limite de tamanho, listagem isolada por usuário e download autorizado ou negado. A identidade por `X-User-Id` permanece demonstrativa, conforme o escopo.