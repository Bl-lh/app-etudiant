-- Insertion de nouveaux cours enrichis pour diversifier le catalogue
INSERT INTO courses (id, category_id, title, slug, summary, description, instructor_name, price, level, duration_hours, capacity, enrolled_count, image_url, syllabus) VALUES
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
 ))
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  summary = VALUES(summary),
  description = VALUES(description),
  price = VALUES(price),
  level = VALUES(level),
  duration_hours = VALUES(duration_hours),
  capacity = VALUES(capacity),
  image_url = VALUES(image_url),
  syllabus = VALUES(syllabus);

-- Nouveaux avis d'étudiants pour ces cours
INSERT INTO course_reviews (course_id, user_id, rating, comment) VALUES
(5, 3, 5, 'Indispensable pour tout ingénieur logiciel. La mise en place de Kubernetes et des tests continus est limpide.'),
(6, 4, 5, 'Super formation React Native, j ai pu concevoir mon application mobile en 3 semaines.'),
(7, 3, 5, 'Les travaux pratiques sur PyTorch et la détection d objets sont d un niveau d excellence impressionnant.'),
(8, 4, 5, 'Très formateur sur le plan pratique et éthique. Les démonstrations de pentesting sont d un réalisme saisissant.'),
(10, 3, 5, 'Cours d initiation parfait pour débuter en douceur sans débourser un centime.');
