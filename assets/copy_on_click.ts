import { copyToClipboard } from "./lib/copy";
const buttonTemplate = document.createElement("template");
const pre = {
  icon: "📋",
  title: "click to copy",
};
const post = {
  icon: "✅",
  title: "copied",
};
buttonTemplate.innerHTML = `<span class="copy-on-click" title="${pre.title}">${pre.icon}</span>`;
const _copyElement = (e: MouseEvent) => {
  const button = e.target as HTMLElement;
  const parent = button.parentElement as HTMLElement;
  let textToCopy = (parent.textContent ?? "").replace(/^(📋|✅)/, "");
  copyToClipboard(textToCopy).then(() => {
    button.textContent = post.icon;
    button.title = post.title;
    setTimeout(() => {
      button.textContent = pre.icon;
      button.title = pre.title;
    }, 1000);
  });
};
document.querySelectorAll(".highlight").forEach((el) => {
  const button = buttonTemplate.content.cloneNode(true);
  el.prepend(button);
  el.querySelector(".copy-on-click")?.addEventListener("click", _copyElement);
});
