def prix_portion(prix_plat: int, tiers: int) -> int:
    """Prix d'une portion arrondi au multiple de 25 FCFA supérieur."""
    brut = prix_plat * tiers / 3
    return int(-(-brut // 25) * 25)


def prix_portions(prix: int, prix_tiers1: int | None, prix_tiers2: int | None) -> dict[int, int]:
    """Prix des trois portions : réglés par le chef, sinon proportionnels au prix entier."""
    return {
        1: prix_tiers1 if prix_tiers1 is not None else prix_portion(prix, 1),
        2: prix_tiers2 if prix_tiers2 is not None else prix_portion(prix, 2),
        3: prix,
    }


def prix_menu(menu, tiers: int) -> int:
    """Prix d'une portion d'un menu publié (prix figés à la publication)."""
    return prix_portions(menu.prix, menu.prix_tiers1, menu.prix_tiers2)[tiers]
