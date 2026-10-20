const { pool } = require('../config/db');

/**
 * Récupérer les statistiques globales de la plateforme (Dashboard Admin)
 */
async function getPlatformStats(req, res, next) {
  try {
    // 1. Total étudiants
    const [students] = await pool.query(
      'SELECT COUNT(*) as total_students FROM users WHERE role = "STUDENT"'
    );

    // 2. Total cours publiés
    const [courses] = await pool.query(
      'SELECT COUNT(*) as total_courses FROM courses WHERE is_published = TRUE'
    );

    // 3. Inscriptions actives
    const [enrollments] = await pool.query(
      'SELECT COUNT(*) as total_enrollments FROM enrollments WHERE status = "CONFIRMED"'
    );

    // 4. Revenu total cumulé
    const [revenue] = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total_revenue FROM payments WHERE status = "SUCCESS"'
    );

    // 5. Répartition par catégorie
    const [categoryDistribution] = await pool.query(`
      SELECT cat.name, COUNT(c.id) as course_count
      FROM categories cat
      LEFT JOIN courses c ON cat.id = c.category_id
      GROUP BY cat.id
    `);

    // 6. Top 5 des cours les plus populaires
    const [topCourses] = await pool.query(`
      SELECT id, title, price, enrolled_count, capacity,
             ROUND((enrolled_count / capacity) * 100, 1) as occupancy_rate
      FROM courses
      ORDER BY enrolled_count DESC
      LIMIT 5
    `);

    // 7. Dernières transactions
    const [recentPayments] = await pool.query(`
      SELECT p.id, p.transaction_id, p.amount, p.status, p.payment_date, p.payment_method,
             u.name as student_name, c.title as course_title
      FROM payments p
      JOIN users u ON p.user_id = u.id
      JOIN enrollments e ON p.enrollment_id = e.id
      JOIN courses c ON e.course_id = c.id
      ORDER BY p.payment_date DESC
      LIMIT 5
    `);

    return res.status(200).json({
      success: true,
      stats: {
        totalStudents: students[0].total_students,
        totalCourses: courses[0].total_courses,
        totalEnrollments: enrollments[0].total_enrollments,
        totalRevenue: parseFloat(revenue[0].total_revenue).toFixed(2),
        currency: 'MAD / DH'
      },
      categoryDistribution,
      topCourses,
      recentPayments
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getPlatformStats
};
