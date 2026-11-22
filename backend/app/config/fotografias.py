
from pathlib import Path

# Diretório raiz do backend
BASE_DIR = Path(__file__).resolve().parents[2]

# Diretório de armazenamento das fotografias
UPLOAD_DIR = BASE_DIR / "uploads" / "imoveis"

# Limite de 5 MB por fotografia
TAMANHO_MAXIMO = 5 * 1024 * 1024

# Formatos aceitos
TIPOS_PERMITIDOS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

# Garante que o diretório exista
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
