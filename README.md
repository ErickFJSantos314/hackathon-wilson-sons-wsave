<<<<<<< HEAD
# 🛡️ Guardião de EPI Digital

### Solução desenvolvida para o Hackathon 2025 da Wilson Sons

Um checkpoint de segurança inteligente para garantir a conformidade no uso de Equipamentos de Proteção Individual (EPIs) em tempo real, utilizando Inteligência Artificial diretamente no navegador.

---

### Demo ao Vivo

**[>> Acesse a demonstração ao vivo aqui! <<](https://ErickFJSantos314.github.io/detector-epi-ws)**

---

### Visão Geral do Projeto

O Guardião de EPI Digital é um protótipo funcional que ataca o Desafio 2, propondo uma solução proativa para a segurança no trabalho. Em vez de uma verificação manual e reativa, a solução atua como um portão de acesso digital, analisando o vídeo da câmera em tempo real para validar se os colaboradores estão utilizando os EPIs corretos antes de entrarem em uma área de risco.


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
=======
# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
>>>>>>> master
