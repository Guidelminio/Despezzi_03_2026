# Guia do dia da apresentação — Despezi

**Data-alvo:** 12/11/2026. Este roteiro assume que a pasta do projeto já foi copiada para o computador apresentador. O celular acessa o site responsivo pelo navegador; não há APK/IPA, instalação nativa ou uso offline.

## Antes do dia

No computador, confirme **Node.js 20+**, npm e **Python 3.9+** (`python --version` no Windows ou `python3 --version` no macOS/Linux). Na pasta do projeto, execute `npm ci` com antecedência para baixar dependências e verifique que o comando termina. Depois, conecte o computador e o telefone à mesma rede Wi‑Fi privada. Evite a rede de convidados ou “client isolation”, que pode impedir que os aparelhos conversem.

Faça um ensaio com o telefone físico pelo menos uma vez antes da apresentação. Teste o firewall, o login nos dois aparelhos e a visualização dos mesmos dados. Use sempre uma conta, e-mail, transações e motivo de objetivo fictícios. O envio de e-mails e o login Google ficam desativados no modo de apresentação.

## Iniciar no computador

Abra um terminal na pasta do projeto e execute:

```powershell
npm run presentation
```

O comando está preparado para PowerShell/Prompt, macOS e Linux; foi exercitado neste ambiente Linux, mas o runner Windows ainda precisa de ensaio no computador apresentador. O runner compila a interface localmente, inicia Node/Express na porta 3000 e usa `database-presentation.sqlite`, um banco separado. Mantenha essa janela aberta durante a demo. No computador apresentador, acesse `http://localhost:3000`.

O terminal mostra os endereços IPv4 privados detectados. No celular, usando a mesma rede, abra no navegador `http://<IP_DO_COMPUTADOR>:3000` — substitua pelo endereço impresso, sem `localhost`. Faça login no telefone com a mesma conta fictícia criada no computador; cada aparelho mantém a própria sessão, mas usa o mesmo banco no computador.

Se o Windows pedir autorização de firewall, permita somente em **redes privadas**. Se bloquear sem mostrar o aviso, um administrador pode criar uma regra local restrita:

```powershell
New-NetFirewallRule -DisplayName "Despezi Demo 3000" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3000 -Profile Private -RemoteAddress LocalSubnet
```

Depois da apresentação, remova a regra:

```powershell
Remove-NetFirewallRule -DisplayName "Despezi Demo 3000"
```

## Se o celular não abrir o site

Confirme que o servidor continua rodando, que o telefone está na mesma rede privada, que o IP digitado é o anunciado no terminal e que a URL usa `http://` e a porta `3000`. Redes de convidados podem isolar dispositivos; nesse caso use uma rede privada compartilhada ou um hotspot confiável. Não exponha a rede do computador em perfil público, não encaminhe a porta no roteador e não crie túnel/URL pública.

## Encerrar e limpar

Na janela do servidor, pressione `Ctrl+C`. Para começar do zero na próxima demo, confirme que o processo parou e apague apenas `database-presentation.sqlite` e, se existirem, `database-presentation.sqlite-wal` e `database-presentation.sqlite-shm`. Não apague `database.sqlite` nem arquivos de banco que queira preservar. Esta demo usa HTTP na LAN e não cifra tráfego: não digite informações reais.

## Limites

O Sandbox validou o build estático e a matriz de viewports simulados, mas não conseguiu testar um telefone físico, a rede do evento ou o Firewall do Windows. Por isso o ensaio real antes do dia é obrigatório. Para detalhes técnicos e limitações de segurança, consulte o [README](README.md) e a [documentação técnica](DOCUMENTACAO_TCC.md).
