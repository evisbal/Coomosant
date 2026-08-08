// Coomosant — inicialización del cliente de Supabase.
// Requiere que config.js y el script UMD de @supabase/supabase-js se hayan
// cargado antes que este archivo (ver <script> tags en cada página).
(function () {
  const cfg = window.COOMOSANT_CONFIG || {};
  const notConfigured =
    !cfg.SUPABASE_URL ||
    !cfg.SUPABASE_ANON_KEY ||
    cfg.SUPABASE_URL.startsWith('REEMPLAZAR');

  if (notConfigured) {
    console.warn(
      '[Coomosant] Falta configurar Supabase en assets/js/config.js (SUPABASE_URL / SUPABASE_ANON_KEY).'
    );
  }

  window.coomosantSupabase = notConfigured
    ? null
    : window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
})();
