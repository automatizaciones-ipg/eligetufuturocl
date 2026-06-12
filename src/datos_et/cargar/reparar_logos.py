import os
import sys
import requests
import time
import unicodedata
import re
from io import BytesIO
from PIL import Image
from supabase import create_client, Client
from dotenv import load_dotenv
from ddgs import DDGS
import wikipedia
from bs4 import BeautifulSoup

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")  # Service role key
BUCKET_NAME = "logos_instituciones"

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ ERROR: Configurá SUPABASE_URL y SUPABASE_KEY en el archivo .env")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ------------------------------------------------------------
# Utilidades
# ------------------------------------------------------------
def sanitizar_nombre_archivo(nombre: str) -> str:
    """Elimina tildes, caracteres especiales y deja solo ASCII seguro."""
    nombre = unicodedata.normalize('NFD', nombre)
    nombre = ''.join(c for c in nombre if unicodedata.category(c) != 'Mn')
    nombre = re.sub(r'[^a-zA-Z0-9\s\-_]', '', nombre)
    nombre = re.sub(r'\s+', '_', nombre.strip())
    nombre = re.sub(r'_+', '_', nombre)
    return nombre.lower()

def existe_en_bucket(nombre_archivo: str) -> bool:
    """Verifica si un archivo existe en el bucket (usando info)."""
    try:
        supabase.storage.from_(BUCKET_NAME).info(nombre_archivo)
        return True
    except:
        return False

# ------------------------------------------------------------
# 1. Buscar logo en Wikipedia
# ------------------------------------------------------------
def logo_desde_wikipedia(nombre_institucion: str) -> BytesIO | None:
    print(f"      🌐 Buscando en Wikipedia...")
    try:
        wikipedia.set_lang("es")
        try:
            pagina = wikipedia.page(nombre_institucion)
        except wikipedia.exceptions.PageError:
            wikipedia.set_lang("en")
            try:
                pagina = wikipedia.page(nombre_institucion)
            except:
                return None
        except wikipedia.exceptions.DisambiguationError as e:
            pagina = wikipedia.page(e.options[0])

        url = pagina.url
        resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
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
                print(f"      🖼 Logo encontrado: {src}")
                img_resp = requests.get(src, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
                if img_resp.status_code == 200 and "image" in img_resp.headers.get("content-type", ""):
                    img = Image.open(BytesIO(img_resp.content))
                    print(f"      ✅ Logo extraído ({img.size[0]}x{img.size[1]}px)")
                    return BytesIO(img_resp.content)
        print(f"      ℹ No se pudo extraer logo de Wikipedia")
    except Exception as e:
        print(f"      ⚠ Error Wikipedia: {e}")
    return None

# ------------------------------------------------------------
# 2. Buscar logo en DuckDuckGo (fallback)
# ------------------------------------------------------------
def logo_desde_ddgs(nombre: str) -> BytesIO | None:
    print(f"      🖼 Buscando en DuckDuckGo Images...")
    try:
        with DDGS() as ddgs:
            resultados = list(ddgs.images(f"{nombre} logo", max_results=5))
        for img in resultados:
            url = img["image"]
            try:
                resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
                if resp.status_code == 200 and "image" in resp.headers.get("content-type", ""):
                    image = Image.open(BytesIO(resp.content))
                    print(f"      ✓ Imagen descargada ({image.size[0]}x{image.size[1]}px)")
                    return BytesIO(resp.content)
            except:
                continue
        print(f"      ℹ No se encontró imagen válida en DDG")
    except Exception as e:
        print(f"      ⚠ Error DDG: {e}")
    return None

# ------------------------------------------------------------
# 3. Subir a bucket y obtener URL pública
# ------------------------------------------------------------
def subir_logo(archivo: BytesIO, nombre_institucion: str) -> str | None:
    safe_name = sanitizar_nombre_archivo(nombre_institucion)
    file_path = f"{safe_name}.png"
    try:
        archivo.seek(0)
        print(f"      ☁ Subiendo '{file_path}'...")
        supabase.storage.from_(BUCKET_NAME).upload(
            path=file_path,
            file=archivo.getvalue(),
            file_options={"content-type": "image/png"}
        )
        public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(file_path)
        print(f"      🔗 URL: {public_url}")
        return public_url
    except Exception as e:
        print(f"      ❌ Error al subir: {e}")
        return None

# ------------------------------------------------------------
# 4. Actualizar DB
# ------------------------------------------------------------
def actualizar_db(codigo_institucion: int, url_logo: str):
    supabase.table("instituciones").update({"logo_url": url_logo}).eq("codigo_institucion", codigo_institucion).execute()

# ------------------------------------------------------------
# 5. Lógica principal
# ------------------------------------------------------------
def reparar_logos():
    print("=" * 70)
    print("         REPARADOR DE LOGOS INSTITUCIONALES")
    print("=" * 70)

    # Traer todas las instituciones con logo_url no nulo
    res = supabase.table("instituciones").select("codigo_institucion, nombre, logo_url").neq("logo_url", None).execute()
    instituciones = res.data
    total = len(instituciones)
    print(f"📊 Total instituciones con logo registrado: {total}\n")

    reparadas = 0
    no_encontrado = 0
    errores = 0

    for i, inst in enumerate(instituciones, 1):
        codigo = inst["codigo_institucion"]
        nombre = inst["nombre"]
        url_actual = inst["logo_url"]
        nombre_archivo = url_actual.split("/")[-1] if url_actual.startswith("http") else url_actual

        print(f"[{i}/{total}] {nombre} (cód. {codigo})")
        if url_actual.startswith("http"):
            # Es URL completa, verificamos si el archivo existe en el bucket
            if not existe_en_bucket(nombre_archivo):
                print(f"   ⚠ Archivo '{nombre_archivo}' no existe en el bucket")
            else:
                print(f"   ✅ Logo existente, se omite")
                continue
        else:
            # No es URL completa, directamente lo tratamos como faltante
            print(f"   ⚠ URL no válida, se procede a buscar logo")

        # Buscar logo
        logo_bytes = logo_desde_wikipedia(nombre)
        if not logo_bytes:
            logo_bytes = logo_desde_ddgs(nombre)

        if not logo_bytes:
            print(f"   🚫 No se pudo obtener logo. Se deja como está.\n")
            no_encontrado += 1
            continue

        # Subir y actualizar
        nueva_url = subir_logo(logo_bytes, nombre)
        if nueva_url:
            actualizar_db(codigo, nueva_url)
            print(f"   ✅ Logo reparado exitosamente\n")
            reparadas += 1
        else:
            print(f"   ❌ Falló la subida\n")
            errores += 1

        time.sleep(1.5)

    print("=" * 70)
    print("                     RESUMEN FINAL")
    print("=" * 70)
    print(f"✅ Reparadas: {reparadas}")
    print(f"❌ No se encontró logo: {no_encontrado}")
    print(f"⚠ Errores de subida: {errores}")
    print("=" * 70)

if __name__ == "__main__":
    reparar_logos()