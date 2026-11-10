"""Build static pages using Python 3 standard library: python scripts/build.py."""
from pathlib import Path
import json,re
from publication_metadata import date_index,sort_groups
from openlab_content import research_page,home_highlights
from email_privacy import protect_public_emails
root=Path(__file__).resolve().parents[1]
groups=sort_groups(json.loads((root/'data/publications.json').read_text(encoding='utf-8')),date_index(root))
openlab=json.loads((root/'data/openlab.json').read_text(encoding='utf-8'))
old='http://selab.gnu.ac.kr/index.php'
def page(title,body,section=None):
 section=section or title
 nav=''.join(f'<a href="{url}"'+(' aria-current="page"' if label==section else '')+f'>{label}</a>' for label,url in [('Home','index.html'),('Research & Lab','research.html'),('Members','members.html'),('Publications','publications.html'),('News','news.html'),('Gallery','gallery.html')])
 markup=f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Software Evolution and Architecture Lab, Gyeongsang National University"><title>{title} — Software Evolution and Architecture Lab</title><link rel="stylesheet" href="styles.css"><link rel="stylesheet" href="refinements.css"><link rel="stylesheet" href="openlab.css"></head>
<body id="top" class="page-{'research' if section=='Research & Lab' else section.lower()}"><a class="skip" href="#main">Skip to content</a><div class="site"><header><a class="brand" href="index.html"><span class="brand-identity"><img class="brand-logo" src="assets/branding/sea-lab-wordmark.png" width="1149" height="360" alt="SEA LAB — Software Evolution and Architecture Lab"><span class="brand-university">GYEONGSANG NATIONAL UNIVERSITY</span></span></a><form action="search.html" role="search"><label class="sr" for="header-search">Search publications</label><input id="header-search" name="q" type="search" placeholder="논문 검색"><button>Search</button></form><a class="manage-link" href="admin/">로그인 ↗</a></header><nav aria-label="Main navigation">{nav}</nav><div class="layout"><main id="main"><h1>{title}</h1>{body}<p id="language-note" class="language-note" data-i18n="languageNote">Paper titles, citations and member-written biographies are shown in their original language.</p><div class="breadcrumb">You are here: <a href="index.html">Home</a>{' / '+title if title!='Home' else ''}</div></main></div><footer><span class="footer-identity"><img src="assets/branding/sea-lab-wordmark.png" width="1149" height="360" alt="SEA LAB" loading="lazy"><span>© Software Evolution and Architecture Lab</span></span><a href="#top">Back to Top ↑</a></footer></div><script type="module" src="site.js"></script><script type="module" src="public-content.js"></script></body></html>'''
 markup=markup.replace('>Gallery</a>',' translate="no" class="notranslate">Gallery</a>').replace('<h1>Gallery</h1>','<h1 translate="no" class="notranslate">Gallery</h1>').replace(' / Gallery</div>',' / <span translate="no" class="notranslate">Gallery</span></div>')
 return protect_public_emails(markup)
home_content=(root/'data/home.html').read_text(encoding='utf-8')
first,separator,rest=home_content.partition('</div>')
home='<div id="cloud-home"><div class="home-brand-banner">'+first+separator+'</div>'+rest+'</div>'+home_highlights(openlab)
(root/'index.html').write_text(page('Home',home),encoding='utf-8')
(root/'research.html').write_text(page('Research & Lab',research_page(openlab)),encoding='utf-8')
intro='<p data-i18n="publicationIntro">Publications by SEA Lab members and Professor Seonah Lee, including earlier work.</p><p><a href="https://saleese.github.io/publications/" data-i18n="publicationSource">Professor Lee’s publication list ↗</a></p>'
body=intro
types=['international-journals','international-conferences','domestic-journals','domestic-conferences']
body+='<div class="category-links">'+''.join(f'<a data-category-index="{i}" href="search.html?type={types[i]}">{g["category"]} ({len(g["items"])})</a>' for i,g in enumerate(groups))+'</div>'
for i,g in enumerate(groups): body+=f'<section class="publication-group" id="category-{i}"><h2>{g["category"]}</h2><ul class="publications">'+''.join(f'<li id="publication-{i}-{j}"><div class="paper-citation">'+x+'</div></li>' for j,x in enumerate(g['items']))+'</ul></section>'
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
<div class="paper-search-filters"><div><label for="research-filter">연구 분야</label><select id="research-filter"><option value="all">전체 분야</option><option value="SE">SE · 소프트웨어공학</option><option value="AI">AI · 인공지능</option><option value="AERO">AERO · 항공우주공학</option><option value="unclassified">미분류</option></select></div><div><label for="publication-type-filter">게재 유형</label><select id="publication-type-filter"><option value="all">전체 유형</option><option value="international-journals">국제학술지</option><option value="international-conferences">국제학회</option><option value="domestic-journals">국내학술지</option><option value="domestic-conferences">국내학회</option></select></div><button id="reset-search-filters" type="button">필터 초기화</button></div>
<p id="search-summary" role="status" aria-live="polite"></p><p id="search-data-status" class="search-help" role="status"></p>
<p id="search-hint">검색어를 입력하거나 연구 분야·게재 유형을 선택하세요. 논문을 한 편씩 표시합니다.</p>
<div id="search-results" hidden>
<section id="publication-results" class="search-result-section" aria-labelledby="publication-results-title"><h2 id="publication-results-title">Publications · 논문 <small id="publication-result-count"></small></h2><p id="publication-no-results" hidden>일치하는 논문이 없습니다.</p><ul id="publication-search-list" class="search-result-list"></ul></section>
</div>'''
(root/'search.html').write_text(page('논문 검색',search_body,'Search').replace('<script type="module" src="public-content.js"></script>','<script type="module" src="search.js"></script>'),encoding='utf-8')
print('Built publication search')

