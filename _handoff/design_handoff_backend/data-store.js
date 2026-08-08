// Coomosant — capa de datos de prueba (prototipo). Reemplazar por API real en el handoff a código.
const KEY = 'coomosant_afiliados_v1';
const AUTH_KEY = 'coomosant_admin_session_v1';

const SEED = [
  { cedula: '1085234567', nombre: 'Carlos Andrés Pérez Rodríguez', tipoServicio: 'domiciliario', estado: 'activo', foto: '', fechaRegistro: '2023-03-14' },
  { cedula: '1082967341', nombre: 'Luisa Fernanda Ríos Camargo', tipoServicio: 'mototaxista', estado: 'activo', foto: '', fechaRegistro: '2022-11-02' },
  { cedula: '1120453298', nombre: 'Jhon Edward Martínez Bru', tipoServicio: 'ambos', estado: 'suspendido', foto: '', fechaRegistro: '2024-01-20' },
  { cedula: '1069845213', nombre: 'María José Torres Núñez', tipoServicio: 'domiciliario', estado: 'inactivo', foto: '', fechaRegistro: '2021-07-09' },
];

const ADMIN_USERS = [
  { usuario: 'admin', password: 'coomosant2026', nombre: 'Administrador Coomosant' },
];

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  localStorage.setItem(KEY, JSON.stringify(SEED));
  return SEED.slice();
}
function persist(list) { localStorage.setItem(KEY, JSON.stringify(list)); }

export function getAfiliados() { return load(); }

export function getAfiliadoByCedula(cc) {
  const clean = (cc || '').replace(/\D/g, '');
  return load().find(a => a.cedula === clean) || null;
}

export function saveAfiliado(afiliado) {
  const list = load();
  const idx = list.findIndex(a => a.cedula === afiliado.cedula);
  if (idx >= 0) list[idx] = { ...list[idx], ...afiliado };
  else list.push(afiliado);
  persist(list);
  return afiliado;
}

export function deleteAfiliado(cc) { persist(load().filter(a => a.cedula !== cc)); }

export function setEstado(cc, estado) {
  const list = load();
  const idx = list.findIndex(a => a.cedula === cc);
  if (idx >= 0) { list[idx].estado = estado; persist(list); }
}

export function login(usuario, password) {
  const user = ADMIN_USERS.find(u => u.usuario === usuario && u.password === password);
  if (user) { sessionStorage.setItem(AUTH_KEY, JSON.stringify({ usuario: user.usuario, nombre: user.nombre })); return user; }
  return null;
}
export function getSession() { try { return JSON.parse(sessionStorage.getItem(AUTH_KEY)); } catch (e) { return null; } }
export function logout() { sessionStorage.removeItem(AUTH_KEY); }

export function perfilUrl(cc) {
  const base = location.href.replace(/[^/]*$/, '');
  return `${base}Perfil.dc.html?cc=${cc}`;
}
export function qrImageUrl(cc) {
  const data = encodeURIComponent(perfilUrl(cc));
  return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=10&data=${data}`;
}
