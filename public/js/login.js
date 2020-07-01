const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
}

const showAlert = (type, msg) => {
  hideAlert();
  const markup = `<div class="alert alert--${type}">${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  window.setTimeout(hideAlert, 5000);
}

const login = async(email, password) => {
  try {
    const result = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:8000/api/v1/users/login',
      data: {email, password}
    });
    if (result.data.status === 'success') {
      showAlert('success', 'You have been logged into your account!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
}

const logout = async() => {
  try {
    const result = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:8000/api/v1/users/logout',
    });
    if (result.data.status = 'success') location.reload(true);
  } catch (err) {
    showAlert('error', 'Error logging out! Please try again.');
  }
}

const updateData = async(data, type) => {
  try {
    const url = type === 'password' ? 'http://127.0.0.1:8000/api/v1/users/updatePassword' : 'http://127.0.0.1:8000/api/v1/users/updateProfile';
    const res = await axios({
      method: 'PATCH',
      url,
      data
    });
    if (res.data.status === 'success') {
      showAlert('success', `Your ${type.toUpperCase()} has been changed successfully!`);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

if (document.querySelector('.form--login')) {
  document.querySelector('.form--login').addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

if (document.querySelector('.nav__el--logout')) {
  document.querySelector('.nav__el--logout').addEventListener('click', logout);
}

if (document.querySelector('.form-user-data')) {
  document.querySelector('.form-user-data').addEventListener('submit', e => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    updateData(form, 'information');
  });
}

if (document.querySelector('.form-user-settings')) {
  document.querySelector('.form-user-settings').addEventListener('submit', async e => {
    e.preventDefault();
    document.querySelector('.btn-save-password').textContent = 'Updating...';
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateData({passwordCurrent, password, passwordConfirm}, 'password');

    document.querySelector('.btn-save-password').textContent = 'Save Password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}
