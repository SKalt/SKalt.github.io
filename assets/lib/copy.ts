export const copyToClipboard = async (str: string): Promise<void> => {
  try {
    await window.navigator.clipboard.writeText(str);
  } catch (e) {
    console.error(e);
    return new Promise((resolve) => {
      let i = document.createElement("textarea");
      i.value = str;
      i.select();
      document.execCommand("copy"); // deprecated but still portable
      resolve();
    });
  }
};
