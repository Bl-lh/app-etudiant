import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Nettoyage automatique du DOM après chaque test
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});

// Mock de window.print pour ReceiptModal
Object.defineProperty(window, 'print', {
  writable: true,
  value: vi.fn()
});

// Mock de canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn()
}));

// Mock de matchMedia si utilisé
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
