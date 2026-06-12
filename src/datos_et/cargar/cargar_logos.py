import os
import sys
import requests
from supabase import create_client, Client
from dotenv import load_dotenv
from urllib.parse import urlparse, quote
from io import BytesIO
from PIL import Image
from ddgs import DDGS
import time
import random
import wikipedia
from bs4 import BeautifulSoup
from datetime import datetime
import unicodedata
import re

# ------------------------------------------------------------
# Configuración
# ------------------------------------------------------------
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
BUCKET_NAME = "logos_instituciones"

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: SUPABASE_URL y SUPABASE_KEY deben estar definidos en .env")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ------------------------------------------------------------
# Utilidades
# ------------------------------------------------------------
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
]

def pausa_adaptativa(intento=1):
    base = 2 ** intento + random.uniform(0, 1)
    time.sleep(base)

def sanitizar_nombre_archivo(nombre: str) -> str:
    """
    Convierte un nombre de institución en un nombre de archivo válido para Supabase Storage.
    - Elimina tildes y caracteres diacríticos.
    - Reemplaza espacios por guiones bajos.
    - Elimina cualquier carácter que no sea alfanumérico, guion, punto o guion bajo.
    - Limita la longitud a 100 caracteres.
    """
    # Normalizar Unicode (NFD) para separar tildes
    nombre = unicodedata.normalize('NFD', nombre)
    # Eliminar marcas diacríticas (tildes, ñ -> n, etc.)
    nombre = ''.join(c for c in nombre if unicodedata.category(c) != 'Mn')
    # Reemplazar espacios y guiones por '_'
    nombre = nombre.replace(' ', '_').replace('-', '_')
    # Eliminar caracteres no permitidos (solo alfanuméricos, _, -, .)
    nombre = re.sub(r'[^a-zA-Z0-9_\-\.]', '', nombre)
    # Reducir múltiples guiones bajos
    nombre = re.sub(r'_+', '_', nombre)
    # Limitar longitud
    if len(nombre) > 100:
        nombre = nombre[:100]
    return nombre.lower()

# ------------------------------------------------------------
# 1. Obtener logo desde DuckDuckGo Images (ddgs)
# ------------------------------------------------------------
def logo_desde_ddgs(nombre: str) -> BytesIO | None:
    print(f"      🖼 Buscando logo en DuckDuckGo Images...")
    for intento in range(1, 4):
        try:
            with DDGS() as ddgs:
                resultados = list(ddgs.images(f"{nombre} logo", max_results=5))
            for idx, img in enumerate(resultados, 1):
                url = img["image"]
                print(f"         Intento {idx}: {url}")
                try:
                    resp = requests.get(url, headers={"User-Agent": random.choice(USER_AGENTS)}, timeout=10)
                    if resp.status_code == 200 and "image" in resp.headers.get("content-type", ""):
                        image = Image.open(BytesIO(resp.content))
                        print(f"         ✓ Imagen válida ({image.size[0]}x{image.size[1]}px)")
                        return BytesIO(resp.content)
                    else:
                        print(f"         ✗ No es imagen válida (status {resp.status_code})")
                except Exception as e:
                    print(f"         ✗ Error: {e}")
                    continue
            print(f"      ℹ No se encontró imagen en DDG (intento {intento})")
        except Exception as e:
            print(f"      ⚠ Error en DDG (intento {intento}): {e}")
        pausa_adaptativa(intento)
    return None

