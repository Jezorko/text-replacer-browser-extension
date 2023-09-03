export const emptyMatch = {
    value: '',
    index: 0,
    length: 0,
    description: '',
    suggestedReplacements: []
}

export const matchAll = async (text) => {
    const configuration = (await chrome.storage.local.get()).configuration;
    const {compileConfigurationPatterns} = await dynamicImport('scripts/configuration.js');
    const patternsToConfigurations = compileConfigurationPatterns(configuration);
    return Object.keys(patternsToConfigurations).flatMap(pattern => matchAllForPattern(
        text,
        patternsToConfigurations[pattern].compiledPattern,
        patternsToConfigurations[pattern].possibleSurroundingCharacters,
        patternsToConfigurations[pattern].description,
        patternsToConfigurations[pattern].suggestedReplacements,
    )).sort(byMatchIndexAndLength).filter(matchDoesNotOverlap);
}

const matchAllForPattern = (text, compiledPattern, possibleSurroundingCharacters, description, suggestedReplacements) => {
    let match;
    const matches = [];
    while ((match = compiledPattern.exec(text)) !== null) {
        const precedingCharacter = text[match.index - 1];
        const subsequentCharacter = text[match.index + match[0].length];
        if ((precedingCharacter === undefined || possibleSurroundingCharacters.has(precedingCharacter))
            && (subsequentCharacter === undefined || possibleSurroundingCharacters.has(subsequentCharacter))
            && match[0].length !== 0) {
            matches.push({
                value: match[0],
                index: match.index,
                length: match[0].length,
                description: description,
                suggestedReplacements: suggestedReplacements
            });
        }
    }
    return matches;
}

const byMatchIndexAndLength = (firstMatch, secondMatch) => {
    if (firstMatch.index < secondMatch.index) return -1;
    else if (firstMatch.index === secondMatch.index) {
        if (firstMatch.length < secondMatch.length) return -1;
        else if (firstMatch.length === secondMatch.length) return -1;
        else return 1;
    } else return 1;
};

const matchDoesNotOverlap = (match, matchIndex, allMatches) => {
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
}