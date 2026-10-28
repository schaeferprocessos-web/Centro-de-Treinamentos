# Centro de Treinamentos — Schaefer Yachts

Sistema web para cadastro de funcionários, cursos, avaliações e acompanhamento de desempenho.

- Interface em português (Brasil)
- Sem login, conforme solicitado
- Histórico individual de avaliações, preservando cada prova
- Dashboard com filtros e indicadores
- Persistência compartilhada via Supabase (configuração por variáveis de ambiente)

## Configuração

1. Crie um projeto no Supabase.
2. Execute o SQL de `supabase/schema.sql` no SQL Editor.
3. Copie `.env.example` para `.env` e configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
4. Execute `npm install` e `npm run dev`.

**Atenção:** o aplicativo não exige login. Dados de notas de funcionários podem ficar visíveis a qualquer pessoa que consiga acessar o sistema. Configure políticas e acesso conforme a política da empresa antes de publicar.
