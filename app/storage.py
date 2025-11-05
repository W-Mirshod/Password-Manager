import json
import os
import uuid
from pathlib import Path
from typing import List, Optional
from datetime import datetime
from app.encryption import EncryptionManager
from app.models import PasswordEntry, PasswordEntryCreate, PasswordEntryUpdate


class PasswordStorage:
    def __init__(self, data_dir: str = "data"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)
        self.data_file = self.data_dir / "passwords.encrypted"
        self.encryption = EncryptionManager(data_dir)
    
    def _load_entries(self) -> List[dict]:
        """Load all password entries from encrypted storage"""
        if not self.data_file.exists():
            return []
        
        try:
            encrypted_data = self.data_file.read_text()
            decrypted_data = self.encryption.decrypt(encrypted_data)
            return json.loads(decrypted_data)
        except Exception as e:
            print(f"Error loading entries: {e}")
            return []
    
    def _save_entries(self, entries: List[dict]) -> None:
        """Save password entries to encrypted storage"""
        data = json.dumps(entries, indent=2)
        encrypted_data = self.encryption.encrypt(data)
        self.data_file.write_text(encrypted_data)
        os.chmod(self.data_file, 0o600)  # Restrict permissions
    
    def get_all(self) -> List[PasswordEntry]:
        """Get all password entries"""
        entries_data = self._load_entries()
        return [PasswordEntry(**entry) for entry in entries_data]
    
    def get_by_id(self, entry_id: str) -> Optional[PasswordEntry]:
        """Get a password entry by ID"""
        entries_data = self._load_entries()
        for entry in entries_data:
            if entry.get("id") == entry_id:
                return PasswordEntry(**entry)
        return None
    
    def create(self, entry_data: PasswordEntryCreate) -> PasswordEntry:
        """Create a new password entry"""
        entries_data = self._load_entries()
        
        entry_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        entry = {
            "id": entry_id,
            "title": entry_data.title,
            "username": entry_data.username or "",
            "password": entry_data.password,
            "url": entry_data.url or "",
            "notes": entry_data.notes or "",
            "created_at": now,
            "updated_at": now
        }
        
        entries_data.append(entry)
        self._save_entries(entries_data)
        
        return PasswordEntry(**entry)
    
    def update(self, entry_id: str, entry_data: PasswordEntryUpdate) -> Optional[PasswordEntry]:
        """Update a password entry"""
        entries_data = self._load_entries()
        
        for i, entry in enumerate(entries_data):
            if entry.get("id") == entry_id:
                # Update only provided fields
                update_data = entry_data.dict(exclude_unset=True)
                for key, value in update_data.items():
                    entry[key] = value
                
                entry["updated_at"] = datetime.utcnow().isoformat()
                entries_data[i] = entry
                self._save_entries(entries_data)
                
                return PasswordEntry(**entry)
        
        return None
    
    def delete(self, entry_id: str) -> bool:
        """Delete a password entry"""
        entries_data = self._load_entries()
        
        original_count = len(entries_data)
        entries_data = [e for e in entries_data if e.get("id") != entry_id]
        
        if len(entries_data) < original_count:
            self._save_entries(entries_data)
            return True
        
        return False
    
    def search(self, query: str) -> List[PasswordEntry]:
        """Search password entries by title, username, or URL"""
        query_lower = query.lower()
        entries_data = self._load_entries()
        
        results = []
        for entry in entries_data:
            title = (entry.get("title") or "").lower()
            username = (entry.get("username") or "").lower()
            url = (entry.get("url") or "").lower()
            
            if query_lower in title or query_lower in username or query_lower in url:
                results.append(PasswordEntry(**entry))
        
        return results

