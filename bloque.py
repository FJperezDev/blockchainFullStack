import hashlib
import json

class Bloque:
    def __init__(self, index, timestamp, transacciones, hash_anterior, minero="SISTEMA"):
        self.index = index
        self.timestamp = timestamp
        self.transacciones = transacciones
        self.hash_anterior = hash_anterior
        self.minero = minero
        self.nonce = 0
        self.hash = self.calcular_hash()

    def obtener_string_para_hash(self):
        """
        Devuelve el string exacto que debe ser hasheado.
        Esto ayuda a que el Frontend y el Backend hablen el mismo idioma.
        """
        return json.dumps({
            "index": self.index,
            "timestamp": self.timestamp,
            "transacciones": self.transacciones,
            "hash_anterior": self.hash_anterior,
            "minero": self.minero
        }, sort_keys=True)

    def calcular_hash(self):
        # El hash es: sha256( string_base + nonce )
        bloque_string = self.obtener_string_para_hash() + str(self.nonce)
        return hashlib.sha256(bloque_string.encode()).hexdigest()