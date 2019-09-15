{
  const hash = location.hash.slice(1)
  if (hash) {
    const el = document.getElementById(hash)
    if (el) el.open = true
  }
}

{
  const syncHash = ([mutation]) => {
    const {target} = mutation, {id, open} = target, loc = location.hash
    return location.hash = open
      ? `#${id}`
      : document.querySelector(loc) === target
        ? ''
        : loc
  }
  const observer = new MutationObserver(syncHash)
  const config = {attributes: true, attributeFilter: ['open']}
  document.querySelectorAll('details[id]').forEach(
    (el) => observer.observe(el, config)
  )
}
