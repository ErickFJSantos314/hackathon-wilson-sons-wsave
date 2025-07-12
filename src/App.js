import React, { useState, useEffect, useRef } from 'react';
import { InferenceSession, Tensor } from 'onnxruntime-web';
import './App.css';

console.log('PUBLIC_URL local:', process.env.PUBLIC_URL)
const nomesClasses = [
  'Abafador de ruido',
  'Botas de seguranca',
  'Capacete de seguranca',
  'Luvas de protecao',
  'Mascara',
  'Oculos de protecao',
  'Pessoa',
  'Roupa de protecao',
];
const episParaVerificar = [
  'Capacete de seguranca',
  'Oculos de protecao',
  'Roupa de protecao'
  ];

function useValorAnterior(valor) {
  const referencia = useRef();
  useEffect(() => {
    referencia.current = valor;
  });
  return referencia.current;
}

function Aplicativo() {
  const referenciaVideo = useRef(null);
  const referenciaTela = useRef(null);
  const [sessao, definirSessao] = useState(null);
  const [carregando, definirCarregando] = useState('Carregando modelo ONNX...');
  const [pessoaDetectada, definirPessoaDetectada] = useState(false);
  const [episDetectados, definirEpisDetectados] = useState(new Set());
  const [exibirCaixas, definirExibirCaixas] = useState(false);
  const referenciaExibirCaixas = useRef(exibirCaixas);

  useEffect(() => {
    referenciaExibirCaixas.current = exibirCaixas;
  }, [exibirCaixas]);

  // Configuração de som
  const somSucesso = new Audio('./sounds/sucesso.mp3');
  const todosEpisOk = episParaVerificar.every((epi) => episDetectados.has(epi));
  const valorAnteriorTodosEpisOk = useValorAnterior(todosEpisOk);

  useEffect(() => {
    if (pessoaDetectada && todosEpisOk && !valorAnteriorTodosEpisOk) {
      somSucesso.play();
    }
  }, [todosEpisOk, pessoaDetectada, valorAnteriorTodosEpisOk, somSucesso]);

  // Inicialização da câmera e modelo
  useEffect(() => {
    async function inicializar() {
      try {
        const urlModelo = './WSAVE.onnx';
        const opcoes = { executionProviders: ['wasm'] };
        const novaSessao = await InferenceSession.create(urlModelo, opcoes);
        definirSessao(novaSessao);
        definirCarregando('Modelo carregado. Iniciando câmera...');
        const fluxo = await navigator.mediaDevices.getUserMedia({ video: true });
        const video = referenciaVideo.current;
        if (video) {
          video.srcObject = fluxo;
          video.onloadedmetadata = () => {
            definirCarregando('Câmera pronta');
            setInterval(() => executarDeteccao(novaSessao), 200);
          };
        }
      } catch (e) {
        console.error('Falha na inicialização: ', e);
        definirCarregando(`Erro: ${e.message}`);
      }
    }
    inicializar();
  }, []);

  // Pré-processamento da imagem
  const preprocessar = async (video) => {
    const tamanhoEntradaModelo = 416;
    const telaTemporaria = document.createElement('canvas');
    telaTemporaria.width = tamanhoEntradaModelo;
    telaTemporaria.height = tamanhoEntradaModelo;
    const contexto = telaTemporaria.getContext('2d');
    contexto.fillStyle = '#808080';
    contexto.fillRect(0, 0, tamanhoEntradaModelo, tamanhoEntradaModelo);
    const proporcaoVideo = video.videoWidth / video.videoHeight;
    let novaLargura = tamanhoEntradaModelo;
    let novaAltura = novaLargura / proporcaoVideo;
    if (novaAltura > tamanhoEntradaModelo) {
      novaAltura = tamanhoEntradaModelo;
      novaLargura = novaAltura * proporcaoVideo;
    }
    const deslocamentoX = (tamanhoEntradaModelo - novaLargura) / 2;
    const deslocamentoY = (tamanhoEntradaModelo - novaAltura) / 2;
    contexto.drawImage(video, deslocamentoX, deslocamentoY, novaLargura, novaAltura);
    const dadosImagem = contexto.getImageData(0, 0, tamanhoEntradaModelo, tamanhoEntradaModelo);
    const { data } = dadosImagem;
    const dadosFloat32 = new Float32Array(3 * tamanhoEntradaModelo * tamanhoEntradaModelo);
    for (let i = 0; i < tamanhoEntradaModelo * tamanhoEntradaModelo; i++) {
      dadosFloat32[i] = data[i * 4] / 255.0;
      dadosFloat32[i + tamanhoEntradaModelo * tamanhoEntradaModelo] = data[i * 4 + 1] / 255.0;
      dadosFloat32[i + 2 * tamanhoEntradaModelo * tamanhoEntradaModelo] = data[i * 4 + 2] / 255.0;
    }
    return new Tensor('float32', dadosFloat32, [1, 3, tamanhoEntradaModelo, tamanhoEntradaModelo]);
  };

  // Processamento das detecções
  const processarDeteccoes = (resultados) => {
    const saida = resultados.output0;
    if (!saida?.data) return;

    const limiteConfianca = 0.5;
    const numeroDeteccoes = saida.dims[2];
    const numeroClasses = nomesClasses.length;

    let pessoaVisivel = false;
    const episNoQuadro = new Set();

    const tela = referenciaTela.current;
    const video = referenciaVideo.current;
    const contexto = tela?.getContext('2d');
    if (contexto && tela && video) {
      const limitesVideo = video.getBoundingClientRect();
      tela.width = limitesVideo.width;
      tela.height = limitesVideo.height;
      contexto.clearRect(0, 0, tela.width, tela.height);
    }

    const tamanhoEntradaModelo = 416;
    const proporcaoVideo = video.videoWidth / video.videoHeight;
    let novaLargura = tamanhoEntradaModelo;
    let novaAltura = novaLargura / proporcaoVideo;
    if (novaAltura > tamanhoEntradaModelo) {
      novaAltura = tamanhoEntradaModelo;
      novaLargura = novaAltura * proporcaoVideo;
    }
    const deslocamentoX = (tamanhoEntradaModelo - novaLargura) / 2;
    const deslocamentoY = (tamanhoEntradaModelo - novaAltura) / 2;

    const escalaX = tela.width / novaLargura;
    const escalaY = tela.height / novaAltura;

    for (let i = 0; i < numeroDeteccoes; i++) {
      let confiancaMaxima = 0;
      let idClasse = -1;

      for (let j = 0; j < numeroClasses; j++) {
        const probabilidade = saida.data[(j + 4) * numeroDeteccoes + i];
        if (probabilidade > confiancaMaxima) {
          confiancaMaxima = probabilidade;
          idClasse = j;
        }
      }

      if (confiancaMaxima > limiteConfianca) {
        const rotulo = nomesClasses[idClasse];
        if (rotulo === 'Pessoa') pessoaVisivel = true;
        if (episParaVerificar.includes(rotulo)) episNoQuadro.add(rotulo);

        if (referenciaExibirCaixas.current && contexto && tela && video) {
          const cx_modelo = saida.data[0 * numeroDeteccoes + i];
          const cy_modelo = saida.data[1 * numeroDeteccoes + i];
          const w_modelo = saida.data[2 * numeroDeteccoes + i];
          const h_modelo = saida.data[3 * numeroDeteccoes + i];

          const cx = (cx_modelo - deslocamentoX) * escalaX;
          const cy = (cy_modelo - deslocamentoY) * escalaY;
          const w = w_modelo * escalaX;
          const h = h_modelo * escalaY;

          const x = cx - w / 2;
          const y = cy - h / 2;

          contexto.save();
          contexto.scale(-1, 1);
          contexto.translate(-tela.width, 0);

          const xEspelhado = tela.width - (x + w);

          contexto.strokeStyle = '#00A7E0';
          contexto.lineWidth = 2;
          contexto.strokeRect(xEspelhado, y, w, h);

          contexto.font = '16px Arial';
          const espacamentoTexto = 4;
          const larguraTexto = contexto.measureText(rotulo).width;

          contexto.fillStyle = 'black';
          contexto.fillRect(xEspelhado, y - 22, larguraTexto + espacamentoTexto * 2, 20);

          contexto.fillStyle = 'white';
          contexto.fillText(rotulo, xEspelhado + espacamentoTexto, y - 7);

          contexto.restore();
        }
      }
    }

    definirPessoaDetectada(pessoaVisivel);
    definirEpisDetectados(episNoQuadro);
  };

  // Execução da detecção
  const executarDeteccao = async (sessao) => {
    if (!sessao || !referenciaVideo.current?.srcObject) return;
    try {
      const tensorEntrada = await preprocessar(referenciaVideo.current);
      const alimentacoes = { images: tensorEntrada };
      const resultados = await sessao.run(alimentacoes);
      processarDeteccoes(resultados);
    } catch (e) {
      console.error('Erro durante a detecção: ', e);
    }
  };

  // Definição do status final
  let statusFinal = carregando;
  if (carregando.startsWith('Câmera pronta')) {
    statusFinal = 'Aguardando pessoa...';
    if (pessoaDetectada) {
      statusFinal = todosEpisOk ? 'STATUS: ACESSO LIBERADO' : 'STATUS: EPI(S) FALTANDO';
    }
  }

  return (
    <div className="App">
      <div className={pessoaDetectada ? 'telaDescanso oculto' : 'telaDescanso'}>
        <img src="./descanso.png" alt="Tela de Descanso Wilson Sons" />
      </div>

      <div className="interfacePrincipal">
        <div className="containerCamera" style={{ position: 'relative', width: '100%', height: '100%' }}>
          <video
            ref={referenciaVideo}
            autoPlay
            playsInline
            muted
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', zIndex: 1 }}
          />
          <div className="painelStatus">
            <h2>{statusFinal}</h2>
          </div>
          <canvas
            ref={referenciaTela}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}
          />
        </div>

        <div
          className="botaoAlternancia"
          onClick={() => definirExibirCaixas(!exibirCaixas)}
          role="button"
          tabIndex={0}
          aria-pressed={exibirCaixas}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              definirExibirCaixas(!exibirCaixas);
            }
          }}
          style={{ position: 'absolute', top: 15, right: 15, zIndex: 10, userSelect: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, color: 'white', fontWeight: 'bold' }}
        >
          <div className={`interruptor ${exibirCaixas ? 'ligado' : 'desligado'}`}>
            <div className="circuloAlternancia" />
          </div>
          <span>{exibirCaixas ? 'Ocultar Caixas' : 'Mostrar Caixas'}</span>
        </div>

        <div className="painelCabecalho">
          <h1>WSAVE</h1>
          <h3>Sistema de Análise e Verificação de EPIs</h3>
        </div>
        <div className={pessoaDetectada ? 'painelLista visivel' : 'painelLista'}>
          <h3>CHECKLIST DE EPIs</h3>
          <ul>
            {episParaVerificar.map((epi) => (
              <li key={epi} className={episDetectados.has(epi) ? 'detectado' : ''}>
                {episDetectados.has(epi) ? '✅' : '❌'} {epi}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Aplicativo;