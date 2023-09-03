const dynamicImport = async (fileName) => await import(chrome.runtime.getURL(fileName));
const {createIterator} = await dynamicImport('scripts/common.js');

export const iterateNodes = (root, ignoreChildrenPredicate) => createIterator(function* walk(node) {
    if (node === undefined) node = root;
    yield node;
    if (!ignoreChildrenPredicate(node)) {
        let child, next;
        child = node.firstChild;
        while (child) {
            next = child.nextSibling;
            yield* walk(child);
            child = next;
        }
    }
});

export const hasTag = (node, tag) => tag === node.tagName ? node.tagName.toLowerCase() : "";
export const isTextOrTextAreaNode = node => hasTag(node, 'input') || hasTag(node, 'textarea');
export const isAceEditorNode = node => node.classList && node.classList.contains('ace_editor');
export const isATextNode = node => node.nodeType === 3;