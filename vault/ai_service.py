import re
import os
import json
import math
from collections import Counter
from vault.models import Memory

# Basic Stopwords list for Python text processing
STOPWORDS = set([
    'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', "you're", "you've", "you'll", "you'd",
    'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', "she's", 'her', 'hers',
    'herself', 'it', "it's", 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which',
    'who', 'whom', 'this', 'that', "that'll", 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if',
    'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between',
    'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out',
    'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
    'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
    'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', "don't", 'should',
    "should've", 'now', 'd', 'll', 'm', 'o', 're', 've', 'y', 'ain', 'aren', "aren't", 'couldn', "couldn't",
    'didn', "didn't", 'doesn', "doesn't", 'hadn', "hadn't", 'hasn', "hasn't", 'haven', "haven't", 'isn', "isn't",
    'ma', 'mightn', "mightn't", 'mustn', "mustn't", 'needn', "needn't", 'shan', "shan't", 'shouldn', "shouldn't",
    'wasn', "wasn't", 'weren', "weren't", 'won', "won't", 'wouldn', "wouldn't"
])

def clean_html(raw_html):
    """Helper to remove HTML tags from rich text content."""
    if not raw_html:
        return ""
    cleanr = re.compile('<.*?>|&nbsp;|\n')
    cleantext = re.sub(cleanr, ' ', raw_html)
    return re.sub(' +', ' ', cleantext).strip()

def tokenize(text):
    """Tokenize and lower-case text, removing stopwords."""
    words = re.findall(r'\b\w+\b', text.lower())
    return [w for w in words if w not in STOPWORDS and len(w) > 2]

def compute_tfidf_similarity(query_tokens, doc_tokens):
    """Simple cosine similarity computed between query and doc word frequencies."""
    if not query_tokens or not doc_tokens:
        return 0.0
    
    q_counts = Counter(query_tokens)
    d_counts = Counter(doc_tokens)
    
    # Dot product
    dot_product = 0.0
    for word in q_counts:
        if word in d_counts:
            dot_product += q_counts[word] * d_counts[word]
            
    # Magnitudes
    q_magnitude = math.sqrt(sum(val ** 2 for val in q_counts.values()))
    d_magnitude = math.sqrt(sum(val ** 2 for val in d_counts.values()))
    
    if q_magnitude == 0 or d_magnitude == 0:
        return 0.0
        
    return dot_product / (q_magnitude * d_magnitude)

def generate_local_summary(title, text):
    """Fallback local Python summarizer: extracts first 1-2 sentences."""
    plain = clean_html(text)
    if not plain:
        return f"Notes on {title}."
    
    # Split text into sentences
    sentences = re.split(r'(?<=[.!?])\s+', plain)
    summary_sentences = []
    
    for s in sentences:
        s = s.strip()
        if len(s) > 15:
            summary_sentences.append(s)
            if len(summary_sentences) == 2:
                break
                
    if not summary_sentences:
        return plain[:120] + "..." if len(plain) > 120 else plain
        
    return " ".join(summary_sentences)

def generate_local_tags(title, text, category=None):
    """Fallback local tag suggestion based on keyword matches."""
    plain = (title + " " + clean_html(text)).lower()
    suggested = []
    
    keyword_mapping = {
        'work': ['work', 'meeting', 'project', 'strategy', 'roadmap', 'action', 'client', 'q3', 'q4', 'marketing', 'sprint'],
        'ideas': ['idea', 'brainstorm', 'startup', 'concept', 'innovation', 'creative', 'spark', 'thought'],
        'learning': ['learning', 'course', 'class', 'lecture', 'read', 'principles', 'notes', 'study', 'research'],
        'health': ['health', 'fitness', 'run', 'gym', 'workout', 'yoga', 'medical', 'therapy', 'sleep', 'active'],
        'travel': ['travel', 'trip', 'flight', 'hotel', 'itinerary', 'vacation', 'lake', 'explore'],
        'personal': ['personal', 'diary', 'life', 'journal', 'sunset', 'happy', 'family', 'reflection'],
        'finance': ['finance', 'budget', 'expense', 'invoice', 'cost', 'money', 'saving', 'price'],
        'ai': ['ai', 'intelligence', 'rag', 'llm', 'claude', 'openai', 'model', 'embeddings', 'machine']
    }
    
    for tag_name, keywords in keyword_mapping.items():
        for kw in keywords:
            if kw in plain:
                suggested.append(tag_name)
                break
                
    # Default tags if nothing matches
    if not suggested:
        suggested = ['general', 'notes']
        
    return suggested[:4]

