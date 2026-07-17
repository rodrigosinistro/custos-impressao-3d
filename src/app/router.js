import { routes } from './routes.js';
import { authService } from '../domain/services/authService.js';

export function getCurrentHash() {
  return window.location.hash || '#/login';
}

export function getDefaultAuthenticatedHash() {
  return authService.isAdmin() ? '#/dashboard' : '#/easy-quote';
}

export function guardRoute(hash) {
  const route = routes.find((entry) => entry.hash === hash);
  if (!route) return authService.isAuthenticated() ? getDefaultAuthenticatedHash() : '#/login';

  if (route.requiresAuth && !authService.isAuthenticated()) {
    return '#/login';
  }

  if (route.requiresAuth && !authService.canAccessRoles(route.roles)) {
    return getDefaultAuthenticatedHash();
  }

  if (hash === '#/login' && authService.isAuthenticated()) {
    return getDefaultAuthenticatedHash();
  }

  return hash;
}
