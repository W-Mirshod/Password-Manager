import os
import base64
from pathlib import Path
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC


class EncryptionManager:
    def __init__(self, data_dir: str = "data"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)
        self.key_file = self.data_dir / ".key"
        self._fernet = None
        
    def _get_or_create_key(self) -> bytes:
        """Get existing key or create a new one"""
        if self.key_file.exists():
            return self.key_file.read_bytes()
        
        # Generate a new key
        key = Fernet.generate_key()
        self.key_file.write_bytes(key)
        os.chmod(self.key_file, 0o600)  # Restrict permissions
        return key
    
    def _get_fernet(self) -> Fernet:
        """Get Fernet instance for encryption/decryption"""
        if self._fernet is None:
            key = self._get_or_create_key()
            self._fernet = Fernet(key)
        return self._fernet
    
    def encrypt(self, data: str) -> str:
        """Encrypt a string"""
        fernet = self._get_fernet()
        encrypted = fernet.encrypt(data.encode())
        return base64.urlsafe_b64encode(encrypted).decode()
    
    def decrypt(self, encrypted_data: str) -> str:
        """Decrypt a string"""
        fernet = self._get_fernet()
        decoded = base64.urlsafe_b64decode(encrypted_data.encode())
        decrypted = fernet.decrypt(decoded)
        return decrypted.decode()