# --- Real LLM Connections ---

def query_claude(prompt, max_tokens=300):
    """Query Anthropic Claude model if API key is present."""
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        return None
    try:
        import urllib.request
        
        url = "https://api.anthropic.com/v1/messages"
        headers = {
            "Content-Type": "application/json",
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01"
        }
        
        data = {
            "model": "claude-3-5-sonnet-20241022",
            "max_tokens": max_tokens,
            "messages": [
                {"role": "user", "content": prompt}
            ]
        }
        
        req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=10) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            return res_data['content'][0]['text'].strip()
    except Exception as e:
        print(f"Error querying Anthropic Claude: {e}")
        return None

# --- Main API wrappers ---

def get_ai_summary(title, content, user=None):
    # Check profile settings
    if user and hasattr(user, 'profile'):
        if not user.profile.ai_preferences.get('auto_summarize', True):
            return ""

    plain_content = clean_html(content)
    prompt = f"Generate a concise 1-2 sentence summary for this memory:\n\nTitle: {title}\n\nContent: {plain_content}\n\nReturn ONLY the summary, no quotes, no preamble."
    
    summary = query_claude(prompt, max_tokens=150)
    if summary:
        return summary
    return generate_local_summary(title, content)

def get_ai_tags(title, content, category=None, user=None):
    # Check profile settings
    if user and hasattr(user, 'profile'):
        if not user.profile.ai_preferences.get('ai_tagging', True):
            return []

    plain_content = clean_html(content)
    prompt = f"Generate 3-5 relevant lowercase tags (single words or hyphenated) for this memory:\n\nTitle: {title}\nCategory: {category}\nContent: {plain_content}\n\nReturn ONLY a JSON array of tag strings, e.g. [\"tag1\",\"tag2\",\"tag3\"]. No other text."
    
    res = query_claude(prompt, max_tokens=100)
    if res:
        try:
            cleaned = re.sub(r'```json|```', '', res).strip()
            return json.loads(cleaned)
        except Exception:
            pass
            
    return generate_local_tags(title, content, category)

