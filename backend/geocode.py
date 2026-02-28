import os
import sqlite3
import threading
import requests

GOOGLE_KEY = os.environ.get("GOOGLE_MAPS_API_KEY", "")
GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"

DB_PATH = os.environ.get("GEOCODE_CACHE_DB", "geocode_cache.sqlite3")
LOCK = threading.Lock()


def _init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS geocode_cache (
            address TEXT PRIMARY KEY,
            lat REAL NOT NULL,
            lng REAL NOT NULL
        )
        """
    )
    conn.commit()
    conn.close()


_init_db()


def _get_cached(address):
    conn = sqlite3.connect(DB_PATH)
    row = conn.execute(
        "SELECT lat, lng FROM geocode_cache WHERE address = ?",
        (address,),
    ).fetchone()
    conn.close()

    if not row:
        return None
    return (float(row[0]), float(row[1]))


def _set_cached(address, lat, lng):
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        "INSERT OR REPLACE INTO geocode_cache(address, lat, lng) VALUES (?, ?, ?)",
        (address, lat, lng),
    )
    conn.commit()
    conn.close()


def geocode_address(address):
    address = " ".join(address.split()).strip()

    if not address:
        return None

    if not GOOGLE_KEY:
        return None

    with LOCK:
        cached = _get_cached(address)
        if cached:
            return cached

        response = requests.get(
            GEOCODE_URL,
            params={"address": address, "key": GOOGLE_KEY},
            timeout=10,
        )

        response.raise_for_status()
        data = response.json()

        if data.get("status") != "OK":
            return None

        results = data.get("results")
        if not results:
            return None

        location = results[0]["geometry"]["location"]
        latitude = float(location["lat"])
        longitude = float(location["lng"])

        _set_cached(address, latitude, longitude)

        return (latitude, longitude)