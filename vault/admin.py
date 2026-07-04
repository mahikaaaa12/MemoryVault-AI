from django.contrib import admin

from .models import (
    AIConversation,
    AIMessage,
    CalendarEvent,
    Collection,
    Memory,
    Notification,
    Profile,
    Subtask,
    Tag,
    Task,
)


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'email_verified', 'avatar_color')
    list_filter = ('role', 'email_verified')
    search_fields = ('user__username', 'user__email')


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ('name', 'user')
    list_filter = ('user',)
    search_fields = ('name',)


@admin.register(Collection)
class CollectionAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'icon', 'color', 'created_at')
    list_filter = ('user',)
    search_fields = ('name', 'description')


class SubtaskInline(admin.TabularInline):
    model = Subtask
    extra = 0


@admin.register(Memory)
class MemoryAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'type', 'mood', 'is_favorite', 'is_pinned', 'occurred_at', 'deleted_at')
    list_filter = ('type', 'mood', 'is_favorite', 'is_pinned', 'user')
    search_fields = ('title', 'content', 'ai_summary')
    date_hierarchy = 'occurred_at'
    filter_horizontal = ('tags', 'collections')


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'priority', 'status', 'due_date')
    list_filter = ('priority', 'status', 'user')
    search_fields = ('title', 'description')
    filter_horizontal = ('tags',)
    inlines = [SubtaskInline]


@admin.register(Subtask)
class SubtaskAdmin(admin.ModelAdmin):
    list_display = ('text', 'task', 'is_done')
    list_filter = ('is_done',)


@admin.register(CalendarEvent)
class CalendarEventAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'date', 'time', 'color')
    list_filter = ('user',)
    date_hierarchy = 'date'


class AIMessageInline(admin.TabularInline):
    model = AIMessage
    extra = 0
    readonly_fields = ('created_at',)


@admin.register(AIConversation)
class AIConversationAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'created_at')
    list_filter = ('user',)
    inlines = [AIMessageInline]


@admin.register(AIMessage)
class AIMessageAdmin(admin.ModelAdmin):
    list_display = ('conversation', 'role', 'short_content', 'created_at')
    list_filter = ('role',)

    def short_content(self, obj):
        return obj.content[:60]
    short_content.short_description = 'Content'


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'type', 'short_message', 'is_read', 'created_at')
    list_filter = ('type', 'is_read', 'user')

    def short_message(self, obj):
        return obj.message[:60]
    short_message.short_description = 'Message'
