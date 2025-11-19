// CLECourse, CLEEnrollment, CLEProgress, CLECertificate removed: not in shared package.

const courses: any[] = [];
const enrollments: any[] = [];
const progress: any[] = [];
const certificates: any[] = [];

export const LawyerCLEService = {
  getAllCourses: () => courses,
  enroll: (userId: string, courseId: string) => {
    const enrollment = { userId, courseId, enrolledAt: new Date().toISOString() };
    enrollments.push(enrollment);
    return enrollment;
  },
  getProgress: (userId: string) => progress.filter(p => p.userId === userId),
  getCertificate: (userId: string, courseId: string) => certificates.find(c => c.userId === userId && c.courseId === courseId),
};
