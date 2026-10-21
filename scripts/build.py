"""Build static pages using Python 3 standard library: python scripts/build.py."""
from pathlib import Path
import json,re
root=Path(__file__).resolve().parents[1]
groups=json.loads((root/'data/publications.json').read_text(encoding='utf-8'))
old='http://selab.gnu.ac.kr/index.php'
def page(title,body,section=None):
 section=section or title
 nav=''.join(f'<a href="{url}"'+(' aria-current="page"' if label==section else '')+f'>{label}</a>' for label,url in [('Home','index.html'),('Members','members.html'),('Publications','publications.html'),('News','news.html'),('Gallery','gallery.html')])
 return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Software Evolution and Architecture Lab, Gyeongsang National University"><title>{title} — Software Evolution and Architecture Lab</title><link rel="stylesheet" href="styles.css"></head>
<body id="top" class="page-{section.lower()}"><a class="skip" href="#main">Skip to content</a><div class="site"><header><a class="brand" href="index.html"><span class="brand-mark">SEA<span>LAB</span></span><span class="brand-name">Software Evolution<br>and Architecture Lab<small>GYEONGSANG NATIONAL UNIVERSITY</small></span></a><form action="search.html" role="search"><label class="sr" for="header-search">Search publications</label><input id="header-search" name="q" type="search" placeholder="논문 검색"><button>Search</button></form><a class="manage-link" href="admin/">로그인 ↗</a></header><nav aria-label="Main navigation">{nav}</nav><div class="layout"><main id="main"><h1>{title}</h1>{body}<div class="breadcrumb">You are here: <a href="index.html">Home</a>{' / '+title if title!='Home' else ''}</div></main></div><footer><span>© Software Evolution and Architecture Lab</span><a href="#top">Back to Top ↑</a></footer></div><script src="site.js" defer></script><script type="module" src="public-content.js"></script></body></html>'''
home='<div id="cloud-home">'+(root/'data/home.html').read_text(encoding='utf-8')+'</div>'
(root/'index.html').write_text(page('Home',home),encoding='utf-8')
intro='<p>We only list the publications since 2016. If you want to see the previous ones, please refer to <a href="https://saleese.github.io/">saleese.com</a>.</p>'
body=intro+'<div class="filter"><label for="filter">Find a publication</label><input id="filter" type="search" placeholder="Title, author, year…"><p id="result" role="status" aria-live="polite">110 publications</p></div>'
body=body.replace('<p id="result"', '<div class="filter-options"><div><label for="category-filter">Category</label><select id="category-filter"><option value="all">All categories</option>'+''.join(f'<option value="category-{i}">{g["category"]}</option>' for i,g in enumerate(groups))+'</select></div><button id="clear-filter" type="button">Clear filters</button></div><p id="result"')
body+='<div class="category-links">'+''.join(f'<a href="#category-{i}">{g["category"]}</a>' for i,g in enumerate(groups))+'</div>'
for i,g in enumerate(groups): body+=f'<section class="publication-group" id="category-{i}"><h2>{g["category"]}</h2><ul class="publications">'+''.join(f'<li id="publication-{i}-{j}">'+x+'</li>' for j,x in enumerate(g['items']))+'</ul></section>'
body+='<p id="empty" hidden>No publications match your search.</p>'
(root/'publications.html').write_text(page('Publications',body),encoding='utf-8')
print('Built Home and Publications:',sum(len(g['items']) for g in groups),'entries')

sections=json.loads((root/'data/sections.json').read_text(encoding='utf-8'))
for item in sections:
 if item['section'] in ['Courses','Tools']:continue
 content=item['html'].replace('\r\n','\n')
 content=re.sub(r'<table\b', '<div class="table-scroll" role="region" aria-label="Scrollable table" tabindex="0"><table',content).replace('</table>','</table></div>')
 (root/item['path']).write_text(page(item['title'], '<div class="imported-content">'+content+'</div>',item['section']),encoding='utf-8')
print('Built',sum(item['section'] not in ['Courses','Tools'] for item in sections),'additional pages')

search_body='''<p class="search-intro">논문 제목·저자·연도로 연구실의 논문을 검색하세요.</p>
<form id="site-search-form" class="site-search-form" role="search"><label for="site-query">검색어</label><div><input id="site-query" name="q" type="search" placeholder="예: object, traceability, 저자 이름"><button type="submit">검색</button></div></form>
<p id="search-summary" role="status" aria-live="polite"></p><p id="search-data-status" class="search-help" role="status"></p>
<p id="search-hint">검색어를 입력하세요. 논문을 한 편씩 검색 결과로 표시합니다.</p>
<div id="search-results" hidden>
<section id="publication-results" class="search-result-section" aria-labelledby="publication-results-title"><h2 id="publication-results-title">Publications · 논문 <small id="publication-result-count"></small></h2><p id="publication-no-results" hidden>일치하는 논문이 없습니다.</p><ul id="publication-search-list" class="search-result-list"></ul></section>
</div>'''
(root/'search.html').write_text(page('논문 검색',search_body,'Search').replace('<script type="module" src="public-content.js"></script>','<script type="module" src="search.js"></script>'),encoding='utf-8')
print('Built publication search')

for title,path,description in [('News','news.html','연구실 소식을 준비 중입니다.'),('Gallery','gallery.html','연구실 사진을 준비 중입니다.')]:
 (root/path).write_text(page(title,'<p>'+description+'</p>'),encoding='utf-8')
