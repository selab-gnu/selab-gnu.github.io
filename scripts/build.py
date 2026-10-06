"""Build the lab website with Python 3; no third-party dependencies."""
from pathlib import Path
from html import escape
import json,re

ROOT=Path(__file__).resolve().parents[1]
groups=json.loads((ROOT/'data/publications.json').read_text(encoding='utf-8'))
sections=json.loads((ROOT/'data/sections.json').read_text(encoding='utf-8'))
total=sum(len(g['items']) for g in groups)
navigation=[('Home','index.html'),('Members','members.html'),('Publications','publications.html'),('Courses','courses.html'),('Tools','tools.html')]

def page(title,body,section='Home',description=''):
 nav=''.join(f'<a href="{url}"'+(' aria-current="page"' if label==section else '')+f'>{label}</a>' for label,url in navigation)
 crumbs='<a href="index.html">Home</a>'+(f'<span aria-hidden="true">/</span><span>{escape(title)}</span>' if section!='Home' else '')
 heading='' if section=='Home' else f'<div class="page-heading"><p class="eyebrow">SEA LAB / {section.upper()}</p><h1>{escape(title)}</h1><p class="lede">{description}</p></div>'
 return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Software Evolution and Architecture Lab at Gyeongsang National University. Explore our people, publications, courses and research tools."><meta name="theme-color" content="#163b38"><title>{escape(title)} — SEA Lab</title><link rel="stylesheet" href="styles.css"></head>
