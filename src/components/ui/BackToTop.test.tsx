/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BackToTop } from './BackToTop';
import { useUIStore } from '../../store/uiStore';

// Mock Zustand store
vi.mock('../../store/uiStore');

describe('BackToTop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock scrollTo
    window.scrollTo = vi.fn();
  });

  it('does not render when showBackToTop is false', () => {
    vi.mocked(useUIStore).mockReturnValue({ showBackToTop: false } as any);
    render(<BackToTop />);
    const button = screen.queryByRole('button');
    expect(button).not.toBeInTheDocument();
  });

  it('renders when showBackToTop is true', () => {
    vi.mocked(useUIStore).mockReturnValue({ showBackToTop: true } as any);
    render(<BackToTop />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('scrolls to top when clicked', () => {
    vi.mocked(useUIStore).mockReturnValue({ showBackToTop: true } as any);
    render(<BackToTop />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });
});
