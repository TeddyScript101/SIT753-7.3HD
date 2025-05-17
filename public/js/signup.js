document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signup-form');
  const errorDisplay = document.getElementById('error');
  const spinner = document.getElementById('spinner');
  let emailForOtp = '';

  const showError = (message) => {
    errorDisplay.textContent = message;
    errorDisplay.style.display = 'block';
  };

  const hideError = () => {
    errorDisplay.textContent = '';
    errorDisplay.style.display = 'none';
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const email = form.email.value.trim();

    try {
      spinner.style.display = 'flex';

      const checkEmailRes = await fetch(
        'http://localhost:3000/api/users/email-exists',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        }
      );

      const checkEmailData = await checkEmailRes.json();

      if (!checkEmailRes.ok) {
        showError(checkEmailData.message || 'Email already exists.');
        spinner.style.display = 'none';
        return;
      }

      emailForOtp = email;

      const otpRes = await fetch('http://localhost:3000/api/users/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const otpData = await otpRes.json();

      if (!otpRes.ok) {
        showError(otpData.message || 'Failed to send OTP.');
        spinner.style.display = 'none';
        return;
      }

      const otpModal = document.getElementById('otp-modal');
      otpModal.style.display = 'flex';

      spinner.style.display = 'none';
    } catch (err) {
      console.error(err);
      showError('Something went wrong. Please try again.');
      spinner.style.display = 'none';
    }
  });

  const otpSubmitBtn = document.getElementById('submit-otp');
  const otpField = document.getElementById('otp');

  otpSubmitBtn.addEventListener('click', async () => {
    hideError();
    const otp = otpField.value.trim();

    if (otp.length === 6) {
      try {
        spinner.style.display = 'flex';

        const otpRes = await fetch(
          'http://localhost:3000/api/users/verify-otp',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: emailForOtp, otp }),
          }
        );

        const otpData = await otpRes.json();

        if (otpRes.ok) {
          const userCreationRes = await fetch(
            'http://localhost:3000/api/users/signup',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: emailForOtp,
                name: form.name.value.trim(),
                password: form.password.value,
              }),
            }
          );

          const userCreationData = await userCreationRes.json();

          if (userCreationRes.ok) {
            alert('Account created successfully!');
            window.location.href = '/login';
          } else {
            showError(userCreationData.message || 'User creation failed.');
          }
        } else {
          showError(otpData.message || 'Invalid OTP.');
        }

        spinner.style.display = 'none';
      } catch (err) {
        console.error(err);
        showError('Something went wrong while verifying OTP.');
        spinner.style.display = 'none';
      }
    } else {
      showError('Please enter a valid 6-digit OTP.');
    }
  });

  const resendOtpBtn = document.getElementById('resend-otp');
  resendOtpBtn.addEventListener('click', async () => {
    hideError();

    try {
      spinner.style.display = 'flex';

      const resendRes = await fetch(
        'http://localhost:3000/api/users/send-otp',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: emailForOtp }),
        }
      );

      const resendData = await resendRes.json();

      if (resendRes.ok) {
        alert('OTP resent to your email.');
      } else {
        showError(resendData.message || 'Failed to resend OTP.');
      }

      spinner.style.display = 'none';
    } catch (err) {
      console.error(err);
      showError('Something went wrong while resending OTP.');
      spinner.style.display = 'none';
    }
  });
});
