import { useState, useEffect } from 'react'; // Ya no necesitamos useCallback obligatoriamente
import './App.css';
import type { Block, ChainResponse } from './types';
import SHA256 from 'crypto-js/sha256';

function App() {
  const [blockchain, setBlockchain] = useState<Block[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [miningStatus, setMiningStatus] = useState<string>("");
  const [form, setForm] = useState({ emisor: '', receptor: '', cantidad: 0 });

  const myWalletAddress = "Usuario_React_123";

  const getBlockchainData = async (): Promise<Block[]> => {
    try {
      const response = await fetch('http://localhost:5000/chain');
      const data: ChainResponse = await response.json();
      return data.chain;
    } catch (error) {
      console.error("Error:", error);
      return [];
    }
  };

  // --- 2. EFECTO DE CARGA INICIAL ---
  useEffect(() => {
    // Definimos la lógica de carga DENTRO del efecto
    const init = async () => {
      // Opcional: setLoading(true) aquí si quieres, pero para la carga inicial 
      // a veces es mejor mostrar el estado vacío directamente para evitar parpadeos.
      const data = await getBlockchainData();
      setBlockchain(data);
    };
    
    init();
  }, []); // Array vacío: Solo se ejecuta 1 vez al montar

  // --- 3. MANEJADORES DE EVENTOS ---

  const handleClientSideMining = async () => {
    setLoading(true);
    setMiningStatus("Solicitando trabajo al servidor...");

    try {
      // 1. Pedir los datos del bloque al servidor
      const jobResponse = await fetch('http://localhost:5000/mine/get-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: myWalletAddress }),
      });
      const jobData = await jobResponse.json();
      
      const difficulty = jobData.difficulty;
      const blockString = jobData.block_string;
      const target = "0".repeat(difficulty);

      setMiningStatus(`Minando... Dificultad: ${difficulty}`);

      // 2. El Bucle de Minería (CPU INTENSIVO)
      // Nota: Esto bloqueará la UI brevemente si la dificultad es muy alta.
      // En una app real, esto iría en un "Web Worker".
      
      let nonce = 0;
      let hash = "";
      let found = false;
      
      // Hacemos un pequeño truco para no congelar el navegador totalmente
      // Usamos setImmediate o un loop controlado, pero para este ejemplo simple:
      const startTime = Date.now();
      
      while (!found) {
        // Concatenamos igual que en Python: string + nonce
        const textToHash = blockString + nonce.toString();
        hash = SHA256(textToHash).toString();

        if (hash.substring(0, difficulty) === target) {
          found = true;
          break;
        }
        
        nonce++;
        
        // Freno de emergencia (por si la dificultad es 10 y tu PC explota)
        if (nonce > 10000000) break; 
      }

      const duration = (Date.now() - startTime) / 1000;

      if (found) {
        setMiningStatus(`¡Encontrado! Nonce: ${nonce} (${duration}s)`);
        
        // 3. Enviar la solución al servidor
        const submitResponse = await fetch('http://localhost:5000/mine/submit-solution', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nonce: nonce }),
        });

        if (submitResponse.ok) {
           alert(`¡ÉXITO! Has minado un bloque.\nNonce: ${nonce}\nHash: ${hash}`);
           // Recargar la cadena
           const data = await getBlockchainData();
           setBlockchain(data);
        } else {
           alert("El servidor rechazó el bloque (quizás otro minero ganó).");
        }

      } else {
        setMiningStatus("No se encontró solución (timeout).");
      }

    } catch (error) {
      console.error(error);
      setMiningStatus("Error en el proceso.");
    }
    setLoading(false);
  };

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.emisor || !form.receptor || !form.cantidad) {
      alert("Por favor rellena todos los campos");
      return;
    }

    await fetch('http://localhost:5000/transactions/new', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    alert("Transacción añadida a la Mempool (pendiente de minar)");
    setForm({ emisor: '', receptor: '', cantidad: 0 });
  };

  return (
    <div className="container">
      <h1>🔗 PyChain Dashboard</h1>
      
      <div className="actions-panel">
        
        {/* Formulario */}
        <div className="card form-card">
          <h3>💸 Nueva Transacción</h3>
          <form onSubmit={handleTransaction}>
            <input 
              placeholder="Emisor" 
              value={form.emisor}
              onChange={e => setForm({...form, emisor: e.target.value})} 
            />
            <input 
              placeholder="Receptor" 
              value={form.receptor}
              onChange={e => setForm({...form, receptor: e.target.value})} 
            />
            <input 
              type="number" 
              placeholder="Cantidad" 
              value={form.cantidad}
              onChange={e => setForm({...form, cantidad: Number(e.target.value)})} 
            />
            <button type="submit">Enviar</button>
          </form>
        </div>

        {/* Botón de Minado */}
        <div className="card mine-card">
          <h3>⛏️ Minería Cliente</h3>
          <p>Tu PC calculará el hash.</p>
          <div className="status-log">{miningStatus}</div>
          <button onClick={handleClientSideMining} disabled={loading} className="mine-btn">
            {loading ? 'Calculando...' : 'MINAR AHORA'}
          </button>
        </div>
      </div>

      {/* Visualización */}
      <h2>Blockchain ({blockchain.length} Bloques)</h2>
      <div className="chain-container">
        {blockchain.length === 0 ? <p>Cargando bloques...</p> : null}
        
        {blockchain.map((bloque) => (
          <div key={bloque.index} className="block">
            <div className="block-header">
              <span className="block-index">#{bloque.index}</span>
              <span className="block-timestamp">
                {new Date(bloque.timestamp * 1000).toLocaleTimeString()}
              </span>
            </div>
            
            <div style={{ padding: '5px 0', borderBottom: '1px solid #444', marginBottom: '10px' }}>
              <small style={{ color: '#aaa' }}>Minado por:</small><br/>
              <strong style={{ color: '#fca311', wordBreak: 'break-all' }}>
                {bloque.minero === "SISTEMA" ? "🤖 SISTEMA" : `👤 ${bloque.minero}`}
              </strong>
            </div>

            <div className="block-data">
              <p><strong>Hash:</strong> {bloque.hash.substring(0, 15)}...</p>
              <p><strong>Prev:</strong> {bloque.hash_anterior.substring(0, 15)}...</p>
              <p><strong>Nonce:</strong> {bloque.nonce}</p>
            </div>

            <div className="block-transactions">
              <strong>Transacciones ({bloque.transacciones.length}):</strong>
              <ul>
                {bloque.transacciones.map((tx, i) => (
                  <li key={i}>
                    {tx.emisor === "SISTEMA" 
                      ? <span style={{color: '#fca311'}}>🎁 Recompensa Minero</span> 
                      : `Transferencia: ${tx.emisor} ➡ ${tx.receptor}`} 
                    : <b>${tx.cantidad}</b>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;