for title,path,description,kind in [('News','news.html','연구실의 소식과 활동을 전합니다.','news'),('Gallery','gallery.html','함께 연구하고 성장하는 연구실의 순간들입니다.','gallery')]:
 body='<p class="collection-intro" data-i18n="'+kind+'Intro">'+description+'</p><p id="collection-status" role="status">등록된 게시물을 불러오는 중입니다…</p><div id="collection-items" class="'+kind+'-grid"></div>'
 if kind=='gallery':
  body='<section class="gallery-intro"><p id="gallery-kicker" class="eyebrow">LIFE AT SEA LAB</p><h2 id="gallery-heading"></h2><p id="gallery-description"></p><div class="gallery-intro-mark" aria-hidden="true">SE × AI × AERO</div></section><div class="gallery-toolbar"><div><label id="gallery-search-label" for="gallery-search">Search albums</label><input id="gallery-search" type="search"></div><div><label id="gallery-year-label" for="gallery-year">Year</label><select id="gallery-year"></select></div></div><p id="collection-status" role="status"></p><div id="collection-items" class="event-album-grid"></div><section id="gallery-empty" hidden><span aria-hidden="true">▧</span><h2 id="gallery-empty-title"></h2><p id="gallery-empty-body"></p></section><dialog id="gallery-album" aria-labelledby="album-title"><button id="album-close" type="button">Close album</button><h2 id="album-title"></h2><p id="album-date"></p><p id="album-caption"></p><div id="album-photos"></div></dialog><dialog id="gallery-viewer" aria-labelledby="viewer-title"><button id="viewer-close" type="button">Close photo</button><img id="viewer-image" alt=""><h2 id="viewer-title"></h2><p id="viewer-caption"></p><div class="viewer-controls"><button id="viewer-prev" type="button">Previous</button><span id="viewer-position" aria-live="polite"></span><button id="viewer-next" type="button">Next</button></div></dialog>'

 (root/path).write_text(page(title,body).replace('<script type="module" src="public-content.js"></script>','<script type="module" src="'+('gallery-public.js' if kind=='gallery' else 'collections-public.js')+'"></script>'),encoding='utf-8')
