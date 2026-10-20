package ma.emi.campus.model;

public class Course {
    private final Long id;
    private final String title;
    private final double price;
    private final int capacity;
    private int enrolledCount;

    public Course(Long id, String title, double price, int capacity, int enrolledCount) {
        this.id = id;
        this.title = title;
        this.price = price;
        this.capacity = capacity;
        this.enrolledCount = enrolledCount;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public double getPrice() { return price; }
    public int getCapacity() { return capacity; }
    public int getEnrolledCount() { return enrolledCount; }

    public boolean isFull() {
        return enrolledCount >= capacity;
    }

    public void incrementEnrolled() {
        this.enrolledCount++;
    }
}
