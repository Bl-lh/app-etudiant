const { pool, withTransaction } = require('../config/db');
const { generateEnrollmentNumber } = require('../utils/receiptGenerator');

const MAX_ENROLLMENTS_PER_STUDENT = parseInt(process.env.MAX_ENROLLMENTS_PER_STUDENT || '10', 10);

/**
 * Initialiser l'inscription d'un étudiant à un cours
 */
async function enrollCourse(req, res, next) {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'L\'identifiant du cours (courseId) est obligatoire.'
      });
    }

    // 1. Vérification du cours
    const [courses] = await pool.query(
      'SELECT id, title, price, capacity, enrolled_count, is_published FROM courses WHERE id = ?',
      [courseId]
    );

    if (courses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cours introuvable.'
      });
    }

    const course = courses[0];

    if (!course.is_published) {
      return res.status(400).json({
        success: false,
        message: 'Ce cours n\'est plus ouvert aux inscriptions.'
      });
    }

    // 2. Vérification des places disponibles (Règle Métier & Cas Limites)
    if (course.enrolled_count >= course.capacity) {
      return res.status(409).json({
        success: false,
        message: `Ce cours est complet. La capacité maximale de ${course.capacity} étudiants a été atteinte.`
      });
    }

    // 3. Vérification de l'inscription existante (Règle d'Unicité)
    const [existing] = await pool.query(
      'SELECT id, enrollment_number, status FROM enrollments WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    );

    if (existing.length > 0) {
      const enr = existing[0];
      if (enr.status === 'CONFIRMED') {
        return res.status(409).json({
          success: false,
          message: 'Vous êtes déjà inscrit et actif sur ce cours.',
          enrollmentId: enr.id
        });
      }
      if (enr.status === 'PENDING') {
        return res.status(200).json({
          success: true,
          message: 'Une inscription en attente de paiement existe déjà.',
          enrollmentId: enr.id,
          enrollmentNumber: enr.enrollment_number,
          status: 'PENDING',
          requiresPayment: parseFloat(course.price) > 0,
          coursePrice: parseFloat(course.price)
        });
      }
    }

    // 4. Vérification de la limite globale d'inscriptions par étudiant
    const [studentActiveEnrollments] = await pool.query(
      'SELECT COUNT(*) as active_count FROM enrollments WHERE user_id = ? AND status IN ("PENDING", "CONFIRMED")',
      [userId]
    );

    if (studentActiveEnrollments[0].active_count >= MAX_ENROLLMENTS_PER_STUDENT) {
      return res.status(400).json({
        success: false,
        message: `Limite maximale de ${MAX_ENROLLMENTS_PER_STUDENT} inscriptions actives atteinte pour votre compte.`
      });
    }

    const enrollmentNumber = generateEnrollmentNumber();
    const coursePrice = parseFloat(course.price);

    // Si le cours est gratuit (prix = 0.00 DH)
    if (coursePrice === 0) {
      const result = await withTransaction(async (conn) => {
        const [insert] = await conn.query(
          `INSERT INTO enrollments (enrollment_number, user_id, course_id, status, progress_percent)
           VALUES (?, ?, ?, 'CONFIRMED', 0)`,
          [enrollmentNumber, userId, courseId]
        );
        await conn.query(
          'UPDATE courses SET enrolled_count = enrolled_count + 1 WHERE id = ?',
          [courseId]
        );
        return insert.insertId;
      });

      return res.status(201).json({
        success: true,
        message: 'Félicitations ! Vous êtes inscrit au cours gratuit.',
        enrollmentId: result,
        enrollmentNumber,
        status: 'CONFIRMED',
        requiresPayment: false
      });
    }

    // Cours payant -> Statut PENDING en attente de validation du paiement
    const [insertPending] = await pool.query(
      `INSERT INTO enrollments (enrollment_number, user_id, course_id, status, progress_percent)
       VALUES (?, ?, ?, 'PENDING', 0)
       ON DUPLICATE KEY UPDATE status = 'PENDING'`,
      [enrollmentNumber, userId, courseId]
    );

    return res.status(201).json({
      success: true,
      message: 'Inscription initiée. Veuillez finaliser le règlement.',
      enrollmentId: insertPending.insertId,
      enrollmentNumber,
      status: 'PENDING',
      requiresPayment: true,
      coursePrice
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Récupérer toutes les inscriptions de l'étudiant connecté
 */
async function getMyEnrollments(req, res, next) {
  try {
    const userId = req.user.id;

    const [enrollments] = await pool.query(
      `SELECT e.id, e.enrollment_number, e.status, e.progress_percent, e.enrollment_date,
              c.id as course_id, c.title as course_title, c.slug as course_slug,
              c.price as course_price, c.instructor_name, c.level, c.image_url,
              cat.name as category_name,
              p.id as payment_id, p.transaction_id, p.receipt_number, p.amount as paid_amount,
              p.payment_method, p.status as payment_status
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       JOIN categories cat ON c.category_id = cat.id
       LEFT JOIN payments p ON p.enrollment_id = e.id AND p.status = 'SUCCESS'
       WHERE e.user_id = ?
       ORDER BY e.enrollment_date DESC`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      count: enrollments.length,
      data: enrollments
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Récupérer une inscription par son ID
 */
async function getEnrollmentById(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    let query = `
      SELECT e.id, e.enrollment_number, e.status, e.progress_percent, e.enrollment_date,
             e.user_id,
             u.name as student_name, u.email as student_email,
             c.id as course_id, c.title as course_title, c.price as course_price,
             c.duration_hours, c.instructor_name, c.image_url
      FROM enrollments e
      JOIN users u ON e.user_id = u.id
      JOIN courses c ON e.course_id = c.id
      WHERE e.id = ?
    `;

    const params = [id];
    if (!isAdmin) {
      query += ' AND e.user_id = ?';
      params.push(userId);
    }

    const [rows] = await pool.query(query, params);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Dossier d\'inscription introuvable ou accès non autorisé.'
      });
    }

    return res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Liste de toutes les inscriptions (Administration)
 */
async function getAllEnrollments(req, res, next) {
  try {
    const { status, courseId, userId } = req.query;

    let query = `
      SELECT e.id, e.enrollment_number, e.status, e.progress_percent, e.enrollment_date,
             u.id as user_id, u.name as user_name, u.email as user_email,
             c.id as course_id, c.title as course_title, c.price as course_price,
             p.receipt_number, p.amount as paid_amount, p.status as payment_status
      FROM enrollments e
      JOIN users u ON e.user_id = u.id
      JOIN courses c ON e.course_id = c.id
      LEFT JOIN payments p ON p.enrollment_id = e.id AND p.status = 'SUCCESS'
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      query += ' AND e.status = ?';
      params.push(status);
    }

    if (courseId) {
      query += ' AND e.course_id = ?';
      params.push(courseId);
    }

    if (userId) {
      query += ' AND e.user_id = ?';
      params.push(userId);
    }

    query += ' ORDER BY e.enrollment_date DESC';

    const [enrollments] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      count: enrollments.length,
      data: enrollments
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Annuler ou supprimer une inscription
 */
async function cancelEnrollment(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    const [enrRows] = await pool.query(
      'SELECT id, user_id, course_id, status FROM enrollments WHERE id = ?',
      [id]
    );

    if (enrRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inscription introuvable.'
      });
    }

    const enr = enrRows[0];

    if (!isAdmin && enr.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas l\'autorisation d\'annuler cette inscription.'
      });
    }

    await withTransaction(async (conn) => {
      await conn.query(
        'UPDATE enrollments SET status = "CANCELLED" WHERE id = ?',
        [id]
      );
      if (enr.status === 'CONFIRMED') {
        await conn.query(
          'UPDATE courses SET enrolled_count = GREATEST(0, enrolled_count - 1) WHERE id = ?',
          [enr.course_id]
        );
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Inscription annulée avec succès.'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  enrollCourse,
  getMyEnrollments,
  getEnrollmentById,
  getAllEnrollments,
  cancelEnrollment
};