def get_rag_chat_response(query, user, conversation=None):
    """Performs semantic RAG search over SQLite memories and returns answer + citations."""
    query_tokens = tokenize(query)
    
    # 1. Search database
    # prefetch_related('tags') so the tag-overlap boost below (which reads
    # mem.tags.all() once per memory) doesn't issue a separate query for
    # every memory in the vault — was N+1 on every chat message sent.
    pool = Memory.objects.filter(user=user, deleted_at__isnull=True).prefetch_related('tags')
    similarities = []
    
    for mem in pool:
        doc_tokens = tokenize(mem.title + " " + clean_html(mem.content))
        sim = compute_tfidf_similarity(query_tokens, doc_tokens)
        
        # Add boost for tag overlap
        tag_match_count = sum(1 for t in mem.tags.all() if t.name.lower() in query_tokens)
        if tag_match_count > 0:
            sim += (tag_match_count * 0.1)
            
        if sim > 0.02:
            similarities.append((mem, sim))
            
    # Sort by similarity score descending
    similarities.sort(key=lambda x: x[1], reverse=True)
    top_matches = [item[0] for item in similarities[:4]]
    
    citations = top_matches # The referenced memories list
    
    # 2. Build RAG response
    if os.environ.get("ANTHROPIC_API_KEY"):
        # Format context for LLM
        context_items = []
        for m in top_matches:
            context_items.append(f"Memory Title: {m.title}\nType: {m.get_type_display()}\nContent: {clean_html(m.content)}")
        
        context_str = "\n---\n".join(context_items)
        tone = getattr(user, 'profile', None) and user.profile.ai_preferences.get('ai_tone', 'concise')
        tone_instruction = {
            'concise':        'Answer in 1-3 short sentences. Be direct, no fluff.',
            'conversational': 'Answer in a warm, conversational tone, as a helpful friend would.',
            'detailed':       'Answer thoroughly, with full context and specific details drawn from the memories.',
        }.get(tone, 'Answer in 1-3 short sentences. Be direct, no fluff.')
        prompt = (
            f"You are a personal AI Second Brain assistant. A user is asking: \"{query}\"\n\n"
            f"Here are the relevant retrieved memories from their history:\n{context_str}\n\n"
            f"{tone_instruction} Cite specific memories by their title when providing information. "
            f"Only speak about what is supported by their memories. If no memories are relevant or available, explain that you couldn't find any relevant memories in their database."
        )
        answer = query_claude(prompt, max_tokens=600)
        if answer:
            return answer, citations
            
    # Fallback / Local simulated response
    if not top_matches:
        answer = "I couldn't find any memories in your database that relate to your query. Try capturing a new memory or note about it first!"
        return answer, []
        
    # We construct a highly realistic response using matching memory contents
    best_match = top_matches[0]
    plain_best = clean_html(best_match.content)
    
    # Basic synthesis templates based on memory type
    if best_match.type == 'meeting':
        answer = f"Based on your meeting '**{best_match.title}**', here is what I found:\n\n"
        # Try to pull bullet points from meeting content
        bullets = re.findall(r'<li>(.*?)</li>', best_match.content)
        if bullets:
            answer += "Key decisions and details:\n" + "\n".join(f"- {b}" for b in bullets[:4])
        else:
            answer += f"{best_match.ai_summary or plain_best[:200] + '...'}"
    elif best_match.type == 'conversation':
        answer = f"According to your conversation '**{best_match.title}**':\n\n"
        answer += f"{best_match.ai_summary or plain_best[:200] + '...'}"
    else:
        answer = f"I found a memory titled '**{best_match.title}**' ({best_match.get_type_display()}) matching your question. Here is a summary of what you wrote:\n\n"
        answer += f"{best_match.ai_summary or plain_best[:250] + '...'}"
        
    # Add other matching citations mentions
    if len(top_matches) > 1:
        others = [f"**{m.title}** ({m.get_type_display()})" for m in top_matches[1:3]]
        answer += "\n\nOther connected memories: " + ", ".join(others) + "."
        
    return answer, citations


def generate_local_dashboard_insight(activity):
    """Deterministic fallback for the Dashboard AI Insight box, used when
    ANTHROPIC_API_KEY isn't configured or the API call fails (Step 15a).
    Mirrors the style of the other generate_local_* fallbacks above.
    """
    days  = activity['days']
    totals = [n + c + v for n, c, v in zip(activity['notes'], activity['conversations'], activity['voice'])]

    if not any(totals):
        return (
            "You haven't captured anything this week yet — jot down a quick "
            "note or thought to start seeing patterns here."
        )

    peak_idx   = totals.index(max(totals))
    peak_day   = days[peak_idx]
    peak_count = totals[peak_idx]

    tag_phrase = (
        f" Your most common topics lately are {', '.join(activity['top_tags'][:3])}."
        if activity['top_tags'] else ""
    )

    return (
        f"Your capturing peaked on {peak_day} with {peak_count} "
        f"{'entry' if peak_count == 1 else 'entries'}. You've logged "
        f"{activity['week_captures']} memories this week out of "
        f"{activity['total_memories']} total.{tag_phrase}"
    )


