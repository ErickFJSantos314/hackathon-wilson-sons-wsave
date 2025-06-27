import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { InferenceSession, Tensor } from 'onnxruntime-web';
import './App.css';

const classNames = ['Abafador de ruido', 'Botas de seguranca', 'Capacete de seguranca', 'Luvas de protecao', 'Mascara', 'Oculos de protecao', 'Pessoa', 'Roupa de protecao'];

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState("Carregando modelo ONNX...");

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
            setLoading("Câmera pronta. Pronto para detectar!");
          };
        }
      } catch (e) {
        console.error("Falha na inicialização: ", e);
        setLoading(`Erro: ${e.message}`);
      }
    }
    setup();
  }, []);

  useEffect(() => {
    let intervalId;
    if (session && loading === "Câmera pronta. Pronto para detectar!") {
      intervalId = setInterval(() => {
        runDetection(session);
      }, 100); 
    }
    return () => clearInterval(intervalId);
  }, [session, loading]);

  const preprocess = async (video) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const inputSize = 416;
    canvas.width = inputSize;
    canvas.height = inputSize;
    ctx.drawImage(video, 0, 0, inputSize, inputSize);
    const imageData = ctx.getImageData(0, 0, inputSize, inputSize);
    const { data } = imageData;
    const float32Data = new Float32Array(3 * inputSize * inputSize);
    for (let i = 0; i < inputSize * inputSize; i++) {
        float32Data[i] = data[i * 4] / 255.0;
        float32Data[i + inputSize * inputSize] = data[i * 4 + 1] / 255.0;
        float32Data[i + 2 * inputSize * inputSize] = data[i * 4 + 2] / 255.0;
    }
    return new Tensor('float32', float32Data, [1, 3, inputSize, inputSize]);
  };
  
  // >>>>>>>>>>>>> A FÓRMULA MATEMÁTICA FINALMENTE CORRETA <<<<<<<<<<<<<<<
  const drawBoundingBoxes = (results) => {
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
    const modelInputSize = 416.0; // O tamanho da imagem que o modelo espera

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
        
        // As coordenadas vêm em pixels relativos ao input de 416x416
        const x_center_raw = output.data[i];
        const y_center_raw = output.data[i + numDetections];
        const width_raw = output.data[i + 2 * numDetections];
        const height_raw = output.data[i + 3 * numDetections];

        // 1. Normalizamos as coordenadas (dividimos pelo tamanho do input do modelo)
        const x_center_norm = x_center_raw / modelInputSize;
        const y_center_norm = y_center_raw / modelInputSize;
        const width_norm = width_raw / modelInputSize;
        const height_norm = height_raw / modelInputSize;

        // 2. Escalamos para o tamanho real do vídeo
        const w = width_norm * videoWidth;
        const h = height_norm * videoHeight;
        const x = x_center_norm * videoWidth - (w / 2);
        const y = y_center_norm * videoHeight - (h / 2);
        
        // Desenha
        ctx.strokeStyle = '#00FF00'; // Verde Sucesso!
        ctx.lineWidth = 4;
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        const font = '18px Arial';
        ctx.font = font;
        const text = `${label} (${(maxProb * 100).toFixed(1)}%)`;
        ctx.fillRect(x, y - 22, ctx.measureText(text).width + 10, 22);
        ctx.fillStyle = '#00FF00';
        ctx.fillText(text, x + 5, y - 5);
      }
    }
  };
  
  const runDetection = async (session) => {
    if (!session || !videoRef.current?.srcObject || !videoRef.current.videoWidth) return;
    try {
        const inputTensor = await preprocess(videoRef.current);
        const feeds = { 'images': inputTensor };
        const results = await session.run(feeds);
        drawBoundingBoxes(results);
    } catch (e) {
      console.error("Erro durante a detecção: ", e);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Detector de EPI - Wilson Sons</h1>
        <div className="video-container">
          <video ref={videoRef} autoPlay playsInline muted />
          <canvas ref={canvasRef} />
        </div>
        <h2>{loading}</h2>
      </header>
    </div>
  );
}

export default App;