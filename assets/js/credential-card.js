// Coomosant — markup compartido de la credencial/carnet de un afiliado.
// Usado por perfil.html (verificación pública) y carnet.html (vista para
// imprimir/exportar). Mantenerlo en un solo lugar evita que las dos vistas
// se desincronicen visualmente.

const TEMA = {
  activo: {
    bg: '#eef3f4',
    bannerGrad: 'linear-gradient(135deg,#04233b 0%,#0a5f74 60%,#0a97b0 100%)',
    ringColor: '#0a97b0', badgeBg: '#dff1f4', badgeBorder: '#0a97b0', badgeTxt: '#04233b',
    badgeLabel: 'Afiliado Activo', dotColor: '#0a97b0', dotAnim: 'cm-pulse 2s infinite',
    nombreColor: '#04233b', nombreDecoration: 'none',
    selloBg: 'linear-gradient(135deg,#dff1f4,#c3e6ec)', selloBorder: '#0a97b0', selloIcon: '✅',
    selloTitulo: 'Miembro Verificado', selloTitleColor: '#04233b',
    selloSub: 'Información oficial · Coomosant', selloSubColor: '#0a5f74',
    aviso: null,
  },
  suspendido: {
    bg: '#FFF7E6',
    bannerGrad: 'linear-gradient(135deg,#7A4B00 0%,#B8790A 60%,#F59E0B 100%)',
    ringColor: '#F59E0B', badgeBg: '#FDECC8', badgeBorder: '#F59E0B', badgeTxt: '#7A4B00',
    badgeLabel: 'Suspendido Temporalmente', dotColor: '#F59E0B', dotAnim: 'none',
    nombreColor: '#7A4B00', nombreDecoration: 'none',
    selloBg: 'linear-gradient(135deg,#FFF3D6,#FDECC8)', selloBorder: '#F59E0B', selloIcon: '⏳',
    selloTitulo: 'Membresía Suspendida', selloTitleColor: '#7A4B00',
    selloSub: 'Temporalmente fuera de servicio', selloSubColor: '#8A5A00',
    aviso: { bg: '#FFF3D6', border: '#F59E0B', txt: '#7A4B00',
      texto: 'Este afiliado está temporalmente suspendido y no debe prestar servicios a nombre de Coomosant hasta nuevo aviso.' },
  },
  inactivo: {
    bg: '#f3eeee',
    bannerGrad: 'linear-gradient(135deg,#7B1313 0%,#A01A1A 60%,#C0392B 100%)',
    ringColor: '#C0392B', badgeBg: '#F8D7D7', badgeBorder: '#C0392B', badgeTxt: '#7B1313',
    badgeLabel: 'Afiliado Inactivo', dotColor: '#C0392B', dotAnim: 'none',
    nombreColor: '#7B1313', nombreDecoration: 'line-through',
    selloBg: 'linear-gradient(135deg,#F8D7D7,#F3B8B8)', selloBorder: '#C0392B', selloIcon: '🚫',
    selloTitulo: 'Membresía Cancelada', selloTitleColor: '#7B1313',
    selloSub: 'Ya no pertenece a Coomosant', selloSubColor: '#7B1313',
    aviso: { bg: '#FDE8E8', border: '#C0392B', txt: '#7B1313',
      texto: 'Este afiliado ya no pertenece a Coomosant. No debe recibir servicios bajo el respaldo de la organización.' },
  },
};

export function tema(estado) {
  return TEMA[estado] || TEMA.activo;
}

