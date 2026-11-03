"""Hide plain contact addresses in generated pages, keeping editable source data intact."""
import base64
import html
import re
from urllib.parse import unquote

ADDRESS=re.compile(r'[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}',re.I)

def contact(address):
    user,domain=address.split('@')
    user_token=base64.b64encode(user.encode('ascii')).decode('ascii')
    domain_token=base64.b64encode(domain.encode('ascii')).decode('ascii')
    return '<span class="email-contact" data-email-user="'+user_token+'" data-email-domain="'+domain_token+'">Email</span>'

def protect_public_emails(markup):
    def link(match):
        address=unquote(html.unescape(match.group(1))).split('?')[0]
        return contact(address) if ADDRESS.fullmatch(address) else match.group(0)
    markup=re.sub(r'<a\b[^>]*href=["\']mailto:([^"\']+)["\'][^>]*>.*?</a>',link,markup,flags=re.I|re.S)
    return ADDRESS.sub(lambda match:contact(match.group(0)),markup)
