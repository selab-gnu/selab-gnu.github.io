const filter = document.querySelector('#filter');
if (filter) {
  const entries = [...document.querySelectorAll('.publications li')];
  const groups = [...document.querySelectorAll('.publication-group')];
  const category = document.querySelector('#category-filter');
  function update() {
    const q = filter.value.trim().toLocaleLowerCase();
    let count = 0;
    for (const group of groups) {
      let visible = 0;
      for (const item of group.querySelectorAll('li')) {
        item.hidden = !(category.value === 'all' || category.value === group.id) || !item.textContent.toLocaleLowerCase().includes(q);
        if (!item.hidden) visible++;
      }
      group.hidden = visible === 0;
      count += visible;
    }
    document.querySelector('#result').textContent = `${count} of ${entries.length} publications`;
    document.querySelector('#empty').hidden = count !== 0;
    for (const link of document.querySelectorAll('.category-links a')) {
      link.hidden = document.querySelector(link.getAttribute('href')).hidden;
    }
  }
  filter.value = new URLSearchParams(location.search).get('q') || '';
  filter.addEventListener('input', update);
  category.addEventListener('change', update);
  document.querySelector('#clear-filter').addEventListener('click', () => {
    filter.value = ''; category.value = 'all'; update(); filter.focus();
  });
  update();
}
