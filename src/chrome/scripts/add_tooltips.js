const dynamicImport = async (fileName) => await import(chrome.runtime.getURL(fileName));

(async () => {
    const {test} = await dynamicImport('scripts/test.js');
    console.log(test);
})();

chrome.storage.local.get(configuration => {
    const emptyMatch = {
        value: '',
        index: 0,
        length: 0
    }
    const matchSpanClass = 'text-replacer-browser-extension-match';
    const tooltipSpanClass = 'text-replacer-browser-extension-tooltip';

    const patternsToConfigurations = Object.assign(
        {},
        ...Object.keys(configuration.categories)
            .flatMap(categoryName => configuration.categories[categoryName].map(categoryConfiguration => {
                categoryConfiguration.category = categoryName;
                categoryConfiguration.compiledPattern = new RegExp(categoryConfiguration.pattern, "g");
                categoryConfiguration.possibleSurroundingCharacters = new Set(configuration.possibleSurroundingCharacters);
                return categoryConfiguration;
            }))
            .map(category => ({
                [category.pattern]: category
            }))
    )

    console.log("Extension executing!", patternsToConfigurations);
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
                if (node.nodeValue !== '') handleText(node);
                break;
        }
    }

    function handleText(textNode) {
        const text = textNode.nodeValue;
        const newChildren = [];
        const allMatches = Object.keys(patternsToConfigurations).flatMap(pattern => {
            const configuration = patternsToConfigurations[pattern];
            let match;
            const matches = [];
            while ((match = configuration.compiledPattern.exec(text)) !== null) {
                const precedingCharacter = text[match.index - 1];
                const subsequentCharacter = text[match.index + match[0].length];
                if ((precedingCharacter === undefined || configuration.possibleSurroundingCharacters.has(precedingCharacter))
                    && (subsequentCharacter === undefined || configuration.possibleSurroundingCharacters.has(subsequentCharacter))
                    && match[0].length !== 0) {
                    matches.push({
                        value: match[0],
                        index: match.index,
                        length: match[0].length,
                        configuration: configuration
                    });
                }
            }
            return matches;
        }).sort((firstMatch, secondMatch) => { // sort matches by match index
            if (firstMatch.index < secondMatch.index) return -1;
            else if (firstMatch.index === secondMatch.index) {
                if (firstMatch.length < secondMatch.length) return -1;
                else if (firstMatch.length === secondMatch.length) return -1;
                else return 1;
            } else return 1;
        }).filter((match, matchIndex, allMatches) => { // remove overlapping matches
            let otherMatch;
            let doesOverlap;
            if (matchIndex === 0) { // when looking at first match, consider the second one
                otherMatch = matchIndex === allMatches.length - 1
                    ? emptyMatch // only one match present
                    : allMatches[matchIndex + 1];
                doesOverlap = match.index + match.length >= otherMatch.index;
            } else { // when looking at any other match, consider the previous one
                otherMatch = allMatches[matchIndex - 1];
                doesOverlap = otherMatch.index + otherMatch.length > match.index;
            }

            // if overlaps and other match is longer, filter out
            return (!doesOverlap) || (match.length > otherMatch.length);
        });

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
            tooltipSpan.textContent = match.configuration.description;
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
    }
});