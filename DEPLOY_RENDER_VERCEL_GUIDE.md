# 🚀 GUIDE DE DÉPLOIEMENT COMPLET : VERCEL + RENDER + CLOUD MYSQL
## Projet CampusEnroll — Déploiement Public 24/7 & Démonstration Shift-Right pour le Professeur

Ce guide vous permet d'obtenir **deux URLs publiques permanentes (en HTTPS)** accessibles depuis n'importe quel ordinateur ou téléphone (sans carte bancaire et 100% gratuitement) :
1. **Frontend (React 19 + Vite) :** Hébergé sur **Vercel** (`https://mon-campus.vercel.app`)
2. **Backend (Express API) :** Hébergé sur **Render** (`https://mon-backend.onrender.com`)
3. **Base de données MySQL :** Hébergée sur **TiDB Cloud Serverless** (MySQL 8.0 managé, persistant et gratuit à vie)

---

## 🏗️ Architecture du Déploiement

```mermaid
graph LR
    User["👨‍🏫 Professeur / Étudiant (Navigateur)"] -->|HTTPS| Vercel["⚡ Vercel (Frontend React)"]
    Vercel -->|VITE_API_URL / CORS| Render["🖥️ Render (Backend Express Node.js)"]
    Render -->|Connexion TLS / SSL| TiDB["🗄️ TiDB Cloud (MySQL 8.0 Managé)"]
    Render -->|Shift-Right / Kill Switch| Unleash["🛡️ Unleash Engine (Feature Flags)"]
```

---

## 📋 ÉTAPE 1 : Obtenir la Base de Données MySQL Gratuite (2 minutes)

Puisque Render ne propose pas de MySQL gratuit sur son offre de base (Render propose uniquement PostgreSQL), nous utilisons **TiDB Cloud Serverless**, la solution MySQL la plus populaire, 100% compatible MySQL 8.0, sans aucune carte de crédit requise.

