"""
SignConnect AI - Text to Sign Language Service
Converts natural language input into Indian Sign Language (ISL) token structures,
matching vocabulary phrases, numbers, and fallback fingerspelling sequences.
"""

import re
from database import query_db


def process_text_to_sign_sequence(text: str):
    """
    Process input text into an ordered sequence of sign demonstrations.
    """
    if not text:
        return {
            'success': False,
            'message': 'No text provided for conversion.',
            'tokens': [],
            'signs': []
        }

    raw_text = text.strip().upper()
    clean_text = re.sub(r'[^A-Z0-9\s]', ' ', raw_text)
    words = clean_text.split()

    if not words:
        return {
            'success': False,
            'message': 'No valid words found in input text.',
            'tokens': [],
            'signs': []
        }

    # Fetch all available signs from MySQL database
    db_lessons = query_db("SELECT id, title, category, sign, description, image_path, two_handed, pronunciation FROM lessons")
    lesson_map = {l['id'].lower(): l for l in db_lessons}
    # Also map by uppercase sign label
    label_map = {l['sign'].upper(): l for l in db_lessons}

    tokens = []
    i = 0

    while i < len(words):
        # 1. Check 3-4 word phrases
        three_words = " ".join(words[i:i+3])
        four_words = " ".join(words[i:i+4])

        if four_words == "WHAT IS YOUR NAME" or three_words == "WHAT IS YOUR":
            sign_match = lesson_map.get('what_is_your_name')
            tokens.append({
                'type': 'phrase',
                'label': 'WHAT IS YOUR NAME?',
                'supported': True,
                'sign': sign_match
            })
            i += 4 if four_words == "WHAT IS YOUR NAME" else 3
            continue

        # 2. Check 2-word phrases
        two_words = " ".join(words[i:i+2])
        if two_words == "GOOD MORNING":
            sign_match = lesson_map.get('good_morning')
            tokens.append({
                'type': 'phrase',
                'label': 'GOOD MORNING',
                'supported': True,
                'sign': sign_match
            })
            i += 2
            continue

        if two_words == "THANK YOU":
            sign_match = lesson_map.get('thank_you')
            tokens.append({
                'type': 'phrase',
                'label': 'THANK YOU',
                'supported': True,
                'sign': sign_match
            })
            i += 2
            continue

        if two_words in ("HOW ARE", "HOW ARE YOU"):
            sign_match = lesson_map.get('how_are_you')
            tokens.append({
                'type': 'phrase',
                'label': 'HOW ARE YOU?',
                'supported': True,
                'sign': sign_match
            })
            i += 3 if (i+2 < len(words) and words[i+2] == "YOU") else 2
            continue

        # 3. Check single word exact match
        curr_word = words[i]
        curr_word_lower = curr_word.lower()
        sign_match = lesson_map.get(curr_word_lower) or label_map.get(curr_word)

        if sign_match:
            tokens.append({
                'type': 'word',
                'label': sign_match['sign'].upper(),
                'supported': True,
                'sign': sign_match
            })
        else:
            # 4. Fallback to ISL Fingerspelling for vocabulary not directly in the dictionary
            letters = []
            for ch in curr_word:
                ch_lower = ch.lower()
                char_sign = lesson_map.get(ch_lower)
                letters.append({
                    'type': 'letter',
                    'label': ch,
                    'supported': bool(char_sign),
                    'sign': char_sign
                })
            tokens.append({
                'type': 'fingerspell',
                'label': curr_word,
                'supported': False,
                'letters': letters
            })

        i += 1

    # Flatten into final display sequence
    flattened_sequence = []
    step = 1
    for t in tokens:
        if t['supported'] and t['sign']:
            s = t['sign']
            flattened_sequence.append({
                'step': step,
                'type': t['type'],
                'label': t['label'],
                'sign_id': s['id'],
                'title': s['title'],
                'category': s['category'],
                'image_path': s['image_path'],
                'two_handed': bool(s['two_handed']),
                'pronunciation': s.get('pronunciation', ''),
                'animation_ready': True,
                'animation_url': None  # Prepared for future 3D avatar / video integration
            })
            step += 1
        elif 'letters' in t:
            for l in t['letters']:
                if l['sign']:
                    ls = l['sign']
                    flattened_sequence.append({
                        'step': step,
                        'type': 'letter',
                        'label': f"Letter {l['label']}",
                        'sign_id': ls['id'],
                        'title': ls['title'],
                        'category': ls['category'],
                        'image_path': ls['image_path'],
                        'two_handed': bool(ls['two_handed']),
                        'pronunciation': ls.get('pronunciation', ''),
                        'fingerspelled_from': t['label'],
                        'animation_ready': True,
                        'animation_url': None
                    })
                    step += 1

    return {
        'success': True,
        'input_text': text,
        'token_count': len(tokens),
        'demonstration_steps': len(flattened_sequence),
        'tokens': tokens,
        'sequence': flattened_sequence,
        'has_unsupported_words': any(not t['supported'] for t in tokens),
        'message': 'Text successfully transformed to Indian Sign Language sequence.'
    }
