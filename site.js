const menuButton = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('#main-nav');
const mobile = window.matchMedia('(max-width: 900px)');
function syncMenu() {
  menuButton.hidden = !mobile.matches;
  mainNav.hidden = mobile.matches;
  menuButton.setAttribute('aria-expanded', String(!mobile.matches));
}
syncMenu();
mobile.addEventListener('change', syncMenu);
menuButton.addEventListener('click', () => {
  mainNav.hidden = !mainNav.hidden;
  menuButton.setAttribute('aria-expanded', String(!mainNav.hidden));
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && mobile.matches && !mainNav.hidden) {
    mainNav.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.focus();
  }
});

const filter = document.querySelector('#filter');
if (filter) {
  const category = document.querySelector('#category-filter');
  const entries = [...document.querySelectorAll('.publications li')];
  const groups = [...document.querySelectorAll('.publication-group')];
  function update() {
    const q = filter.value.trim().toLocaleLowerCase();
    let count = 0;
    for (const group of groups) {
      let groupCount = 0;
      for (const item of group.querySelectorAll('li')) {
        item.hidden = !(category.value === 'all' || category.value === group.dataset.category) || !item.textContent.toLocaleLowerCase().includes(q);
        if (!item.hidden) groupCount++;
      }
      group.hidden = groupCount === 0;
      group.querySelector('.count').textContent = groupCount;
      count += groupCount;
    }
    document.querySelector('#result').textContent = `${count} of ${entries.length} publications`;
    document.querySelector('#empty').hidden = count !== 0;
    for (const link of document.querySelectorAll('.section-nav a')) {
      link.hidden = document.querySelector(link.getAttribute('href')).hidden;
    }
  }
  filter.value = new URLSearchParams(location.search).get('q') || '';
  filter.addEventListener('input', update);
  category.addEventListener('change', update);
  document.querySelector('#reset-filter').addEventListener('click', () => {
    filter.value = '';
    category.value = 'all';
    update();
    filter.focus();
  });
  update();
}
