function toggleSection(id){
  const el = byId(id)
  if (!el) return
  return el.open = !el.open
}

function handle(ev = {}) {
  const {type} = ev
  if (!type || type === 'hashchange') {
    toggleSection(location.hash.slice(1));
  } else if (type === 'click') {
    ev.preventDefault();
    let id = (ev.target.href || ev.target.parentElement.href).split('#')[1];
    if (location.hash !== `#${id}`) return location.hash = id;
    toggleSection(id)
  }
}

handle()
addEventListener('hashchange', handle)
document
  .querySelectorAll('.section-icon, .section-header a')
  .forEach((el) => el.addEventListener('click', handle))
