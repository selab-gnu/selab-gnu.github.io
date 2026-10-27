"""Date ordering shared by static generation and the publication data update."""
import json
import re
import unicodedata
from html.parser import HTMLParser
from pathlib import Path


class Text(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.parts = []
        self.feed(source)

    def handle_data(self, value):
        self.parts.append(value)


def citation_key(source):
    return ''.join(c for c in unicodedata.normalize('NFKC', ''.join(Text(source).parts)).lower() if c.isalnum())


def date_index(root):
    source = json.loads((Path(root) / 'data/publication-tags.json').read_text(encoding='utf-8'))
    return {citation_key(entry['html']): entry['date'] for entry in source['entries'] if entry.get('date')}


def sort_groups(groups, index):
    def date_of(source):
        known = index.get(citation_key(source))
        if known:
            return tuple(int(part) for part in known.split('-')) + (0,) * (3 - len(known.split('-')))
        text = ''.join(Text(source).parts)
        text = re.sub(r'^\s*\[[^\]]*(?:award|우수|최우수|수상)[^\]]*\]', '', text, flags=re.I)
        text = re.sub(r'https?://\S+', '', text)
        return (max(map(int, re.findall(r'(?<!\d)(?:19|20)\d{2}(?!\d)', text)), default=0), 0, 0)
    return [{**group, 'items': sorted(group['items'], key=date_of, reverse=True)} for group in groups]