def get_dashboard_insight(activity):
    """Server-side AI Insight generator for the Dashboard's "AI Insight"
    card (Step 15a). `activity` is a plain dict — see
    views._dashboard_ai_insight_payload for its shape.

    Replaces the old client-side fetch() straight to api.anthropic.com,
    which could never work in production since it had nowhere safe to
    keep an API key.
    """
    prompt = (
        "You are a productivity insight generator for a personal memory app called MemoryVault. "
        f"Here is this user's weekly capture activity by day (Mon\u2013Sun):\n"
        f"Notes: {', '.join(map(str, activity['notes']))}\n"
        f"Conversations: {', '.join(map(str, activity['conversations']))}\n"
        f"Voice memos: {', '.join(map(str, activity['voice']))}\n"
    )
    if activity['top_tags']:
        prompt += f"Their most common tags are: {', '.join(activity['top_tags'])}. "
    prompt += (
        f"They have {activity['total_memories']} total memories, "
        f"{activity['week_captures']} captured this week, and {activity['favorites']} favorites.\n\n"
        "Write ONE short, specific, encouraging productivity insight (2-3 sentences, no preamble, "
        "no quotes) that notices a pattern in this data and gives a concrete actionable suggestion."
    )

    insight = query_claude(prompt, max_tokens=200)
    if insight:
        return insight
    return generate_local_dashboard_insight(activity)


# ---------------------------------------------------------------------------
# AI Assistant page (Step 18) — server-side implementations for the
# Categorize / Related / Duplicates / NL Search / Insights / Recap /
# Weekly Report / Recommendations tabs.
#
# These used to run entirely in the browser against a hardcoded MEMORIES
# array and call api.anthropic.com directly from client-side JS (no key
# available client-side, so it always failed in production). Every
# function below follows the same real-data + graceful-local-fallback
# pattern already used above for chat/summary/tags/dashboard insight.
# ---------------------------------------------------------------------------

def _mem_pool(user):
    """Shared queryset: a user's non-deleted memories, tags prefetched."""
    return Memory.objects.filter(user=user, deleted_at__isnull=True).prefetch_related('tags')


def get_categorization(title, content, user=None):
    """Classify a (possibly unsaved) memory's category/type."""
    plain = clean_html(content)
    prompt = (
        "Classify this memory. Categories available: Work, Personal, Ideas, Learning, Health. "
        "Types available: note, voice_memo, conversation, meeting, image, document, activity.\n\n"
        f"Title: {title}\nContent: {plain}\n\n"
        'Return ONLY JSON like {"category":"Ideas","type":"note","confidence":0.92,"reasoning":"short reason"}. '
        "No other text."
    )
    raw = query_claude(prompt, max_tokens=150)
    if raw:
        try:
            cleaned = re.sub(r'```json|```', '', raw).strip()
            parsed = json.loads(cleaned)
            if parsed.get('category') and parsed.get('type'):
                return parsed
        except Exception:
            pass

    # Local fallback — reuse the same keyword heuristic as generate_local_tags.
    tags = generate_local_tags(title, plain)
    category = 'Personal'
    if any(t in ('work', 'strategy', 'product', 'meeting') for t in tags):
        category = 'Work'
    elif any(t in ('ideas', 'startup', 'ai') for t in tags):
        category = 'Ideas'
    elif any(t in ('learning', 'reading', 'design', 'principles') for t in tags):
        category = 'Learning'
    elif any(t in ('fitness', 'health', 'running') for t in tags):
        category = 'Health'
    return {
        'category': category,
        'type': 'note',
        'confidence': 0.5,
        'reasoning': 'Estimated locally from keyword matches (AI categorization is unavailable right now).',
    }


