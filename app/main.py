from fastapi import FastAPI, Request, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from starlette.templating import Jinja2Templates
from typing import List, Optional
from app.models import PasswordEntry, PasswordEntryCreate, PasswordEntryUpdate, PasswordGenerateRequest
from app.storage import PasswordStorage
from app.utils import generate_password

app = FastAPI(title="Password Manager")
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Initialize storage
storage = PasswordStorage(data_dir="data")


@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/api/passwords", response_model=List[PasswordEntry])
async def get_passwords(search: Optional[str] = Query(None)):
    """Get all password entries, optionally filtered by search query"""
    if search:
        return storage.search(search)
    return storage.get_all()


@app.get("/api/passwords/{entry_id}", response_model=PasswordEntry)
async def get_password(entry_id: str):
    """Get a specific password entry by ID"""
    entry = storage.get_by_id(entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Password entry not found")
    return entry


@app.post("/api/passwords", response_model=PasswordEntry)
async def create_password(entry_data: PasswordEntryCreate):
    """Create a new password entry"""
    return storage.create(entry_data)


@app.put("/api/passwords/{entry_id}", response_model=PasswordEntry)
async def update_password(entry_id: str, entry_data: PasswordEntryUpdate):
    """Update a password entry"""
    entry = storage.update(entry_id, entry_data)
    if not entry:
        raise HTTPException(status_code=404, detail="Password entry not found")
    return entry


@app.delete("/api/passwords/{entry_id}")
async def delete_password(entry_id: str):
    """Delete a password entry"""
    success = storage.delete(entry_id)
    if not success:
        raise HTTPException(status_code=404, detail="Password entry not found")
    return {"message": "Password entry deleted successfully"}


@app.post("/api/passwords/generate")
async def generate_password_endpoint(request: PasswordGenerateRequest):
    """Generate a secure password"""
    password = generate_password(
        length=request.length,
        include_uppercase=request.include_uppercase,
        include_lowercase=request.include_lowercase,
        include_numbers=request.include_numbers,
        include_symbols=request.include_symbols
    )
    return {"password": password}
