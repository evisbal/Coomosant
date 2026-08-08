// Coomosant — capa de datos real (Supabase).
// Reemplaza a design_handoff_backend/data-store.js (localStorage) manteniendo
// el mismo contrato de campos y funciones que ya conocen admin.html y perfil.html.
//
// IMPORTANTE sobre el login: Supabase Auth identifica usuarios por email.
// El campo "Usuario" del login de admin.html debe ser el EMAIL con el que
// se creó la cuenta del administrador en Supabase Auth (no un username libre).
//
// Requiere: <script src=".../supabase.js"></script>, config.js y
// supabase-client.js cargados antes que este archivo.

const TIPO_LABELS = {
  domiciliario: 'Domiciliario',
  mototaxista: 'Mototaxista',
  ambos: 'Domiciliario y Mototaxista',
};

function sb() {
  if (!window.coomosantSupabase) {
    throw new Error(
      'Supabase no está configurado. Editá assets/js/config.js con tu SUPABASE_URL y SUPABASE_ANON_KEY.'
    );
  }
  return window.coomosantSupabase;
}

function cleanCedula(cc) {
  return (cc || '').replace(/\D/g, '');
}

function rowToAfiliado(row) {
  if (!row) return null;
  return {
    cedula: row.cedula,
    nombre: row.nombre,
    tipoServicio: row.tipo_servicio,
    estado: row.estado,
    foto: row.foto_url || '',
    fechaRegistro: row.fecha_registro,
  };
}

// ---------- Afiliados ----------

export async function getAfiliados() {
  const { data, error } = await sb()
    .from('afiliados')
    .select('*')
    .order('fecha_registro', { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToAfiliado);
}

export async function getAfiliadoByCedula(cc) {
  const clean = cleanCedula(cc);
  if (!clean) return null;
  const { data, error } = await sb()
    .from('afiliados')
    .select('*')
    .eq('cedula', clean)
    .maybeSingle();
  if (error) throw error;
  return rowToAfiliado(data);
}

// afiliado: { cedula, nombre, tipoServicio, estado, foto (File opcional o URL existente), fechaRegistro? }
// Si `foto` es un objeto File (subida nueva), se sube a Storage antes de guardar.
export async function saveAfiliado(afiliado, opts = {}) {
  let fotoUrl = typeof afiliado.foto === 'string' ? afiliado.foto : '';

  if (afiliado.foto instanceof File) {
    fotoUrl = await uploadFoto(afiliado.cedula, afiliado.foto);
  }

  const isEditing = !!opts.isEditing;
  const payload = {
    cedula: afiliado.cedula,
    nombre: afiliado.nombre.trim(),
    tipo_servicio: afiliado.tipoServicio,
    estado: afiliado.estado,
    foto_url: fotoUrl || null,
  };
  if (!isEditing) {
    payload.fecha_registro = new Date().toISOString().slice(0, 10);
  }

  const { data, error } = await sb()
    .from('afiliados')
    .upsert(payload, { onConflict: 'cedula' })
    .select()
    .single();
  if (error) throw error;
  return rowToAfiliado(data);
}

export async function deleteAfiliado(cc) {
  const { error } = await sb().from('afiliados').delete().eq('cedula', cleanCedula(cc));
  if (error) throw error;
}

export async function setEstado(cc, estado) {
  const { error } = await sb()
    .from('afiliados')
    .update({ estado })
    .eq('cedula', cleanCedula(cc));
  if (error) throw error;
}

// ---------- Storage (fotos) ----------

async function uploadFoto(cedula, file) {
  const ext = (file.name && file.name.split('.').pop()) || 'jpg';
  const path = `${cleanCedula(cedula)}.${ext}`;
  const { error } = await sb()
    .storage.from('afiliados-fotos')
    .upload(path, file, { upsert: true, cacheControl: '3600' });
  if (error) throw error;
  const { data } = sb().storage.from('afiliados-fotos').getPublicUrl(path);
  return data.publicUrl;
}

// ---------- Autenticación (Supabase Auth) ----------

export async function login(usuario, password) {
  const { data, error } = await sb().auth.signInWithPassword({
    email: usuario,
    password,
  });
  if (error || !data.session) return null;
  return getSession();
}

export async function getSession() {
  const { data } = await sb().auth.getSession();
  const user = data.session && data.session.user;
  if (!user) return null;

  const { data: perfil } = await sb()
    .from('admin_users')
    .select('usuario, nombre')
    .eq('id', user.id)
    .maybeSingle();

  return {
    usuario: (perfil && perfil.usuario) || user.email,
    nombre: (perfil && perfil.nombre) || user.email,
  };
}

export async function logout() {
  await sb().auth.signOut();
}

// ---------- QR y URL de perfil ----------

export function perfilUrl(cc) {
  const base = location.origin + location.pathname.replace(/[^/]*$/, '');
  return `${base}perfil.html?cc=${cleanCedula(cc)}`;
}

// Genera el QR 100% en el navegador (librería `qrcode`, cargada por CDN en la
// página) — no depende de ningún servicio externo en tiempo de uso.
// Devuelve un data URL (PNG) listo para <img src="...">.
export async function qrDataUrl(cc) {
  const url = perfilUrl(cc);
  if (!window.QRCode || !window.QRCode.toDataURL) {
    throw new Error('Falta cargar la librería qrcode (ver <script> en el <head> de la página).');
  }
  return window.QRCode.toDataURL(url, { width: 320, margin: 1 });
}

export function tipoLabel(tipoServicio) {
  return TIPO_LABELS[tipoServicio] || tipoServicio;
}

export function fmtCedula(c) {
  return (c || '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
