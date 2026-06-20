/* ===========================================================
   Auth logic — used by index.html (login) and signup.html
   =========================================================== */

// ---------- toast helper (shared) ----------
function showToast(msg, isError = false){
  const toast = document.getElementById('toast');
  const toastText = document.getElementById('toastText');
  if(!toast || !toastText) return;
  toastText.textContent = msg;
  toast.classList.toggle('error', isError);
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=> toast.classList.remove('show'), 3200);
}

// ---------- password visibility toggles (shared) ----------
document.querySelectorAll('.toggle-eye').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = document.getElementById(btn.dataset.target);
    target.type = target.type === 'password' ? 'text' : 'password';
  });
});

// If a session already exists on the login/signup page, skip straight
// to the dashboard instead of showing the form again.
(async function redirectIfLoggedIn(){
  if(!window.sb) return;
  const { data } = await window.sb.auth.getSession();
  if(data && data.session){
    window.location.href = 'dashboard.html';
  }
})();

// ---------- LOGIN ----------
const loginForm = document.getElementById('loginForm');
if(loginForm){
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const submitBtn = loginForm.querySelector('button[type="submit"]');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';

    const { data, error } = await window.sb.auth.signInWithPassword({ email, password });

    submitBtn.disabled = false;
    submitBtn.textContent = 'Log in';

    if(error){
      showToast(error.message || 'Could not log in', true);
      return;
    }

    showToast('Welcome back!');
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 600);
  });
}

// ---------- SIGNUP ----------
const signupForm = document.getElementById('signupForm');
if(signupForm){
  const pw = document.getElementById('signupPassword');
  const confirm = document.getElementById('signupConfirm');
  const matchHint = document.getElementById('matchHint');

  function checkMatch(){
    if(!confirm.value){ matchHint.textContent=''; matchHint.className='hint'; return; }
    if(pw.value === confirm.value){
      matchHint.textContent = 'Passwords match';
      matchHint.className = 'hint match';
    } else {
      matchHint.textContent = "Passwords don't match yet";
      matchHint.className = 'hint mismatch';
    }
  }
  pw.addEventListener('input', checkMatch);
  confirm.addEventListener('input', checkMatch);

  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if(pw.value.length < 6){
      showToast('Password must be at least 6 characters', true);
      return;
    }
    if(pw.value !== confirm.value){
      checkMatch();
      showToast("Passwords don't match — fix that first", true);
      return;
    }

    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const submitBtn = signupForm.querySelector('button[type="submit"]');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Registering...';

    const { data, error } = await window.sb.auth.signUp({
      email,
      password: pw.value,
      options: { data: { full_name: name } }
    });

    submitBtn.disabled = false;
    submitBtn.textContent = 'Register';

    if(error){
      showToast(error.message || 'Could not register', true);
      return;
    }

    // If email confirmation is on (Supabase default), there is no
    // session yet — send the person to log in after confirming.
    if(data.session){
      showToast('Account created!');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 600);
    } else {
      showToast('Check your email to confirm your account');
      setTimeout(() => { window.location.href = 'index.html'; }, 1800);
    }
  });
}
