from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class PasswordEntry(BaseModel):
    id: Optional[str] = None
    title: str = Field(..., min_length=1, max_length=200)
    username: Optional[str] = Field(None, max_length=200)
    password: str = Field(..., min_length=1)
    url: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = Field(None, max_length=1000)
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class PasswordEntryCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    username: Optional[str] = Field(None, max_length=200)
    password: str = Field(..., min_length=1)
    url: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = Field(None, max_length=1000)


class PasswordEntryUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    username: Optional[str] = Field(None, max_length=200)
    password: Optional[str] = Field(None, min_length=1)
    url: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = Field(None, max_length=1000)


class PasswordGenerateRequest(BaseModel):
    length: int = Field(16, ge=8, le=128)
    include_uppercase: bool = True
    include_lowercase: bool = True
    include_numbers: bool = True
    include_symbols: bool = True

