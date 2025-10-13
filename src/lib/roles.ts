export type Role = 'WAITER'|'INVENTORY'|'PROC'|'ADMIN'|'COMMERCIAL'|'SYSADMIN'|'CHEF';

export const MENU_WEB: Record<Role, {href:string,label:string}[]> = {
  CHEF: [
    { href:'/dishes', label:'Registrar/Consultar platos' },
    { href:'/kitchen', label:'Estados de pedidos' },
    { href:'/requests', label:'Solicitar insumos' },
  ],
  INVENTORY: [
    { href:'/kitchen', label:'Estados de pedidos' },
    { href:'/requests', label:'Solicitudes de insumo' },
  ],
  PROC: [
    { href:'/rfqs', label:'Cotizaciones' },
    { href:'/pos',  label:'Órdenes de compra' },
  ],
  COMMERCIAL: [{ href:'/reports', label:'Indicadores' }],
  SYSADMIN:   [{ href:'/admin/users', label:'Usuarios y permisos' }],
  ADMIN: [
    { href:'/products', label:'Insumos' },
    { href:'/dishes',   label:'Platos' },
    { href:'/kitchen',  label:'Estados de pedidos' },
    { href:'/requests', label:'Solicitudes' },
    { href:'/rfqs',     label:'Cotizaciones' },
    { href:'/pos',      label:'Órdenes de compra' },
    { href:'/reports',  label:'Indicadores' },
    { href:'/admin/users', label:'Usuarios' },
  ],
  WAITER: [], // (solo en móvil)
};
