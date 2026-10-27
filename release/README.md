# Despezi LAN Demo 1.0.1 — instalador Windows

- Arquivo: [`Despezi-Setup-1.0.1.exe`](Despezi-Setup-1.0.1.exe)
- Tamanho: 67.593.935 bytes (aprox. 64,5 MiB / 67,6 MB decimal)
- SHA-256: `5b2941710a68111ba36ed174111b3a1c74d26f3323ab1f7cad9b9b602d0b77bc`
- Plataforma: Windows 10/11 x64
- Conteúdo: app, Node.js 22.23.4, Python 3.14.9, dependências e UI compilada.
- Instalação: por usuário. Não instala Node/Python no PATH global.

Confira o checksum em [`SHA256SUMS.txt`](SHA256SUMS.txt) antes de executar. O EXE não possui assinatura Authenticode e o Windows pode alertar sobre editor desconhecido. Não desative o Defender nem ignore políticas de segurança.

A regra opcional de rede permite TCP 3000 somente no perfil privado e na sub-rede local. O app usa HTTP sem criptografia; Google OAuth e SMTP/e-mails ficam desligados no modo de apresentação. Utilize apenas dados fictícios e uma rede privada confiável. Não exponha a porta à Internet.

Veja [INSTRUCOES.md](INSTRUCOES.md) para passos de instalação, conta administradora, acesso pelo celular e localização do banco. O banco não está incluído no instalador; dados locais do usuário são mantidos fora da pasta do programa.
