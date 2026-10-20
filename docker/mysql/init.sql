-- ====================================================================
-- Initialisation de la Base de Données : Plateforme d'Inscription aux Cours
-- Système Persistant MySQL pour le cours de Tests Logiciels
-- ====================================================================

CREATE DATABASE IF NOT EXISTS campus_enrollment_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE campus_enrollment_db;

-- Désactivation temporaire des contraintes pour réinitialisation propre si nécessaire
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS test_audit_logs;
DROP TABLE IF EXISTS course_reviews;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS coupons;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- --------------------------------------------------------------------
-- 1. Table Utilisateurs (Étudiants, Enseignants, Administrateurs)
-- --------------------------------------------------------------------
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('STUDENT', 'ADMIN', 'INSTRUCTOR') NOT NULL DEFAULT 'STUDENT',
    phone VARCHAR(30),
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email (email),
    INDEX idx_user_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 2. Table Catégories de cours
-- --------------------------------------------------------------------
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'book-open'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 3. Table Cours en ligne
-- --------------------------------------------------------------------
CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(220) NOT NULL UNIQUE,
    summary VARCHAR(300) NOT NULL,
    description TEXT NOT NULL,
    instructor_name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    level ENUM('DEBUTANT', 'INTERMEDIAIRE', 'AVANCE') NOT NULL DEFAULT 'DEBUTANT',
    duration_hours INT NOT NULL DEFAULT 20,
    capacity INT NOT NULL DEFAULT 30,
    enrolled_count INT NOT NULL DEFAULT 0,
    image_url VARCHAR(255),
    syllabus JSON,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_courses_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    INDEX idx_course_category (category_id),
    INDEX idx_course_price (price),
    INDEX idx_course_level (level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 4. Table Bons de Réduction / Coupons (Pour tests de calcul de remise)
-- --------------------------------------------------------------------
CREATE TABLE coupons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    discount_percent INT NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
    valid_until DATE NOT NULL,
    max_uses INT NOT NULL DEFAULT 100,
    current_uses INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    INDEX idx_coupon_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 5. Table Inscriptions aux Cours (Enrollments)
-- --------------------------------------------------------------------
CREATE TABLE enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enrollment_number VARCHAR(50) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    status ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    progress_percent INT NOT NULL DEFAULT 0,
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_enrollments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_enrollments_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT,
    CONSTRAINT unique_user_course UNIQUE (user_id, course_id),
    INDEX idx_enrollment_user (user_id),
    INDEX idx_enrollment_course (course_id),
    INDEX idx_enrollment_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 6. Table Paiements (Traçabilité financière, transactions)
-- --------------------------------------------------------------------
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id VARCHAR(64) NOT NULL UNIQUE,
    receipt_number VARCHAR(64) NOT NULL UNIQUE,
    enrollment_id INT NOT NULL,
    user_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    original_amount DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    coupon_code VARCHAR(50),
    payment_method ENUM('CREDIT_CARD', 'PAYPAL', 'BANK_TRANSFER') NOT NULL,
    card_last4 VARCHAR(4),
    status ENUM('SUCCESS', 'FAILED', 'PENDING', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    failure_reason VARCHAR(255),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payments_enrollment FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
    CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_payment_tx (transaction_id),
    INDEX idx_payment_user (user_id),
    INDEX idx_payment_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 7. Table Avis et Évaluations
-- --------------------------------------------------------------------
CREATE TABLE course_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    user_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reviews_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 8. Table Journal d'Audit et Exécution des Tests Logiciels
-- --------------------------------------------------------------------
CREATE TABLE test_audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    test_suite VARCHAR(100) NOT NULL,
    test_case VARCHAR(100) NOT NULL,
    status ENUM('PASSED', 'FAILED', 'SKIPPED') NOT NULL,
    duration_ms INT NOT NULL DEFAULT 0,
    details TEXT,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- DONNÉES INITIALES (SEED DATA)
-- Mots de passe hashés avec bcrypt (salt rounds = 10)
-- Pour tous les comptes pré-créés, le mot de passe clair est : 'Password123!'
-- Hash bcrypt généré : '$2b$10$wzVdK.43d/D8p4JvP4sYxeKk6fL8aWqBf14G8uU4mZ7H.Ff/uI9/W' (ou recalculé dynamiquement)
-- ====================================================================

-- 1. Catégories
INSERT INTO categories (id, name, slug, description, icon) VALUES
(1, 'Développement Web & Mobile', 'dev-web-mobile', 'Maîtrisez les technologies full-stack modernes, React, Node.js, et microservices.', 'code'),
(2, 'Tests Logiciels & DevOps', 'tests-devops', 'Assurance qualité, tests unitaires, TDD, CI/CD et automatisation logicielle.', 'check-circle'),
(3, 'Intelligence Artificielle & Data', 'ia-data-science', 'Machine learning, analyse de données, Python et modèles prédictifs.', 'cpu'),
(4, 'Cybersécurité & Réseaux', 'cybersecurite', 'Sécurité applicative, cryptographie, ethical hacking et audit de conformité.', 'shield');

-- 2. Utilisateurs : Admin, Enseignants, Étudiants de démonstration
-- Hash pour 'Password123!' généré avec bcrypt : $2a$10$WwO5eYq25iM3vQYxO0X27uFp6OQ63p2b/Uv/eZJ7k2B0F4P.5qX6G
INSERT INTO users (id, name, email, password_hash, role, phone) VALUES
(1, 'Prof. Karim Alami', 'admin@campus-online.ma', '$2a$10$WkSkMW6YuEZTKy3ZNOea2OR2KiH5a.zhotNOwOWo8H3jic6sw0skO', 'ADMIN', '+212661000001'),
(2, 'Dr. Amina Benjelloun', 'amina.benjelloun@campus-online.ma', '$2a$10$WkSkMW6YuEZTKy3ZNOea2OR2KiH5a.zhotNOwOWo8H3jic6sw0skO', 'INSTRUCTOR', '+212661000002'),
(3, 'Bilal Mansouri', 'etudiant@campus-online.ma', '$2a$10$WkSkMW6YuEZTKy3ZNOea2OR2KiH5a.zhotNOwOWo8H3jic6sw0skO', 'STUDENT', '+212661000003'),
(4, 'Sarah Chraibi', 'sarah.c@campus-online.ma', '$2a$10$WkSkMW6YuEZTKy3ZNOea2OR2KiH5a.zhotNOwOWo8H3jic6sw0skO', 'STUDENT', '+212661000004');

-- 3. Cours disponibles
INSERT INTO courses (id, category_id, title, slug, summary, description, instructor_name, price, level, duration_hours, capacity, enrolled_count, image_url, syllabus) VALUES
(1, 2, 'Processus Complet des Tests Logiciels & Automatisation', 'tests-logiciels-complets',
 'Apprenez à concevoir, automatiser et documenter les tests unitaires, d''intégration et de recette.',
 'Ce cours magistral et pratique couvre exhaustivement l''art de la qualification logicielle : pyramide des tests, plans de tests, cas nominaux et aux limites (analyse de valeurs frontières, partition d''équivalence), TDD, tests de non-régression, Jest, Supertest, et génération de métriques de couverture.',
 'Prof. Karim Alami', 499.00, 'INTERMEDIAIRE', 36, 40, 2, 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
 JSON_ARRAY(
   JSON_OBJECT('module', 'Module 1', 'title', 'Fondamentaux de la Qualification et Normes ISTQB', 'duration', '6h'),
   JSON_OBJECT('module', 'Module 2', 'title', 'Tests Unitaires & Mocks avec Jest', 'duration', '10h'),
   JSON_OBJECT('module', 'Module 3', 'title', 'Tests d''Intégration d''APIs & Transactions SQL', 'duration', '10h'),
   JSON_OBJECT('module', 'Module 4', 'title', 'Automatisation End-to-End et Couverture de Code', 'duration', '10h')
 )),

(2, 1, 'Architecture Web Full-Stack Moderne avec React & Node.js', 'architecture-fullstack-react-node',
 'Construisez des applications résilientes, sécurisées et scalables avec React, Node.js et MySQL.',
 'Une formation approfondie pour concevoir de bout en bout des applications web professionnelles : conception de schémas relationnels normalisés, API RESTful sécurisées avec JWT, gestion des états réactifs côté client, et paiements en ligne intégrés.',
 'Dr. Amina Benjelloun', 650.00, 'AVANCE', 48, 30, 1, 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80',
 JSON_ARRAY(
   JSON_OBJECT('module', 'Module 1', 'title', 'Modélisation et Persistance Avancée avec MySQL', 'duration', '12h'),
   JSON_OBJECT('module', 'Module 2', 'title', 'Sécurité d''API, Authentification JWT & Rôles', 'duration', '12h'),
   JSON_OBJECT('module', 'Module 3', 'title', 'Front-End Réactif avec React, Hooks et Context', 'duration', '12h'),
   JSON_OBJECT('module', 'Module 4', 'title', 'Workflow de Paiement et Transaction ACID', 'duration', '12h')
 )),

(3, 3, 'Fondamentaux du Machine Learning & Analyse de Données', 'machine-learning-data-science',
 'Introduction pratique aux algorithmes supervisés, à la régression et à la classification.',
 'Découvrez la manipulation des jeux de données avec Python, Pandas, NumPy et Scikit-Learn. Conçu pour les ingénieurs souhaitant structurer des pipelines de données et valider des modèles statistiques.',
 'Dr. Amina Benjelloun', 550.00, 'DEBUTANT', 30, 25, 0, 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
 JSON_ARRAY(
   JSON_OBJECT('module', 'Module 1', 'title', 'Introduction aux données et statistiques descriptives', 'duration', '6h'),
   JSON_OBJECT('module', 'Module 2', 'title', 'Régression Linéaire et Logistique', 'duration', '8h'),
   JSON_OBJECT('module', 'Module 3', 'title', 'Arbres de décision et Forêts aléatoires', 'duration', '8h'),
   JSON_OBJECT('module', 'Module 4', 'title', 'Évaluation et Métriques de Performance', 'duration', '8h')
 )),

(4, 4, 'Sécurité des Applications Web & Cryptographie Pratique', 'securite-web-cryptographie',
 'Protégez vos applications contre les failles OWASP Top 10 et chiffrez les données sensibles.',
 'Ce cours traite des vulnérabilités classiques (Injections SQL, XSS, CSRF, failles d''authentification), de l''implémentation du hachage de mots de passe (bcrypt/argon2), de TLS et de la sécurisation des passerelles de transaction financière.',
 'Prof. Karim Alami', 599.00, 'AVANCE', 40, 20, 0, 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80',
 JSON_ARRAY(
   JSON_OBJECT('module', 'Module 1', 'title', 'OWASP Top 10 et Audit de Vulnérabilités', 'duration', '10h'),
   JSON_OBJECT('module', 'Module 2', 'title', 'Cryptographie, Hachage et Salage', 'duration', '10h'),
   JSON_OBJECT('module', 'Module 3', 'title', 'Sécurisation des Transactions Bancaires', 'duration', '10h'),
   JSON_OBJECT('module', 'Module 4', 'title', 'Tests de Pénétration Applicative', 'duration', '10h')
 )),

(5, 2, 'DevOps, Pipelines CI/CD & Orchestration avec Docker et Kubernetes', 'devops-cicd-docker-kubernetes',
 'Automatisez le déploiement, les tests continus et la scalabilité de vos applications conteneurisées.',
 'Une immersion complète dans les pratiques DevOps d''entreprise : conteneurisation avancée avec Docker, écriture de pipelines CI/CD automatisés (GitHub Actions, GitLab CI), tests d''intégration dans le pipeline, et gestion de clusters Kubernetes avec Helm et monitoring Prometheus/Grafana.',
 'Prof. Karim Alami', 620.00, 'AVANCE', 42, 35, 3, 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=800&auto=format&fit=crop&q=80',
 JSON_ARRAY(
   JSON_OBJECT('module', 'Module 1', 'title', 'Conteneurisation avancée et multi-stage builds Docker', 'duration', '8h'),
   JSON_OBJECT('module', 'Module 2', 'title', 'Chaînes d''intégration continue CI/CD & Qualimétrie', 'duration', '12h'),
   JSON_OBJECT('module', 'Module 3', 'title', 'Déploiement et Orchestration Kubernetes (K8s)', 'duration', '14h'),
   JSON_OBJECT('module', 'Module 4', 'title', 'Observabilité, Logging et Monitoring en production', 'duration', '8h')
 )),

(6, 1, 'Développement Mobile Multiplateforme avec React Native & Expo', 'developpement-mobile-react-native',
 'Créez des applications mobiles natives performantes et élégantes pour iOS et Android avec une seule base de code.',
 'Ce cours pratique vous forme à la création d''applications mobiles professionnelles : composants natifs, gestion d''état avec Redux/Zustand, navigation fluide, intégration des APIs matérielles (GPS, Caméra, Notifications Push) et tests unitaires mobiles avec Jest.',
 'Dr. Amina Benjelloun', 580.00, 'INTERMEDIAIRE', 36, 30, 2, 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&auto=format&fit=crop&q=80',
 JSON_ARRAY(
   JSON_OBJECT('module', 'Module 1', 'title', 'Fondements de React Native et écosystème Expo', 'duration', '8h'),
   JSON_OBJECT('module', 'Module 2', 'title', 'Interfaces réactives, Animations et Gestures', 'duration', '10h'),
   JSON_OBJECT('module', 'Module 3', 'title', 'Persistance locale, Offline-First et Synchronisation', 'duration', '10h'),
   JSON_OBJECT('module', 'Module 4', 'title', 'Publication sur Google Play Store et Apple App Store', 'duration', '8h')
 )),

(7, 3, 'Deep Learning, Vision par Ordinateur & NLP avec PyTorch', 'deep-learning-vision-nlp-pytorch',
 'Maîtrisez les réseaux de neurones profonds, la détection d''objets et les modèles de langage Transformers.',
 'Formation avancée dédiée aux réseaux neuronaux artificiels : convolutions (CNNs), vision par ordinateur (ResNet, YOLO), traitement automatique du langage naturel (NLP avec Transformers / HuggingFace) et optimisation des hyperparamètres sur GPU.',
 'Dr. Amina Benjelloun', 750.00, 'AVANCE', 50, 25, 1, 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop&q=80',
 JSON_ARRAY(
   JSON_OBJECT('module', 'Module 1', 'title', 'Architecture des Réseaux Neuronaux et Backpropagation', 'duration', '10h'),
   JSON_OBJECT('module', 'Module 2', 'title', 'Vision par Ordinateur et Détection d''Objets avec PyTorch', 'duration', '14h'),
   JSON_OBJECT('module', 'Module 3', 'title', 'Traitement du Langage Naturel et Attention Mechanism', 'duration', '14h'),
   JSON_OBJECT('module', 'Module 4', 'title', 'Déploiement de modèles d''IA via API FastAPI', 'duration', '12h')
 )),

(8, 4, 'Sécurité Offensive, Hacking Éthique & Pentesting Réseau', 'securite-offensive-ethical-hacking',
 'Apprenez à auditer, tester la résistance des systèmes et sécuriser les infrastructures d''entreprise.',
 'Découvrez les techniques d''audit de sécurité et d''intrusion autorisée (Ethical Hacking) : reconnaissance passive et active, analyse des vulnérabilités avec Nmap et Nessus, exploitation d''environnements vulnérables, post-exploitation et rédaction de rapports d''audit de sécurité conformes aux normes.',
 'Prof. Karim Alami', 690.00, 'AVANCE', 45, 20, 4, 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
 JSON_ARRAY(
   JSON_OBJECT('module', 'Module 1', 'title', 'Méthodologie de test d''intrusion et Cadre Légal', 'duration', '8h'),
   JSON_OBJECT('module', 'Module 2', 'title', 'Scan de vulnérabilités et Attaques réseau', 'duration', '12h'),
   JSON_OBJECT('module', 'Module 3', 'title', 'Exploitation des failles logicielles et élévation de privilèges', 'duration', '15h'),
   JSON_OBJECT('module', 'Module 4', 'title', 'Rédaction du rapport de remédiation technique', 'duration', '10h')
 )),

(9, 2, 'Cloud Computing AWS & Architectures Serverless Résilientes', 'cloud-computing-aws-serverless',
 'Concevez des infrastructures Cloud haute disponibilité avec AWS Lambda, S3, RDS et Terraform.',
 'Formation complète aux architectures Cloud modernes sur Amazon Web Services (AWS) : mise en place de réseaux VPC sécurisés, bases de données managées, fonctions Serverless avec API Gateway et automatisation par Infrastructure as Code (IaC) avec Terraform.',
 'Prof. Karim Alami', 600.00, 'INTERMEDIAIRE', 38, 30, 2, 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
 JSON_ARRAY(
   JSON_OBJECT('module', 'Module 1', 'title', 'Fondamentaux d''AWS et Sécurité IAM', 'duration', '8h'),
   JSON_OBJECT('module', 'Module 2', 'title', 'Architectures Serverless (Lambda, DynamoDB, SQS)', 'duration', '12h'),
   JSON_OBJECT('module', 'Module 3', 'title', 'Infrastructure as Code avec Terraform', 'duration', '10h'),
   JSON_OBJECT('module', 'Module 4', 'title', 'Haute disponibilité, Auto-Scaling et Disaster Recovery', 'duration', '8h')
 )),

(10, 1, 'Initiation au Développement Web Moderne : HTML5, CSS3 & JavaScript', 'initiation-developpement-web-moderne',
 'Le cours fondamental complet pour débuter la programmation web et créer vos premiers sites interactifs.',
 'Programme gratuit d''accueil pour tous les étudiants ingénieurs souhaitant acquérir les bases indispensables du Web : sémantique HTML5, mise en page moderne avec Flexbox et CSS Grid, manipulation du DOM en JavaScript vanilla, et hébergement de projets sur GitHub Pages.',
 'Dr. Amina Benjelloun', 0.00, 'DEBUTANT', 20, 60, 5, 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&auto=format&fit=crop&q=80',
 JSON_ARRAY(
   JSON_OBJECT('module', 'Module 1', 'title', 'Bases du Web, Protocoles HTTP et Sémantique HTML5', 'duration', '5h'),
   JSON_OBJECT('module', 'Module 2', 'title', 'Design et Styles Modernes avec CSS3 (Flexbox & Grid)', 'duration', '6h'),
   JSON_OBJECT('module', 'Module 3', 'title', 'Dynamisme et Événements avec JavaScript ES6+', 'duration', '6h'),
   JSON_OBJECT('module', 'Module 4', 'title', 'Projet pratique : Portfolio Web interactif', 'duration', '3h')
 )),

(11, 3, 'Data Engineering & Streaming Temps Réel avec Apache Kafka & Spark', 'data-engineering-kafka-spark',
 'Bâtissez des pipelines de données massives (Big Data) résilients, fiables et en temps réel.',
 'Apprenez à concevoir des architectures de données d''entreprise : ingestion de flux continus avec Apache Kafka, traitement distribué en batch et streaming avec Apache Spark, modélisation de Data Lakes et orchestrations de flux avec Apache Airflow.',
 'Dr. Amina Benjelloun', 720.00, 'AVANCE', 45, 25, 0, 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&auto=format&fit=crop&q=80',
 JSON_ARRAY(
   JSON_OBJECT('module', 'Module 1', 'title', 'Architectures Big Data Lambda & Kappa', 'duration', '8h'),
   JSON_OBJECT('module', 'Module 2', 'title', 'Streaming temps réel et Pub/Sub avec Apache Kafka', 'duration', '14h'),
   JSON_OBJECT('module', 'Module 3', 'title', 'Traitement analytique distribué avec PySpark', 'duration', '15h'),
   JSON_OBJECT('module', 'Module 4', 'title', 'Orchestration et Automatisation avec Apache Airflow', 'duration', '8h')
 )),

(12, 4, 'Audit de Sécurité des SI, Analyse des Risques & Conformité ISO 27001', 'audit-securite-si-iso27001',
 'Gouvernance de la sécurité informatique, analyse des risques EBIOS et préparation à la certification.',
 'Ce cours s''adresse aux futurs responsables de la sécurité des systèmes d''information (RSSI) et auditeurs : analyse des risques selon la méthode EBIOS RM, mise en place d''un SMSI (Système de Management de la Sécurité de l''Information) conforme à l''ISO/IEC 27001, et gestion des plans de continuité d''activité (PCA).',
 'Prof. Karim Alami', 540.00, 'INTERMEDIAIRE', 32, 30, 1, 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=80',
 JSON_ARRAY(
   JSON_OBJECT('module', 'Module 1', 'title', 'Fondamentaux de la Gouvernance et Cadre Réglementaire', 'duration', '6h'),
   JSON_OBJECT('module', 'Module 2', 'title', 'Analyse et Traitement des Risques selon EBIOS RM', 'duration', '10h'),
   JSON_OBJECT('module', 'Module 3', 'title', 'Déploiement des Mesures de Sécurité ISO 27002', 'duration', '10h'),
   JSON_OBJECT('module', 'Module 4', 'title', 'Conduite de l''Audit Interne et Certification', 'duration', '6h')
 ));

-- 4. Bons de réduction (Coupons) pour scénarios de test
INSERT INTO coupons (id, code, discount_percent, valid_until, max_uses, current_uses, is_active) VALUES
(1, 'ETUDIANT20', 20, '2027-12-31', 500, 1, TRUE),
(2, 'PROMO50', 50, '2027-12-31', 100, 0, TRUE),
(3, 'EXPIRE10', 10, '2023-01-01', 50, 0, FALSE), -- Test coupon expiré/inactif
(4, 'WELCOME10', 10, '2027-12-31', 1000, 0, TRUE);

-- 5. Inscriptions initiales
INSERT INTO enrollments (id, enrollment_number, user_id, course_id, status, progress_percent, enrollment_date) VALUES
(1, 'ENR-2026-00101', 3, 1, 'CONFIRMED', 45, '2026-09-15 10:30:00'),
(2, 'ENR-2026-00102', 3, 2, 'CONFIRMED', 15, '2026-09-20 14:15:00'),
(3, 'ENR-2026-00103', 4, 1, 'CONFIRMED', 80, '2026-09-18 09:00:00');

-- 6. Paiements initiaux
INSERT INTO payments (id, transaction_id, receipt_number, enrollment_id, user_id, amount, original_amount, discount_amount, coupon_code, payment_method, card_last4, status, payment_date) VALUES
(1, 'TXN-9843217482', 'REC-2026-0001', 1, 3, 399.20, 499.00, 99.80, 'ETUDIANT20', 'CREDIT_CARD', '4242', 'SUCCESS', '2026-09-15 10:31:00'),
(2, 'TXN-9843217483', 'REC-2026-0002', 2, 3, 650.00, 650.00, 0.00, NULL, 'CREDIT_CARD', '5555', 'SUCCESS', '2026-09-20 14:16:00'),
(3, 'TXN-9843217484', 'REC-2026-0003', 3, 4, 499.00, 499.00, 0.00, NULL, 'PAYPAL', NULL, 'SUCCESS', '2026-09-18 09:01:00');

-- 7. Avis de démonstration
INSERT INTO course_reviews (id, course_id, user_id, rating, comment) VALUES
(1, 1, 4, 5, 'Excellente pédagogie sur les tests logiciels ! Les explications sur la couverture et les cas limites sont très claires.'),
(2, 2, 3, 5, 'Cours très complet, orienté pratique et professionnel.');
