import React from 'react';
import { useCLECourses } from '@/hooks/lawyerServices/useCLECourses';

export const CLECourseCatalog: React.FC = () => {
  const { courses, enroll, isLoading } = useCLECourses();

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">CLE Course Catalog</h2>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <ul>
          {courses.map(c => (
            <li key={c.id} className="border-b py-2 flex justify-between items-center">
              <div>
                <div className="font-semibold">{c.title}</div>
                <div className="text-sm text-gray-500">{c.instructor} &bull; {c.duration} hrs</div>
              </div>
              <button className="bg-blue-500 text-white px-2 py-1 rounded" onClick={() => enroll(c.id)}>Enroll</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
