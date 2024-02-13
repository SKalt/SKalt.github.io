{
    const el = document.getElementById(location.hash.slice(1));
    if (el) (el as HTMLDetailsElement).open = true;
}

{
  const syncHash: MutationCallback = ([mutation]) => {
    const { target } = mutation;
    const { id, open } = (target as HTMLDetailsElement);
    const {hash} = location;
    if (open) return (location.hash = `#${id}`);
    if (document.querySelector(hash) === target) return (location.hash = "");
    return (location.hash = hash);
  };

  const observer = new MutationObserver(syncHash);
  const config = { attributes: true, attributeFilter: ["open"] };
  document
    .querySelectorAll("details[id]")
    .forEach(el => observer.observe(el, config));
}
