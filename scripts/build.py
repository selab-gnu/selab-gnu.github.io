"""Build static pages using Python 3 standard library: python scripts/build.py."""
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
groups=json.loads((root/'data/publications.json').read_text(encoding='utf-8'))
old='http://selab.gnu.ac.kr/index.php'
def page(title,body,section=None):
 section=section or title
 nav=''.join(f'<a href="{url}"'+(' aria-current="page"' if label==section else '')+f'>{label}</a>' for label,url in [('Home','index.html'),('Members','members.html'),('Publications','publications.html'),('Courses','courses.html'),('Tools','tools.html')])
 return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Software Evolution and Architecture Lab, Gyeongsang National University"><title>{title} — Software Evolution and Architecture Lab</title><link rel="stylesheet" href="styles.css"></head>
<body id="top"><a class="skip" href="#main">Skip to content</a><div class="site"><header><a class="brand" href="index.html">Software Evolution and Architecture Lab</a><form action="publications.html" role="search"><label class="sr" for="header-search">Search publications</label><input id="header-search" name="q" type="search" placeholder="Search publications…"><button>Search</button></form></header><nav aria-label="Main navigation">{nav}</nav><div class="layout"><main id="main"><h1>{title}</h1>{body}<div class="breadcrumb">You are here: <a href="index.html">Home</a>{' / '+title if title!='Home' else ''}</div></main><aside><section><h2>Latest Articles</h2><ul><li><a href="courses-ai4se.html">AI4SE</a></li><li><a href="courses-software-architecture.html">Software Architecture Design, Spring 2019</a></li><li><a href="courses-object-oriented-programming-basic.html">Data Structure and Algorithm, 2020</a></li><li><a href="courses-software-engineering.html">Software Engineering, Fall 2018</a></li><li><a href="tools-11-artm-agile-requirement-traceability-matrix.html">ARTM: Agile Requirement Traceability Matrix</a></li></ul></section></aside></div><footer><span>© Software Evolution and Architecture Lab</span><a href="#top">Back to Top ↑</a></footer></div><script src="site.js" defer></script></body></html>'''
home=(root/'data/home.html').read_text(encoding='utf-8')
(root/'index.html').write_text(page('Home',home),encoding='utf-8')
intro='<p>We only list the publications since 2016. If you want to see the previous ones, please refer to <a href="https://saleese.github.io/">saleese.com</a>.</p>'
body=intro+'<div class="filter"><label for="filter">Find a publication</label><input id="filter" type="search" placeholder="Title, author, year…"><p id="result" role="status" aria-live="polite">110 publications</p></div>'
body+='<div class="category-links">'+''.join(f'<a href="#category-{i}">{g["category"]}</a>' for i,g in enumerate(groups))+'</div>'
for i,g in enumerate(groups): body+=f'<section class="publication-group" id="category-{i}"><h2>{g["category"]}</h2><ul class="publications">'+''.join('<li>'+x+'</li>' for x in g['items'])+'</ul></section>'
body+='<p id="empty" hidden>No publications match your search.</p>'
(root/'publications.html').write_text(page('Publications',body),encoding='utf-8')
print('Built Home and Publications:',sum(len(g['items']) for g in groups),'entries')

sections=json.loads((root/'data/sections.json').read_text(encoding='utf-8'))
course_links='<div class="course-menu"><h2>Courses</h2><ul>'+''.join('<li><a href="'+p['path']+'">'+p['title']+'</a></li>' for p in sections if p['section']=='Courses' and p['path']!='courses.html')+'</ul></div>'
for item in sections:
 content=item['html']
 if item['section']=='Courses':content=course_links+content
 (root/item['path']).write_text(page(item['title'], '<div class="imported-content">'+content+'</div>',item['section']),encoding='utf-8')
print('Built',len(sections),'additional pages')
