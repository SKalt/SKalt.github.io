function toggleSection(id){
  const el = document.getElementById(id)
  if (!el) return
  return (location.hash = (el.open = !el.open) ? id : '')
}
function closestHref(e) {
  return e.href || e.id || closestHref(e.parentElement)
}
function handle(e) {
  if (e.target === this && e.target.tagName.match(/(a|summary)/i)){
    e.preventDefault()
  }
  if (e.done) return
  e.done = true
  let id = closestHref(e.target)
  if (id) id = id.split('#').pop() // get the last part of the split
  if (location.hash !== `#${id}`) return location.hash = id
  toggleSection(id)
}

const update = () => toggleSection(location.hash.slice(1))
update()
addEventListener('hashchange', update)
document
  .querySelectorAll('.section-icon, .section-header a, summary')
  .forEach((el) => el.addEventListener('click', handle))
