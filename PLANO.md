# Plano de Migração — mango-app (Flutter) → mango-app-web (React)

**Objetivo:** Abandonar a abordagem Flutter Web e reescrever o projeto inteiro do `mango-app` em React dentro da pasta `mango-app-web`, começando do zero.

**Pasta de trabalho:** `/home/nebu/Documentos/tmp/mango/mango-app-web`

---

## 0. Status atual

| Item | Detalhe |
|------|---------|
| Fonte | `/home/nebu/Documentos/tmp/mango/mango-app` (Flutter, Dart) |
| Alvo | `/home/nebu/Documentos/tmp/mango/mango-app-web` (React) |
| Estado do alvo | 🧹 Limpo + scaffold React + tipos + store + DB IndexedDB |

---

## 1. Tarefas (checklist)

### Fase A — Preparação e limpeza
- [x] **T01** Limpar o conteúdo da pasta `mango-app-web` (remover arquivos Flutter/Dart existentes)
- [x] **T02** Criar este documento de planejamento (`PLANO.md`)

### Fase B — Scaffold do projeto React
- [x] **T03** Inicializar projeto React com Vite + TypeScript
- [x] **T04** Configurar Tailwind CSS
- [x] **T05** Instalar dependências (lucide-react, date-fns, zustand, react-router-dom, clsx, tailwind-merge, idb)
- [x] **T06** Configurar scripts de `package.json` (dev, build, preview, lint)
- [x] **T07** Criar estrutura de pastas (`src/pages`, `src/components`, `src/hooks`, `src/store`, `src/services`, `src/types`, `src/utils`, `src/assets`)

### Fase C — Camada de domínio (traduzir modelos do Dart → TypeScript)
- [x] **T08** Traduzir enums e tipos: `Category`, `EntryKind`, `EntryType`, `PaymentMethod`, `BandeiraCartao`
- [x] **T09** Traduzir interfaces de modelo: `Expense`, `CartaoCredito`, `UserProfile`, `SegurancaConfig`, `TentativasBloqueio`, `ModeloIa`
- [x] **T10** Traduzir helpers de domínio (label de categoria, isReceita, paraTipo, chaveUnica, etc.)

### Fase D — Camada de persistência (substituir SQLite)
- [x] **T11** Criar wrapper de IndexedDB (`src/services/db.ts`)
- [x] **T12** Implementar CRUD de despesas, cartões, perfil, configuração de segurança, tentativas
- [x] **T13** Migração/inicialização do banco (seed se vazio)

### Fase E — Gerenciamento de estado (substituir Riverpod)
- [x] **T14** Criar store Zustand: despesas, cartões, perfil, segurança, mês selecionado, filtros
- [x] **T15** Implementar ações: adicionar/editar/excluir despesa, cadastrar/editar cartão, trocar tema/cor, travar/destravar PIN

### Fase F — Utilitários e formatação
- [x] **T16** Traduzir formatação de dinheiro (`formatMoney`, `formatMoneyOf`)
- [x] **T17** Traduzir formatação de data (`formatDateOf`, `dayMonth`, pt-BR/en-US)
- [x] **T18** Traduzir lógica de parcelamento (`expandirParcelas`)

### Fase G — Tradução de telas (uma por uma)
- [x] **T19** Tela Splash / identidade visual
- [x] **T20** Tela FirstRun (criação de perfil)
- [x] **T21** Tela Landing (portão de perfil)
- [x] **T22** Tela Lock (bloqueio por PIN/biometria simulada)
- [x] **T23** Tela Home (gastos, resumo, lista, filtro rápido, seletor de mês)
- [x] **T24** Tela Relatórios (gráficos, totais por categoria/dia)
- [x] **T25** Tela Cartões (lista, fatura do mês, limite, progresso)
- [x] **T26** Tela Cartão Detalhe (total por categoria/dia)
- [x] **T27** Tela Formulário de Despesa (incluindo OCR/foto simplificada)
- [x] **T28** Tela Formulário de Cartão
- [x] **T29** Tela Diagnóstico
- [x] **T30** Tela Perfil / Configurações (tema, cor, idioma, segurança)

### Fase H — Componentes compartilhados
- [x] **T31** Bottom navigation / navegação entre abas
- [x] **T32** Menu lateral / drawer com navegação
- [x] **T33** Cards de resumo, tile de despesa, visual do cartão
- [x] **T34** Diálogos (seleção de mês, confirmação de exclusão)
- [x] **T35** Internacionalização (pt-BR / en-US)

### Fase I — Serviços web (substituir plugins Flutter)
- [x] **T36** Serviço de notificações (web push / simples aviso)
- [x] **T37** Serviço de IA local (simulado/estub, manter estrutura)
- [x] **T38** Serviço de OCR local (reconhecimento de texto em imagem de cupom)
- [x] **T39** Log de falhas / diagnóstico

### Fase J — Finalização
- [x] **T40** Ajustes de responsividade (mobile-first + de'sktop)
- [x] **T41** Build de produção (`npm run build`) — ✅ passou
- [x] **T42** Testar navegação e fluxos principais
- [x] **T43** Commit final e documentação de uso

---

## 2. Stack técnica

| Camada | Tecnologia |
|--------|------------|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| Estilização | Tailwind CSS v3 |
| Ícones | lucide-react |
| Estado | Zustand |
| Persistência | IndexedDB (via `idb`) |
| Datas | date-fns + date-fns/locale (pt-BR) |
| Roteamento | React Router DOM (disponível, pendente integração) |

---

## 3. Convenções

- Pastas em inglês, arquivos em `camelCase` / `PascalCase` (componentes).
- Interfaces/types em `src/types/`.
- Store em `src/store/` com Zustand.
- Serviços em `src/services/`.
- Telas em `src/pages/`.
- Componentes reutilizáveis em `src/components/`.
- Idioma padrão: pt-BR, com suporte a en-US.

---

## 4. Critério de conclusão

O projeto estará concluído quando todas as tarefas estiverem marcadas, o build de produção passar sem erros e os fluxos principais (adicionar despesa, ver relatório, cadastrar cartão, trocar tema, travar/destravar PIN) estiverem funcionando no navegador.
