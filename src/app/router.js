import { routes } from './routes.js';
import { authService } from '../domain/services/authService.js';

export function getCurrentHash() {
  return window.location.hash || '#/login';
}

export function guardRoute(hash) {
  const route = routes.find((entry) => entry.hash === hash) || routes[0];
  if (route.requiresAuth && (!authService.isAuthenticated() || !authService.isAdmin())) {
    return '#/login';
  }
  if (hash === '#/login' && authService.isAuthenticated() && authService.isAdmin()) {
    return '#/dashboard';
  }
  return hash;
}
