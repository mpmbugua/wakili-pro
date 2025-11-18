export interface CLECourse {
  id: string;
  title: string;
  description: string;
  duration: number; // in hours
  instructor: string;
}

export interface CLEEnrollment {
  userId: string;
  courseId: string;
  enrolledAt: string;
}

export interface CLEProgress {
  userId: string;
  courseId: string;
  progress: number; // percent
}

export interface CLECertificate {
  userId: string;
  courseId: string;
  issuedAt: string;
  certificateUrl: string;
}
