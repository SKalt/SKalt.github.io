{
  const hash = location.hash.slice(1)
  if (hash) {
    const el = document.getElementById(hash)
    if (el) el.open = true
  }
}

{
  const syncHash = ([mutation]) => {
    const hash = `#${mutation.target.id}`
    if (hash === location.hash) location.hash = ''
    else location.hash = hash
  }
  const observer = new MutationObserver(syncHash)
  const config = {attributes: true, attributeFilter: ['open']}
  document.querySelectorAll('details[id]').forEach(
    (el) => observer.observe(el, config)
  )
}
