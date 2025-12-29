import time
from bloque import Bloque

class Blockchain:
    def __init__(self):
        self.cadena = []
        self.transacciones_pendientes = [] 
        self.dificultad = 5 # Ajusta esto si quieres que sea más difícil (ej. 5)
        self.crear_bloque_genesis()

    def crear_bloque_genesis(self):
        """
        Crea el primer bloque de la cadena manualmente.
        """
        genesis = Bloque(0, time.time(), [], "0")
        # Minamos el génesis manualmente para que tenga un hash válido
        genesis.nonce = 0
        target = '0' * self.dificultad
        
        # Pequeño bucle local solo para el génesis
        while True:
            hash_genesis = genesis.calcular_hash()
            if hash_genesis[:self.dificultad] == target:
                genesis.hash = hash_genesis
                break
            genesis.nonce += 1
            
        self.cadena.append(genesis)

    def obtener_ultimo_bloque(self):
        return self.cadena[-1]

    def nueva_transaccion(self, emisor, receptor, cantidad):
        self.transacciones_pendientes.append({
            "emisor": emisor,
            "receptor": receptor,
            "cantidad": cantidad
        })
        return self.obtener_ultimo_bloque().index + 1

    def preparar_bloque_candidato(self, direccion_minero):
        """
        Crea un bloque temporal con transacciones + recompensa.
        NO tiene nonce válido aún.
        """
        transacciones_temp = self.transacciones_pendientes.copy()
        
        # Añadimos la recompensa para el minero
        transacciones_temp.append({
            "emisor": "SISTEMA",
            "receptor": direccion_minero,
            "cantidad": 1
        })

        candidato = Bloque(
            index=len(self.cadena),
            timestamp=time.time(),
            transacciones=transacciones_temp,
            hash_anterior=self.obtener_ultimo_bloque().hash,
            minero=direccion_minero
        )
        return candidato
    
    def recibir_bloque_minado(self, bloque_candidato, nonce_encontrado):
        """
        Valida si el nonce que envió el cliente es correcto.
        """
        bloque_candidato.nonce = nonce_encontrado
        hash_resultante = bloque_candidato.calcular_hash()
        
        target = '0' * self.dificultad
        
        if hash_resultante[:self.dificultad] == target:
            bloque_candidato.hash = hash_resultante
            self.cadena.append(bloque_candidato)
            self.transacciones_pendientes = [] # Limpiamos mempool
            return True, hash_resultante
        else:
            return False, None