import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

document.documentElement.lang = 'en';
document.title = 'NammaWard AI';

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});
