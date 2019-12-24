{
  const hash = location.hash.slice(1);
  if (hash) {
    const el = document.getElementById(hash);
    if (el) el.open = true;
  }
}

{
  const syncHash = ([mutation]) => {
    const { target } = mutation,
      { id, open } = target,
      loc = location.hash;
    if (open) return (location.hash = `#${id}`);
    if (document.querySelector(loc) === target) return (location.hash = "");
    return (location.hash = loc);
  };

  const observer = new MutationObserver(syncHash);
  const config = { attributes: true, attributeFilter: ["open"] };
  document
    .querySelectorAll("details[id]")
    .forEach(el => observer.observe(el, config));
}
