from html.parser import HTMLParser
from html import unescape
from pathlib import Path
import json,re,unicodedata,difflib,sys
sys.stdout.reconfigure(encoding='utf-8')
BASE=Path(__file__).resolve().parent
class Node:
 def __init__(self,tag='',attrs=(),parent=None):self.tag=tag;self.attrs=dict(attrs);self.children=[];self.parent=parent
 def text(self):return ' '.join(c.text() if isinstance(c,Node) else c for c in self.children)
 def all(self,tag=None,cls=None,**attrs):
  result=[]
  for c in self.children:
   if isinstance(c,Node):
    if (not tag or c.tag==tag) and (not cls or cls in c.attrs.get('class','').split()) and all(c.attrs.get(k)==v for k,v in attrs.items()):result.append(c)
    result.extend(c.all(tag,cls,**attrs))
  return result
class Parser(HTMLParser):
 def __init__(self,source):super().__init__(convert_charrefs=True);self.root=Node();self.current=self.root;self.feed(source)
 def handle_starttag(self,tag,attrs):
  n=Node(tag,attrs,self.current);self.current.children.append(n)
  if tag not in {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}:self.current=n
 def handle_startendtag(self,tag,attrs):self.handle_starttag(tag,attrs);self.handle_endtag(tag)
 def handle_endtag(self,tag):
  n=self.current
  while n.parent:
   if n.tag==tag:self.current=n.parent;return
   n=n.parent
 def handle_data(self,data):self.current.children.append(data)
def plain(x):return re.sub(r'\s+',' ',unescape(x)).strip()
def norm(x):return ''.join(c for c in unicodedata.normalize('NFKC',unescape(x)).casefold() if c.isalnum())
def extract(html,category,index,source):
 n=Parser(html).root if isinstance(html,str) else html;text=plain(n.text());links=[{'text':plain(a.text()),'url':a.attrs.get('href','')}for a in n.all('a')]
 title=max((a['text'] for a in links if a['text'].lower() not in ['pdf','doi','html','link']),key=len,default='').strip(' .,;"“”')
 if not title:
  quotes=re.findall(r'["“]([^"”]+)["”]',text)
  title=max(quotes,key=len,default='')
 if not title:title=text
 years=re.findall(r'(?<!\d)(?:19|20)\d{2}(?!\d)',text)
 return {'source':source,'id':source+'-'+str(index),'category':category,'title':title,'citation':text,'years':list(dict.fromkeys(years)),'links':links}
def load():
 p=Parser((BASE/'professor.html').read_text(encoding='utf-8')).root
 area=p.all('div','publications')[0];prof=[];category='';year=''
 for node in area.children:
  if not isinstance(node,Node):continue
  if node.tag=='h2':
   if 'bibliography' in node.attrs.get('class',''):year=plain(node.text())
   else:category=plain(node.text())
  if node.tag=='ol':
   for item in node.all('li'):
    title=item.all('div','title')[0];author=item.all('div','author')[0];period=item.all('div','periodical')[0]
    r=extract(item,category,len(prof)+1,'professor');r.update(title=plain(title.text()),authors=plain(author.text()),year=year,venue=plain(period.text()),bib_id=next(n.attrs['id']for n in item.all('div')if n.attrs.get('id')));prof.append(r)
 legacy=[];article=Parser((BASE/'legacy.html').read_text(encoding='utf-8')).root.all('div',itemprop='articleBody')[0];category=''
 for n in article.children:
  if not isinstance(n,Node):continue
  if n.tag=='p' and n.all('strong'):category=plain(n.text())
  if n.tag=='ul':
   for item in [c for c in n.children if isinstance(c,Node)and c.tag=='li']:legacy.append(extract(item,category,len(legacy)+1,'legacy'))
 local=[]
 for g in json.loads((BASE.parents[1]/'data/publications.json').read_text(encoding='utf-8')):
  for item in g['items']:local.append(extract(item,g['category'],len(local)+1,'local'))
 deployed=[];page=Parser((BASE/'deployed.html').read_text(encoding='utf-8')).root
 for section in page.all('section','publication-group'):
  for item in section.all('li'):deployed.append(extract(item,plain(section.all('h2')[0].text()),len(deployed)+1,'deployed'))
 cloud=[];cp=json.loads((BASE/'cloud-selab-fe241.json').read_text(encoding='utf-8'))
 for g in cp['groups']:
  for item in g['items']:cloud.append(extract(item,g['category'],len(cloud)+1,'cloud'))
 return {'professor':prof,'legacy':legacy,'local':local,'deployed':deployed,'cloud':cloud}
def linkskey(r):return {l['url'].lower().replace('http://','https://').rstrip('/') for l in r['links'] if l['url']}
def match(a,b):
 x,y=norm(a['title']),norm(b['title'])
 if x==y:return 'normalized-title'
 if len(x)>18 and x in norm(b['citation']):return 'title-in-citation'
 if len(y)>18 and y in norm(a['citation']):return 'title-in-citation'
 if linkskey(a)&linkskey(b):return 'same-link'
 return None
if __name__=='__main__':
 sources=load();(BASE/'records.json').write_text(json.dumps(sources,ensure_ascii=False,indent=2),encoding='utf-8')
 print('COUNTS', {k:len(v)for k,v in sources.items()})
 for name in ['legacy','deployed','cloud']:
  missing=[r for r in sources[name]if not any(match(r,b)for b in sources['local'])];print('NOT LOCAL',name,len(missing));print('\n'.join(r['id']+' '+r['title']for r in missing))
 unmatched=[r for r in sources['professor']if not any(match(r,b)for b in sources['local'])]
 print('PROFESSOR UNMATCHED',len(unmatched))
 for r in unmatched:
  print(r['id'],r['bib_id'],r['year'],r['category'],r['title']);print(' DOI/LINK', [l['url']for l in r['links']]);near=sorted(sources['local'],key=lambda b:difflib.SequenceMatcher(None,norm(r['title']),norm(b['title'])).ratio(),reverse=True)[:2];print(' NEAR',[(b['id'],round(difflib.SequenceMatcher(None,norm(r['title']),norm(b['title'])).ratio(),2),b['title'])for b in near])
 print('LOCAL TITLES');print('\n'.join(r['id']+' | '+','.join(r['years'])+' | '+r['title']for r in sources['local']))
