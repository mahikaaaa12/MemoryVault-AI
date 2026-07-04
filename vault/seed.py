from django.utils import timezone
from datetime import timedelta
from vault.models import Tag, Collection, Memory, Task, Subtask, CalendarEvent, Notification

def seed_user_data(user):
    # Avoid double seeding
    if Memory.objects.filter(user=user).exists():
        return

    # 1. Create standard collections
    collections_data = [
        ('Work', 'Meetings, projects, and professional notes', 'users', '#3B82F6'),
        ('Personal', 'Reflections, journal entries, and life moments', 'star', '#EC4899'),
        ('Learning', 'Reading notes, courses, and things studying', 'layers', '#14B8A6'),
        ('Ideas', 'Brainstorms, sparks of inspiration, and concepts', 'sparkles', '#A855F7'),
        ('Health', 'Fitness, wellness, and medical notes', 'activity', '#F59E0B'),
        ('Travel', 'Trips, itineraries, and travel memories', 'folder', '#F97316'),
        ('Finance', 'Budgets, expenses, and money matters', 'tag', '#10B981'),
        ('Other', 'Everything that doesn\'t fit elsewhere', 'file-text', '#6B7290'),
    ]
    
    collections = {}
    for name, desc, icon, color in collections_data:
        coll = Collection.objects.create(user=user, name=name, description=desc, icon=icon, color=color)
        collections[name] = coll

    # 2. Create tags
    tags_data = ['philosophy', 'consciousness', 'ideas', 'work', 'strategy', 'product', 'design', 
                 'principles', 'learning', 'remote-work', 'productivity', 'team', 'startup', 'ai', 
                 'memory', 'fitness', 'health', 'running', 'reading', 'psychology', 'cognitive-bias', 
                 'personal', 'nature', 'reflection', 'photography']
    
    tags = {}
    for tag_name in tags_data:
        tag, _ = Tag.objects.get_or_create(user=user, name=tag_name)
        tags[tag_name] = tag

    # 3. Create memories
    now = timezone.now()
    memories_data = [
        {
            'type': 'note',
            'title': 'Midnight thought on consciousness',
            'content': '<p>What if consciousness is simply the universe experiencing itself? The boundary between self and world seems less like a wall and more like a membrane—porous, shifting, defined only by attention.</p><p>The idea of a \'hard problem\' might itself be a cognitive artifact.</p>',
            'ai_summary': 'Philosophical reflection on consciousness as a permeable boundary rather than a fixed division between self and world.',
            'mood': 'Reflective',
            'is_favorite': True,
            'is_pinned': True,
            'occurred_at': now - timedelta(days=2),
            'collection_names': ['Ideas'],
            'tag_names': ['philosophy', 'consciousness', 'ideas']
        },
        {
            'type': 'meeting',
            'title': 'Q3 Product Strategy Meeting',
            'content': '<p>Discussed roadmap priorities for Q3. Key decisions:</p><ul><li>Memory search gets priority over analytics dashboard</li><li>AI tagging to be rolled out in phases</li><li>Mobile PWA by end of quarter</li></ul><p>Action items: Sarah owns search spec, Alex on AI pipeline, Marcus on mobile audit.</p>',
            'ai_summary': 'Q3 planning session covering roadmap priorities: search first, phased AI tagging, mobile PWA by quarter end.',
            'mood': 'Focused',
            'is_favorite': False,
            'is_pinned': True,
            'occurred_at': now - timedelta(days=5),
            'collection_names': ['Work'],
            'tag_names': ['work', 'strategy', 'product']
        },
        {
            'type': 'note',
            'title': 'Design principles from Dieter Rams',
            'content': '<p>Good design is innovative. Good design makes a product useful. Good design is aesthetic. Good design makes a product understandable.</p><p>The less design, the better. Restraint is the hardest skill and the most valuable one.</p>',
            'ai_summary': 'Notes on Dieter Rams\' ten principles of good design with personal reflections on restraint as the core skill.',
            'mood': 'Inspired',
            'is_favorite': True,
            'is_pinned': False,
            'occurred_at': now - timedelta(days=8),
            'collection_names': ['Learning'],
            'tag_names': ['design', 'principles', 'learning']
        },
        {
            'type': 'conversation',
            'title': 'Chat with Sarah about remote work',
            'content': '<p>Sarah shared that she\'s been most productive between 6–9 AM before notifications start. She uses the Pomodoro method but with 50-min blocks.</p><p>We talked about how async communication changes team trust dynamics—visibility becomes a proxy for reliability when presence isn\'t observable.</p>',
            'ai_summary': 'Discussion on remote work productivity rhythms and how async communication reshapes team trust dynamics.',
            'mood': 'Collaborative',
            'is_favorite': False,
            'is_pinned': False,
            'occurred_at': now - timedelta(days=10),
            'collection_names': ['Work'],
            'tag_names': ['remote-work', 'productivity', 'team']
        },
        {
            'type': 'voice_memo',
            'title': 'Voice memo: App idea brainstorm',
            'content': '<p>Idea: a memory app that uses spaced repetition not for facts but for feelings—resurfaces an old journal entry when the AI detects you\'re in a similar emotional context.</p><p>The key insight is that memory isn\'t retrieval, it\'s reconstruction. Every recall changes the memory slightly.</p>',
            'ai_summary': 'Brainstorm on emotion-aware spaced repetition for personal memories, noting that recall is reconstruction not retrieval.',
            'mood': 'Creative',
            'is_favorite': True,
            'is_pinned': False,
            'occurred_at': now - timedelta(days=14),
            'collection_names': ['Ideas'],
            'tag_names': ['ideas', 'startup', 'ai', 'memory']
        },
        {
            'type': 'activity',
            'title': 'Morning run insights',
            'content': '<p>6.2 km in 31 minutes. Heart rate peaked at 172 bpm on the hill section. Felt strong after the first km warm-up.</p><p>Mental clarity was notably better post-run. The ideas about the memory app came during the cooldown walk.</p>',
            'ai_summary': 'Morning run: 6.2km in 31min, peak HR 172. Notable mental clarity boost post-exercise triggering creative thinking.',
            'mood': 'Energetic',
            'is_favorite': False,
            'is_pinned': False,
            'occurred_at': now - timedelta(days=1),
            'collection_names': ['Health'],
            'tag_names': ['fitness', 'health', 'running']
        },
        {
            'type': 'document',
            'title': 'Reading notes: Thinking Fast and Slow',
            'content': '<p>System 1 (fast) vs System 2 (slow) thinking. The availability heuristic explains why vivid, recent events distort our probability estimates.</p><p>Most of our decisions are made by System 1 and rationalized afterward. The \'what you see is all there is\' (WYSIATI) effect.</p>',
            'ai_summary': 'Core concepts from Kahneman\'s dual-process theory: System 1/2 thinking, availability heuristic, and WYSIATI bias.',
            'mood': 'Analytical',
            'is_favorite': False,
            'is_pinned': False,
            'occurred_at': now - timedelta(days=20),
            'deleted_at': now - timedelta(days=12), # Soft-deleted / in Trash
            'collection_names': ['Learning'],
            'tag_names': ['reading', 'psychology', 'cognitive-bias', 'learning']
        },
        {
            'type': 'image',
            'title': 'Sunset at the lake — photo journal',
            'content': '<p>The light was this impossible amber color, like the sky was apologizing for the whole day. Drove out to Lake Merced on a whim after the meeting.</p><p>Sometimes the best memories are the unplanned ones. No agenda, no output. Just witness.</p>',
            'ai_summary': 'Spontaneous lake visit after work producing a reflective journal entry about presence and unplanned moments.',
            'mood': 'Peaceful',
            'is_favorite': True,
            'is_pinned': False,
            'occurred_at': now - timedelta(days=3),
            'collection_names': ['Personal'],
            'tag_names': ['personal', 'nature', 'reflection', 'photography']
        }
    ]

    for m_data in memories_data:
        mem = Memory.objects.create(
            user=user,
            type=m_data['type'],
            title=m_data['title'],
            content=m_data['content'],
            ai_summary=m_data['ai_summary'],
            mood=m_data['mood'],
            is_favorite=m_data['is_favorite'],
            is_pinned=m_data['is_pinned'],
            occurred_at=m_data['occurred_at'],
            deleted_at=m_data.get('deleted_at')
        )
        
        # Add collections
        for c_name in m_data['collection_names']:
            if c_name in collections:
                mem.collections.add(collections[c_name])
                
        # Add tags
        for t_name in m_data['tag_names']:
            if t_name in tags:
                mem.tags.add(tags[t_name])

    # 4. Create tasks
    tasks_data = [
        {
            'title': 'Finalize Q3 strategy deck',
            'desc': 'Pull insights from the product strategy meeting into slides.',
            'priority': 'high',
            'status': 'todo',
            'due_offset': 1,
            'tags': ['work', 'strategy'],
            'subtasks': [
                ('Outline structure', True),
                ('Add chart data', False),
                ('Review with Sarah', False)
            ]
        },
        {
            'title': 'Write blog post on consciousness notes',
            'desc': 'Reflect on midnight consciousness thoughts.',
            'priority': 'medium',
            'status': 'inprogress',
            'due_offset': 3,
            'tags': ['ideas'],
            'subtasks': [
                ('Draft intro', True)
            ]
        },
        {
            'title': 'Renew gym membership',
            'desc': 'Gym subscription renewal.',
            'priority': 'low',
            'status': 'todo',
            'due_offset': -2,
            'tags': ['health'],
            'subtasks': []
        },
        {
            'title': 'Review ML course Week 3',
            'desc': 'Backprop + CNNs lecture notes and programming assignment.',
            'priority': 'medium',
            'status': 'todo',
            'due_offset': 0,
            'tags': ['learning'],
            'subtasks': [
                ('Watch lecture', False),
                ('Do problem set', False)
            ]
        },
        {
            'title': 'Plan weekend hike',
            'desc': 'Prepare trail maps and invite friends.',
            'priority': 'low',
            'status': 'done',
            'due_offset': -5,
            'tags': ['personal'],
            'subtasks': []
        },
        {
            'title': 'Prep onboarding improvements doc',
            'desc': 'Focus on user feedback and mock screens.',
            'priority': 'high',
            'status': 'inprogress',
            'due_offset': 5,
            'tags': ['work', 'product'],
            'subtasks': [
                ('List pain points', True),
                ('Sketch new flow', False)
            ]
        }
    ]

    for t_data in tasks_data:
        due = (now + timedelta(days=t_data['due_offset'])).date()
        task = Task.objects.create(
            user=user,
            title=t_data['title'],
            description=t_data['desc'],
            priority=t_data['priority'],
            status=t_data['status'],
            due_date=due
        )
        
        # Add tags
        for t_name in t_data['tags']:
            if t_name in tags:
                task.tags.add(tags[t_name])
                
        # Add subtasks
        for sub_text, sub_done in t_data['subtasks']:
            Subtask.objects.create(task=task, text=sub_text, is_done=sub_done)

    # 5. Create calendar events
    events_data = [
        ('Design sync', 0, '10:00', '#3B82F6'),
        ('Therapy session', 2, '17:30', '#EC4899'),
        ('Team standup', 1, '09:00', '#F97316'),
        ('Yoga class', 4, '07:00', '#10B981'),
    ]
    for title, offset, time_str, color in events_data:
        date = (now + timedelta(days=offset)).date()
        CalendarEvent.objects.create(
            user=user,
            title=title,
            date=date,
            time=timezone.datetime.strptime(time_str, '%H:%M').time(),
            color=color
        )

    # 6. Create notifications
    Notification.objects.create(
        user=user,
        type='insight',
        message='AI Insight generated: Your productivity peaked on Tuesday with 4 notes captured. Most notes pertain to "Work".'
    )
    Notification.objects.create(
        user=user,
        type='digest',
        message='Daily Digest: You have 1 task due today: "Review ML course Week 3".'
    )