function esc(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

// afiliado: { nombre, cedula, tipoServicio, estado, foto } — campos ya
// "de presentación" (nombreMayus/cedulaFmt/tipoServicioLabel opcionales; si
// no vienen, se calculan acá). qrHtml: markup del <img> del QR ya generado
// (o un placeholder), lo arma el caller porque la generación es async.
export function cardHtml(afiliado, qrHtml, fmtCedula, tipoLabel) {
  const t = tema(afiliado.estado);
  const fotoHtml = afiliado.foto
    ? `<img src="${esc(afiliado.foto)}" alt="Foto del afiliado" style="width:100%;height:100%;object-fit:cover;display:block;" />`
    : '👤';
  const avisoHtml = t.aviso ? `
      <div style="margin-top:16px;background:${t.aviso.bg};border-left:5px solid ${t.aviso.border};border-radius:4px;padding:14px 16px;text-align:left;">
        <p style="font-size:14px;color:${t.aviso.txt};line-height:1.6;margin:0;">${esc(t.aviso.texto)}</p>
      </div>` : '';

  return `
    <article class="coomosant-carnet" style="background:#FFFFFF;border-radius:6px;overflow:hidden;box-shadow:0 8px 32px rgba(4,35,59,0.18);max-width:400px;margin:0 auto;">
      <div style="background:${t.bannerGrad};padding:26px 20px 0;display:flex;flex-direction:column;align-items:center;">
        <div style="width:112px;height:112px;border-radius:50%;border:4px solid #FFFFFF;box-shadow:0 0 0 3px ${t.ringColor},0 4px 16px rgba(4,35,59,0.4);overflow:hidden;background:#F0F4F5;display:flex;align-items:center;justify-content:center;font-size:46px;">${fotoHtml}</div>
      </div>
      <div style="background:${t.bannerGrad};height:50px;position:relative;">
        <div style="position:absolute;bottom:0;left:0;right:0;height:50px;background:#FFFFFF;border-radius:50% 50% 0 0 / 22px 22px 0 0;"></div>
      </div>
      <div style="padding:0 26px 30px;text-align:center;">
        <div style="display:inline-flex;align-items:center;gap:7px;background:${t.badgeBg};border:1.5px solid ${t.badgeBorder};border-radius:4px;padding:7px 18px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:${t.badgeTxt};margin-bottom:18px;">
          <span style="width:8px;height:8px;border-radius:50%;background:${t.dotColor};animation:${t.dotAnim};"></span>
          <span>${t.badgeLabel}</span>
        </div>
        <h2 style="font-weight:800;font-size:26px;line-height:1.2;color:${t.nombreColor};margin:0 0 6px;text-decoration:${t.nombreDecoration};text-transform:uppercase;">${esc(afiliado.nombre.toUpperCase())}</h2>
        <p style="font-size:14px;color:#5a6b7a;margin:0 0 24px;">Afiliado a Coomosant · Santa Marta</p>
        <hr style="border:none;border-top:1px solid #e5e9eb;margin:0 0 24px;" />
        <div style="display:flex;align-items:flex-start;gap:12px;text-align:left;margin-bottom:16px;">
          <div style="width:44px;height:44px;background:#f8f8f9;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;border:1px solid #e5e9eb;">🪪</div>
          <div>
            <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#0a97b0;margin:0 0 2px;">Cédula de ciudadanía</p>
            <p style="font-size:17px;font-weight:600;color:#0D0D0D;margin:0;">${fmtCedula(afiliado.cedula)}</p>
          </div>
        </div>
        <div style="display:flex;align-items:flex-start;gap:12px;text-align:left;margin-bottom:16px;">
          <div style="width:44px;height:44px;background:#f8f8f9;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;border:1px solid #e5e9eb;">🏍️</div>
          <div>
            <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#0a97b0;margin:0 0 2px;">Tipo de servicio</p>
            <p style="font-size:17px;font-weight:600;color:#0D0D0D;margin:0;">${esc(tipoLabel(afiliado.tipoServicio))}</p>
          </div>
        </div>
        <div style="padding-top:20px;border-top:1px solid #e5e9eb;text-align:center;margin-top:6px;">
          <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#0a97b0;margin:0 0 10px;">Código QR del afiliado</p>
          <div style="width:148px;height:148px;margin:0 auto;border:2px solid #04233b;border-radius:4px;overflow:hidden;background:#f8f8f9;display:flex;align-items:center;justify-content:center;">${qrHtml}</div>
        </div>
        <div style="margin-top:22px;background:${t.selloBg};border:1.5px solid ${t.selloBorder};border-radius:4px;padding:14px 16px;display:flex;align-items:center;gap:12px;">
          <span style="font-size:26px;flex-shrink:0;">${t.selloIcon}</span>
          <div>
            <p style="font-weight:800;font-size:16px;color:${t.selloTitleColor};margin:0;text-transform:uppercase;">${t.selloTitulo}</p>
            <p style="font-size:13px;color:${t.selloSubColor};margin:1px 0 0;">${t.selloSub}</p>
          </div>
        </div>
        ${avisoHtml}
      </div>
      <div style="background:#04233b;padding:14px 20px;display:flex;align-items:center;justify-content:center;gap:10px;">
        <img src="assets/logo.png" alt="" style="width:30px;height:30px;object-fit:contain;" />
        <span style="font-weight:800;font-size:15px;color:#fff;letter-spacing:2px;text-transform:uppercase;">Coomosant</span>
      </div>
    </article>`;
}
