# Module Comparatif de Tests : JUnit 5, Mockito & JaCoCo vs Jest & Istanbul

Ce module a été conçu pour établir une **comparaison rigoureuse et concrète** entre :
1. **La pile académique & entreprise Java** (recommandée par **Pr. Asmaa Retbi**) :
   * **Test Runner / Assertions :** `JUnit 5 (Jupiter)`
   * **Bouchonnage / Mocking :** `Mockito 5`
   * **Couverture de code :** `JaCoCo` (avec support du standard XML `Cobertura`)
2. **La pile Full-Stack JavaScript** (mise en œuvre dans le projet `CampusEnroll`) :
   * **Test Runner / Assertions / Mocks :** `Jest` (Backend) & `Vitest + React Testing Library` (Frontend)
   * **Couverture de code :** `Istanbul (nyc)` & `V8 Coverage` (avec export XML `Cobertura`)

---

## 1. Structure du Module Java (`comparatif-java`)

```
comparatif-java/
├── pom.xml                                  <- Configuration Maven (JUnit 5, Mockito, JaCoCo, Quality Gates)
└── src/
    ├── main/java/ma/emi/campus/
    │   ├── model/                          <- Modèles métier (User, Course, Enrollment)
    │   ├── repository/
    │   │   └── EnrollmentRepository.java   <- Interface DAO (cible de bouchonnage Mockito)
    │   └── service/
    │       ├── LuhnValidator.java          <- Algorithme Modulo 10 (identique à utils/luhnValidator.js)
    │       ├── DiscountService.java        <- Règles de coupons (identique à services/discountService.js)
    │       ├── PaymentGateway.java         <- Interface bancaire (cible de bouchonnage Mockito)
    │       └── EnrollmentService.java      <- Service métier orchestrant l'inscription
    └── test/java/ma/emi/campus/service/
        ├── LuhnValidatorTest.java          <- Tests unitaires purs JUnit 5 (@ParameterizedTest, AssertJ)
        ├── DiscountServiceTest.java        <- Tests de branches et cas limites (Branch Coverage JaCoCo)
        └── EnrollmentServiceTest.java      <- Tests avec Mockito 5 (@Mock, @InjectMocks, verify, Captor)
```

---

## 2. Commandes d'Exécution et Démonstration

### A. Exécuter les Tests Java (JUnit 5 + Mockito + JaCoCo)
```bash
# Depuis la racine du projet
npm run test:java:coverage

# Ou directement avec Maven
cd comparatif-java
mvn clean test jacoco:report
```
* **Rapport HTML JaCoCo :** Ouvrir dans un navigateur `comparatif-java/target/site/jacoco/index.html`.
* **Rapport XML JaCoCo :** `comparatif-java/target/site/jacoco/jacoco.xml`.

### B. Exécuter les Tests Backend (Jest + Istanbul + Cobertura)
```bash
npm run test:backend:coverage
```
* **Rapport HTML Istanbul :** `backend/coverage/index.html`.
* **Rapport XML Cobertura :** `backend/coverage/cobertura-coverage.xml`.

### C. Exécuter les Tests Frontend (React Testing Library + Vitest + Cobertura)
```bash
npm run test:frontend:coverage
```
* **Rapport HTML :** `frontend/coverage/index.html`.
* **Rapport XML Cobertura :** `frontend/coverage/cobertura-coverage.xml`.

### D. Exécuter la Suite Complète (Toutes les Piles en Une Seule Commande)
```bash
npm run test:comparatif:all
```
