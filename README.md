# 🛡️ Guardião de EPI Digital

### Solução desenvolvida para o Hackathon 2025 da Wilson Sons

Um checkpoint de segurança inteligente para garantir a conformidade no uso de Equipamentos de Proteção Individual (EPIs) em tempo real, utilizando Inteligência Artificial diretamente no navegador.

---

###  डेमो ao Vivo

**(Link a ser atualizado após o deploy no GitHub Pages)**

**[>> Acesse a demonstração ao vivo aqui! <<](https://ErickFJSantos314.github.io/detector-epi-ws)**

---

### Visão Geral do Projeto

O Guardião de EPI Digital é um protótipo funcional que ataca o Desafio 2, propondo uma solução proativa para a segurança no trabalho. Em vez de uma verificação manual e reativa, a solução atua como um portão de acesso digital, analisando o vídeo da câmera em tempo real para validar se os colaboradores estão utilizando os EPIs corretos antes de entrarem em uma área de risco.

![Demonstração do Guardião de EPI em Ação](URL_DO_SEU_GIF_AQUI)
*(Dica: Grave um GIF da tela com o app funcionando usando um programa como o 'ScreenToGif' ou 'Giphy Capture' e suba para o seu repositório para colocar o link aqui)*

### ✨ Funcionalidades Principais

* **Detecção em Tempo Real:** Análise de vídeo diretamente do navegador, sem necessidade de enviar imagens para um servidor.
* **Modelo de IA Otimizado:** Utiliza um modelo YOLOv8 treinado para identificar múltiplas classes de EPIs e pessoas.
* **Execução Client-Side:** Todo o processamento da IA acontece no computador do usuário através do ONNX Runtime Web, garantindo privacidade, baixo custo e alta velocidade de resposta.
* **Interface Reativa:** Construída com React para um feedback visual instantâneo, com caixas de detecção e scores de confiança.

### 🛠️ Tecnologias Utilizadas

* **Front-end (Aplicação de Análise):**
    * **React.js:** Para a construção da interface de usuário.
    * **ONNX Runtime Web:** Para executar o modelo de IA diretamente no navegador.
    * **JavaScript (ES6+) & CSS3:** Para toda a lógica e estilização.

* **Inteligência Artificial (Treinamento do Modelo):**
    * **Python:** Linguagem principal para o treinamento.
    * **PyTorch:** Framework de deep learning.
    * **YOLOv8 (Ultralytics):** Arquitetura de detecção de objetos.

* **Cloud (Ambiente de Treinamento):**
    * **AWS SageMaker:** Para o provisionamento do ambiente e execução do treinamento.
    * **AWS S3:** Para armazenamento do dataset.

### 🚀 Como Executar o Projeto Localmente

**Pré-requisitos:**
* **Node.js e npm:** [Instale aqui](https://nodejs.org/)
* **Git:** [Instale aqui](https://git-scm.com/)

**Passos para Instalação:**

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/ErickFJSantos314/detector-epi-ws.git](https://github.com/ErickFJSantos314/detector-epi-ws.git)
    ```

2.  **Navegue até a pasta do projeto:**
    ```bash
    cd detector-de-epi-ws
    ```

3.  **Instale as dependências:**
    ```bash
    npm install
    ```

4.  **Inicie a aplicação:**
    ```bash
    npm start
    ```

5.  Abra seu navegador e acesse `http://localhost:3000`.

### 🗺️ Próximos Passos (Roadmap)

Este protótipo é a base para uma solução de produto completa. Os próximos passos na evolução do Guardião de EPI seriam:

* **Produto Físico (Totem):** Embarcar a solução em um hardware dedicado (mini-PC + câmera + tela) para instalação em pontos de acesso físicos.
* **Otimização de Performance:** Migrar a aplicação para uma solução nativa em Python com OpenCV para otimizar o uso de recursos no dispositivo embarcado.
* **Integração de Hardware:** Conectar o sistema a catracas, portas automáticas ou sinalizadores (luzes verde/vermelha) para controle de acesso físico.
* **Back-end e Dashboard:** Desenvolver uma API (ex: em Flask) para coletar dados de não conformidade e exibi-los em um dashboard para gestores de segurança.

### 👨‍💻 Autor

* **Erick Santos** - [GitHub](https://github.com/ErickFJSantos314)
