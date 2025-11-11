import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText(/🎯 Production Ready/i)).toBeInTheDocument();
  });

  it('displays backend status testing message', () => {
    render(<App />);
    expect(screen.getByText(/Testing.../i)).toBeInTheDocument();
  });
});