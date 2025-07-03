import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { InferenceSession, Tensor } from 'onnxruntime-web';
import './App.css';

const classNames = ['Abafador de ruido', 'Botas de seguranca', 'Capacete de seguranca', 'Luvas de protecao', 'Mascara', 'Oculos de protecao', 'Pessoa', 'Roupa de protecao'];
const episToCheck = [ 'Capacete de seguranca', 'Oculos de protecao', 'Roupa de protecao'];

// Função auxiliar para "lembrar" o valor anterior de uma variável
function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [session, setSession] = useState(null);
  const [personDetected, setPersonDetected] = useState(false);
  const [detectedEPIs, setDetectedEPIs] = useState(new Set());
  const [loading, setLoading] = useState("Carregando modelo ONNX...");

  // --- LÓGICA DE SOM ---
  // 1. Carrega os sons. Garanta que eles estejam em 'public/sounds/'
  const successSound = new Audio('sucesso.mp3');
  const alertSound = new Audio('acessonegado.mp3');

  const allEpisOk = episToCheck.every(epi => detectedEPIs.has(epi));
  // 2. Guarda o status anterior para saber quando ocorre a MUDANÇA
  const prevAllEpisOk = usePrevious(allEpisOk);
  const prevPersonDetected = usePrevious(personDetected);

  // 3. Efeito que roda SOMENTE quando o status de detecção muda
  useEffect(() => {
    // Se uma pessoa acabou de aparecer e os EPIs NÃO estão OK -> Toca alerta
    if (personDetected && !prevPersonDetected && !allEpisOk) {
      alertSound.play();
    }
    
    // Se os EPIs ficaram OK AGORA mas não estavam antes -> Toca sucesso
    if (allEpisOk && !prevAllEpisOk) {
      successSound.play();
    }
  }, [personDetected, allEpisOk, prevPersonDetected, prevAllEpisOk, alertSound, successSound]);
  // --- FIM DA LÓGICA DE SOM ---

  useEffect(() => {
    async function setup() {
      try {
        const modelUrl = './best.onnx';
        const options = { executionProviders: ['webgl', 'wasm'] };
        const newSession = await InferenceSession.create(modelUrl, options);
        setSession(newSession);
        setLoading("Modelo carregado. Iniciando câmera...");

        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.onloadedmetadata = () => {
            setLoading("Câmera pronta. Aguardando pessoa...");
            setInterval(() => runDetection(newSession), 200);
          };
        }
      } catch (e) {
        console.error("Falha na inicialização: ", e);
        setLoading(`Erro: ${e.message}`);
      }
    }
    setup();
  }, []);

  const preprocess = async (video) => {
    const modelInputSize = 416;
    const canvas = document.createElement('canvas');
    canvas.width = modelInputSize;
    canvas.height = modelInputSize;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, modelInputSize, modelInputSize);
    const videoRatio = video.videoWidth / video.videoHeight;
    let newWidth = modelInputSize;
    let newHeight = newWidth / videoRatio;
    if (newHeight > modelInputSize) {
      newHeight = modelInputSize;
      newWidth = newHeight * videoRatio;
    }
    const xOffset = (modelInputSize - newWidth) / 2;
    const yOffset = (modelInputSize - newHeight) / 2;
    ctx.drawImage(video, xOffset, yOffset, newWidth, newHeight);
    const imageData = ctx.getImageData(0, 0, modelInputSize, modelInputSize);
    const { data } = imageData;
    const float32Data = new Float32Array(3 * modelInputSize * modelInputSize);
    for (let i = 0; i < modelInputSize * modelInputSize; i++) {
        float32Data[i] = data[i * 4] / 255.0;
        float32Data[i + modelInputSize * modelInputSize] = data[i * 4 + 1] / 255.0;
        float32Data[i + 2 * modelInputSize * modelInputSize] = data[i * 4 + 2] / 255.0;
    }
    return new Tensor('float32', float32Data, [1, 3, modelInputSize, modelInputSize]);
  };
  
  const processDetections = (results) => {
    const output = results.output0;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !output?.data) return;

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const confidenceThreshold = 0.50;
    const numDetections = output.dims[2];
    const numClasses = classNames.length;
    const modelInputSize = 416.0;

    const scale = Math.min(videoWidth / modelInputSize, videoHeight / modelInputSize);
    const xOffset = (videoWidth - modelInputSize * scale) / 2;
    const yOffset = (videoHeight - modelInputSize * scale) / 2;
    
    let isPersonVisible = false;
    const currentEpisInFrame = new Set();
    
    for (let i = 0; i < numDetections; i++) {
      let maxProb = 0;
      let classId = -1;
      
      for (let j = 0; j < numClasses; j++) {
        const prob = output.data[(j + 4) * numDetections + i];
        if (prob > maxProb) {
          maxProb = prob;
          classId = j;
        }
      }
      
      if (maxProb > confidenceThreshold) {
        const label = classNames[classId];

        if (label === "Pessoa") isPersonVisible = true;
        if (episToCheck.includes(label)) currentEpisInFrame.add(label);
      }
    }
    
    setPersonDetected(isPersonVisible);
    setDetectedEPIs(currentEpisInFrame);
  };
  
  const runDetection = async (session) => {
    if (!session || !videoRef.current?.srcObject) return;
    try {
        const inputTensor = await preprocess(videoRef.current);
        const feeds = { 'images': inputTensor };
        const results = await session.run(feeds);
        processDetections(results);
    } catch (e) { console.error("Erro durante a detecção: ", e); }
  };

  let videoContainerClass = "video-container";
  if (personDetected) {
    videoContainerClass += allEpisOk ? ' status-ok' : ' status-error';
  }

  return (
    <div className="App">
      <div className={videoContainerClass}>
        <video ref={videoRef} autoPlay playsInline muted />
        <canvas ref={canvasRef} />
      </div>
      <div className="header-panel">
        <h1>GUARDIÃO EPI - WS</h1>
      </div>
      <div className="status-panel">
        <h2>{personDetected ? (allEpisOk ? 'STATUS: ACESSO LIBERADO' : 'STATUS: EPI FALTANTE') : 'Aguardando Validação...'}</h2>
      </div>
      <div className={personDetected ? 'checklist-panel visible' : 'checklist-panel'}>
        <h3>CHECKLIST DE EPIs</h3>
        <ul>
            {episToCheck.map(epi => (
                <li key={epi} className={detectedEPIs.has(epi) ? 'detected' : ''}>
                    {detectedEPIs.has(epi) ? '✅' : '❌'} {epi}
                </li>
            ))}
        </ul>
      </div>
    </div>
  );
}

export default App;