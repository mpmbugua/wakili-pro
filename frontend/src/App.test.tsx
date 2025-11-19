import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import App from './App';

describe('App Component', () => {

  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText('Wakili Pro')).toBeInTheDocument();
  });

  it('displays Wakili Pro branding', () => {
    render(<App />);
    expect(screen.getByText('Wakili Pro')).toBeInTheDocument();
  });
});