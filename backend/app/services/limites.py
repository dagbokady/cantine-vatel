"""Limitation des tentatives de connexion (en mémoire : un seul processus backend).

- Par compte : 5 échecs en 15 minutes bloquent le compte 15 minutes (PIN élève à 4 chiffres).
- Par adresse IP : 20 échecs en 15 minutes bloquent l'adresse 15 minutes (essais sur plusieurs comptes).
Une connexion réussie efface les échecs du compte.
"""
from __future__ import annotations

import time
from collections import deque
from threading import Lock

from fastapi import HTTPException, Request

FENETRE = 15 * 60
MAX_PAR_COMPTE = 5
MAX_PAR_IP = 20

_echecs: dict[str, deque[float]] = {}
_verrou = Lock()


def _recents(cle: str, maintenant: float) -> deque[float]:
    file = _echecs.setdefault(cle, deque())
    while file and maintenant - file[0] > FENETRE:
        file.popleft()
    return file


def _ip(request: Request) -> str:
    return request.client.host if request.client else "inconnue"


def verifier(request: Request, compte: str) -> None:
    """Lève 429 si le compte ou l'adresse IP a trop d'échecs récents."""
    maintenant = time.monotonic()
    with _verrou:
        for cle, maximum in ((f"compte:{compte}", MAX_PAR_COMPTE), (f"ip:{_ip(request)}", MAX_PAR_IP)):
            file = _recents(cle, maintenant)
            if len(file) >= maximum:
                minutes = max(1, int((FENETRE - (maintenant - file[0])) // 60) + 1)
                raise HTTPException(
                    status_code=429,
                    detail=f"Trop de tentatives. Réessaie dans {minutes} min.",
                    headers={"Retry-After": str(minutes * 60)},
                )


def echec(request: Request, compte: str) -> None:
    maintenant = time.monotonic()
    with _verrou:
        _recents(f"compte:{compte}", maintenant).append(maintenant)
        _recents(f"ip:{_ip(request)}", maintenant).append(maintenant)
        if len(_echecs) > 50_000:  # garde-fou mémoire
            for cle in [c for c, f in _echecs.items() if not f]:
                del _echecs[cle]


def succes(compte: str) -> None:
    with _verrou:
        _echecs.pop(f"compte:{compte}", None)


def reinitialiser() -> None:
    """Pour les tests."""
    with _verrou:
        _echecs.clear()