def get_related_memories(memory, user):
    """Return up to 3 memories from the user's real library related to `memory`."""
    pool = list(_mem_pool(user).exclude(pk=memory.pk))
    if not pool:
        return []

    others = [
        {'id': m.pk, 'title': m.title, 'tags': [t.name for t in m.tags.all()], 'summary': m.ai_summary or clean_html(m.content)[:200]}
        for m in pool
    ]
    prompt = (
        f"Given this memory:\nTitle: {memory.title}\nContent: {clean_html(memory.content)[:500]}\n\n"
        f"Find the 1-3 most related memories from this list:\n{json.dumps(others)}\n\n"
        'Return ONLY a JSON array of numeric IDs, e.g. [3,7]. No other text. If none are relevant, return [].'
    )
    raw = query_claude(prompt, max_tokens=150)
    if raw:
        try:
            cleaned = re.sub(r'```json|```', '', raw).strip()
            ids = json.loads(cleaned)
            by_id = {m.pk: m for m in pool}
            return [by_id[i] for i in ids if i in by_id][:3]
        except Exception:
            pass

    # Local fallback — TF-IDF similarity against the same pool.
    query_tokens = tokenize(memory.title + " " + clean_html(memory.content))
    scored = []
    for m in pool:
        doc_tokens = tokenize(m.title + " " + clean_html(m.content))
        sim = compute_tfidf_similarity(query_tokens, doc_tokens)
        if sim > 0.02:
            scored.append((m, sim))
    scored.sort(key=lambda x: x[1], reverse=True)
    return [m for m, _ in scored[:3]]


def get_duplicate_pairs(user):
    """Scan the user's real memory library for likely duplicate pairs."""
    pool = list(_mem_pool(user))
    if len(pool) < 2:
        return []

    listing = [
        {'id': m.pk, 'title': m.title, 'summary': m.ai_summary or clean_html(m.content)[:200], 'tags': [t.name for t in m.tags.all()]}
        for m in pool
    ]
    prompt = (
        f"Here is a user's full memory library:\n{json.dumps(listing)}\n\n"
        "Identify any pairs that are likely duplicates or near-duplicates (same event/topic captured "
        "twice, heavy overlap). Be honest if there are none.\n\n"
        'Return ONLY JSON: {"pairs":[{"a":1,"b":2,"reason":"short reason","similarity":0.0-1.0}]} '
        "with pairs as an empty array if none found. IDs must be numeric. No other text."
    )
    raw = query_claude(prompt, max_tokens=400)
    if raw:
        try:
            cleaned = re.sub(r'```json|```', '', raw).strip()
            parsed = json.loads(cleaned)
            by_id = {m.pk: m for m in pool}
            pairs = []
            for p in parsed.get('pairs', []):
                a, b = by_id.get(p.get('a')), by_id.get(p.get('b'))
                if a and b:
                    pairs.append({'a': a, 'b': b, 'reason': p.get('reason', ''), 'similarity': p.get('similarity', 0)})
            return pairs
        except Exception:
            pass

    # Local fallback — flag any pair whose TF-IDF similarity is very high.
    pairs = []
    for i, m1 in enumerate(pool):
        tokens1 = tokenize(m1.title + " " + clean_html(m1.content))
        for m2 in pool[i + 1:]:
            tokens2 = tokenize(m2.title + " " + clean_html(m2.content))
            sim = compute_tfidf_similarity(tokens1, tokens2)
            if sim > 0.5:
                pairs.append({'a': m1, 'b': m2, 'reason': 'High text overlap detected locally.', 'similarity': round(sim, 2)})
    return pairs


def get_nl_search_results(query, user):
    """Natural-language search over the user's real memory library."""
    pool = list(_mem_pool(user))
    if not pool:
        return []

    listing = [
        {'id': m.pk, 'title': m.title, 'summary': m.ai_summary or clean_html(m.content)[:200], 'tags': [t.name for t in m.tags.all()], 'category': m.category}
        for m in pool
    ]
    prompt = (
        f"A user is searching their personal memory library using natural language. Library:\n{json.dumps(listing)}\n\n"
        f'Search query: "{query}"\n\n'
        "Return the IDs of matching memories ranked by relevance, even if the query doesn't use exact "
        'keywords (match by meaning). Return ONLY JSON: {"results":[{"id":1,"reason":"short reason it matches"}]}. '
        "IDs must be numeric. Empty array if nothing matches. No other text."
    )
    raw = query_claude(prompt, max_tokens=300)
    if raw:
        try:
            cleaned = re.sub(r'```json|```', '', raw).strip()
            parsed = json.loads(cleaned)
            by_id = {m.pk: m for m in pool}
            results = []
            for r in parsed.get('results', []):
                m = by_id.get(r.get('id'))
                if m:
                    results.append({'memory': m, 'reason': r.get('reason', '')})
            return results
        except Exception:
            pass

    # Local fallback — plain TF-IDF ranking, same technique as RAG chat search.
    query_tokens = tokenize(query)
    scored = []
    for m in pool:
        doc_tokens = tokenize(m.title + " " + clean_html(m.content))
        sim = compute_tfidf_similarity(query_tokens, doc_tokens)
        if sim > 0.02:
            scored.append((m, sim))
    scored.sort(key=lambda x: x[1], reverse=True)
    return [{'memory': m, 'reason': 'Matched on keyword overlap.'} for m, _ in scored[:5]]


