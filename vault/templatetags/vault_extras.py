"""
MemoryVault AI — custom template filters.
`highlight` backs the Search page's result highlighting (Step 13c),
mirroring the reference JSX's `highlightText()` helper.
`friendly_time` backs the Dashboard's relative timestamps (Step 14b).
"""
import re

from django import template
from django.utils import timezone
from django.utils.html import escape
from django.utils.safestring import mark_safe

register = template.Library()


@register.filter(name='highlight')
def highlight(text, query):
    """
    Wrap case-insensitive occurrences of `query` in <mark class="search-mark">.

    The surrounding text is always HTML-escaped before re-assembly, so this
    is safe to use on arbitrary user-entered memory content even though the
    filter returns pre-escaped (mark_safe) output.
    """
    text = '' if text is None else str(text)
    if not query:
        return escape(text)

    pattern = re.compile(re.escape(str(query)), re.IGNORECASE)
    parts = pattern.split(text)
    matches = pattern.findall(text)

    out = []
    for i, part in enumerate(parts):
        out.append(escape(part))
        if i < len(matches):
            out.append(f'<mark class="search-mark">{escape(matches[i])}</mark>')
    return mark_safe(''.join(out))


@register.filter(name='friendly_time')
def friendly_time(value):
    """
    Relative timestamp for the Dashboard's Recent memories list —
    'Just now' / '12m ago' / '3h ago' / 'Yesterday' / '4 days ago',
    falling back to an absolute date ('Jun 24') past a week old.
    """
    if not value:
        return ''

    now = timezone.now()
    seconds = max((now - value).total_seconds(), 0)

    if seconds < 60:
        return 'Just now'
    if seconds < 3600:
        return f'{int(seconds // 60)}m ago'

    day_diff = (timezone.localtime(now).date() - timezone.localtime(value).date()).days
    if day_diff == 0:
        return f'{int(seconds // 3600)}h ago'
    if day_diff == 1:
        return 'Yesterday'
    if day_diff < 7:
        return f'{day_diff} days ago'
    return timezone.localtime(value).strftime('%b %d')
