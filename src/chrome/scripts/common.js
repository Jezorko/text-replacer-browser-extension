export const createIterator = generatorConstructor => {
    return {
        forEach: async callback => {
            const generator = generatorConstructor();
            let next;
            let index = 0;
            while (!(next = await generator.next()).done) {
                callback(next.value, index++);
            }
        },
        filter: predicate => createIterator(async function* () {
            const generator = generatorConstructor();
            let next;
            while (!(next = await generator.next()).done) {
                if (predicate(next.value)) yield next.value;
            }
        }),
        map: mappingFunction => createIterator(async function* () {
            const generator = generatorConstructor();
            let next;
            while (!(next = await generator.next()).done) {
                yield mappingFunction(next.value);
            }
        })
    };
};