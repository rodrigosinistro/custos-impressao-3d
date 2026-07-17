export const routes = [
  { hash: '#/dashboard', label: 'Dashboard', requiresAuth: true, roles: ['admin'] },
  { hash: '#/clients', label: 'Clientes', requiresAuth: true, roles: ['admin'] },
  { hash: '#/printers', label: 'Impressoras', requiresAuth: true, roles: ['admin'] },
  { hash: '#/materials', label: 'Materiais', requiresAuth: true, roles: ['admin'] },
  { hash: '#/quotes', label: 'Orçamentos', requiresAuth: true, roles: ['admin'] },
  { hash: '#/easy-quote', label: 'Orçamento Fácil', requiresAuth: true, roles: ['admin', 'staff'] },
  { hash: '#/production', label: 'Produção', requiresAuth: true, roles: ['admin', 'staff'] },
  { hash: '#/users', label: 'Usuários', requiresAuth: true, roles: ['admin'] },
  { hash: '#/settings', label: 'Configurações', requiresAuth: true, roles: ['admin'] },
  { hash: '#/login', label: 'Entrar', requiresAuth: false },
];
