import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';

// Nettoyage automatique du DOM après chaque test
afterEach(() => {
  cleanup();
  localStorage.clear();
  jest.clearAllMocks();
});

// Mock de window.print pour ReceiptModal
Object.defineProperty(window, 'print', {
  writable: true,
  value: jest.fn()
});

// Mock de canvas-confetti
jest.mock('canvas-confetti', () => ({
  __esModule: true,
  default: jest.fn()
}));

// Mock de matchMedia si requis
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
