"""
MemoryVault AI — Authentication views.

Sign-in, sign-up, logout, and the two-step forgot/reset-password flow.
Split out of the original monolithic views.py during Step 16's code-
quality pass (Area 1).
"""
import logging

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.shortcuts import redirect, render
from django.utils import timezone
from django.utils.http import url_has_allowed_host_and_scheme
from django.views.decorators.http import require_http_methods

from ..forms import ForgotPasswordForm, LoginForm, PasswordResetForm, SignupForm, generate_otp

logger = logging.getLogger(__name__)

OTP_VALID_MINUTES = 10


@require_http_methods(['GET', 'POST'])
def login_view(request):
    """Sign-in: validates credentials and logs the user in."""
    if request.user.is_authenticated:
        return redirect('vault:dashboard')

    form = LoginForm(request.POST or None)
    error = None

    if request.method == 'POST' and form.is_valid():
        raw_username = form.cleaned_data['username']
        password     = form.cleaned_data['password']
        remember_me  = form.cleaned_data.get('remember_me', False)

        # Allow login by email OR username
        username = raw_username
        if '@' in raw_username:
            try:
                username = User.objects.get(email__iexact=raw_username).username
            except User.DoesNotExist:
                pass

        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            if not remember_me:
                # Session expires when browser closes
                request.session.set_expiry(0)
            next_url = request.GET.get('next', '')
            if next_url and url_has_allowed_host_and_scheme(
                url=next_url,
                allowed_hosts={request.get_host()},
                require_https=request.is_secure(),
            ):
                return redirect(next_url)
            return redirect('vault:dashboard')
        else:
            error = 'Invalid username/email or password. Please try again.'

    return render(request, 'vault/auth/login.html', {'form': form, 'error': error})


@require_http_methods(['GET', 'POST'])
def signup_view(request):
    """Registration: creates user + profile and logs them straight in."""
    if request.user.is_authenticated:
        return redirect('vault:dashboard')

    form = SignupForm(request.POST or None)
    error = None

    if request.method == 'POST':
        if form.is_valid():
            data = form.cleaned_data
            parts = data['full_name'].strip().split(' ', 1)
            user = User.objects.create_user(
                username   = data['username'],
                email      = data['email'],
                password   = data['password'],
                first_name = parts[0],
                last_name  = parts[1] if len(parts) > 1 else '',
            )
            login(request, user)

            return redirect('vault:dashboard')
        else:
            # Flatten form errors into a single readable message
            error = ' '.join(
                msg
                for field_errors in form.errors.values()
                for msg in field_errors
            )

    return render(request, 'vault/auth/signup.html', {'form': form, 'error': error})


@require_http_methods(['GET', 'POST'])
def logout_view(request):
    """Log out and redirect to login."""
    logout(request)
    return redirect('login')


@require_http_methods(['GET', 'POST'])
def forgot_password_view(request):
    """Step 1 of password reset: user submits email, receives OTP."""
    if request.user.is_authenticated:
        return redirect('vault:dashboard')

    form    = ForgotPasswordForm(request.POST or None)
    error   = None
    success = None

    if request.method == 'POST' and form.is_valid():
        email = form.cleaned_data['email']
        try:
            user = User.objects.get(email__iexact=email)
            otp  = generate_otp()
            request.session['reset_otp']      = otp
            request.session['reset_email']    = email
            request.session['reset_otp_uid']  = user.pk
            request.session['reset_otp_at']   = timezone.now().isoformat()

            logger.info('PASSWORD RESET OTP for %s: %s', email, otp)
            print(f'\n[MemoryVault] Password reset code for {email}: {otp}\n')
        except User.DoesNotExist:
            # Silent — don't reveal whether the email exists
            pass

        # Always show success to prevent user-enumeration
        success = (
            f'If {email} is registered, a reset code has been sent. '
            f'Check your email (and the server console in development). '
            f'The code expires in {OTP_VALID_MINUTES} minutes.'
        )

    return render(request, 'vault/auth/forgot.html', {
        'form': form, 'error': error, 'success': success,
    })


@require_http_methods(['GET', 'POST'])
def reset_password_view(request):
    """Step 2 of password reset: user submits the OTP + new password."""
    # Require a valid reset session (set by forgot_password_view)
    if 'reset_otp_uid' not in request.session:
        return redirect('forgot_password')

    form    = PasswordResetForm(request.POST or None)
    error   = None
    success = None

    if request.method == 'POST' and form.is_valid():
        otp_expected = request.session.get('reset_otp')
        otp_at_raw   = request.session.get('reset_otp_at')
        expired = True
        if otp_at_raw:
            try:
                otp_at = timezone.datetime.fromisoformat(otp_at_raw)
                expired = (timezone.now() - otp_at).total_seconds() > OTP_VALID_MINUTES * 60
            except ValueError:
                expired = True

        if expired:
            error = 'This code has expired. Please request a new one.'
        elif form.cleaned_data['otp'] != otp_expected:
            error = 'Incorrect verification code. Please try again.'
        else:
            try:
                user = User.objects.get(pk=request.session['reset_otp_uid'])
                user.set_password(form.cleaned_data['password'])
                user.save()
                # Clear the reset session keys
                for key in ('reset_otp', 'reset_email', 'reset_otp_uid', 'reset_otp_at'):
                    request.session.pop(key, None)
                success = 'Password reset successfully. You can now sign in with your new password.'
            except User.DoesNotExist:
                error = 'Something went wrong. Please request a new reset link.'
    elif request.method == 'POST':
        error = ' '.join(
            msg
            for field_errors in form.errors.values()
            for msg in field_errors
        )

    return render(request, 'vault/auth/reset.html', {
        'form': form, 'error': error, 'success': success,
    })
