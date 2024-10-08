import { copyToClipboard } from "./lib/copy";
const pre = {
  icon: "📋",
  title: "click to copy",
};
const post = {
  icon: "✅",
  title: "copied",
};
const buttonTemplate = document.createElement("template");
buttonTemplate.innerHTML = `<button class="copy-on-click" style="border: none; background: none" title="${pre.title}">${pre.icon}</button>`;
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
document.querySelectorAll(".highlight, citation").forEach((el) => {
  el.prepend(buttonTemplate.content.cloneNode(true));
  (el.querySelector(".copy-on-click")! as HTMLButtonElement).addEventListener(
    "click",
    _copyElement,
  );
});
