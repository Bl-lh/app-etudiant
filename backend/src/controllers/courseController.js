const { pool } = require('../config/db');

/**
 * Récupérer la liste des cours avec filtres dynamiques, recherche et pagination
 */
async function getAllCourses(req, res, next) {
  try {
    const { category, search, level, minPrice, maxPrice, sortBy } = req.query;

    let query = `
      SELECT c.id, c.title, c.slug, c.summary, c.description, c.instructor_name,
             c.price, c.level, c.duration_hours, c.capacity, c.enrolled_count,
             (c.capacity - c.enrolled_count) as available_seats,
             c.image_url, c.created_at,
             cat.id as category_id, cat.name as category_name, cat.slug as category_slug
      FROM courses c
      JOIN categories cat ON c.category_id = cat.id
      WHERE c.is_published = TRUE
    `;

    const params = [];

    if (category) {
      query += ' AND (cat.slug = ? OR cat.id = ?)';
      params.push(category, category);
    }

    if (level) {
      query += ' AND c.level = ?';
      params.push(level.toUpperCase());
    }

    if (search) {
      query += ' AND (c.title LIKE ? OR c.description LIKE ? OR c.instructor_name LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (minPrice !== undefined && minPrice !== '') {
      query += ' AND c.price >= ?';
      params.push(parseFloat(minPrice));
    }

    if (maxPrice !== undefined && maxPrice !== '') {
      query += ' AND c.price <= ?';
      params.push(parseFloat(maxPrice));
    }

    // Tri
    switch (sortBy) {
      case 'price_asc':
        query += ' ORDER BY c.price ASC';
        break;
      case 'price_desc':
        query += ' ORDER BY c.price DESC';
        break;
      case 'popularity':
        query += ' ORDER BY c.enrolled_count DESC';
        break;
      case 'recent':
      default:
        query += ' ORDER BY c.created_at DESC';
        break;
    }

    const [courses] = await pool.query(query, params);

    // Si l'utilisateur est authentifié, on ajoute l'information de son inscription
    if (req.user && req.user.id) {
      const [userEnrollments] = await pool.query(
        'SELECT course_id, status FROM enrollments WHERE user_id = ?',
        [req.user.id]
      );
      const enrollmentMap = new Map();
      userEnrollments.forEach(e => enrollmentMap.set(e.course_id, e.status));

      courses.forEach(c => {
        c.is_enrolled = enrollmentMap.has(c.id);
        c.enrollment_status = enrollmentMap.get(c.id) || null;
      });
    }

    return res.status(200).json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Récupérer les détails d'un cours spécifique par son ID ou son slug
 */
async function getCourseById(req, res, next) {
  try {
    const { id } = req.params;

    const isNumeric = /^\d+$/.test(id);
    const query = `
      SELECT c.id, c.title, c.slug, c.summary, c.description, c.instructor_name,
             c.price, c.level, c.duration_hours, c.capacity, c.enrolled_count,
             (c.capacity - c.enrolled_count) as available_seats,
             c.image_url, c.syllabus, c.created_at,
             cat.id as category_id, cat.name as category_name, cat.slug as category_slug
      FROM courses c
      JOIN categories cat ON c.category_id = cat.id
      WHERE ${isNumeric ? 'c.id = ?' : 'c.slug = ?'}
    `;

    const [rows] = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cours introuvable.'
      });
    }

    const course = rows[0];

    // Traitement du syllabus JSON
    if (typeof course.syllabus === 'string') {
      try {
        course.syllabus = JSON.parse(course.syllabus);
      } catch {
        course.syllabus = [];
      }
    }

    // Récupération des avis
    const [reviews] = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at, u.name as user_name
       FROM course_reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.course_id = ?
       ORDER BY r.created_at DESC`,
      [course.id]
    );

    course.reviews = reviews;
    course.average_rating = reviews.length > 0
      ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
      : 5.0;

    // Statut de l'utilisateur connecté
    if (req.user && req.user.id) {
      const [enr] = await pool.query(
        'SELECT id, status, progress_percent FROM enrollments WHERE user_id = ? AND course_id = ?',
        [req.user.id, course.id]
      );
      course.user_enrollment = enr.length > 0 ? enr[0] : null;
    }

    return res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Créer un nouveau cours (Rôle ADMIN ou INSTRUCTOR)
 */
async function createCourse(req, res, next) {
  try {
    const {
      title, category_id, summary, description,
      price, level = 'DEBUTANT', duration_hours = 20,
      capacity = 30, image_url, syllabus
    } = req.body;

    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '') + '-' + Date.now().toString(36);

    const instructor_name = req.user.name;

    const syllabusJson = syllabus ? JSON.stringify(syllabus) : JSON.stringify([]);

    const [result] = await pool.query(
      `INSERT INTO courses 
        (category_id, title, slug, summary, description, instructor_name, price, level, duration_hours, capacity, image_url, syllabus)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        category_id, title.trim(), slug, summary.trim(), description.trim(),
        instructor_name, parseFloat(price), level, parseInt(duration_hours, 10),
        parseInt(capacity, 10), image_url || null, syllabusJson
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Cours créé avec succès.',
      courseId: result.insertId,
      slug
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mettre à jour un cours existant (Rôle ADMIN ou INSTRUCTOR)
 */
async function updateCourse(req, res, next) {
  try {
    const { id } = req.params;
    const {
      title, category_id, summary, description,
      price, level, duration_hours, capacity, image_url, syllabus
    } = req.body;

    const [existing] = await pool.query('SELECT id FROM courses WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cours introuvable.'
      });
    }

    const updates = [];
    const params = [];

    if (title !== undefined) { updates.push('title = ?'); params.push(title.trim()); }
    if (category_id !== undefined) { updates.push('category_id = ?'); params.push(category_id); }
    if (summary !== undefined) { updates.push('summary = ?'); params.push(summary.trim()); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description.trim()); }
    if (price !== undefined) { updates.push('price = ?'); params.push(parseFloat(price)); }
    if (level !== undefined) { updates.push('level = ?'); params.push(level); }
    if (duration_hours !== undefined) { updates.push('duration_hours = ?'); params.push(parseInt(duration_hours, 10)); }
    if (capacity !== undefined) { updates.push('capacity = ?'); params.push(parseInt(capacity, 10)); }
    if (image_url !== undefined) { updates.push('image_url = ?'); params.push(image_url); }
    if (syllabus !== undefined) { updates.push('syllabus = ?'); params.push(JSON.stringify(syllabus)); }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun champ à mettre à jour fourni.'
      });
    }

    params.push(id);
    await pool.query(`UPDATE courses SET ${updates.join(', ')} WHERE id = ?`, params);

    return res.status(200).json({
      success: true,
      message: 'Cours mis à jour avec succès.'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Supprimer un cours (ADMIN)
 */
async function deleteCourse(req, res, next) {
  try {
    const { id } = req.params;

    // Vérifier si des étudiants sont déjà inscrits
    const [enrollments] = await pool.query(
      'SELECT id FROM enrollments WHERE course_id = ? AND status = "CONFIRMED"',
      [id]
    );

    if (enrollments.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer un cours ayant des inscriptions confirmées actives.'
      });
    }

    // Supprimer les dépendances (avis, inscriptions pending)
    await pool.query('DELETE FROM course_reviews WHERE course_id = ?', [id]);
    await pool.query('DELETE FROM enrollments WHERE course_id = ?', [id]);
    const [result] = await pool.query('DELETE FROM courses WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cours introuvable.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Cours supprimé avec succès.'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Liste des catégories avec nombre de cours
 */
async function getCategories(req, res, next) {
  try {
    const [categories] = await pool.query(`
      SELECT cat.id, cat.name, cat.slug, cat.description, cat.icon,
             COUNT(c.id) as course_count
      FROM categories cat
      LEFT JOIN courses c ON cat.id = c.category_id AND c.is_published = TRUE
      GROUP BY cat.id
      ORDER BY cat.name ASC
    `);

    return res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getCategories
};
