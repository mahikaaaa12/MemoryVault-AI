from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone


# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------

def get_default_ai_prefs():
    return {
        "auto_summarize": True,
        "suggest_related": True,
        "ai_tagging": True,
        "proactive_insights": False,
        "ai_tone": "concise",
        "context_depth": "8",
    }


def get_default_notif_prefs():
    return {
        "daily_digest": False,
        "weekly_report": True,
        "anniversary_reminders": True,
        "ai_insights": True,
        "bell_badge": True,
        "push_notifications": False,
    }


def get_default_appearance_prefs():
    return {
        "dark_mode": True,
        "compact_view": False,
        "animated_transitions": True,
        "accent_color": "#7C3AED",
        "text_size": "medium",
    }


def get_default_privacy_prefs():
    return {
        "ai_improve": False,
        "usage_analytics": True,
        "public_profile": False,
        "third_party": False,
        "data_retention_days": "30",
    }


def get_default_accessibility_prefs():
    return {
        "reduce_motion": False,
        "high_contrast": False,
        "focus_rings": True,
        "screen_reader": True,
    }


class Profile(models.Model):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('member', 'Member'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member')
    avatar_color = models.CharField(max_length=7, default='#7C3AED')
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    bio = models.TextField(blank=True)
    location = models.CharField(max_length=100, blank=True)
    website = models.URLField(blank=True)
    email_verified = models.BooleanField(default=False)

    # JSON blobs — store per-user preferences without extra tables
    ai_preferences = models.JSONField(default=get_default_ai_prefs)
    notification_preferences = models.JSONField(default=get_default_notif_prefs)
    appearance_preferences = models.JSONField(default=get_default_appearance_prefs)
    privacy_preferences = models.JSONField(default=get_default_privacy_prefs)
    accessibility_preferences = models.JSONField(default=get_default_accessibility_prefs)

    def __str__(self):
        return f"{self.user.username}'s Profile"

    @property
    def display_name(self):
        return self.user.get_full_name() or self.user.username

    @property
    def initials(self):
        name = self.display_name
        parts = name.split()
        if len(parts) >= 2:
            return (parts[0][0] + parts[-1][0]).upper()
        return name[:2].upper()

    @property
    def memory_count(self):
        """Total non-deleted memories for this user — used by dashboard stat cards."""
        return self.user.memories.live().count()

    @property
    def favorite_count(self):
        """Total favourited (non-deleted) memories — used by dashboard stat cards."""
        return self.user.memories.live().filter(is_favorite=True).count()


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()


# ---------------------------------------------------------------------------
# Tag
# ---------------------------------------------------------------------------

class Tag(models.Model):
    user  = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tags')
    name  = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default='#7C3AED')  # per-tag accent colour

    class Meta:
        unique_together = ('user', 'name')
        ordering = ['name']

    def __str__(self):
        return self.name


# ---------------------------------------------------------------------------
# Collection  (a.k.a. "Categories" in the UI — Step 13b)
# ---------------------------------------------------------------------------

# Fixed swatch set used by the Categories page's icon/color pickers — mirrors
# CATEGORY_ICON_CHOICES / CATEGORY_PALETTE from the reference JSX exactly.
# Values are real Tabler icon suffixes (ti-<value>) so templates can render
# them directly without a translation layer.
COLLECTION_ICON_CHOICES = [
    ('folder',    'Folder'),
    ('users',     'Users'),
    ('star',      'Star'),
    ('layers',    'Layers'),
    ('sparkles',  'Sparkles'),
    ('activity',  'Activity'),
    ('tag',       'Tag'),
    ('brain',     'Brain'),
    ('bolt',      'Lightning'),
    ('file-text', 'Document'),
]

COLLECTION_COLOR_CHOICES = [
    '#3B82F6', '#EC4899', '#10B981', '#F97316', '#A855F7',
    '#14B8A6', '#F59E0B', '#6B7290', '#22C55E', '#EF4444',
]


class Collection(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='collections')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, default='folder')  # Tabler icon suffix (ti-<icon>)
    color = models.CharField(max_length=7, default='#A855F7')  # Hex colour
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        unique_together = ('user', 'name')

    def __str__(self):
        return self.name

    def memories_qs(self):
        """Non-deleted memories belonging to this category.

        Categories match Memory.category by *name* (a flat string field —
        see the comment on Memory.category below) rather than through a
        many-to-many join, which keeps counting/filtering cheap.
        """
        return Memory.objects.live().filter(user=self.user, category=self.name)

    @property
    def memory_count(self):
        return self.memories_qs().count()


