export const compileConfigurationPatterns = configuration => Object.assign(
    {},
    ...Object.keys(configuration.categories)
        .flatMap(categoryName => configuration.categories[categoryName].map(categoryConfiguration => {
            categoryConfiguration.category = categoryName;
            categoryConfiguration.compiledPattern = new RegExp(categoryConfiguration.pattern, "g");
            categoryConfiguration.possibleSurroundingCharacters = new Set(configuration.possibleSurroundingCharacters);
            return categoryConfiguration;
        }))
        .map(categoryConfiguration => ({
            [categoryConfiguration.pattern]: categoryConfiguration
        }))
);