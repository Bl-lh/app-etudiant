# Guide Opérationnel : Shift-Right Testing & Progressive Delivery (Canary & Unleash sur OCI)

**École Mohammadia d'Ingénieurs (EMI) — Département Génie Informatique**  
**Cycle Ingénieur d'État : Option Systèmes d'Information & Génie Logiciel (SI-GL)**  
**Cadre Méthodologique : SRE, DevOps & Shift-Right Testing en Production**  
**Auteur : Bilal LAHYANI (`bilallahyani2004@gmail.com`) — Encadrement : Pr. Asmaa RETBI**

---

## Table des Matières
1. [Contexte & Objectifs du Projet](#1-contexte--objectifs-du-projet)
2. [Architecture Globale du Système](#2-architecture-globale-du-système)
3. [Guide Pas à Pas : Déploiement sur Oracle Cloud Infrastructure (OCI Free Tier)](#3-guide-pas-à-pas--déploiement-sur-oracle-cloud-infrastructure-oci-free-tier)
4. [Intégration d'Unleash (Feature Flags & Kill Switch)](#4-intégration-dunleash-feature-flags--kill-switch)
5. [Stratégie de Canary Deployment avec Nginx](#5-stratégie-de-canary-deployment-avec-nginx)
6. [Protocole de Simulation de Panne (Failure Injection)](#6-protocole-de-simulation-de-panne-failure-injection)
7. [Procédures de Recouvrement (Rollback Nginx & Kill Switch Unleash)](#7-procédures-de-recouvrement-rollback-nginx--kill-switch-unleash)
8. [Guide des Commandes Pratiques (Cheatsheet)](#8-guide-des-commandes-pratiques-cheatsheet)
9. [Matrice Comparative : Nginx vs Flagger vs Argo Rollouts vs Traefik](#9-matrice-comparative--nginx-vs-flagger-vs-argo-rollouts-vs-traefik)

---

## 1. Contexte & Objectifs du Projet

Dans le cycle de vie logiciel moderne, le **Shift-Left Testing** (tests unitaires, tests de mutation, tests d'intégration en pré-production) ne suffit plus à garantir une disponibilité à 99.99%. Certaines anomalies ne se manifestent qu'en conditions réelles : concurrence imprévue, latence réseau, comportement réel des utilisateurs et intégrations tierces.

Le **Shift-Right Testing** (ou *Testing in Production*) consiste à déplacer la validation logicielle au sein même de l'environnement de production en s'appuyant sur deux piliers :
1. **Le Progressive Delivery (Canary Deployment)** : Router progressivement une fraction du trafic réel (ex: 10%) vers une nouvelle version candidate afin de limiter le rayon d'impact (*blast radius*) en cas de dysfonctionnement.
2. **Les Feature Flags (Unleash)** : Découpler le déploiement du code de l'activation de la fonctionnalité, permettant d'activer un composant à chaud ou de déclencher un **Kill Switch instantané** sans redéploiement ni interruption de service.

### Consigne Réalisée :
> "Déployer une application sur un serveur gratuit (Oracle Cloud Free Tier), puis utiliser deux outils : **Canary Deployments** et **Unleash**, afin de simuler une panne (failure) et son rétablissement automatique ou manuel (recouvrement)."

---

## 2. Architecture Globale du Système

La stack est orchestrée avec **Docker & Docker Compose** sur une instance **Oracle Cloud Infrastructure (OCI)** :

```
                        UTILISATEURS / REQUÊTES HTTP (Port 80)
                                          │
                                          ▼
                      ┌───────────────────────────────────────┐
                      │    ORACLE CLOUD INFRASTRUCTURE (OCI)  │
                      │       Sécurité VCN (Ports 80, 4242)   │
                      │  Firewall OS (iptables ouvert tcp/80) │
                      └───────────────────┬───────────────────┘
                                          │
                                          ▼
                      ┌───────────────────────────────────────┐
                      │    CANARY ROUTER REVERSE PROXY        │
                      │          (Nginx Alpine)               │
                      │   split_clients 90% Stable / 10% V2   │
                      │   Header Override: "X-Canary: always" │
                      └───────────────┬───────┬───────────────┘
                                      │       │
                     90% du trafic    │       │   10% du trafic (Canary)
                     (ou par défaut)  │       │   (ou header X-Canary)
                                      ▼       ▼
                ┌────────────────────────┐  ┌────────────────────────┐
                │   campus-app-stable    │  │   campus-app-canary    │
                │     (Version 1.0.0)    │  │     (Version 2.0.0)    │
                │     Conteneur Docker   │  │     Conteneur Docker   │
                └───────────┬────────────┘  └───────────┬────────────┘
                            │                           │
                            │   Vérification Flag       │   Vérification Flag
                            │   "chaos_faulty_payment"  │   "chaos_faulty_payment"
                            └─────────────┬─────────────┘
                                          │
                                          ▼
                        ┌───────────────────────────────────┐
                        │    SERVEUR UNLEASH (Port 4242)    │
                        │    (Feature Flag & Kill Switch)   │
                        │       unleashorg/unleash-server   │
                        └─────────────────┬─────────────────┘
                                          │
                                          ▼
                        ┌───────────────────────────────────┐
                        │    POSTGRESQL 15 (unleash-db)     │
                        │   Persistance des Feature Flags   │
                        └───────────────────────────────────┘
```

### Rôle des Composants Déployés :
| Composant | Rôle Technique | Port Interne / Externe |
| :--- | :--- | :--- |
| `campus-canary-router` | Reverse proxy Nginx avec `split_clients` et header routing | `80:80` (Public) |
| `campus-app-stable-v1` | Version de référence stable (V1.0.0) | `5000` (Réseau bridge interne) |
| `campus-app-canary-v2` | Version candidate Canary (V2.0.0) | `5000` (Réseau bridge interne) |
| `campus-unleash-server` | Moteur de Feature Flags & tableau de bord de gestion | `4242:4242` (Public / Admin) |
| `campus-unleash-db` | Base PostgreSQL dédiée au stockage des états Unleash | `5432` (Réseau interne) |
| `campus-mysql` | Base de données métier MySQL de l'application | `3306` (Réseau interne) |

---

## 3. Guide Pas à Pas : Déploiement sur Oracle Cloud Infrastructure (OCI Free Tier)

Le déploiement sur **Oracle Cloud Free Tier** offre gratuitement jusqu'à 4 OCPU et 24 Go de RAM (instances Ampere A1 ARM) ou 2 instances micro AMD (1 OCPU, 1 Go RAM).

### Étape 3.1 : Création de l'Instance Virtuelle (Compute VM)
1. Rendez-vous sur la console [Oracle Cloud Infrastructure](https://cloud.oracle.com/).
2. Menu principal $\to$ **Compute** $\to$ **Instances** $\to$ Cliquez sur **Create Instance**.
3. **Paramètres recommandés :**
   - **Name :** `instance-campus-shift-right`
   - **Image :** `Ubuntu 22.04 Minimal LTS` ou `Oracle Linux 9`.
   - **Shape :**
     - Option A (Recommandée) : `VM.Standard.A1.Flex` (Ampere ARM, 2 à 4 OCPU, 12 Go RAM — 100% gratuit à vie).
     - Option B : `VM.Standard.E2.1.Micro` (AMD, 1 OCPU, 1 Go RAM).
   - **Networking :** Créez une nouvelle Virtual Cloud Network (VCN) avec un sous-réseau public et cochez **Assign a public IPv4 address**.
   - **SSH Keys :** Téléchargez la clé privée générée (`ssh-key.key`) ou collez votre clé publique locale.
4. Cliquez sur **Create**. Notez l'adresse IP publique attribuée (ex: `152.67.x.x`).

---

### Étape 3.2 : Ouverture des Ports Réseau dans la Security List d'OCI
Par défaut, le pare-feu virtuel d'Oracle Cloud bloque tout le trafic entrant à l'exception du port SSH (22).

1. Sur la page de votre instance, cliquez sur le lien de votre **Subnet** $\to$ Cliquez sur la **Default Security List for VCN**.
2. Cliquez sur **Add Ingress Rules** et ajoutez les règles suivantes :

| Source CIDR | Protocole IP | Port Plage | Description |
| :--- | :--- | :--- | :--- |
| `0.0.0.0/0` | TCP | `80` | Trafic HTTP public vers le routeur Canary |
| `0.0.0.0/0` | TCP | `443` | Trafic HTTPS sécurisé |
| `0.0.0.0/0` | TCP | `4242` | Console d'administration Unleash (Feature Flags) |

---

### Étape 3.3 : Résolution du Piège OCI (Pare-feu interne OS `iptables`)
> **ATTENTION (Piège classique sous OCI) :** Même après avoir ouvert les ports dans la Security List, les images Ubuntu/Oracle Linux d'Oracle Cloud possèdent des règles locales `iptables` qui rejettent le trafic sur le port 80 et 4242 !

Connectez-vous en SSH à votre machine OCI :
```bash
ssh -i /chemin/vers/ssh-key.key ubuntu@<IP_PUBLIQUE_OCI>
```

Exécutez immédiatement les commandes pour débloquer les ports au niveau du système d'exploitation :
```bash
# Autoriser les ports 80, 443 et 4242 dans les règles iptables
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 4242 -j ACCEPT

# Persister les règles pour qu'elles survivent à un redémarrage
sudo apt-get update && sudo apt-get install -y iptables-persistent
sudo netfilter-persistent save
sudo netfilter-persistent reload
```

---

### Étape 3.4 : Installation de Docker et Docker Compose sur OCI
Sur votre machine virtuelle OCI :
```bash
# Mise à jour des paquets
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg lsb-release git

# Installation officielle de Docker Engine
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Autoriser l'utilisateur ubuntu à exécuter docker sans sudo
sudo usermod -aG docker ubuntu
newgrp docker

# Vérification
docker --version
docker compose version
```

---

### Étape 3.5 : Déploiement de la Stack Applicative sur OCI
Transférez le projet ou clonez-le sur la machine OCI :
```bash
# Cloner le dépôt sur l'instance OCI
git clone https://github.com/votre-compte/app-etudiant.git
cd app-etudiant/shift-right

# Lancement des conteneurs
docker compose up -d --build

# Vérification de l'état des conteneurs
docker compose ps
```

Vous devriez voir les 6 conteneurs à l'état `healthy` ou `running` :
- `campus-canary-router` (Port 80)
- `campus-app-stable-v1`
- `campus-app-canary-v2`
- `campus-unleash-server` (Port 4242)
- `campus-unleash-db`
- `campus-mysql`

---

## 4. Intégration d'Unleash (Feature Flags & Kill Switch)

### 4.1. Principe de Fonctionnement du SDK Unleash
L'application Express Backend intègre le client officiel `unleash-client` via le module singleton [`backend/src/services/unleashService.js`](file:///home/bilal/Desktop/app-etudiant/backend/src/services/unleashService.js) :

```javascript
const { initialize, isEnabled } = require('unleash-client');

const unleash = initialize({
  url: process.env.UNLEASH_URL || 'http://unleash-server:4242/api',
  appName: 'campus-enroll-backend',
  environment: 'production',
  customHeaders: {
    Authorization: process.env.UNLEASH_API_TOKEN
  },
  refreshInterval: 2000, // Rafraîchissement ultra-rapide toutes les 2 secondes
  metricsInterval: 5000
});

function isFeatureEnabled(toggleName, context = {}, defaultValue = false) {
  return isEnabled(toggleName, context, defaultValue);
}
```

### 4.2. Le Flag de Panne Contrôlée : `chaos_faulty_payment`
Dans le contrôleur de paiement ou l'endpoint de transaction [`shiftRightController.js`](file:///home/bilal/Desktop/app-etudiant/backend/src/controllers/shiftRightController.js) :

```javascript
// Si le flag est activé dans Unleash -> Déclenchement de la panne
if (isFeatureEnabled('chaos_faulty_payment', context, false)) {
  console.error(`[CHAOS FAILURE] Feature Flag actif ! Injection d'une erreur 500.`);
  return res.status(500).json({
    success: false,
    status: 500,
    errorCode: 'ERR_UNLEASH_CHAOS_PAYMENT_FAILURE',
    message: 'ÉCHEC CRITIQUE : La passerelle de paiement v2 a crashé.',
    details: { faultInjectedBy: 'Unleash Feature Flag [chaos_faulty_payment]' }
  });
}

// Comportement nominal lorsque le flag est désactivé
return res.status(200).json({
  success: true,
  message: 'Transaction validée avec succès.',
  transactionId: `TX-${Date.now()}`
});
```

### 4.3. Accès au Tableau de Bord Unleash
1. Ouvrez votre navigateur sur `http://<IP_PUBLIQUE_OCI>:4242/`.
2. Connectez-vous avec les identifiants par défaut :
   - **Username :** `admin`
   - **Password :** `unleash4all`
3. Créez un nouveau Feature Flag :
   - **Name :** `chaos_faulty_payment`
   - **Type :** `Kill switch`
   - **Project :** `default`
   - **Impression :** Activer / Désactiver le switch dans l'environnement `production`.

---

## 5. Stratégie de Canary Deployment avec Nginx

Le routeur Nginx agit comme point d'entrée unique sur le port 80 et implémente la distribution progressive du trafic via la directive native `split_clients` :

### Configuration Nginx Active ([`shift-right/nginx/nginx.conf`](file:///home/bilal/Desktop/app-etudiant/shift-right/nginx/nginx.conf)) :
```nginx
# Définition des upstreams
upstream backend_stable {
    server app-stable:5000 max_fails=3 fail_timeout=5s;
}

upstream backend_canary {
    server app-canary:5000 max_fails=3 fail_timeout=5s;
}

# Répartition progressive : 90% Stable / 10% Canary
split_clients "${remote_addr}${http_user_agent}${msec}" $split_target {
    90%     backend_stable;
    *       backend_canary;
}

# Mécanisme de ciblage prioritaire par en-tête HTTP pour les tests QA
map $http_x_canary $upstream_choice {
    "always"    backend_canary;   # Force 100% Canary
    "never"     backend_stable;   # Force 100% Stable
    default     $split_target;    # 90/10 par défaut
}

server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://$upstream_choice;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        # En-têtes HTTP de traçabilité injectés dans la réponse
        add_header X-Served-By-Upstream $upstream_addr always;
        add_header X-Canary-Pool $upstream_choice always;
    }
}
```

### Avantages Majeurs de cette Conception :
1. **Zéro latence additionnelle :** Traitement en mémoire vive au niveau du reverse proxy C de Nginx.
2. **Double mode d'aiguillage :**
   - **Mode Public Aléatoire :** 90% des requêtes anonymes vont vers Stable, 10% vont vers Canary.
   - **Mode Ciblé QA/SRE :** En envoyant l'en-tête `curl -H "X-Canary: always"`, les testeurs peuvent forcer l'exécution sur le Canary pour des tests de fumée avant l'ouverture du trafic public.

---

## 6. Protocole de Simulation de Panne (Failure Injection)

Ce protocole expérimental démontre le comportement du système lors de la survenue d'une régression en production.

### Étape 1 : Vérification de l'État Nominal
Exécutez le script de trafic pour valider que 100% des transactions réussissent en conditions standard :
```bash
bash scripts/simulate_traffic.sh http://localhost/api/shift-right/transaction 20
```
**Résultat attendu :**
- 18 requêtes sur `[STABLE v1]` : `200 OK`
- 2 requêtes sur `[CANARY v2]` : `200 OK`
- Taux d'échec : **0.0%**.

---

### Étape 2 : Déclenchement de la Panne (Failure Injection)
Nous simulons le déploiement d'un bug critique sur la passerelle de paiement en activant le Feature Flag Unleash :

**Option A (Via le Script CLI) :**
```bash
bash scripts/unleash_toggle_flag.sh on
```

**Option B (Via l'Interface Web Unleash) :**
- Rendez-vous sur `http://<IP_PUBLIQUE_OCI>:4242/projects/default/features/chaos_faulty_payment`.
- Basculez l'interrupteur sur **Enabled** dans l'environnement `production`.

---

### Étape 3 : Observation de la Panne en Direct
Lancez à nouveau le générateur de trafic :
```bash
bash scripts/simulate_traffic.sh http://localhost/api/shift-right/transaction 30
```

**Résultat observé dans le terminal :**
```text
Req #01 | 200 OK  | [STABLE  v1] (v1.0.0-stable) | 42ms | Transaction validée
Req #02 | 200 OK  | [STABLE  v1] (v1.0.0-stable) | 39ms | Transaction validée
Req #03 | 500 ERR | [CANARY  v2] (v2.0.0-canary) | 45ms | ERR_UNLEASH_CHAOS_PAYMENT_FAILURE
Req #04 | 200 OK  | [STABLE  v1] (v1.0.0-stable) | 41ms | Transaction validée
...
--------------------------------------------------------------------
BILAN STATISTIQUE DU TRAFIC SHIFT-RIGHT :
  • Total Requêtes     : 30
  • Requêtes V1 Stable : 27 (90.0%)
  • Requêtes V2 Canary : 3 (10.0%)
  • Succès (HTTP 200)  : 27
  • Échecs (HTTP 5xx)  : 3
  • Taux d'Échec Global: ⚠️  ALERTE PANNE DÉTECTÉE : Taux d'erreur de 10.0% !
```

> **Analyse SRE :** Grâce au Canary 90/10, l'anomalie critique n'a impacté que **10% des utilisateurs** (rayon d'impact confiné). La version V1 Stable a continué de traiter 90% des paiements sans aucune anomalie !

---

## 7. Procédures de Recouvrement (Rollback Nginx & Kill Switch Unleash)

Nous disposons de deux mécanismes de rétablissement complémentaires pour neutraliser la panne :

### Méthode 1 : Le Kill Switch Instantané via Unleash (Temps de rétablissement < 2 sec)
Si l'anomalie est liée à une nouvelle fonctionnalité sous Feature Flag, le Kill Switch permet d'éteindre le composant défaillant **sans toucher à l'infrastructure ni redéployer** :

```bash
# Déclenchement de la coupure d'urgence
bash scripts/unleash_toggle_flag.sh off
```
*Le client Unleash dans les conteneurs synchronise le changement en 2 secondes.*

**Vérification immédiate :**
```bash
bash scripts/simulate_traffic.sh http://localhost/api/shift-right/transaction 20
```
> **Résultat :** 100% des requêtes (Stable et Canary) reviennent instantanément à `200 OK`. Zéro redémarrage de conteneur, zéro interruption de service.

---

### Méthode 2 : Le Rollback Nginx Canary d'Urgence (Coupure Totale de la Version V2)
Si le conteneur Canary présente un problème structurel (ex: fuite mémoire, crash de processus, faille de sécurité), le SRE coupe immédiatement tout routage vers le Canary en le basculant à 100% sur Stable :

```bash
# Exécution du script de rollback
bash scripts/canary_rollback.sh
```

**Actions effectuées par le script :**
1. Remplacement de `nginx.conf` par le profil [`nginx-rollback.conf`](file:///home/bilal/Desktop/app-etudiant/shift-right/nginx/nginx-rollback.conf).
2. Rechargement gracieux de Nginx en mémoire sans perte de connexion : `docker exec campus-canary-router nginx -s reload`.
3. Désormais, 100% du trafic est servi par `campus-app-stable-v1`.

Pour réactiver le Canary après correction du code :
```bash
bash scripts/canary_promote.sh
```

---

## 8. Guide des Commandes Pratiques (Cheatsheet)

### Commandes de Déploiement et Cycle de Vie :
```bash
# Se placer dans le répertoire du projet
cd /home/bilal/Desktop/app-etudiant/shift-right

# Démarrer l'ensemble de la stack en arrière-plan
docker compose up -d --build

# Consulter les logs du routeur Nginx en direct
docker logs -f campus-canary-router

# Consulter les logs de l'application Canary
docker logs -f campus-app-canary-v2

# Arrêter proprement la stack
docker compose down
```

### Commandes de Test et de Démonstration au Professeur :
```bash
# 1. Tester l'accès au statut du routeur Canary
curl -i http://localhost/canary-status

# 2. Forcer un appel vers la version V1 Stable
curl -i -H "X-Canary: never" http://localhost/api/shift-right/status

# 3. Forcer un appel vers la version V2 Canary
curl -i -H "X-Canary: always" http://localhost/api/shift-right/status

# 4. Lancer une simulation de 50 transactions réparties
bash scripts/simulate_traffic.sh http://localhost/api/shift-right/transaction 50

# 5. Déclencher la panne via Unleash (Simuler Failure)
bash scripts/unleash_toggle_flag.sh on

# 6. Constater la hausse des erreurs 500
bash scripts/simulate_traffic.sh http://localhost/api/shift-right/transaction 30

# 7. Actionner le Kill Switch Unleash (Recouvrement instantané)
bash scripts/unleash_toggle_flag.sh off

# 8. Actionner le Rollback Nginx (Coupure totale du Canary)
bash scripts/canary_rollback.sh
```

---

## 9. Matrice Comparative : Nginx vs Flagger vs Argo Rollouts vs Traefik

| Critère d'Évaluation | Nginx `split_clients` (Notre Approche) | Traefik Canary | Flagger (Kubernetes) | Argo Rollouts (Kubernetes) |
| :--- | :--- | :--- | :--- | :--- |
| **Environnement Requis** | Docker / Docker Compose / VM OCI | Docker / K8s | Cluster Kubernetes (K8s) | Cluster Kubernetes (K8s) |
| **Consommation Mémoire** | **Ultra-faible (< 20 Mo RAM)** | Faible (< 80 Mo RAM) | Élevée (Istio/Linkerd requis) | Moyenne (CRD K8s) |
| **Compatibilité OCI Free** | **Parfaite (Micro ou Ampere)** | Très bonne | Lourde pour une VM 1 Go | Lourde pour une VM 1 Go |
| **Granularité du Routage** | Pourcentage fixe ou par en-tête | Poids d'upstream | Métriques Prometheus actives | Analyse de métriques & étapes |
| **Temps de Rollback** | **< 100 ms (`nginx -s reload`)** | Immédiat | Automatique sur alerte | Automatique sur métrique |
| **Complexité d'Exploitation**| Simple & direct | Modérée | Complexe (Service Mesh) | Modérée à Complexe |

### Pourquoi cette architecture est idéale pour l'évaluation ?
1. **Économie de ressources OCI Free Tier :** L'approche Nginx + Docker Compose tourne sans encombre même sur l'instance gratuite la plus modeste (1 Go de RAM) tout en offrant la même rigueur conceptuelle qu'un cluster Kubernetes lourd.
2. **Couplage Parfait avec Unleash :** La combinaison du **Canary Routing** (niveau réseau/infrastructure) et des **Feature Flags** (niveau applicatif/code) constitue l'état de l'art du *Shift-Right Testing* moderne recommandé par les géants de la tech (Netflix, Spotify, GitHub).
