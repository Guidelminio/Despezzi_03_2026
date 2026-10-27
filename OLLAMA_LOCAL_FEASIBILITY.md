# Viabilidade preliminar: Ollama local para o Despezi

**Conclusão:** a ideia é tecnicamente viável como etapa futura. O padrão mais seguro para a apresentação seria executar Ollama e Node no mesmo computador, manter a API do modelo apenas em `127.0.0.1:11434` e deixar o celular falar somente com o site Node na rede privada. Não é necessário expor Ollama ao Wi-Fi nem à Internet.

## Requisitos e limites conhecidos

O Ollama tem instalador nativo para Windows 10 22H2 ou mais recente e serve sua API local em `http://localhost:11434`. A instalação do binário requer pelo menos 4 GB de espaço; os modelos precisam de armazenamento adicional, que pode chegar a dezenas ou centenas de GB [1]. A aceleração depende do hardware: a documentação lista suporte para GPUs NVIDIA e AMD específicas, drivers correspondentes e Metal em dispositivos Apple [2]. As páginas consultadas não definem um mínimo universal de RAM ou VRAM: consumo e velocidade dependem do modelo, quantização, contexto e se a execução fica na CPU, GPU ou dividida. O próprio `ollama ps` informa essa divisão após o carregamento [3].

A API local oferece compatibilidade parcial com o formato OpenAI em `http://localhost:11434/v1`, incluindo `/v1/chat/completions`. Para esse servidor local, o campo de API key é ignorado pelo Ollama [4]. O FAQ confirma que o servidor usa `127.0.0.1:11434` por padrão e que o bind pode ser alterado por `OLLAMA_HOST` [3]. Portanto, não mude esse endereço para `0.0.0.0`: mantenha Ollama no loopback e deixe Node atuar como único intermediário. Para modo estritamente local, desative os recursos de nuvem com `OLLAMA_NO_CLOUD=1` ou `disable_ollama_cloud` [3].

## Integração futura sugerida

No Despezi, a interface React no telefone enviaria a solicitação ao Node/Express do computador. O Node verificaria a sessão, aplicaria limites de tamanho/tempo e chamaria `http://127.0.0.1:11434` com um modelo escolhido. Assim, o navegador não precisaria conhecer o endpoint Ollama, e a porta 11434 continuaria inacessível aos outros aparelhos. A API compatível usa o caminho local `/v1/chat/completions` [4].

A IA deve ser separada dos insights determinísticos já existentes: apresentar explicações como sugestões, nunca alterar metas, limites ou transações. Por padrão, não enviar nomes, e-mails, descrições de lançamentos ou motivos privados; construir no Node um contexto mínimo, agregado e explícito. Essa camada ainda não foi implementada.

## O que falta para dimensionar

O computador autorizado `DESKTOP-F2GDIMA` estava offline nesta revisão, então não consegui medir especificações. Para recomendar um modelo e estimar velocidade, preciso do sistema operacional e versão, processador, RAM, modelo da GPU e VRAM, além do espaço livre em disco. Até obter esses dados, não recomendo baixar um modelo específico. A máquina também deve permanecer ligada durante a demo e o uso futuro do serviço local.

## Referências

[1]: https://docs.ollama.com/windows "Ollama para Windows"
[2]: https://docs.ollama.com/gpu "Hardware e GPUs suportadas pelo Ollama"
[3]: https://docs.ollama.com/faq "Perguntas frequentes do Ollama: servidor, privacidade e recursos de nuvem"
[4]: https://docs.ollama.com/api/openai-compatibility "Compatibilidade da API OpenAI no Ollama"
