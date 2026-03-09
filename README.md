# Couture Stock Manager

Application de gestion de stock de tissus et accessoires de couture pour Coralie.

## Description
Cette application permet de gérer le stock de tissus, fils, accessoires et mercerie, ainsi que de suivre leur utilisation par projet. Elle offre des fonctionnalités de statistiques, d'alertes pour les stocks bas, et une interface intuitive.

## Technologies
- **Frontend** : React (Vite)
- **Backend** : Supabase (PostgreSQL, Auth, Storage)
- **Déploiement** : GitHub Pages (frontend), Supabase (backend)

## Prérequis
- Node.js (v16 ou supérieur)
- Un compte Supabase (pour la base de données et l'authentification)

## Installation
1. Cloner le dépôt :
   ```bash
   git clone https://github.com/Geipia/couture-stock-manager.git
   ```
2. Installer les dépendances :
   ```bash
   cd couture-stock-manager
   npm install
   ```
3. Configurer Supabase :
   - Créer un projet sur [Supabase](https://supabase.com/)
   - Récupérer l'URL et la clé publique dans les paramètres du projet
   - Créer un fichier `.env` à la racine du projet avec les variables suivantes :
     ```env
     VITE_SUPABASE_URL=ton_url_supabase
     VITE_SUPABASE_ANON_KEY=ta_clé_publique_supabase
     ```

## Lancement
Pour lancer l'application en mode développement :
```bash
npm run dev
```

## Déploiement
- Le frontend sera déployé sur GitHub Pages.
- Le backend (base de données, auth, stockage) est géré par Supabase.

## Structure du Projet
```
couture-stock-manager/
├── public/          # Fichiers statiques
├── src/
│   ├── components/  # Composants React
│   ├── pages/       # Pages principales
│   ├── services/    # Connexion à Supabase
│   ├── styles/      # Fichiers CSS/SCSS
│   ├── App.jsx      # Point d'entrée
│   └── main.jsx     # Configuration de React
├── .gitignore
├── package.json
└── README.md
```

## Contribution
Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## Licence
MIT