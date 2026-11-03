"""Public copy distilled from the supplied Open Lab deck; no deck binary is published."""
from html import escape
from urllib.parse import quote

def dual(tag, value, css=''):
    attr=f' class="{css}"' if css else ''
    return f'<{tag}{attr}><span data-lang="en">{escape(value["en"])}</span><span data-lang="ko" hidden>{escape(value["ko"])}</span></{tag}>'

def label(ko,en):
    return {'ko':ko,'en':en}

def research_cards(data):
    return '<div class="research-area-grid">'+''.join(
        '<article class="research-area-card"><span class="area-code">'+escape(area['code'])+'</span>'+
        dual('h3',area['title'])+dual('p',area['body'])+dual('p',area['topics'],'area-topics')+'</article>'
        for area in data['areas'])+'</div>'

def home_highlights(data):
    return '<section class="openlab-highlights" aria-labelledby="openlab-home-title"><p class="eyebrow">SE × AI × AERO</p><h2 id="openlab-home-title" data-i18n="researchOverview">Research overview</h2>'+research_cards(data)+\
        '<div class="openlab-home-links"><a href="research.html#projects" data-i18n="seeProjects">Explore research</a><a href="research.html#awards" data-i18n="seeAwards">Awards & achievements</a><a href="research.html#join" data-i18n="seeJoin">Joining the lab</a></div></section>'

def research_page(data):
    body='<p class="research-page-intro" data-i18n="openlabIntro">Intelligent software engineering at the intersection of software engineering, AI and aviation.</p>'
    body+='<nav class="research-section-nav" aria-label="Research page sections">'+''.join(
        f'<a href="#{anchor}" data-i18n="{key}">{fallback}</a>' for anchor,key,fallback in [
            ('areas','researchOverview','Research areas'),('projects','featuredProjects','Featured research'),('journey','researchJourney','Research journey'),('awards','awardsTitle','Awards'),('life','labLife','Lab life'),('careers','careerPaths','Career paths'),('join','joinTitle','Join the lab')])+'</nav>'
    body+='<section id="areas" class="openlab-section"><h2 data-i18n="researchOverview">Research areas</h2>'+research_cards(data)+'</section>'
    body+='<section id="projects" class="openlab-section"><h2 data-i18n="featuredProjects">Featured research</h2><p data-i18n="projectsIntro">Selected studies introduced in the 2026 Open Lab presentation.</p><div class="project-grid">'
    for project in data['projects']:
        venue=label(project['venue'],'KSAS Spring Conference 2026' if project['venue']=='한국항공우주학회 춘계학술대회 2026' else project['venue'])
        body+='<article class="research-project"><p class="project-area">'+escape(project['area'])+'</p>'+dual('h3',project['title'])+dual('p',project['body'])+dual('p',venue,'project-venue')+'<a href="search.html?q='+quote(project['query'])+'" data-i18n="findRelatedPaper">Find related publication ↗</a></article>'
    body+='</div></section>'
    body+='<section id="journey" class="openlab-section"><h2 data-i18n="researchJourney">Research journey</h2><ol class="research-timeline">'
    for milestone in data['milestones']:
        body+='<li><span class="timeline-year">'+str(milestone['year'])+'</span>'+dual('p',milestone['title'])+'</li>'
    body+='</ol></section>'
    body+='<section id="awards" class="openlab-section"><div class="section-heading"><h2 data-i18n="awardsTitle">Awards & achievements</h2><span class="section-count">'+str(len(data['awards']))+'</span></div><p data-i18n="awardsSource">Listed by award year in the supplied 2026 Open Lab presentation.</p><div class="award-years">'
    for year in sorted({item['year'] for item in data['awards']},reverse=True):
        body+='<section class="award-year"><h3>'+str(year)+'</h3><ul>'
        for award in [a for a in data['awards'] if a['year']==year]:
            body+='<li>'+dual('strong',award['name'])+dual('p',award['event'])+'</li>'
        body+='</ul></section>'
    body+='</div></section>'
    body+='<section id="life" class="openlab-section"><h2 data-i18n="labLife">Lab life</h2><div class="lab-life-grid">'
    for key,title,desc in [
        ('schedule','Regular schedule','scheduleBody'),('events','Annual activities','eventsBody'),('learning','Learning together','learningBody')]:
        body+='<article><h3 data-i18n="'+key+'">'+title+'</h3><p data-i18n="'+desc+'"></p></article>'
    body+='</div><p class="source-note" data-i18n="scheduleNote"></p></section>'
    career_names={'컷백':'Cutback','젠티':'JENTI','슈어소프트웨어':'Suresoft','LIG넥스원':'LIG Nex1','현대로템':'Hyundai Rotem','모아소프트':'MOASOFT','포스코 기술연구원':'POSCO Technical Research Laboratories','엔테크서비스·NTS':'N Tech Service · NTS','엔스퀘어':'NSQUARE'}
    body+='<section id="careers" class="openlab-section"><h2 data-i18n="careerPaths">Alumni pathways</h2><p data-i18n="careerIntro"></p><ul class="career-destinations">'+''.join(dual('li',label(name,career_names.get(name,name))) for name in data['careers'])+'</ul><a href="members.html" data-i18n="meetMembers">Meet our members ↗</a></section>'
    # Preserve the deck's year groups; a range is not an exact employment date.
    outcomes=data.get('careerOutcomes',[])
    career_detail=dual('p',label('2026 오픈랩 발표자료 30쪽에 기재된 취업·진학 내역입니다. 연도는 발표자료의 분류를 따르며 현재 재직 여부나 정확한 입사일을 뜻하지 않습니다.','Employment and further study listed on slide 30 of the 2026 Open Lab presentation. Years follow the presentation and do not confirm current employment or exact start dates.'),'source-note')
    career_detail+='<div class="career-years">'
    for period in dict.fromkeys(item['period'] for item in outcomes):
        entries=[item for item in outcomes if item['period']==period]
        career_detail+='<section class="career-year"><div class="career-year-heading"><h3>'+escape(period)+'</h3><span class="section-count">'+str(len(entries))+'</span></div><ul>'
        for item in entries:
            kind=label('박사과정 진학','PhD study') if item['type']=='phd' else label('취업','Employment')
            career_detail+='<li class="career-outcome">'+dual('strong',item['name'])+'<div>'+dual('span',kind,'career-kind')+dual('p',item['destination'])+'</div></li>'
        career_detail+='</ul></section>'
    career_detail+='</div>'
    # Insert the detailed records inside the existing pathways section.
    body=body.replace('<a href="members.html" data-i18n="meetMembers">',career_detail+'<a href="members.html" data-i18n="meetMembers">')
    body+='<section id="join" class="openlab-section join-section"><h2 data-i18n="joinTitle">Join the lab</h2><div class="join-grid"><article><h3 data-i18n="foundations">Foundations</h3><p data-i18n="foundationsBody"></p><h3 data-i18n="preferred">Helpful experience</h3><p data-i18n="preferredBody"></p></article><article><h3 data-i18n="developSkills">What you will study</h3><p data-i18n="developSkillsBody"></p><h3 data-i18n="contactTitle">Contact</h3><a href="mailto:saleese@gnu.ac.kr">saleese@gnu.ac.kr</a><p data-i18n="contactLocation"></p></article></div></section>'
    body+='<p class="openlab-source" data-i18n="openlabSource">Based on the supplied 2026 Open Lab presentation.</p>'
    return body
