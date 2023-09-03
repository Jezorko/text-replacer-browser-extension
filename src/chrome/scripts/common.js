export const createIterator = generatorConstructor => {
    return {
        forEach: callback => {
            const generator = generatorConstructor();
            let next;
            let index = 0;
            while (!(next = generator.next()).done) {
                callback(next.value, index++);
            }
        },
        filter: predicate => createIterator(function* () {
            const generator = generatorConstructor();
            let next;
            while (!(next = generator.next()).done) {
                if (predicate(next.value)) yield next.value;
            }
        }),
        map: mappingFunction => createIterator(function* () {
            const generator = generatorConstructor();
            let next;
            while (!(next = generator.next()).done) {
                yield mappingFunction(next.value);
            }
        })
    };
};