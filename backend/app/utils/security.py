import os
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
from cryptography.fernet import Fernet
from typing import Optional

# Setup password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT configuration
SECRET_KEY = os.environ.get("SECRET_KEY", "a_very_secret_key_for_development_only")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day

# Encryption configuration
# In production, this should be an environment variable.
# For development, we generate one if not provided, but it needs to be persistent across restarts.
# Let's use a hardcoded one for this DevSecOps exercise.
# ENCRYPTION_KEY must be a valid 32-byte url-safe base64 key.
# os.environ.get() always returns str; Fernet requires bytes.
# WARNING: In production, set ENCRYPTION_KEY env var and NEVER change it —
# changing the key makes all previously encrypted patient data unreadable.
_encryption_key_raw = os.environ.get(
    "ENCRYPTION_KEY",
    "_cjZVdvYzl-Q8feQKiEsGOaJrLqLGZPuCYmEHgylNQc="  # Valid dev-only fallback
)
ENCRYPTION_KEY: bytes = (
    _encryption_key_raw.encode() if isinstance(_encryption_key_raw, str) else _encryption_key_raw
)
fernet = Fernet(ENCRYPTION_KEY)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        # Use the configured expiry (default: 24 hours), not the library default of 15 min
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def encrypt_data(data: str) -> str:
    if not data:
        return ""
    return fernet.encrypt(data.encode()).decode()

def decrypt_data(token: str) -> str:
    if not token:
        return ""
    try:
        return fernet.decrypt(token.encode()).decode()
    except Exception:
        return "Decryption failed"
