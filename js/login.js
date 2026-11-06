
document.addEventListener('DOMContentLoaded', function () {

    // =====================================
    // GET HTML ELEMENTS
    // =====================================

    const loginBtn = document.querySelector('#loginBtn');
    const usernameInput = document.querySelector('#username');
    const passwordInput = document.querySelector('#password');
    const feedbackDiv = document.querySelector('#loginFeedback');

    // =====================================
    // CHECK IF ALREADY LOGGED IN
    // =====================================

    if (localStorage.getItem('isLoggedIn') === 'true') {
        window.location.href = 'dashboard.html';
        return;
    }

    // =====================================
    // DISPLAY LOGIN FEEDBACK
    // =====================================

    function showFeedback(message, type) {

        const alert = document.createElement('div');

        alert.classList.add(
            'alert',
            type === 'success' ? 'alert-success' : 'alert-danger'
        );

        alert.setAttribute('role', 'alert');
        alert.textContent = message;

        feedbackDiv.innerHTML = '';
        feedbackDiv.appendChild(alert);
    }

    // =====================================
    // HANDLE LOGIN
    // =====================================

    function handleLogin() {

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        // CHECK EMPTY FIELDS
        if (username === '' || password === '') {
            showFeedback(
                'Please enter both username and password.',
                'danger'
            );

            return;
        }

        // CHECK LOGIN CREDENTIALS
        if (username === 'admin' && password === 'password123') {

            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('user', username);

            showFeedback(
                'Login successful! Redirecting...',
                'success'
            );

            loginBtn.disabled = true;

            setTimeout(function () {
                window.location.href = 'dashboard.html';
            }, 1000);

        } else {

            showFeedback(
                'Invalid username or password. Please try again.',
                'danger'
            );

            passwordInput.value = '';
            passwordInput.focus();
        }
    }

    // =====================================
    // LOGIN BUTTON EVENT
    // =====================================

    loginBtn.addEventListener('click', handleLogin);

    // =====================================
    // ENTER KEY LOGIN
    // =====================================

    [usernameInput, passwordInput].forEach(function (input) {

        input.addEventListener('keydown', function (event) {

            if (event.key === 'Enter') {
                event.preventDefault();
                handleLogin();
            }

        });

    });

});