# ------------------------------------------------------------
# 2. Obtener logo desde Wikipedia
# ------------------------------------------------------------
def logo_desde_wikipedia(nombre: str) -> BytesIO | None:
    print(f"      🌐 Buscando en Wikipedia...")
    try:
        wikipedia.set_lang("es")
        try:
            pagina = wikipedia.page(nombre)
        except wikipedia.exceptions.PageError:
            wikipedia.set_lang("en")
            try:
                pagina = wikipedia.page(nombre)
            except:
                print(f"      ℹ No se encontró página en Wikipedia")
                return None
        except wikipedia.exceptions.DisambiguationError as e:
            pagina = wikipedia.page(e.options[0])

        url = pagina.url
        print(f"      📄 Página: {url}")
        resp = requests.get(url, headers={"User-Agent": random.choice(USER_AGENTS)})
        soup = BeautifulSoup(resp.text, "html.parser")
        infobox = soup.find("table", class_="infobox")
        if not infobox:
            infobox = soup.find("table", {"class": "infobox"})
        if infobox:
            img_tag = infobox.find("img")
            if img_tag and img_tag.get("src"):
                src = img_tag["src"]
                if src.startswith("//"):
                    src = "https:" + src
                elif src.startswith("/"):
                    src = "https://es.wikipedia.org" + src
                print(f"      🖼 Logo encontrado en Wikipedia: {src}")
                img_resp = requests.get(src, headers={"User-Agent": random.choice(USER_AGENTS)})
                if img_resp.status_code == 200 and "image" in img_resp.headers.get("content-type", ""):
                    image = Image.open(BytesIO(img_resp.content))
                    print(f"      ✓ Logo extraído ({image.size[0]}x{image.size[1]}px)")
                    return BytesIO(img_resp.content)
        print(f"      ℹ No se pudo extraer logo de la infobox")
    except Exception as e:
        print(f"      ⚠ Error en Wikipedia: {e}")
    return None

# ------------------------------------------------------------
# 3. Subir logo a Supabase (con sanitización)
# ------------------------------------------------------------
def subir_logo(archivo: BytesIO, nombre_institucion: str) -> str | None:
    # Sanitizar el nombre para el archivo
    safe_name = sanitizar_nombre_archivo(nombre_institucion)
    file_path = f"{safe_name}.png"
    print(f"      ☁ Subiendo '{file_path}' al bucket '{BUCKET_NAME}' (original: {nombre_institucion})...")
    try:
        archivo.seek(0)
        supabase.storage.from_(BUCKET_NAME).upload(
            path=file_path,
            file=archivo.getvalue(),
            file_options={"content-type": "image/png"}
        )
        public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(file_path)
        print(f"      🔗 URL pública: {public_url}")
        return public_url
    except Exception as e:
        print(f"      ❌ Error al subir: {e}")
        return None

# ------------------------------------------------------------
# 4. Actualizar base de datos
# ------------------------------------------------------------
def actualizar_logo_db(codigo_institucion: int, url_logo: str):
    print(f"      💾 Actualizando registro (código {codigo_institucion})...")
    try:
        supabase.table("instituciones").update({"logo_url": url_logo}).eq("codigo_institucion", codigo_institucion).execute()
        print(f"      ✓ Base de datos actualizada")
    except Exception as e:
        print(f"      ❌ Error en DB: {e}")

# ------------------------------------------------------------
# 5. Lógica principal
# ------------------------------------------------------------
def procesar_instituciones():
    print("=" * 70)
    print("         AUTOMATIZADOR DE LOGOS (DDG + Wikipedia)")
    print("=" * 70)
    print(f"Inicio: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

    response = supabase.table("instituciones").select("*").is_("logo_url", "null").execute()
    instituciones = response.data
    total = len(instituciones)
    print(f"📊 Instituciones sin logo: {total}\n")

    exito = 0
    fallo = 0

    for i, inst in enumerate(instituciones, 1):
        codigo = inst["codigo_institucion"]
        nombre = inst["nombre"]
        print(f"[{i}/{total}] Procesando: {nombre} (cód. {codigo})")

        logo_bytes = logo_desde_ddgs(nombre)
        if not logo_bytes:
            logo_bytes = logo_desde_wikipedia(nombre)

        if not logo_bytes:
            print(f"   🚫 No se encontró logo. Se omite.\n")
            fallo += 1
            continue

        url_logo = subir_logo(logo_bytes, nombre)
        if url_logo:
            actualizar_logo_db(codigo, url_logo)
            exito += 1
            print(f"   ✅ INSTITUCIÓN COMPLETADA\n")
        else:
            fallo += 1
            print(f"   ⚠ Falló la subida\n")

        time.sleep(random.uniform(2.0, 4.0))

    print("=" * 70)
    print("                     RESUMEN FINAL")
    print("=" * 70)
    print(f"Total procesadas: {total}")
    print(f"✅ Logos actualizados: {exito}")
    print(f"❌ No se pudo obtener/subir: {fallo}")
    print(f"Finalizó: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)

if __name__ == "__main__":
    procesar_instituciones()