# ---------------------------------------------------------------------------
# Memory
# ---------------------------------------------------------------------------

CATEGORY_CHOICES = [
    ('Work',     'Work'),
    ('Personal', 'Personal'),
    ('Ideas',    'Ideas'),
    ('Learning', 'Learning'),
    ('Health',   'Health'),
    ('Travel',   'Travel'),
    ('Finance',  'Finance'),
    ('Other',    'Other'),
]


class MemoryQuerySet(models.QuerySet):
    """Encapsulates the soft-delete filtering that was previously repeated
    as `deleted_at__isnull=True/False` in 22 places across models.py and
    views.py (Step 16, Area 1 code-quality pass)."""

    def live(self):
        """Non-deleted memories — the default view everywhere except Trash."""
        return self.filter(deleted_at__isnull=True)

    def deleted(self):
        """Soft-deleted memories — backs the Trash tab."""
        return self.filter(deleted_at__isnull=False)


class Memory(models.Model):
    TYPE_CHOICES = [
        ('note',         'Note'),
        ('conversation', 'Conversation'),
        ('meeting',      'Meeting'),
        ('voice_memo',   'Voice Memo'),
        ('image',        'Image'),
        ('document',     'Document'),
        ('activity',     'Activity'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='memories')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='note')
    title = models.CharField(max_length=255)
    content = models.TextField()       # rich-text / HTML
    ai_summary = models.TextField(blank=True)
    media_file = models.FileField(upload_to='memories/attachments/', null=True, blank=True)
    mood = models.CharField(max_length=50, blank=True, default='')

    # Flat category string (mirrors JSX `memory.category`) — fast for filtering
    # without always joining to Collections.
    category = models.CharField(
        max_length=20, choices=CATEGORY_CHOICES, default='Personal', blank=True
    )

    # State flags
    is_favorite = models.BooleanField(default=False)
    is_pinned   = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)   # ← was missing; drives Archive tab (Step 13)

    # Relationships
    tags        = models.ManyToManyField(Tag,        blank=True, related_name='memories')
    collections = models.ManyToManyField(Collection, blank=True, related_name='memories')

    # Self-referential M2M for "related memories" (mirrors JSX `relatedIds`)
    related_memories = models.ManyToManyField(
        'self', blank=True, symmetrical=True
    )

    occurred_at = models.DateTimeField(default=timezone.now)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)
    deleted_at  = models.DateTimeField(null=True, blank=True)  # soft-delete timestamp

    objects = MemoryQuerySet.as_manager()

    class Meta:
        ordering = ['-occurred_at', '-created_at']

    def __str__(self):
        return self.title

    @property
    def is_deleted(self):
        return self.deleted_at is not None

    def soft_delete(self):
        self.deleted_at = timezone.now()
        self.save(update_fields=['deleted_at'])

    def restore(self):
        self.deleted_at = None
        self.is_archived = False
        self.save(update_fields=['deleted_at', 'is_archived'])

    # ------------------------------------------------------------------
    # Template helpers
    # ------------------------------------------------------------------

    TYPE_ICON_MAP = {
        'note':         'file-text',
        'conversation': 'message-circle',
        'meeting':      'calendar-event',
        'voice_memo':   'microphone',
        'image':        'photo',
        'document':     'file-text',
        'activity':     'activity',
    }

    TYPE_COLOR_MAP = {
        'note':         '#3B82F6',
        'conversation': '#10B981',
        'meeting':      '#F97316',
        'voice_memo':   '#EC4899',
        'image':        '#A855F7',
        'document':     '#14B8A6',
        'activity':     '#F59E0B',
    }

    @property
    def type_icon(self):
        return self.TYPE_ICON_MAP.get(self.type, 'file')

    @property
    def type_color(self):
        return self.TYPE_COLOR_MAP.get(self.type, '#6B7290')

    @property
    def type_bg(self):
        """8-digit hex = color + ~12% alpha — matches the Dashboard's inline rgba(...,.12) tint."""
        return f'{self.type_color}1F'

    @property
    def tag_names(self):
        """Return a list of tag name strings.

        Iterates `self.tags.all()` rather than calling `.values_list()`
        directly on the related manager: `.all()` re-uses Django's
        `prefetch_related('tags')` cache when the calling queryset was
        prefetched, while `.values_list()` always issues a brand new
        query and silently ignores that cache — turning what looks like
        an O(1) prefetch into an O(n) query per row (e.g. once per card
        on the Memories page).
        """
        return [t.name for t in self.tags.all()]


