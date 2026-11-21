def prix_portion(prix_plat: int, tiers: int) -> int:
    """Prix d'une portion arrondi au multiple de 25 FCFA supérieur."""
    brut = prix_plat * tiers / 3
    return int(-(-brut // 25) * 25)
