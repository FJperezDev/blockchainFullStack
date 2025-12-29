from flask import Flask, jsonify, request
from uuid import uuid4
from blockchain import Blockchain
from flask_cors import CORS

app = Flask(__name__)
CORS(app) # Permite conexiones desde React

# Variable global para guardar el bloque que se está intentando minar actualmente
bloque_candidato_actual = None

# Instanciar la Blockchain
mi_blockchain = Blockchain()

# --- 3. RUTAS (Endpoints) ---

@app.route('/chain', methods=['GET'])
def full_chain():
    datos_cadena = []
    for bloque in mi_blockchain.cadena:
        datos_cadena.append({
            'index': bloque.index,
            'timestamp': bloque.timestamp,
            'transacciones': bloque.transacciones,
            'hash': bloque.hash,
            'hash_anterior': bloque.hash_anterior,
            'nonce': bloque.nonce,
            'minero': bloque.minero
        })
    
    response = {
        'chain': datos_cadena,
        'length': len(mi_blockchain.cadena),
    }
    return jsonify(response), 200

@app.route('/transactions/new', methods=['POST'])
def new_transaction():
    values = request.get_json()
    required = ['emisor', 'receptor', 'cantidad']
    if not all(k in values for k in required):
        return 'Faltan valores', 400

    index = mi_blockchain.nueva_transaccion(values['emisor'], values['receptor'], values['cantidad'])
    return jsonify({'mensaje': f'La transacción se añadirá al bloque {index}'}), 201

@app.route('/transactions/pending', methods=['GET'])
def get_pending_transactions():
    return jsonify({
        'transacciones_pendientes': mi_blockchain.transacciones_pendientes,
        'cantidad': len(mi_blockchain.transacciones_pendientes)
    }), 200

# --- RUTAS DE MINADO DESCENTRALIZADO ---

@app.route('/mine/get-job', methods=['POST'])
def get_mining_job():
    global bloque_candidato_actual
    data = request.get_json()
    miner_address = data.get('address') 
    
    # El servidor PREPARA el bloque, pero no lo mina
    bloque_candidato_actual = mi_blockchain.preparar_bloque_candidato(miner_address)
    
    response = {
        'difficulty': mi_blockchain.dificultad,
        'block_string': bloque_candidato_actual.obtener_string_para_hash()
    }
    return jsonify(response), 200

@app.route('/mine/submit-solution', methods=['POST'])
def submit_solution():
    global bloque_candidato_actual
    if not bloque_candidato_actual:
        return jsonify({'mensaje': "No hay trabajo activo. Solicita un trabajo primero."}), 400
        
    data = request.get_json()
    nonce = data.get('nonce')
    
    # Validamos si el nonce que encontró el cliente sirve
    exito, hash_nuevo = mi_blockchain.recibir_bloque_minado(bloque_candidato_actual, nonce)
    
    if exito:
        bloque_candidato_actual = None # Trabajo terminado
        return jsonify({'mensaje': "¡Bloque validado y añadido!", 'hash': hash_nuevo}), 200
    else:
        return jsonify({'mensaje': "Nonce incorrecto, sigue intentando"}), 400

# --- 4. ARRANQUE ---

if __name__ == '__main__':
    # Esto siempre va AL FINAL
    app.run(host='0.0.0.0', port=5000)
