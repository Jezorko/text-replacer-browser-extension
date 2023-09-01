walk(document.body);

function walk(node) {
    let child, next;

    let tagName = node.tagName ? node.tagName.toLowerCase() : "";
    if (tagName === 'input' || tagName === 'textarea') {
        return;
    }
    if (node.classList && node.classList.contains('ace_editor')) {
        return;
    }

    switch (node.nodeType) {
        case 1:  // Element
        case 9:  // Document
        case 11: // Document fragment
            child = node.firstChild;
            while (child) {
                next = child.nextSibling;
                walk(child);
                child = next;
            }
            break;

        case 3: // Text node
            handleText(node);
            break;
    }
}

function handleText(textNode) {
    console.log(textNode.classList) // WHY IS THIS UNDEFINED PLEEEEEASE
}