def _usage_stats(user):
    """Real usage stats for the Insights / Recommendations tabs."""
    from django.utils import timezone
    from collections import Counter as _Counter
    import datetime as _dt

    pool = list(_mem_pool(user))
    total = len(pool)
    week_start = timezone.now() - _dt.timedelta(days=7)
    week_count = sum(1 for m in pool if m.created_at >= week_start)
    favorites = sum(1 for m in pool if m.is_favorite)

    by_type = _Counter(m.type for m in pool)
    hour_counts = _Counter(m.created_at.hour for m in pool)
    day_counts = _Counter(m.created_at.strftime('%A') for m in pool)
    tag_counts = _Counter(t.name for m in pool for t in m.tags.all())

    peak_hour = hour_counts.most_common(1)
    peak_day = day_counts.most_common(1)

    return {
        'total_memories': total,
        'week_captures': week_count,
        'favorites': favorites,
        'by_type': dict(by_type),
        'peak_hour': f"{peak_hour[0][0]:02d}:00" if peak_hour else None,
        'peak_day': peak_day[0][0] if peak_day else None,
        'top_tags': [t for t, _ in tag_counts.most_common(5)],
    }


def get_productivity_insights(user):
    """3 productivity insights based on the user's real usage stats."""
    stats = _usage_stats(user)
    if stats['total_memories'] == 0:
        return [{'title': 'Start capturing', 'detail': "You haven't saved any memories yet — capture your first one to start seeing insights here."}]

    prompt = (
        f"Analyze this personal memory app usage data and produce 3 distinct productivity insights:\n{json.dumps(stats)}\n\n"
        'Return ONLY JSON: {"insights":[{"title":"short title","detail":"1-2 sentence insight with a concrete suggestion"}]}. No other text.'
    )
    raw = query_claude(prompt, max_tokens=400)
    if raw:
        try:
            cleaned = re.sub(r'```json|```', '', raw).strip()
            parsed = json.loads(cleaned)
            if parsed.get('insights'):
                return parsed['insights']
        except Exception:
            pass

    # Local fallback — deterministic sentences built from the real stats.
    insights = []
    if stats['peak_day']:
        insights.append({'title': 'Peak capture day', 'detail': f"You capture the most memories on {stats['peak_day']}, out of {stats['total_memories']} total."})
    if stats['by_type']:
        top_type = max(stats['by_type'], key=stats['by_type'].get)
        insights.append({'title': 'Favorite format', 'detail': f"Most of your memories are logged as \"{top_type}\" entries — try mixing in another format for variety."})
    if stats['top_tags']:
        insights.append({'title': 'Recurring themes', 'detail': f"Your most common tags are {', '.join(stats['top_tags'][:3])}. Consider grouping these into a collection."})
    if not insights:
        insights.append({'title': 'Keep it up', 'detail': f"You've captured {stats['total_memories']} memories so far — keep the habit going."})
    return insights


