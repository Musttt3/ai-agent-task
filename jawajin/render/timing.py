import json, os, re
_R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_d = json.load(open(os.path.join(_R, 'work', 'transcript.json')))
WORDS = [w for w in _d['words'] if w['type'] == 'word']
SENT = json.load(open(os.path.join(_R, 'work', 'sentences.json')))
def norm(s): return re.sub(r'[^a-z0-9%-]', '', s.lower())
def S(i): return SENT[i]['start']
def E(i): return SENT[i]['end']
def w(word, after=0.0, end=False):
    """start (or end) time of first word matching `word` (prefix match) at/after `after`"""
    key = norm(word)
    for x in WORDS:
        if x['start'] >= after - 1e-6 and norm(x['text']).startswith(key):
            return x['end'] if end else x['start']
    raise KeyError(f'{word} after {after}')
DURATION = 541.231
