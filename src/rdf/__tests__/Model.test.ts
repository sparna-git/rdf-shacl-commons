import { RdfStore } from 'rdf-stores';
import { Model } from '../Model';
import { RdfStoreReader } from '../RdfStoreReader';
import { Term } from '@rdfjs/types/data-model';

describe('Model', () => {
    let store: RdfStore;
    let model: Model;

    beforeEach(() => {
        // Create a new RdfStore before each test
        store = RdfStore.createDefault();
        model = new Model(store);
    });

    /**
     * Helper to load Turtle data into the store
     */
    function loadTurtle(turtleData: string): Promise<void> {
        return new Promise((resolve, reject) => {
            RdfStoreReader.buildStoreFromString(turtleData, 'test.ttl', (loadedStore: RdfStore) => {
                // Copy all quads from loaded store to test store
                const allQuads = loadedStore.getQuads(null, null, null, null);
                allQuads.forEach(quad => {
                    store.addQuad(quad);
                });
                resolve();
            });
        });
    }

    describe('querySparqlSelect', () => {
        it('should execute a SPARQL SELECT query and return an array of bindings', async () => {
            const turtleData = `
                @prefix ex: <http://example.org/> .

                ex:alice ex:name "Alice"@en .
                ex:alice ex:age 30 .

                ex:bob ex:name "Bob"@en .
                ex:bob ex:age 25 .

                ex:charlie ex:name "Charlie"@en .
                ex:charlie ex:age 35 .
            `;

            await loadTurtle(turtleData);

            // Verify data was loaded
            expect(model.size()).toBeGreaterThan(0);

            const sparqlQuery = `
                PREFIX ex: <http://example.org/>
                SELECT ?person ?name
                WHERE {
                    ?person ex:name ?name .
                }
            `;

            const results = await model.querySparqlSelect(sparqlQuery);

            // Should return a non-empty array
            expect(Array.isArray(results)).toBe(true);
            expect((results as Array<any>).length).toBeGreaterThan(0);
        });

        it('should return empty array when no matches found', async () => {
            const turtleData = `
                @prefix ex: <http://example.org/> .

                ex:alice ex:age 30 .
                ex:bob ex:age 25 .
            `;

            await loadTurtle(turtleData);

            const sparqlQuery = `
                PREFIX ex: <http://example.org/>
                SELECT ?person ?name
                WHERE {
                    ?person ex:name ?name .
                }
            `;

            const results = await model.querySparqlSelect(sparqlQuery);

            // Should return an array (possibly empty)
            expect(Array.isArray(results)).toBe(true);
            expect((results as Array<any>).length).toBe(0);
        });

        it('should handle queries with multiple triple patterns', async () => {
            const turtleData = `
                @prefix ex: <http://example.org/> .

                ex:alice ex:name "Alice"@en .
                ex:alice ex:age 30 .

                ex:bob ex:name "Bob"@en .
                ex:bob ex:age 25 .
            `;

            await loadTurtle(turtleData);

            const sparqlQuery = `
                PREFIX ex: <http://example.org/>
                SELECT ?person ?name ?age
                WHERE {
                    ?person ex:name ?name .
                    ?person ex:age ?age .
                }
            `;

            const results = await model.querySparqlSelect(sparqlQuery);

            // Should return an array
            expect(Array.isArray(results)).toBe(true);
            expect((results as Array<any>).length).toBeGreaterThan(0);
        });

        it('should handle queries where we filter on literals', async () => {
            const turtleData = `
                @prefix ex: <http://example.org/> .

                ex:alice ex:name "Alice"@en .
                ex:alice ex:age 30 .

                ex:bob ex:name "Bob"@en .
                ex:bob ex:age 25 .
            `;

            await loadTurtle(turtleData);

            const sparqlQuery = `
                PREFIX ex: <http://example.org/>
                SELECT ?person ?name ?age
                WHERE {
                    ?person ex:name ?name .
                    ?person ex:age 30 .
                }
            `;

            const results = await model.querySparqlSelect(sparqlQuery);

            // Should return an array
            expect(Array.isArray(results)).toBe(true);
            expect((results as Array<any>).length).toBe(1);
        });

        it('should work with a FILTER', async () => {
            // Note: FILTER with numeric comparisons has limitations with sparql-engine v0.8.3
            // The comparison operators don't properly coerce RDF Literal values to JavaScript numbers
            // This test documents the current behavior
            const turtleData = `
                @prefix ex: <http://example.org/> .

                ex:alice ex:name "Alice"@en .
                ex:alice ex:age 30 .

                ex:bob ex:name "Bob"@en .
                ex:bob ex:age 25 .
            `;

            await loadTurtle(turtleData);

            const sparqlQuery = `
                PREFIX ex: <http://example.org/>
                SELECT ?person ?name ?age
                WHERE {
                    ?person ex:name ?name .
                    ?person ex:age ?age .
                    FILTER(?age > 26)
                }
            `;

            const results = await model.querySparqlSelect(sparqlQuery);

            // Should return an array
            expect(Array.isArray(results)).toBe(true);
            expect((results as Array<any>).length).toBe(1);
        });
    });
});