def get_daily_recap(user):
    """Warm recap of the memories captured today."""
    from django.utils import timezone
    today = timezone.localdate()
    todays = [m for m in _mem_pool(user) if timezone.localtime(m.created_at).date() == today]
    if not todays:
        return "You haven't captured anything today yet — jot down a quick note to see it here."

    listing = "\n".join(f"- ({m.type}) \"{m.title}\": {m.ai_summary or clean_html(m.content)[:150]}" for m in todays[:8])
    prompt = (
        "Write a warm, brief daily recap (3-4 sentences) for a personal memory app, summarizing the "
        f"memories someone captured today:\n{listing}\n\n"
        "Mention specific titles naturally. No preamble, no headers — just the recap text."
    )
    recap = query_claude(prompt, max_tokens=250)
    if recap:
        return recap

    titles = ", ".join(f'"{m.title}"' for m in todays[:5])
    return f"Today you captured {len(todays)} {'memory' if len(todays) == 1 else 'memories'}: {titles}."


def get_weekly_report(user):
    """Structured weekly report from the memories captured in the last 7 days."""
    from django.utils import timezone
    import datetime as _dt
    week_start = timezone.now() - _dt.timedelta(days=7)
    weeks = [m for m in _mem_pool(user) if m.created_at >= week_start]
    if not weeks:
        return "No memories were captured in the last 7 days — this week's report will fill in once you start logging again."

    listing = "\n".join(f"- ({m.category}/{m.type}) \"{m.title}\": {m.ai_summary or clean_html(m.content)[:150]}" for m in weeks[:15])
    prompt = (
        "Write a structured weekly report for a personal memory app user, based on this week's "
        f"captured memories:\n{listing}\n\n"
        'Include: a one-line headline, 3 short bullet-style highlights (use "- " prefix), and one '
        "forward-looking suggestion for next week. Plain text only, no markdown headers, no asterisks."
    )
    report = query_claude(prompt, max_tokens=500)
    if report:
        return report

    lines = [f"This week you captured {len(weeks)} {'memory' if len(weeks) == 1 else 'memories'}."]
    for m in weeks[:3]:
        lines.append(f"- \"{m.title}\" ({m.category})")
    lines.append("Keep logging regularly to build a richer picture next week.")
    return "\n".join(lines)


def get_recommendations(user):
    """Concrete, actionable recommendations based on the user's real library."""
    stats = _usage_stats(user)
    pool = list(_mem_pool(user))
    if not pool:
        return [{'icon': 'sparkles', 'title': 'Capture your first memory', 'detail': 'Add a note, voice memo, or photo to start getting personalized recommendations.'}]

    listing = [{'title': m.title, 'category': m.category, 'tags': [t.name for t in m.tags.all()]} for m in pool]
    prompt = (
        f"Based on this user's memory library:\n{json.dumps(listing)}\n\n"
        "Suggest 3 concrete, actionable recommendations for how they could better use a personal "
        "memory app (e.g. collections to create, habits to build, connections to revisit). "
        'Return ONLY JSON: {"recs":[{"icon":"folders|tag|bell|star|sparkles","title":"short title","detail":"1 sentence action"}]}. No other text.'
    )
    raw = query_claude(prompt, max_tokens=400)
    if raw:
        try:
            cleaned = re.sub(r'```json|```', '', raw).strip()
            parsed = json.loads(cleaned)
            if parsed.get('recs'):
                return parsed['recs']
        except Exception:
            pass

    # Local fallback — generic but data-driven recommendations.
    recs = []
    if stats['top_tags']:
        recs.append({'icon': 'folders', 'title': 'Create a collection', 'detail': f"Group your \"{stats['top_tags'][0]}\" memories into a collection for quick access."})
    if stats['favorites'] == 0:
        recs.append({'icon': 'star', 'title': 'Star your favorites', 'detail': 'Mark the memories that matter most as favorites so they surface faster.'})
    else:
        recs.append({'icon': 'star', 'title': 'Revisit favorites', 'detail': f"You have {stats['favorites']} favorites — revisit one this week."})
    recs.append({'icon': 'bell', 'title': 'Build a capture habit', 'detail': 'Set a daily reminder to log at least one memory, even a short one.'})
    return recs[:3]
