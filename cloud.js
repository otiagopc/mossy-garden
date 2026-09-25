(function () {
  'use strict';

  const CONFIG = window.MOSSY_SUPABASE_CONFIG || {};
  const TABLE = 'mossy_garden_user_data';
  const LOCAL_OWNER_KEY = 'mossy_garden_cloud_owner';
  const DEBOUNCE_MS = 1000;

  let supabase = null;
  let user = null;
  let hooks = null;
  let saveTimer = null;
  let cloudReady = false;
  let suppressSave = false;

  function configured() {
    return CONFIG.url && CONFIG.publishableKey &&
      !CONFIG.url.includes('COLE_AQUI') &&
      !CONFIG.publishableKey.includes('COLE_AQUI');
  }

  function setStatus(text, state = '') {
    const el = document.getElementById('cloudStatus');
    const elSignedOut = document.getElementById('cloudStatusSignedOut');
    if (el) {
      el.textContent = text;
      el.dataset.state = state;
    }
    if (elSignedOut) {
      elSignedOut.textContent = text;
      elSignedOut.dataset.state = state;
    }
    if (hooks && hooks.onStatus) hooks.onStatus(text, state);
  }

  function renderAccount() {
    const signedOut = document.getElementById('btnGoogleLogin') || document.getElementById('authSignedOut');
    const signedIn = document.getElementById('authSignedIn');
    const avatar = document.getElementById('authAvatar');
    const name = document.getElementById('authName');

    if (!signedOut || !signedIn) return;

    if (!user) {
      signedOut.hidden = false;
      signedOut.style.display = '';
      signedIn.hidden = true;
      signedIn.style.display = 'none';
      return;
    }

    signedOut.hidden = true;
    signedOut.style.display = 'none';
    signedIn.hidden = false;
    signedIn.style.display = '';
    const meta = user.user_metadata || {};
    if (name) name.textContent = meta.full_name || meta.name || user.email || 'Conta Google';
    if (avatar) {
      const photo = meta.avatar_url || meta.picture;
      if (photo) {
        avatar.src = photo;
        avatar.hidden = false;
        avatar.style.display = '';
      } else {
        avatar.hidden = true;
        avatar.style.display = 'none';
      }
    }
  }

  async function login() {
    if (!supabase) return;
    setStatus('abrindo Google…', 'syncing');
    const redirectTo = window.location.origin + window.location.pathname;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo }
    });
    if (error) {
      console.error(error);
      setStatus('erro ao entrar', 'error');
    }
  }

  async function logout() {
    if (!supabase) return;
    await flush();
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error(error);
      setStatus('erro ao sair', 'error');
      return;
    }
    user = null;
    cloudReady = false;
    renderAccount();
    setStatus('somente neste dispositivo', 'local');
  }

  async function fetchRemote() {
    const { data, error } = await supabase
      .from(TABLE)
      .select('plants, settings, schema_version, updated_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async function upsertNow() {
    if (!cloudReady || !user || suppressSave || !hooks) return;
    clearTimeout(saveTimer);
    saveTimer = null;

    setStatus('salvando…', 'syncing');
    const payload = {
      user_id: user.id,
      plants: hooks.getPlants ? hooks.getPlants() : [],
      settings: hooks.getSettings ? hooks.getSettings() : {},
      schema_version: 1,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from(TABLE).upsert(payload, { onConflict: 'user_id' });
    if (error) {
      console.error('Mossy Garden: erro ao salvar na nuvem', error);
      setStatus(navigator.onLine ? 'erro ao sincronizar' : 'offline — salvo localmente', 'error');
      return;
    }
    localStorage.setItem(LOCAL_OWNER_KEY, user.id);
    setStatus('salvo na nuvem', 'ok');
  }

  function scheduleSave() {
    if (!cloudReady || !user || suppressSave) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(upsertNow, DEBOUNCE_MS);
  }

  async function flush() {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
      await upsertNow();
    }
  }

  async function syncForUser() {
    if (!user || !hooks) return;
    setStatus('sincronizando…', 'syncing');

    try {
      const remote = await fetchRemote();
      const previousOwner = localStorage.getItem(LOCAL_OWNER_KEY);

      if (remote) {
        // Se já existe nuvem, ela é a fonte inicial de verdade neste dispositivo.
        suppressSave = true;
        if (hooks.setPlants) hooks.setPlants(Array.isArray(remote.plants) ? remote.plants : []);
        if (hooks.setSettings) hooks.setSettings(remote.settings || {});
        suppressSave = false;
        localStorage.setItem(LOCAL_OWNER_KEY, user.id);
        cloudReady = true;
        setStatus('salvo na nuvem', 'ok');
      } else {
        // Primeira vez desta conta: leva os dados locais existentes para a nuvem.
        // Se o navegador pertencia explicitamente a outra conta, não mistura os dados.
        if (previousOwner && previousOwner !== user.id) {
          suppressSave = true;
          if (hooks.setPlants) hooks.setPlants([]);
          suppressSave = false;
        }
        cloudReady = true;
        await upsertNow();
      }
    } catch (err) {
      console.error('Mossy Garden: falha na sincronização inicial', err);
      cloudReady = true; // mantém saves locais e permite tentar novamente depois
      setStatus(navigator.onLine ? 'erro ao sincronizar' : 'offline — salvo localmente', 'error');
    }
  }

  async function init(appHooks) {
    hooks = appHooks;

    const loginBtn = document.getElementById('btnGoogleLogin');
    const logoutBtn = document.getElementById('btnLogout');
    if (loginBtn) loginBtn.addEventListener('click', login);
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    if (!configured()) {
      renderAccount();
      setStatus('Supabase não configurado', 'error');
      return;
    }

    if (!window.supabase || !window.supabase.createClient) {
      setStatus('biblioteca do Supabase não carregou', 'error');
      return;
    }

    supabase = window.supabase.createClient(CONFIG.url, CONFIG.publishableKey);

    const { data, error } = await supabase.auth.getSession();
    if (error) console.warn('Mossy Garden: erro ao recuperar sessão', error);
    user = data && data.session ? data.session.user : null;
    renderAccount();

    if (user) await syncForUser();
    else setStatus('somente neste dispositivo', 'local');

    supabase.auth.onAuthStateChange(async (event, session) => {
      const nextUser = session ? session.user : null;
      const changedUser = nextUser && (!user || nextUser.id !== user.id);
      user = nextUser;
      renderAccount();

      if (!user) {
        cloudReady = false;
        setStatus('somente neste dispositivo', 'local');
      } else if (changedUser || event === 'SIGNED_IN') {
        await syncForUser();
      }
    });

    window.addEventListener('online', () => {
      if (user) upsertNow();
    });
    window.addEventListener('pagehide', () => {
      if (saveTimer) upsertNow();
    });
  }

  window.MossyCloud = {
    init,
    scheduleSave,
    flush,
    login,
    logout,
    getUser: () => user,
    isReady: () => cloudReady
  };
})();
