const dynamicImport = async (fileName) => await import(chrome.runtime.getURL(fileName));

(async () => {
    const {matchSpanClass, tooltipSpanClass} = await dynamicImport('data/constants.js');
    const {matchAll, emptyMatch} = await dynamicImport('scripts/matching.js');

    const {
        iterateNodes, isTextOrTextAreaNode, isAceEditorNode, isATextNode
    } = await dynamicImport('scripts/document.js');

    iterateNodes(
        document.body,
        node => isAceEditorNode(node) || isTextOrTextAreaNode(node)
    ).filter(isATextNode)
        .forEach(textNode => {
            const text = textNode.nodeValue;
            const newChildren = [];
            matchAll(text).then(allMatches => {
                if (allMatches.length === 0) return;

                allMatches.forEach((match, matchIndex, allMatches) => {
                    const precedingMatch = matchIndex === 0 ? emptyMatch : allMatches[matchIndex - 1];
                    newChildren.push(
                        document.createTextNode(text.substring(precedingMatch.index + precedingMatch.length, match.index))
                    );

                    const matchSpan = document.createElement('span');
                    matchSpan.className = matchSpanClass;
                    matchSpan.textContent = match.value;
                    const tooltipSpan = document.createElement('span');
                    tooltipSpan.className = tooltipSpanClass;
                    tooltipSpan.textContent = match.description;
                    matchSpan.appendChild(tooltipSpan);

                    newChildren.push(matchSpan);

                    if (matchIndex === allMatches.length - 1) {
                        newChildren.push(
                            document.createTextNode(text.substring(match.index + match.length, text.length))
                        );
                    }
                });

                const parentElement = textNode.parentNode;
                newChildren.forEach((newChild, childIndex) => {
                    const previousChild = childIndex === 0 ? textNode : newChildren[childIndex - 1];
                    parentElement.insertBefore(newChild, previousChild.nextSibling);
                });
                parentElement.removeChild(textNode);
            });
        });
})();