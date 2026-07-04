"""
MemoryVault AI — Forms
Auth forms live here (login, signup, password reset).
Memory forms are added in Step 12. Task/CalendarEvent forms come in Step 13+.
"""
import random
import string

from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

from .models import Collection, Memory, Tag, COLLECTION_COLOR_CHOICES, COLLECTION_ICON_CHOICES


def _clean_password_confirmation(cleaned_data, password_field='password', confirm_field='confirm_password'):
    """Shared by SignupForm and PasswordResetForm: both collect a new
    password + confirmation and need the same "do they match, and does
    the password pass Django's validators" check.
    """
    pw = cleaned_data.get(password_field, '')
    cpw = cleaned_data.get(confirm_field, '')
    if pw and cpw and pw != cpw:
        raise ValidationError({confirm_field: 'Passwords do not match.'})
    if pw:
        try:
            validate_password(pw)
        except ValidationError as exc:
            raise ValidationError({password_field: exc.messages})
    return cleaned_data


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------

class LoginForm(forms.Form):
    username = forms.CharField(
        max_length=150,
        widget=forms.TextInput(attrs={
            'placeholder': 'Enter your username or email',
            'autocomplete': 'username',
        }),
        label='Username or Email',
    )
    password = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'placeholder': 'Enter your password',
            'autocomplete': 'current-password',
        }),
        label='Password',
    )
    remember_me = forms.BooleanField(required=False)


# ---------------------------------------------------------------------------
# Signup
# ---------------------------------------------------------------------------

class SignupForm(forms.Form):
    username = forms.CharField(
        max_length=150,
        widget=forms.TextInput(attrs={'placeholder': 'Choose a username'}),
    )
    full_name = forms.CharField(
        max_length=150,
        widget=forms.TextInput(attrs={'placeholder': 'Enter your full name'}),
    )
    email = forms.EmailField(
        widget=forms.EmailInput(attrs={'placeholder': 'you@example.com'}),
    )
    password = forms.CharField(
        widget=forms.PasswordInput(attrs={'placeholder': 'Create a strong password'}),
    )
    confirm_password = forms.CharField(
        widget=forms.PasswordInput(attrs={'placeholder': 'Re-enter your password'}),
    )

    def clean_username(self):
        username = self.cleaned_data['username'].strip()
        if User.objects.filter(username__iexact=username).exists():
            raise ValidationError('That username is already taken.')
        return username

    def clean_email(self):
        email = self.cleaned_data['email'].strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise ValidationError('An account with that email already exists.')
        return email

    def clean(self):
        cleaned = super().clean()
        return _clean_password_confirmation(cleaned)


# ---------------------------------------------------------------------------
# Forgot password (request a reset link / OTP)
# ---------------------------------------------------------------------------

class ForgotPasswordForm(forms.Form):
    email = forms.EmailField(
        widget=forms.EmailInput(attrs={'placeholder': 'Enter your email'}),
        label='Email Address',
    )

    def clean_email(self):
        email = self.cleaned_data['email'].strip().lower()
        # We deliberately don't raise if the email doesn't exist (prevents
        # user-enumeration). The view will silently succeed either way.
        return email


# ---------------------------------------------------------------------------
# Password reset (submit new password, requires valid token in session)
# ---------------------------------------------------------------------------

class PasswordResetForm(forms.Form):
    otp = forms.CharField(
        max_length=6,
        min_length=6,
        widget=forms.TextInput(attrs={
            'placeholder': 'Enter the 6-digit code',
            'autocomplete': 'one-time-code',
            'inputmode': 'numeric',
        }),
        label='Verification Code',
    )
    password = forms.CharField(
        widget=forms.PasswordInput(attrs={'placeholder': 'Enter new password'}),
        label='New Password',
    )
    confirm_password = forms.CharField(
        widget=forms.PasswordInput(attrs={'placeholder': 'Re-enter new password'}),
        label='Confirm New Password',
    )

    def clean_otp(self):
        otp = self.cleaned_data['otp'].strip()
        if not otp.isdigit():
            raise ValidationError('Enter the 6-digit numeric code.')
        return otp

    def clean(self):
        cleaned = super().clean()
        return _clean_password_confirmation(cleaned)


# ---------------------------------------------------------------------------
# OTP helper (used by the forgot-password flow; no DB table needed for dev)
# ---------------------------------------------------------------------------

def generate_otp(length=6):
    """Return a random numeric OTP string."""
    return ''.join(random.choices(string.digits, k=length))


# ---------------------------------------------------------------------------
# Memory (create / edit) — Step 12
# ---------------------------------------------------------------------------

