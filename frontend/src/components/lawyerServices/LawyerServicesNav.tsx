import React from 'react';

const navItems = [
  { label: 'Document Templates', anchor: '#document-templates' },
  { label: 'CLE Courses', anchor: '#cle-courses' },
  { label: 'Profile & Branding', anchor: '#profile-branding' },
  { label: 'Collaboration', anchor: '#collaboration' },
];

export const LawyerServicesNav: React.FC = () => (
  <nav className="sticky top-0 z-20 bg-white shadow mb-8" aria-label="Lawyer Services Navigation">
    <ul className="flex flex-wrap justify-center md:justify-start space-x-2 md:space-x-6 px-2 md:px-6 py-3 text-base md:text-lg font-medium overflow-x-auto scrollbar-thin scrollbar-thumb-blue-200">
      {navItems.map(item => (
        <li key={item.anchor}>
          <a
            href={item.anchor}
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-2 py-1 hover:text-blue-600 transition-colors duration-150"
            tabIndex={0}
            aria-label={item.label}
            onClick={e => {
              e.preventDefault();
              const el = document.querySelector(item.anchor);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          >
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  </nav>
);
