package ma.emi.campus.model;

import java.time.LocalDateTime;

public class Enrollment {
    private final Long id;
    private final Long userId;
    private final Long courseId;
    private final String status;
    private final double amountPaid;
    private final LocalDateTime enrolledAt;

    public Enrollment(Long id, Long userId, Long courseId, String status, double amountPaid, LocalDateTime enrolledAt) {
        this.id = id;
        this.userId = userId;
        this.courseId = courseId;
        this.status = status;
        this.amountPaid = amountPaid;
        this.enrolledAt = enrolledAt;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public Long getCourseId() { return courseId; }
    public String getStatus() { return status; }
    public double getAmountPaid() { return amountPaid; }
    public LocalDateTime getEnrolledAt() { return enrolledAt; }
}
