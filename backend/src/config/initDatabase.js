const { pool } = require('./db');

/**
 * Script d'initialisation et d'auto-migration de la base de données
 * Exécuté automatiquement au démarrage du serveur en environnement Cloud (Render / TiDB / Aiven / etc.)
 */
async function initDatabase() {
  let connection;
  try {
    connection = await pool.getConnection();

    // Vérifier si la table users existe déjà
    const [existingTables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
    `);

    if (existingTables && existingTables.length > 0) {
      console.log('✓ [Database] Les tables existent déjà. Aucune migration requise.');
      return true;
    }

    console.log('⚡ [Database] Base vide détectée. Initialisation automatique du schéma et des données de démo...');

    // 1. Table Users
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
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
    `);

    // 2. Table Categories
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        slug VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        icon VARCHAR(50) DEFAULT 'book-open'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Table Courses
    await connection.query(`
      CREATE TABLE IF NOT EXISTS courses (
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
    `);

    // 4. Table Coupons
    await connection.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        discount_percent INT NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
        valid_until DATE NOT NULL,
        max_uses INT NOT NULL DEFAULT 100,
        current_uses INT NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        INDEX idx_coupon_code (code)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. Table Enrollments
    await connection.query(`
      CREATE TABLE IF NOT EXISTS enrollments (
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
    `);

    // 6. Table Payments
    await connection.query(`
      CREATE TABLE IF NOT EXISTS payments (
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
    `);

    // 7. Table Reviews
    await connection.query(`
      CREATE TABLE IF NOT EXISTS course_reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        course_id INT NOT NULL,
        user_id INT NOT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_reviews_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 8. Table Test Audit Logs
    await connection.query(`
      CREATE TABLE IF NOT EXISTS test_audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        test_suite VARCHAR(100) NOT NULL,
        test_case VARCHAR(100) NOT NULL,
        status ENUM('PASSED', 'FAILED', 'SKIPPED') NOT NULL,
        duration_ms INT NOT NULL DEFAULT 0,
        details TEXT,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // SEEDING : Données initiales
    console.log('🌱 [Database] Insertion des données de référence (utilisateurs, cours, coupons)...');

    // Catégories
    await connection.query(`
      INSERT IGNORE INTO categories (id, name, slug, description, icon) VALUES
      (1, 'Développement Web & Mobile', 'dev-web-mobile', 'Maîtrisez les technologies full-stack modernes, React, Node.js, et microservices.', 'code'),
      (2, 'Tests Logiciels & DevOps', 'tests-devops', 'Assurance qualité, tests unitaires, TDD, CI/CD et automatisation logicielle.', 'check-circle'),
      (3, 'Intelligence Artificielle & Data', 'ia-data-science', 'Machine learning, analyse de données, Python et modèles prédictifs.', 'cpu'),
      (4, 'Cybersécurité & Réseaux', 'cybersecurite', 'Sécurité applicative, cryptographie, ethical hacking et audit de conformité.', 'shield');
    `);

    // Utilisateurs (Password: 'Password123!')
    await connection.query(`
      INSERT IGNORE INTO users (id, name, email, password_hash, role, phone) VALUES
      (1, 'Prof. Karim Alami', 'admin@campus-online.ma', '$2a$10$WkSkMW6YuEZTKy3ZNOea2OR2KiH5a.zhotNOwOWo8H3jic6sw0skO', 'ADMIN', '+212661000001'),
      (2, 'Dr. Amina Benjelloun', 'amina.benjelloun@campus-online.ma', '$2a$10$WkSkMW6YuEZTKy3ZNOea2OR2KiH5a.zhotNOwOWo8H3jic6sw0skO', 'INSTRUCTOR', '+212661000002'),
      (3, 'Bilal Mansouri', 'etudiant@campus-online.ma', '$2a$10$WkSkMW6YuEZTKy3ZNOea2OR2KiH5a.zhotNOwOWo8H3jic6sw0skO', 'STUDENT', '+212661000003'),
      (4, 'Sarah Chraibi', 'sarah.c@campus-online.ma', '$2a$10$WkSkMW6YuEZTKy3ZNOea2OR2KiH5a.zhotNOwOWo8H3jic6sw0skO', 'STUDENT', '+212661000004');
    `);

    // Cours
    await connection.query(`
      INSERT IGNORE INTO courses (id, category_id, title, slug, summary, description, instructor_name, price, level, duration_hours, capacity, enrolled_count, image_url) VALUES
      (1, 2, 'Processus Complet des Tests Logiciels & Automatisation', 'tests-logiciels-complets',
       'Apprenez à concevoir, automatiser et documenter les tests unitaires, d''intégration et de recette.',
       'Ce cours magistral et pratique couvre exhaustivement l''art de la qualification logicielle : pyramide des tests, plans de tests, cas nominaux et aux limites, TDD, tests de non-régression, Jest, Supertest, et génération de métriques de couverture.',
       'Prof. Karim Alami', 499.00, 'INTERMEDIAIRE', 36, 40, 2, 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'),
      (2, 1, 'Architecture Web Full-Stack Moderne avec React & Node.js', 'architecture-fullstack-react-node',
       'Construisez des applications résilientes, sécurisées et scalables avec React, Node.js et MySQL.',
       'Une formation approfondie pour concevoir de bout en bout des applications web professionnelles : conception de schémas relationnels normalisés, API RESTful sécurisées avec JWT, gestion des états réactifs côté client, et paiements en ligne intégrés.',
       'Dr. Amina Benjelloun', 650.00, 'AVANCE', 48, 30, 1, 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80'),
      (3, 3, 'Fondamentaux du Machine Learning & Analyse de Données', 'machine-learning-data-science',
       'Introduction pratique aux algorithmes supervisés, à la régression et à la classification.',
       'Découvrez la manipulation des jeux de données avec Python, Pandas, NumPy et Scikit-Learn. Conçu pour les ingénieurs souhaitant structurer des pipelines de données et valider des modèles statistiques.',
       'Dr. Amina Benjelloun', 550.00, 'DEBUTANT', 30, 25, 0, 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80'),
      (4, 4, 'Sécurité des Applications Web & Cryptographie Pratique', 'securite-web-cryptographie',
       'Protégez vos applications contre les failles OWASP Top 10 et chiffrez les données sensibles.',
       'Ce cours traite des vulnérabilités classiques, de l''implémentation du hachage de mots de passe (bcrypt), de TLS et de la sécurisation des passerelles de transaction financière.',
       'Prof. Karim Alami', 599.00, 'AVANCE', 40, 20, 0, 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80'),
      (5, 2, 'DevOps, Pipelines CI/CD & Orchestration avec Docker et Kubernetes', 'devops-cicd-docker-kubernetes',
       'Automatisez le déploiement, les tests continus et la scalabilité de vos applications conteneurisées.',
       'Une immersion complète dans les pratiques DevOps : conteneurisation avancée avec Docker, pipelines CI/CD (GitHub Actions), tests d''intégration et monitoring.',
       'Prof. Karim Alami', 620.00, 'AVANCE', 42, 35, 3, 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=800&auto=format&fit=crop&q=80'),
      (6, 1, 'Développement Mobile Multiplateforme avec React Native & Expo', 'developpement-mobile-react-native',
       'Créez des applications mobiles natives performantes pour iOS et Android avec une seule base de code.',
       'Composants natifs, gestion d''état réactive, navigation fluide, intégration des APIs matérielles et tests unitaires mobiles.',
       'Dr. Amina Benjelloun', 580.00, 'INTERMEDIAIRE', 36, 30, 2, 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&auto=format&fit=crop&q=80');
    `);

    // Coupons
    await connection.query(`
      INSERT IGNORE INTO coupons (id, code, discount_percent, valid_until, max_uses, current_uses, is_active) VALUES
      (1, 'PROMO20', 20, '2028-12-31', 200, 5, TRUE),
      (2, 'WELCOME10', 10, '2028-12-31', 500, 12, TRUE),
      (3, 'BLACKFRIDAY', 50, '2028-12-31', 100, 2, TRUE),
      (4, 'STUDENT30', 30, '2028-12-31', 300, 0, TRUE);
    `);

    console.log('✓ [Database] Schéma et données de référence créés avec succès !');
    return true;
  } catch (error) {
    console.error('⚠️ [Database] Erreur lors de l\'initialisation automatique :', error.message);
    return false;
  } finally {
    if (connection) connection.release();
  }
}

module.exports = { initDatabase };