1. Rendez-vous sur : [https://tidbcloud.com](https://tidbcloud.com)
2. Cliquez sur **Continue with GitHub** (connexion en 1 clic avec votre compte GitHub).
3. Cliquez sur **Create Cluster** :
   - Choisissez le type **Serverless (Free)**.
   - Région : **AWS Frankfurt (eu-central-1)** ou la plus proche de vous.
   - Cliquez sur **Create**.
4. Dans l'onglet **Overview**, cliquez sur le bouton **Connect** :
   - Choisissez **Connect with: Node.js (mysql2)** ou **General Client**.
   - Notez le mot de passe généré et copiez l'URL de connexion ou les paramètres :
     ```text
     Host     : gateway01.eu-central-1.prod.aws.tidbcloud.com
     Port     : 4000
     User     : xxxxx.root
     Password : VotrePassword
     Database : test
     SSL      : Required
     ```
   - Ou la chaîne URI complète :
     `mysql://user:password@gateway01.eu-central-1.prod.aws.tidbcloud.com:4000/test?ssl={"rejectUnauthorized":true}`

> 💡 **Magie de votre backend :** Dès que le backend démarrera sur Render, notre script d'auto-migration (`initDatabase.js`) va automatiquement créer toutes les tables (`users`, `courses`, `coupons`, `enrollments`, `payments`) et insérer les 6 cours complets ainsi que les comptes démo ! Vous n'avez aucun script SQL à taper.

---

## 🖥️ ÉTAPE 2 : Déployer le Backend sur Render (3 minutes)

1. Rendez-vous sur : [https://render.com](https://render.com) et connectez-vous avec votre compte **GitHub**.
2. Sur votre Dashboard Render, cliquez sur le bouton **New +** en haut à droite, puis sélectionnez **Web Service**.
3. Choisissez **Build and deploy from a Git repository**, puis sélectionnez votre dépôt **`Bl-lh/app-etudiant`**.
4. Remplissez les champs de configuration :
   - **Name :** `campus-enroll-backend` *(ou le nom de votre choix)*
   - **Region :** Frankfurt (EU Central)
   - **Branch :** `main`
   - **Root Directory :** `backend` *(très important !)*
   - **Runtime :** `Node`
   - **Build Command :** `npm install`
   - **Start Command :** `node src/server.js`
   - **Instance Type :** `Free` ($0/month)
5. Descendez à la section **Environment Variables** et ajoutez :
   | Clé | Valeur | Description |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Active le mode production |
   | `PORT` | `10000` | Port d'écoute Render |
   | `JWT_SECRET` | `campus_secret_key_jwt_render_2026` | Clé secrète des jetons |
   | `DATABASE_URL` | *(Collez l'URL de TiDB Cloud obtenue à l'Étape 1)* | Lien de connexion MySQL |
   | `DB_SSL` | `true` | Force le chiffrement TLS sécurisé |
   | `RELEASE_TYPE` | `STABLE` | Indicateur de version Shift-Right |
   | `APP_VERSION` | `v1.0.0-stable` | Version applicative |
6. Cliquez sur **Deploy Web Service**.
7. Attendez environ 1 à 2 minutes :
   - Dans les logs de déploiement, vous verrez :
     ```text
     ✓ Base de données MySQL connectée avec succès (Persistance active)
     ⚡ [Database] Base vide détectée. Initialisation automatique...
     ✓ [Database] Schéma et données de référence créés avec succès !
     Serveur opérationnel sur : http://localhost:10000
     ```
8. **Copiez l'URL HTTPS de votre backend** affichée en haut (ex: `https://campus-enroll-backend.onrender.com`).
   - Testez dans votre navigateur : `https://campus-enroll-backend.onrender.com/health`  
     👉 Vous recevez : `{"status":"UP","database":"CONNECTED"}` !

---

## ⚡ ÉTAPE 3 : Déployer le Frontend sur Vercel (2 minutes)

1. Rendez-vous sur : [https://vercel.com](https://vercel.com) et connectez-vous avec votre compte **GitHub**.
2. Cliquez sur **Add New...** > **Project**.
3. Sélectionnez le dépôt **`Bl-lh/app-etudiant`** et cliquez sur **Import**.
4. Configurez le projet :
   - **Project Name :** `campus-enroll` *(ou votre choix)*
   - **Framework Preset :** `Vite` (détecté automatiquement)
   - **Root Directory :** Cliquez sur **Edit**, sélectionnez le dossier **`frontend`** et validez.
5. Déroulez la section **Environment Variables** et ajoutez :
   - **Key :** `VITE_API_URL`
   - **Value :** `https://campus-enroll-backend.onrender.com/api`  
     *(Remplacez par l'URL de votre backend Render obtenue à l'étape 2 en ajoutant `/api` à la fin)*
6. Cliquez sur **Deploy**.
7. En moins de 45 secondes, Vercel affiche l'écran de félicitations avec votre URL publique :  
   👉 **`https://campus-enroll.vercel.app`** !

---

## 🎓 ÉTAPE 4 : Appliquer le travail demandé par le prof (Démonstration en direct)

Vous avez maintenant votre application déployée en Cloud public 24h/24 ! Voici comment dérouler la démonstration devant le professeur :

### 1. Démontrer l'Application Web Fonctionnelle en Production
1. Donnez au professeur l'URL Vercel : `https://campus-enroll.vercel.app`.
2. Connectez-vous avec le compte pré-créé :
   - **Email :** `etudiant@campus-online.ma`
   - **Mot de passe :** `Password123!`  
   *(Ou cliquez sur le bouton de connexion rapide en haut à droite)*
3. Allez dans le **Catalogue des cours**, inscrivez-vous à un cours et procédez au paiement.
4. Cliquez sur **Remplir Carte Valide** puis sur **Régler et Confirmer**.
5. 👉 **Preuve :** Le paiement réussit en direct, des confettis apparaissent et le reçu officiel est généré avec persistance dans la base TiDB Cloud !

---

### 2. Démontrer le Chaos Testing & l'Injection de Panne Unleash
Expliquez au professeur :
> *« Nous allons simuler une panne soudaine de la passerelle de paiement en production sans modifier le code ni redéployer, via notre moteur de Feature Flags Unleash. »*

1. Ouvrez un nouvel onglet dans votre navigateur et chargez l'URL d'activation :  
   👉 `https://campus-enroll-backend.onrender.com/api/shift-right/unleash/toggle?flag=chaos_faulty_payment&action=on`  
   *(Vous recevez : `{"success":true,"message":"Feature Flag 'chaos_faulty_payment' activé (Panne simulée)."}`)*
2. Retournez immédiatement sur votre site Vercel et tentez de régler une inscription :
3. 👉 **Résultat réel :** L'application affiche un bandeau rouge d'erreur 500 :  
   `"Échec critique : La passerelle de règlement bancaire est indisponible (Panne simulée via Feature Flag Unleash)."`

---

### 3. Démontrer le Kill Switch Dynamique (< 2 secondes, Zéro Downtime)
Expliquez au professeur :
> *« En production classique, réparer ce bug exigerait un hotfix git, un pipeline CI/CD et un redémarrage de conteneur d'au moins 20 minutes. Avec notre stratégie Shift-Right, nous déclenchons le Kill Switch. Le RTO est de moins de 2 secondes sans aucune coupure de service. »*

1. Ouvrez dans votre navigateur l'URL de coupure d'urgence :  
   👉 `https://campus-enroll-backend.onrender.com/api/shift-right/unleash/toggle?flag=chaos_faulty_payment&action=off`  
   *(Vous recevez : `{"success":true,"killSwitchTriggered":true,"message":"Kill Switch déclenché : Feature Flag désactivé. Trafic rétabli !"}`)*
2. Sur la page Vercel, sans même rafraîchir la page, recliquez sur **Régler et Confirmer** :
3. 👉 **Résultat réel :** Le paiement repasse instantanément au vert avec succès et le reçu s'affiche !

---

### 4. Démontrer le Canary Deployment (V1 Stable vs V2 Canary)
1. Ouvrez dans le navigateur l'endpoint de diagnostic Shift-Right :  
   `https://campus-enroll-backend.onrender.com/api/shift-right/status`
2. Ouvrez les outils développeurs (`F12` > Réseau) sur Vercel :
   - Montrez les en-têtes HTTP de chaque transaction :
     - `X-Canary-Pool : backend_stable` (ou `backend_canary`)
     - `X-Shift-Right-Router : Nginx-Canary-v1`
3. Expliquez au professeur :
   > *« Notre infrastructure est architecturée avec deux niveaux de résilience :  
   > 1. Au niveau réseau, un routeur Nginx Canary sépare le trafic réel (90% Stable / 10% Canary).  
   > 2. Au niveau applicatif, le moteur Unleash permet d'activer le Kill Switch en moins de 2 secondes.  
   > Cette double protection garantit que nos étudiants ne subissent jamais d'interruption de service. »*

---

## 🏆 Synthèse des Liens Utiles

| Rôle | Service Cloud | Lien / URL type |
| :--- | :--- | :--- |
| **Frontend Public** | Vercel | `https://campus-enroll.vercel.app` |
| **Backend API** | Render | `https://campus-enroll-backend.onrender.com` |
| **Santé du Backend** | Render | `https://campus-enroll-backend.onrender.com/health` |
| **Statut Shift-Right** | Render | `https://campus-enroll-backend.onrender.com/api/shift-right/status` |
| **Activer la Panne 500** | Render | `https://campus-enroll-backend.onrender.com/api/shift-right/unleash/toggle?action=on` |
| **Couper la Panne (Kill Switch)** | Render | `https://campus-enroll-backend.onrender.com/api/shift-right/unleash/toggle?action=off` |
| **Base MySQL Managée** | TiDB Cloud | [https://tidbcloud.com](https://tidbcloud.com) |
