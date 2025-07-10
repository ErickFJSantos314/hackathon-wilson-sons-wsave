import React, { useState, useEffect, useRef } from 'react';
import { InferenceSession, Tensor } from 'onnxruntime-web';
import './App.css';

const classNames = [
  'Abafador de ruido',
  'Botas de seguranca',
  'Capacete de seguranca',
  'Luvas de protecao',
  'Mascara',
  'Oculos de protecao',
  'Pessoa',
  'Roupa de protecao',
];
const episToCheck = ['Capacete de seguranca', 'Luvas de protecao', 'Roupa de protecao'];

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
  const [loading, setLoading] = useState('Carregando modelo ONNX...');
  const [personDetected, setPersonDetected] = useState(false);
  const [detectedEPIs, setDetectedEPIs] = useState(new Set());
  const [showBoxes, setShowBoxes] = useState(false);
  const showBoxesRef = useRef(showBoxes);

  useEffect(() => {
    showBoxesRef.current = showBoxes;
  }, [showBoxes]);

  const successSound = new Audio('./sounds/sucesso.mp3');
  const allEpisOk = episToCheck.every((epi) => detectedEPIs.has(epi));
  const prevAllEpisOk = usePrevious(allEpisOk);

  useEffect(() => {
    if (personDetected && allEpisOk && !prevAllEpisOk) {
      successSound.play();
    }
  }, [allEpisOk, personDetected, prevAllEpisOk, successSound]);

  useEffect(() => {
    async function setup() {
      try {
        const modelUrl = './WSAVE.onnx';
        const options = { executionProviders: ['wasm'] };
        const newSession = await InferenceSession.create(modelUrl, options);
        console.log('Modelo carregado com sucesso.');
        setSession(newSession);
        setLoading('Modelo carregado. Iniciando câmera...');
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.onloadedmetadata = () => {
            console.log('Câmera iniciada.');
            setLoading('Câmera pronta');
            setInterval(() => runDetection(newSession), 200);
          };
        }
      } catch (e) {
        console.error('Falha na inicialização: ', e);
        setLoading(`Erro: ${e.message}`);
      }
    }
    setup();
  }, []);

  const preprocess = async (video) => {
    const modelInputSize = 416;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = modelInputSize;
    tempCanvas.height = modelInputSize;
    const ctx = tempCanvas.getContext('2d');
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
  console.log('Processando detecções...');
  const output = results.output0;
  if (!output?.data) return;

  const confidenceThreshold = 0.5;
  const numDetections = output.dims[2];
  const numClasses = classNames.length;

  let isPersonVisible = false;
  const currentEpisInFrame = new Set();

  const canvas = canvasRef.current;
  const video = videoRef.current;
  const ctx = canvas?.getContext('2d');
  if (ctx && canvas && video) {
    // Tamanho exibido do vídeo
    const videoBounds = video.getBoundingClientRect();
    canvas.width = videoBounds.width;
    canvas.height = videoBounds.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    console.log('Canvas resetado. Dimensões:', canvas.width, canvas.height);
  }

  // Parâmetros da normalização no preprocess
  const modelInputSize = 416;
  const videoRatio = video.videoWidth / video.videoHeight;
  let newWidth = modelInputSize;
  let newHeight = newWidth / videoRatio;
  if (newHeight > modelInputSize) {
    newHeight = modelInputSize;
    newWidth = newHeight * videoRatio;
  }
  const xOffset = (modelInputSize - newWidth) / 2;
  const yOffset = (modelInputSize - newHeight) / 2;

  const scaleX = canvas.width / newWidth;
  const scaleY = canvas.height / newHeight;

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
      console.log(`Classe detectada: ${label} | Confiança: ${maxProb}`);
      if (label === 'Pessoa') isPersonVisible = true;
      if (episToCheck.includes(label)) currentEpisInFrame.add(label);

      if (showBoxesRef.current && ctx && canvas && video) {
        // Coordenadas normalizadas (ainda no espaço 416x416)
        const cx_model = output.data[0 * numDetections + i];
        const cy_model = output.data[1 * numDetections + i];
        const w_model = output.data[2 * numDetections + i];
        const h_model = output.data[3 * numDetections + i];

        // Escalando para o tamanho real do vídeo exibido
        const cx = (cx_model - xOffset) * scaleX;
        const cy = (cy_model - yOffset) * scaleY;
        const w = w_model * scaleX;
        const h = h_model * scaleY;

        const x = cx - w / 2;
        const y = cy - h / 2;

        // Espelhamento horizontal — inverter o desenho no canvas
        ctx.save();
        ctx.scale(-1, 1); // inverte horizontalmente
        ctx.translate(-canvas.width, 0); // move a origem para o canto certo

        const mirroredX = canvas.width - (x + w);

        // Desenhar caixa
        ctx.strokeStyle = '#00A7E0';
        ctx.lineWidth = 2;
        ctx.strokeRect(mirroredX, y, w, h);

        // Desenhar legenda
        ctx.font = '16px Arial';
        const textPadding = 4;
        const textWidth = ctx.measureText(label).width;

        ctx.fillStyle = 'black';
        ctx.fillRect(mirroredX, y - 22, textWidth + textPadding * 2, 20);

        ctx.fillStyle = 'white';
        ctx.fillText(label, mirroredX + textPadding, y - 7);

        ctx.restore(); // volta ao estado original
      }
    }
  }

  console.log('Pessoa detectada?', isPersonVisible);
  console.log('EPIs detectados:', Array.from(currentEpisInFrame));
  console.log('showBoxes está ativado?', showBoxesRef.current);

  setPersonDetected(isPersonVisible);
  setDetectedEPIs(currentEpisInFrame);
};

  const runDetection = async (session) => {
    console.log('Executando runDetection');
    if (!session || !videoRef.current?.srcObject) return;
    try {
      const inputTensor = await preprocess(videoRef.current);
      const feeds = { images: inputTensor };
      const results = await session.run(feeds);
      console.log('Inferência executada. Resultado:', results);
      processDetections(results);
    } catch (e) {
      console.error('Erro durante a detecção: ', e);
    }
  };

  let finalStatus = loading;
  if (loading.startsWith('Câmera pronta')) {
    finalStatus = 'Aguardando pessoa...';
    if (personDetected) {
      finalStatus = allEpisOk ? 'STATUS: ACESSO LIBERADO' : 'STATUS: EPI(S) FALTANDO';
    }
  }

  return (
    <div className="App">
      <div className={personDetected ? 'sleep-screen hidden' : 'sleep-screen'}>
        <img src="./descanso.png" alt="Tela de Descanso Wilson Sons" />
      </div>

      <div className="main-interface">
        <div className="camera-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', zIndex: 1 }}
          />
          <canvas
            ref={canvasRef}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}
          />
        </div>

        <div
          className="toggle-button"
          onClick={() => setShowBoxes(!showBoxes)}
          role="button"
          tabIndex={0}
          aria-pressed={showBoxes}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setShowBoxes(!showBoxes);
            }
          }}
          style={{ position: 'absolute', top: 15, right: 15, zIndex: 30, userSelect: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, color: 'white', fontWeight: 'bold' }}
        >
          <div className={`switch ${showBoxes ? 'on' : 'off'}`}>
            <div className="toggle-circle" />
          </div>
          <span>{showBoxes ? 'Ocultar Caixas' : 'Mostrar Caixas'}</span>
        </div>

        <div className="header-panel">
          <h1>WSAVE</h1>
          <h3>Sistema de Análise e Verificação de EPIs</h3>
        </div>
        <div className="status-panel">
          <h2>{finalStatus}</h2>
        </div>
        <div className={personDetected ? 'checklist-panel visible' : 'checklist-panel'}>
          <h3>CHECKLIST DE EPIs</h3>
          <ul>
            {episToCheck.map((epi) => (
              <li key={epi} className={detectedEPIs.has(epi) ? 'detected' : ''}>
                {detectedEPIs.has(epi) ? '✅' : '❌'} {epi}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
