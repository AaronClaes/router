import { createMiddleware } from '@tanstack/solid-start';
import { z } from 'zod';
export const withUseServer = createMiddleware({
  id: 'test'
});