<body id="top"><a class="skip" href="#main">Skip to content</a><header class="site-header"><div class="header-inner"><a class="brand" href="index.html" aria-label="SEA Lab home"><span class="brand-mark" aria-hidden="true">SEA<span>LAB</span></span><span class="brand-name">Software Evolution<br>and Architecture Lab<span class="university">Gyeongsang National University</span></span></a><button class="menu-toggle" aria-expanded="false" aria-controls="main-nav" hidden>Menu <span aria-hidden="true">☰</span></button><nav id="main-nav" aria-label="Main navigation">{nav}</nav></div></header>
<main id="main" class="shell"><nav class="breadcrumb" aria-label="Breadcrumb">{crumbs}</nav>{heading}{body}</main>
<footer class="site-footer"><div class="shell footer-inner"><div><strong>SEA Lab</strong><p>Software Evolution and Architecture Lab<br>Gyeongsang National University · Jinju, Korea</p></div><div class="footer-links"><a href="members.html">People &amp; contact</a><a href="publications.html">Publications</a><a href="#top">Back to top ↑</a></div><p class="login-status">Member login · Coming soon</p></div></footer><script src="site.js" defer></script></body></html>'''

def cards(items):
 return '<div class="resource-grid">'+''.join(f'<a class="resource-card" href="{x[0]}"><span class="eyebrow">{x[1]}</span><h3>{escape(x[2])}</h3><span class="card-bottom">{x[3]} <span aria-hidden="true">↗</span></span></a>' for x in items)+'</div>'

home=(ROOT/'data/home.html').read_text(encoding='utf-8')
home=re.sub(r'<h3>(.*?)</h3>',r'<h2>\1</h2>',home)
hero='''<section class="hero"><div class="hero-copy"><p class="eyebrow">GYEONGSANG NATIONAL UNIVERSITY</p><h1>Software evolves.<br><em>We study how.</em></h1><p class="hero-description">Software Evolution and Architecture Lab</p><p>Exploring software evolution through software architecture.</p><div class="hero-actions"><a class="button primary" href="publications.html">Explore publications <span aria-hidden="true">↗</span></a><a class="button secondary" href="members.html">Meet the lab</a></div></div><div class="hero-art" aria-hidden="true"><div class="art-label">SOFTWARE / STRUCTURE / EVOLUTION</div><div class="architecture"><span class="node n1">Code</span><span class="node n2">Architecture</span><span class="node n3">Evolution</span><i class="orbit o1"></i><i class="orbit o2"></i><i class="orbit o3"></i></div><div class="art-caption">SEA LAB <span>Since 2016</span></div></div></section>'''
quick=cards([('publications.html','01 / RESEARCH','Publications',f'{total} listed publications'),('members.html','02 / PEOPLE','Our members','People & contact'),('courses.html','03 / LEARNING','Courses','Teaching & course materials'),('tools.html','04 / RESOURCES','Research tools','Software & project resources')])
body=hero+'<section class="explore"><div class="section-heading"><h2>Explore the lab</h2><span>People, research and resources</span></div>'+quick+'</section><section class="about-layout"><div class="section-intro"><p class="eyebrow">ABOUT SEA LAB</p><h2>Our lab.<br>Our principles.</h2><p>Learn about our research, how we work, and our lab seminar.</p><a class="text-link" href="members.html">Get to know our members ↗</a></div><div class="prose">'+home+'</div></section>'
(ROOT/'index.html').write_text(page('Home',body),encoding='utf-8')

options=''.join(f'<option value="{i}">{escape(g["category"])}</option>' for i,g in enumerate(groups))
body=f'''<div class="publication-toolbar"><div class="search-field"><label for="filter">Search publications</label><input id="filter" type="search" placeholder="Title, author or year…" aria-controls="publication-results"></div><div><label for="category-filter">Category</label><select id="category-filter" aria-controls="publication-results"><option value="all">All categories</option>{options}</select></div><button id="reset-filter" class="button secondary" type="button">Reset</button><p id="result" role="status" aria-live="polite">{total} publications</p></div><p class="archive-note">We only list the publications since 2016. If you want to see the previous ones, please refer to <a href="https://saleese.github.io/">saleese.com</a>.</p><div class="publication-layout"><nav class="section-nav" aria-label="Publication categories"><p class="eyebrow">ON THIS PAGE</p>'''
body+=''.join(f'<a href="#category-{i}">{escape(g["category"])} <span>{len(g["items"])}</span></a>' for i,g in enumerate(groups))+'</nav><div id="publication-results">'
for i,g in enumerate(groups):body+=f'<section class="publication-group" id="category-{i}" data-category="{i}"><h2>{escape(g["category"])} <span class="count">{len(g["items"])}</span></h2><ul class="publications">'+''.join('<li>'+x+'</li>' for x in g['items'])+'</ul></section>'
body+='<div id="empty" class="empty-state" hidden><h2>No matching publications</h2><p>Try a different title, author or year, or reset the filters.</p></div></div></div>'
(ROOT/'publications.html').write_text(page('Publications',body,'Publications','Browse our publications by category, or search by title, author and year.'),encoding='utf-8')

def responsive_content(content):
 content=re.sub(r'<table\b', '<div class="table-scroll" role="region" aria-label="Scrollable data table" tabindex="0"><table',content)
 return content.replace('</table>','</table></div>')

course_items=[x for x in sections if x['section']=='Courses']
tool_items=[x for x in sections if x['section']=='Tools' and x['path']!='tools.html']
for item in sections:
 title=item['title'];section=item['section'];content=responsive_content(item['html'])
 description={'Members':'Meet the people behind our research. Find member profiles and contact information.','Courses':'Explore teaching materials and course information.','Tools':'Explore software tools and resources from our research.'}[section]
 if item['path']=='courses.html':
  title='Courses'
  body=cards([(x['path'] if x['path']!='courses.html' else '#intro-course','COURSE',x['title'],'View course →') for x in course_items])
  body+=f'<section id="intro-course" class="article-panel imported-content"><h2>{escape(item["title"])}</h2>{content}</section>'
 elif item['path']=='tools.html':
  body=cards([(x['path'],'RESEARCH TOOL',x['title'],'Explore tool →') for x in tool_items])+'<details class="archive-details"><summary>Original tool listing</summary><div class="imported-content">'+content+'</div></details>'
 else:
  links=course_items if section=='Courses' else tool_items if section=='Tools' else []
  side='<nav class="section-nav" aria-label="Related pages"><p class="eyebrow">'+section.upper()+'</p>'+''.join(f'<a href="{x["path"]}"'+(' aria-current="page"' if x['path']==item['path'] else '')+'>'+escape(x['title'])+'</a>' for x in links)+'</nav>' if links else '<aside class="section-nav"><p class="eyebrow">CONNECT WITH THE LAB</p><p>Contact details and research interests are listed with each member.</p><a href="publications.html">Explore our publications ↗</a></aside>'
  body='<div class="article-layout">'+side+'<article class="article-panel imported-content">'+content+'</article></div>'
 (ROOT/item['path']).write_text(page(title,body,section,description),encoding='utf-8')
print(f'Built 15 responsive pages; preserved {total} publications.')
