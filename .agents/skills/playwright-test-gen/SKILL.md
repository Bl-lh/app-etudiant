---
name: playwright-test-gen
description: Guide opérationnel et protocole méthodologique pour générer, exécuter et qualifier des tests fonctionnels E2E Playwright via le serveur MCP Playwright et l'analyse de conformité ISTQB.
---

# Protocole de Génération de Tests Fonctionnels Playwright via MCP (Model Context Protocol)

Ce guide définit le flux de travail (workflow) standardisé pour explorer une application web, capturer des sélecteurs robustes via les outils MCP Playwright, et synthétiser des suites de tests fonctionnels E2E automatisées conformes aux normes ISTQB.

---

## 1. Architecture du Flux MCP $\rightarrow$ Playwright

```
┌────────────────────────┐      MCP Tools (JSON-RPC)      ┌──────────────────────────┐
│                        ├───────────────────────────────►│                          │
│   Agent IA / LLM       │  - playwright_navigate        │   Serveur MCP Playwright │
│  (Générateur de Tests) │  - playwright_click           │  (@executeautomation/    │
│                        │  - playwright_fill            │   playwright-mcp-server) │
│                        │  - playwright_screenshot      │                          │
│                        │◄───────────────────────────────┤                          │
└──────────┬─────────────┘      DOM State & Screenshots   └────────────┬─────────────┘
           │                                                           │
           │ Synthèse du code de test                                  │ Automatisation Headless
           ▼                                                           ▼
┌────────────────────────┐                                ┌──────────────────────────┐
│ tests-functional/*.js  │                                │  Application en Live     │
│ Spécification E2E      ├───────────────────────────────►│  http://localhost:5173   │
│ Oracles ISTQB          │   Runner Playwright natif      │  (React 19 + Express API)│
└────────────────────────┘                                └──────────────────────────┘
```

---

## 2. Étapes du Protocole de Génération

### Étape 1 : Exploration Dynamique (Grounding)
1. L'agent accède à l'application via `playwright_navigate(url: 'http://localhost:5173')`.
2. L'agent inspecte la hiérarchie DOM réelle (boutons, formulaires, labels accessibles, `data-testid`).
3. L'agent effectue les interactions utilisateur requises (connexion, sélection de cours, saisie de coupon).

### Étape 2 : Extraction des Sélecteurs Robustes (Best Practices Playwright)
* **Privilégier :** `page.getByRole()`, `page.getByLabel()`, `page.getByPlaceholder()`, `page.getByText()`.
* **Éviter impérativement :** Les chemins XPath absolus (`/html/body/div[1]/...`) et les sélecteurs CSS couplés au style visuel (ex: `.css-19v82ka`).

### Étape 3 : Écriture de la Spécification Playwright (`tests-functional/*.spec.js`)
* Chaque test doit suivre le pattern **Arrange-Act-Assert** (ou **Given-When-Then**).
* Définir des oracles précis (ex: présence du numéro de reçu, décrémentation des places disponibles, affichage du message d'erreur bancaire Luhn).

### Étape 4 : Validation & Boucle d'Auto-Correction (Self-Healing)
* Exécuter le test avec `npx playwright test`.
* Si un test échoue (changement de sélecteur ou latence d'API), analyser la trace d'échec (`playwright-report`) et corriger le script.
