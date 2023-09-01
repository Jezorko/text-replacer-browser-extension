console.log("Extension executing!");
const configuration = {
    "possibleSurroundingCharacters": [
        " ",
        ",",
        ".",
        "!",
        "?",
        "\\-",
        "\"",
        "'"
    ],
    "categories": {
        "Team Names": [
            {
                "pattern": "[Rr][Nn]?[Cc]",
                "description": "Refunds & Compensations Team",
                "suggestedReplacements": [
                    "Refunds & Compensations",
                    "Refunds and Compensations",
                    "Refunds & Compensations Team",
                    "Refunds and Compensations Team"
                ]
            }
        ],
        "Acronyms": [
            {
                "pattern": "[Pp][Ii][Rr]",
                "description": "Post-Incident Review",
                "suggestedReplacements": [
                    "Post-Incident Review",
                    "Post Incident Review"
                ]
            }
        ]
    }
}

const emptyMatch = {
    value: '',
    index: 0,
    length: 0
}
const matchSpanClass = 'text-replacer-browser-extension-match';
const tooltipSpanClass = 'text-replacer-browser-extension-tooltip';
configuration.possibleSurroundingCharacters.push(" ");
const possibleSurroundingCharacters = '[' + configuration.possibleSurroundingCharacters.join('') + ']'

const patternsToConfigurations = Object.assign(
    {},
    ...Object.keys(configuration.categories)
        .flatMap(categoryName => configuration.categories[categoryName].map(configuration => {
            configuration.category = categoryName;
            configuration.compiledPattern = new RegExp(
                possibleSurroundingCharacters + configuration.pattern + possibleSurroundingCharacters,
                "g"
            );
            return configuration;
        }))
        .map(category => ({
            [category.pattern]: category
        }))
)

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
    const text = ' ' + textNode.nodeValue + ' ';
    const dividedText = [];
    const allMatches = Object.keys(patternsToConfigurations).flatMap(pattern => {
        const configuration = patternsToConfigurations[pattern];
        let match;
        const matches = [];
        while ((match = configuration.compiledPattern.exec(text)) !== null) {
            matches.push({
                value: match[0].substring(1, match[0].length - 1),
                index: match.index + 1,
                length: match[0].length - 2,
                configuration: configuration
            })
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
        dividedText.push(text.substring(precedingMatch.index + precedingMatch.length, match.index));

        dividedText.push(
            "<span class=\"" + matchSpanClass + "\">"
            + match.value
            + "<span class=\"" + tooltipSpanClass + "\">" + match.configuration.description + "</span></span>"
        );

        if (matchIndex === allMatches.length - 1) {
            dividedText.push(text.substring(match.index + match.length, text.length));
        }
    });
    const dividedTextJoined = dividedText.join('');
    const result = dividedTextJoined.substring(1, dividedTextJoined.length - 1);
    console.log(textNode.tagName);
    console.log(result);
    const test = document.createElement("div");
    test.innerHTML = result;
    test.className = textNode.className;
    test.attributes = textNode.attributes;
    textNode.parentNode.appendChild(test);
    textNode.parentNode.removeChild(textNode);
    // textNode.appendChild(test);
    textNode.nodeValue = result;
    textNode.innerHTML = dividedTextJoined.substring(1, dividedTextJoined.length - 1);
}