# ---------------------------------------------------------------------------
# Task + Subtask
# ---------------------------------------------------------------------------

class Task(models.Model):
    PRIORITY_CHOICES = [
        ('low',    'Low'),
        ('medium', 'Medium'),
        ('high',   'High'),
    ]
    STATUS_CHOICES = [
        ('todo',       'To Do'),
        ('inprogress', 'In Progress'),
        ('done',       'Done'),
    ]

    user        = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks')
    title       = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    priority    = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    status      = models.CharField(max_length=15, choices=STATUS_CHOICES, default='todo')
    due_date    = models.DateField(default=timezone.now)
    tags        = models.ManyToManyField(Tag, blank=True, related_name='tasks')
    # kanban_order lets us sort cards within a column without depending on pk
    kanban_order = models.PositiveIntegerField(default=0)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['due_date', 'kanban_order', '-created_at']

    def __str__(self):
        return self.title

    # ------------------------------------------------------------------
    # Template helpers — Dashboard "Recent tasks" badge (Step 14c)
    # ------------------------------------------------------------------

    BADGE_COLOR_MAP = {
        'Done':     '#22C55E',
        'Overdue':  '#EF4444',
        'Soon':     '#F59E0B',
        'Later':    '#3B82F6',
    }

    @property
    def is_overdue(self):
        return self.status != 'done' and self.due_date < timezone.localdate()

    @property
    def badge_label(self):
        if self.status == 'done':
            return 'Done'
        if self.is_overdue:
            return 'Overdue'
        days_left = (self.due_date - timezone.localdate()).days
        return 'Soon' if days_left <= 1 else 'Later'

    @property
    def badge_color(self):
        return self.BADGE_COLOR_MAP[self.badge_label]

    @property
    def badge_bg(self):
        """8-digit hex = color + ~12% alpha — mirrors Memory.type_bg."""
        return f'{self.badge_color}1F'


class Subtask(models.Model):
    task    = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='subtasks')
    text    = models.CharField(max_length=255)
    is_done = models.BooleanField(default=False)

    def __str__(self):
        return self.text


# ---------------------------------------------------------------------------
# CalendarEvent
# ---------------------------------------------------------------------------

class CalendarEvent(models.Model):
    user        = models.ForeignKey(User, on_delete=models.CASCADE, related_name='calendar_events')
    title       = models.CharField(max_length=255)
    description = models.TextField(blank=True)   # ← was missing; used in event modal
    date        = models.DateField()
    time        = models.TimeField(null=True, blank=True)
    color       = models.CharField(max_length=7, default='#3B82F6')

    class Meta:
        ordering = ['date', 'time']

    def __str__(self):
        return self.title


# ---------------------------------------------------------------------------
# AI Conversation + Message
# ---------------------------------------------------------------------------

class AIConversation(models.Model):
    user       = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations')
    title      = models.CharField(max_length=255, default='New Chat')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class AIMessage(models.Model):
    ROLE_CHOICES = [
        ('user',      'User'),
        ('assistant', 'Assistant'),
    ]
    conversation        = models.ForeignKey(
        AIConversation, on_delete=models.CASCADE, related_name='messages'
    )
    role                = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content             = models.TextField()
    referenced_memories = models.ManyToManyField(
        Memory, blank=True, related_name='referenced_in_messages'
    )
    created_at          = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.role}: {self.content[:30]}"


# ---------------------------------------------------------------------------
# Notification
# ---------------------------------------------------------------------------

class Notification(models.Model):
    TYPE_CHOICES = [
        ('digest',  'Daily Digest'),
        ('insight', 'AI Insight'),
        ('system',  'System'),
    ]
    user       = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type       = models.CharField(max_length=20, choices=TYPE_CHOICES, default='system')
    message    = models.TextField()
    is_read    = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.message[:50]
