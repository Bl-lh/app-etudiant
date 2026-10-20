# CampusEnroll • Plateforme d'Inscription aux Cours en Ligne & Qualification Logicielle

[![Node.js Version](https://img.shields.io/badge/node-v20.20-green.svg)](https://nodejs.org)
[![MySQL Version](https://img.shields.io/badge/mysql-8.4_LTS-blue.svg)](https://mysql.com)
[![React Version](https://img.shields.io/badge/react-19-cyan.svg)](https://react.dev)
[![Tests Status](https://img.shields.io/badge/tests-85%2F85_passed-brightgreen.svg)]()
[![Shift-Right Status](https://img.shields.io/badge/shift--right-canary_%26_unleash_active-orange.svg)]()
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/Bl-lh/app-etudiant)

> **Projet Réalisé pour le Module : Processus des Tests Logiciels & DevOps**  
> **Auteur :** Bilal Mansouri  
> **Établissement :** École Mohammadia d'Ingénieurs (EMI)  
> 📖 **[Accéder au Guide Démonstration & Soutenance Professeur (Shift-Right)](GUIDE_DEMO_ET_ARCHITECTURE_SHIFT_RIGHT.md)**

---

## 📌 Présentation du Projet

Ce projet répond intégralement à la demande académique :
> *"Réalisation de tout le processus des tests logiciels et ce à partir de sur la base d'une application Web de l'inscription des étudiants à des cours en ligne (inscription, paiement, etc.)"*.

Il s'agit d'une application **Full-Stack professionnelle et complète**, adossée à une base de données relationnelle persistante **MySQL**, conçue selon les meilleures pratiques d'ingénierie logicielle et accompagnée d'une suite exhaustive de **81 tests automatisés**.

---

## 🚀 Fonctionnalités Clés Implémentées

### 1. Inscription des Étudiants & Authentification (RBAC)
* Inscription et connexion sécurisée avec hachage de mot de passe **bcrypt** et jetons **JWT**.
* Gestion des rôles : `STUDENT`, `INSTRUCTOR`, `ADMIN`.
* Prévention stricte des inscriptions doubles pour un même cours.
* Respect des quotas et capacités maximales d'accueil par formation.

### 2. Catalogue de Formations en Ligne
* Consultation et recherche multi-critères (mots-clés, filtres par catégorie, niveau de difficulté, tri par tarif et popularité).
* Fiches détaillées avec programme pédagogique complet (**syllabus** modulaire) et avis d'étudiants.

### 3. Moteur de Règlement & Facturation Sécurisée
* **Validation des Cartes Bancaires :** Implémentation algorithmique de la somme de contrôle de **Luhn (Modulus 10)**, détection du réseau (Visa, Mastercard, Amex), vérification des dates d'expiration et codes CVV.
* **Masquage PCI-DSS :** Protection des données sensibles des cartes.
* **Système de Bons de Réduction :** Application de coupons (`ETUDIANT20`, `PROMO50`), calcul automatique des remises et arrondis financiers au centime.
* **Transactions ACID MySQL :** Atomicité complète (inscription confirmée + paiement validé + places décrémentées) avec rollback systématique en cas d'erreur.
* **Génération de Reçus / Factures :** Document officiel téléchargeable et imprimable avec référence de transaction unique et simulation de code-barres.

### 4. Espace Personnel Étudiant & Portail Administrateur
* **Espace Étudiant :** Visualisation des cours actifs avec barres de progression, historique comptable et réimpression des reçus.
* **Portail Administrateur :** KPIs en direct (Total Étudiants, Formations, Chiffre d'Affaires total), ajout/modification/suppression de cours et audit global des transactions.

### 5. Centre d'Assurance Qualité & Tests Logiciels (QA Center)
* Page interactive intégrée dans l'application présentant la **Pyramide des Tests**, la **Matrice des Cas de Tests** et un bouton de diagnostic en direct connecté à la table d'audit MySQL `test_audit_logs`.

### 6. Shift-Right Testing & Progressive Delivery (Canary & Unleash sur Oracle Cloud)
* Déploiement en production sur **Oracle Cloud Infrastructure (OCI Free Tier)** avec Docker Compose.
* Routage de trafic progressif **Canary Deployment (90% Stable V1 / 10% Candidate V2)** via Nginx `split_clients`.
* Gestion dynamique des fonctionnalités et **Kill Switch instantané** via **Unleash Feature Flags**.
* Simulation de pannes réelles (erreurs 5xx, latence) et procédures de recouvrement automatisées.
* Documentation complète disponible dans le dossier [`shift-right/README.md`](file:///home/bilal/Desktop/app-etudiant/shift-right/README.md).

---

## 🏛️ Architecture Technique & Modèle de Données

```
app-etudiant/
├── backend/                       # API REST Express & Suite de Tests Jest
│   ├── src/
│   │   ├── config/                # Connexion pool MySQL2 & transactions ACID
│   │   ├── controllers/           # Contrôleurs métier (Auth, Cours, Inscription, Paiement, Stats, QA)
│   │   ├── middleware/            # Middlewares JWT, RBAC et validation
│   │   ├── routes/                # Définition des endpoints REST
│   │   ├── services/              # Logique métier et moteur de remise (discountService.js)
│   │   ├── utils/                 # Algorithme de Luhn (luhnValidator.js), générateur de reçus
│   │   ├── app.js                 # Configuration Express découplée (testable)
│   │   └── server.js              # Point d'entrée du serveur HTTP
│   └── tests/                     # 81 Tests Automatisés
│       ├── unit/                  # Tests unitaires (Luhn, PCI-DSS, remises, coupons)
│       ├── integration/           # Tests d'intégration API REST (Auth, Cours, Inscription, Paiement, Admin, QA)
│       └── e2e/                   # Scénario End-to-End du parcours étudiant complet
├── frontend/                      # Application Web React 19 + Vite (UI Moderne & Réactive)
│   ├── src/
│   │   ├── components/            # Composants (Navbar, CourseCard, CreditCardPreview 3D, ReceiptModal, etc.)
│   │   ├── pages/                 # Pages (HomePage, CoursesPage, CourseDetailPage, CheckoutPage, etc.)
│   │   ├── context/               # Contexte d'authentification AuthContext
│   │   └── services/              # Client API centralisé
├── docker/
│   └── mysql/
│       └── init.sql               # Schéma relationnel 3NF et données de démonstration
├── docker-compose.yml             # Orchestration du conteneur MySQL 8.4 avec volume persistant
├── docs/                          # Dossier de Qualification Logicielle ISTQB
│   ├── PLAN_DE_TESTS.md           # Plan de tests officiel (ISO 29119)
│   ├── CAHIER_DE_RECETTE_ET_CAS_DE_TESTS.md # Matrice détaillée des 81 cas de tests
│   ├── MATRICE_DE_TRACABILITE.md  # Traçabilité Exigences <-> Tests <-> Code
│   └── RAPPORT_DE_COUVERTURE.md   # Métriques de couverture de code
└── README.md
```

### Schéma Relationnel MySQL (Persistance Active)
* `users` : Comptes étudiants, instructeurs et administrateurs avec mots de passe chiffrés.
* `categories` : Domaines de formation (Développement Web, Tests Logiciels, IA, Cybersécurité).
* `courses` : Formations avec tarifs, capacité maximale d'accueil, syllabus JSON et instructeurs.
* `coupons` : Bons de réduction avec pourcentages, dates de validité et quotas d'usages.
* `enrollments` : Dossiers d'inscriptions (`PENDING`, `CONFIRMED`, `CANCELLED`).
* `payments` : Transactions financières avec référence unique, méthode et montant net.
* `course_reviews` : Évaluations et notes par étoiles laissées par les étudiants.
* `test_audit_logs` : Journal d'audit persistant traçant les exécutions de qualification logicielle.

---

## ⚡ Instructions de Démarrage Rapide

### 1. Démarrer la Base de Données Persistante MySQL
```bash
docker compose up -d
```
> Le conteneur `campus-mysql-db` démarre sur le port `3306` avec initialisation automatique du schéma relationnel et des données de seed.

### 2. Démarrer l'API Backend
```bash
cd backend
npm install
npm start
```
> L'API REST écoute sur `http://localhost:5000` (Healthcheck : `http://localhost:5000/health`).

### 3. Démarrer l'Application Front-End React
Dans un second terminal :
```bash
cd frontend
npm install
npm run dev
```
> Ouvrez votre navigateur sur `http://localhost:5173`.

---

## 🧪 Exécution des Tests Logiciels

La suite de tests a été développée selon la norme **ISTQB** pour valider tous les niveaux de qualification :

```bash
cd backend

# Exécuter l'ensemble des 81 tests automatisés
npm test

# Exécuter uniquement les tests unitaires (Luhn, Remises, Calculs)
npm run test:unit

# Exécuter uniquement les tests d'intégration API
npm run test:integration

# Exécuter le test End-to-End (Parcours complet de l'étudiant)
npm run test:e2e

# Générer le rapport complet de couverture de code
npm run test:coverage
```

### Résumé de l'Exécution des Tests
```text
PASS tests/integration/admin.api.test.js      (7 tests)
PASS tests/integration/auth.api.test.js       (9 tests)
PASS tests/integration/enrollment.api.test.js (5 tests)
PASS tests/integration/payment.api.test.js    (8 tests)
PASS tests/e2e/studentJourney.e2e.test.js     (7 tests)
PASS tests/integration/qa.api.test.js         (4 tests)
PASS tests/integration/courses.api.test.js    (7 tests)
PASS tests/unit/luhnValidator.test.js         (20 tests)
PASS tests/unit/discountService.test.js       (14 tests)

Test Suites: 9 passed, 9 total
Tests:       81 passed, 81 total (100% de succès)
Time:        3.431 s
```

---

## 👤 Comptes de Démonstration Pré-Configurés

Pour faciliter la soutenance et les tests interactifs, un sélecteur rapide de comptes est disponible directement dans la barre de navigation du site (**Bouton "Comptes Démo"**) :

| Rôle | Adresse Email | Mot de Passe | Privilèges |
| :--- | :--- | :--- | :--- |
| **Administrateur** | `admin@campus-online.ma` | `Password123!` | Gestion des cours, statistiques globales, audit financier |
| **Étudiant** | `etudiant@campus-online.ma` | `Password123!` | Inscription aux cours, règlement, suivi des cours et reçus |
| **Enseignant** | `amina.benjelloun@campus-online.ma` | `Password123!` | Consultation et gestion de ses programmes |

### Cartes Bancaires de Test (Scénarios ISTQB)
* **Carte Valide (Succès 200) :** `4242 4242 4242 4242`, Exp: `12/28`, CVV: `123`
* **Simulation Refus Bancaire (Erreur 402) :** `4000 0000 0000 0002`, Exp: `11/29`, CVV: `456`
* **Échec Algorithme de Luhn (Erreur 400) :** `4242 4242 4242 4241`, Exp: `10/28`, CVV: `789`
* **Codes Promo Actifs :** `ETUDIANT20` (-20%), `PROMO50` (-50%)

---

## 📚 Dossier de Qualification Logicielle

Les livrables formels de test sont consultables dans le répertoire [`docs/`](file:///home/bilal/Desktop/app-etudiant/docs/) :
* [**Plan de Tests Logiciels (ISO 29119)**](file:///home/bilal/Desktop/app-etudiant/docs/PLAN_DE_TESTS.md) : Stratégie, périmètre, pyramide des tests, environnement et critères d'acceptation.
* [**Cahier de Recette & Spécification des 81 Cas de Tests**](file:///home/bilal/Desktop/app-etudiant/docs/CAHIER_DE_RECETTE_ET_CAS_DE_TESTS.md) : Description exhaustive de chaque cas de test nominal, limite et négatif avec oracles de test.
* [**Matrice de Traçabilité des Exigences (RTM)**](file:///home/bilal/Desktop/app-etudiant/docs/MATRICE_DE_TRACABILITE.md) : Correspondance entre exigences fonctionnelles, tests et code source.
* [**Rapport de Couverture de Code**](file:///home/bilal/Desktop/app-etudiant/docs/RAPPORT_DE_COUVERTURE.md) : Bilan chiffré des métriques d'exécution.
