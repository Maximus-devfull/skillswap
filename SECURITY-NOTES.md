# Fase 1 — Primeiros cuidados de segurança

> Este repositório AINDA NÃO está pronto para cadastro de usuários reais.
> Login, mensagens e atualização de perfis continuam sem autorização adequada
> até a próxima etapa de refatoração.

## Incidente: chave de API e banco de dados no histórico

- Havia uma chave Gemini diretamente no arquivo `testar-ia.js`.
- Revogue a chave antiga no Google AI Studio / Google Cloud. Excluir apenas
  uma linha do código não invalida a chave nem apaga o histórico Git.
- Crie outra chave e guarde-a em `.env` apenas na sua máquina.
- O arquivo `banco.db` foi rastreado anteriormente no Git. Removê-lo em
  commits novos NÃO remove seu conteúdo de commits antigos ou forks.
- Caso haja usuários reais, trate suas senhas e dados como potencialmente
  expostos. Contas antigas precisarão redefinir suas senhas.
- Não publique backups de bancos, capturas com credenciais ou o conteúdo
  de seu arquivo `.env`.
- Considere limpar o histórico com uma ferramenta adequada e coordene
  qualquer reescrita com quem já clonou o repositório. Revogação e
  redefinição de senhas são necessárias independentemente disso.

## Arquivos de configuração

1. Copie `.env.example` para `.env`.
2. Preencha `GEMINI_API_KEY` com a chave NOVA sem compartilhar com ninguém.
3. Não adicione o arquivo `.env` ao Git.
4. Execute `npm install` e, depois, `node server.js` na raiz do projeto.

## Segurança ainda pendente

- Hash forte de senha e redefinição de credenciais antigas
- Sessões autenticadas, autorização por usuário e proteção contra CSRF
- Validação de entrada, limite de requisições e auditoria das dependências
- Eliminar risco de XSS na renderização de perfis e notificações
- Testes automatizados dos principais fluxos e permissões

**Não publique em produção até concluir e testar esses itens.**
