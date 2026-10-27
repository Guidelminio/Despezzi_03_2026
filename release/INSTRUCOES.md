# Instalação do Despezi LAN Demo 1.0.1

## Verificar o arquivo

Este pacote é para Windows 10/11 x64. Antes de executar, compare o SHA-256 com [`SHA256SUMS.txt`](SHA256SUMS.txt):

```powershell
Get-FileHash .\Despezi-Setup-1.0.1.exe -Algorithm SHA256
```

Hash esperado: `5b2941710a68111ba36ed174111b3a1c74d26f3323ab1f7cad9b9b602d0b77bc`. O instalador não possui assinatura Authenticode. O Windows pode exibir um aviso de editor desconhecido; não desative o Defender nem ignore políticas de segurança.

## Instalar e iniciar

Execute o instalador pelo perfil do usuário. Ele inclui Node.js 22.23.4, Python 3.14.9, dependências e o site compilado; não altera o PATH global e não precisa baixar esses runtimes.

A opção de firewall **Permitir acesso na rede Wi-Fi privada** é opcional e vem selecionada. Aceite UAC apenas se quiser a demonstração pela LAN e estiver usando uma rede confiável. A regra abre somente TCP 3000 para o perfil Private e a sub-rede local; ela não publica o servidor na Internet nem muda o perfil da rede. Não use essa opção em uma rede pública.

No Menu Iniciar, escolha **Despezi → Criar administrador**. Informe o e-mail e uma senha exclusiva do Despezi no prompt oculto; não existe senha padrão embutida. Se o endereço já pertence a uma conta comum, o script não o promove — use um endereço exclusivo. Em seguida, abra **Despezi → Abrir Despezi** e deixe a janela do servidor aberta.

No celular conectado à mesma rede Wi-Fi privada, abra `http://IP_DO_PC:3000`, substituindo `IP_DO_PC` pelo IPv4 exibido no console. Não use `localhost` no telefone. Redes de convidados ou isolamento de clientes podem impedir a conexão.

## Dados e segurança

O banco fica em `%LOCALAPPDATA%\Despezi\data\database.sqlite`, fora da pasta do programa; desinstalar o aplicativo preserva os dados. Faça backup antes de atualizar ou remover dados.

É uma demonstração local: Google OAuth e SMTP/e-mails estão desativados e o HTTP da LAN não é criptografado. Use apenas dados fictícios. Não insira informações financeiras reais, não encaminhe a porta do roteador e não exponha o servidor publicamente.

A instalação silenciosa, a presença dos runtimes, o módulo SQLite nativo e o contrato do worker Python foram testados no PC de construção. O executor não conseguiu completar o smoke HTTP local, e não foi testado um telefone físico nem a rede do evento; faça um ensaio antes da apresentação. Este software não foi declarado pronto para produção.