class MemoryForm(forms.ModelForm):
    """
    Handles both create and edit. `tags` is not a real model field on the
    form — it's a comma-separated text box; the view/save_tags() below
    turns it into real Tag rows scoped to the logged-in user.
    """
    tags = forms.CharField(
        required=False,
        widget=forms.TextInput(attrs={
            'placeholder': 'e.g. work, ideas, product',
            'autocomplete': 'off',
        }),
        help_text='Separate tags with commas.',
    )

    class Meta:
        model = Memory
        fields = ['type', 'title', 'content', 'category', 'mood', 'occurred_at', 'media_file', 'ai_summary']
        widgets = {
            'title': forms.TextInput(attrs={'placeholder': 'Give this memory a title'}),
            'content': forms.Textarea(attrs={'placeholder': "What's on your mind?", 'rows': 6}),
            'mood': forms.TextInput(attrs={'placeholder': 'Optional — e.g. excited, reflective'}),
            'occurred_at': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
            'ai_summary': forms.Textarea(attrs={
                'placeholder': 'AI-generated summary will appear here, or write your own…',
                'rows': 2,
            }),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['occurred_at'].input_formats = ['%Y-%m-%dT%H:%M']
        if self.instance.pk:
            # Pre-fill the tags box when editing an existing memory
            self.fields['tags'].initial = ', '.join(self.instance.tag_names)

    # Security: media_file is a plain FileField with no built-in
    # restrictions, so any file type/size could otherwise be uploaded and
    # stored on disk. Restrict to the file types the UI actually supports
    # (images, audio for voice memos, and common document formats) and cap
    # the size to prevent disk-fill abuse.
    ALLOWED_MEDIA_EXTENSIONS = {
        'jpg', 'jpeg', 'png', 'gif', 'webp',
        'mp3', 'wav', 'm4a', 'ogg',
        'pdf', 'txt', 'doc', 'docx',
    }
    MAX_MEDIA_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

    def clean_media_file(self):
        media_file = self.cleaned_data.get('media_file')
        if not media_file:
            return media_file

        # Cleared/removed via the clear checkbox, or unchanged on edit —
        # Django represents these as False or the existing FieldFile,
        # neither of which needs re-validating.
        if media_file is False or not hasattr(media_file, 'size'):
            return media_file

        ext = media_file.name.rsplit('.', 1)[-1].lower() if '.' in media_file.name else ''
        if ext not in self.ALLOWED_MEDIA_EXTENSIONS:
            raise ValidationError(
                'Unsupported file type. Allowed: images, audio, PDF, TXT, DOC/DOCX.'
            )

        if media_file.size > self.MAX_MEDIA_FILE_SIZE:
            raise ValidationError('File is too large — the limit is 10MB.')

        return media_file

    def save_tags(self, memory, user):
        """Call after save() — resolves the comma text into Tag rows."""
        names = [n.strip() for n in self.cleaned_data.get('tags', '').split(',') if n.strip()]
        tags = []
        for name in names:
            tag, _ = Tag.objects.get_or_create(user=user, name=name)
            tags.append(tag)
        memory.tags.set(tags)


# ---------------------------------------------------------------------------
# Collection / Category (create / edit) — Step 13b
# ---------------------------------------------------------------------------

class CollectionForm(forms.ModelForm):
    """
    Backs the Categories page's create/edit modal. `icon` and `color` are
    picked from fixed swatch sets in the UI (see CollectionIconWidget /
    CollectionColorWidget in the template's JS), so plain hidden inputs are
    enough here — validation just confirms the submitted value is one of
    the allowed choices.
    """

    class Meta:
        model = Collection
        fields = ['name', 'description', 'icon', 'color']
        widgets = {
            'name': forms.TextInput(attrs={'placeholder': 'e.g. Recipes', 'autocomplete': 'off'}),
            'description': forms.TextInput(attrs={'placeholder': "What goes in this category?"}),
            'icon': forms.HiddenInput(),
            'color': forms.HiddenInput(),
        }

    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)

    def clean_name(self):
        name = self.cleaned_data['name'].strip()
        if self.user:
            qs = Collection.objects.filter(user=self.user, name__iexact=name)
            if self.instance.pk:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise ValidationError('You already have a category with that name.')
        return name

    def clean_icon(self):
        icon = self.cleaned_data.get('icon') or 'folder'
        valid_icons = {key for key, _ in COLLECTION_ICON_CHOICES}
        return icon if icon in valid_icons else 'folder'

    def clean_color(self):
        color = self.cleaned_data.get('color') or COLLECTION_COLOR_CHOICES[0]
        return color if color in COLLECTION_COLOR_CHOICES else COLLECTION_COLOR_CHOICES[0]
