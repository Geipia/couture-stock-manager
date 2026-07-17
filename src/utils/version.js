export const APP_VERSION = '1.0.0'

export const CHANGELOG = {
  version: '1.0.0',
  title: 'Version 1.0 — la première version officielle !',
  intro: "Couture Stock quitte la bêta. Voici tout ce qui a changé aujourd'hui :",
  sections: [
    {
      heading: 'Nouveautés',
      items: [
        "Espaces de stock multiples : crée et gère plusieurs magasins depuis un seul compte.",
        "Invitations : invite d'autres personnes par email à rejoindre un de tes espaces.",
        "Compte administrateur avec accès à tous les espaces.",
        "Page Paramètres : renomme ton espace, gère les membres, invite ou supprime.",
      ],
    },
    {
      heading: 'Corrections',
      items: [
        "Connexion et déconnexion plus fiables.",
        "Chargement du tableau de bord qui ne bloque plus indéfiniment.",
        "Récupération de mot de passe depuis l'email corrigée.",
        "Acceptation des invitations qui plantait, réglée.",
      ],
    },
  ],
}
