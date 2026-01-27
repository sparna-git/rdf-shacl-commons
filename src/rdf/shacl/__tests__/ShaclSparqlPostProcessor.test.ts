import { RdfStore } from 'rdf-stores';
import { ShaclModel } from '../ShaclModel';
import { ShaclSparqlPostProcessor } from '../ShaclSparqlPostProcessor';
import { SH } from '../../vocabularies/SH';
import { RdfStoreReader } from '../../RdfStoreReader';
import { Parser } from 'sparqljs';

const parser = new Parser();

describe('ShaclSparqlPostProcessor', () => {
    let store: RdfStore;
    let shaclModel: ShaclModel;
    let postProcessor: ShaclSparqlPostProcessor;

    beforeEach(() => {
        // Create a new RdfStore before each test
        store = RdfStore.createDefault();
        shaclModel = new ShaclModel(store);
        postProcessor = new ShaclSparqlPostProcessor(shaclModel);
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

    /**
     * Helper to verify that a SPARQL query is syntactically valid
     */
    function isValidSparql(sparql: string): boolean {
        try {
            parser.parse(sparql);
            return true;
        } catch (error) {
            return false;
        }
    }

    describe('expandSparql with sh:target/sh:select', () => {
        it('should expand a simple sh:target/sh:select  containing $this', async () => {
            const shaclTurtle = `
                @prefix ex: <http://example.org/> .
                @prefix sh: <http://www.w3.org/ns/shacl#> .
                @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .

                ex:PersonShape
                    a sh:NodeShape ;
                    sh:target [
                        sh:select "SELECT $this WHERE { $this a <http://example.org/Person> . }"
                    ] .
            `;

            await loadTurtle(shaclTurtle);

            const inputSparql = `
                PREFIX ex: <http://example.org/>
                SELECT ?result WHERE {
                    ?anything a <http://example.org/PersonShape> .
                }
            `;

            const resultSparql = postProcessor.expandSparql(inputSparql, {});

            // Verify the result is a valid SPARQL query
            expect(isValidSparql(resultSparql)).toBe(true);
            
            // Verify the result contains the expanded WHERE clause from sh:select
            expect(resultSparql).toContain('?anything <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> ex:Person');
        });

        it('should expand a simple sh:target/sh:select  containing ?this', async () => {
            const shaclTurtle = `
                @prefix ex: <http://example.org/> .
                @prefix sh: <http://www.w3.org/ns/shacl#> .
                @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .

                ex:PersonShape
                    a sh:NodeShape ;
                    sh:target [
                        sh:select "SELECT ?this WHERE { ?this a <http://example.org/Person> . }"
                    ] .
            `;

            await loadTurtle(shaclTurtle);

            const inputSparql = `
                PREFIX ex: <http://example.org/>
                SELECT ?result WHERE {
                    ?anything a <http://example.org/PersonShape> .
                }
            `;

            const resultSparql = postProcessor.expandSparql(inputSparql, {});

            // Verify the result is a valid SPARQL query
            expect(isValidSparql(resultSparql)).toBe(true);
            
            // Verify the result contains the expanded WHERE clause from sh:select
            expect(resultSparql).toContain('?anything <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> ex:Person');
        });


        it('should add prefixes from the sh:select target to the main query', async () => {
            const shaclTurtle = `
                @prefix ex: <http://example.org/> .
                @prefix sh: <http://www.w3.org/ns/shacl#> .
                @prefix foaf: <http://xmlns.com/foaf/0.1/> .

                ex:PersonShape
                    a sh:NodeShape ;
                    sh:target [
                        sh:select "PREFIX foaf: <http://xmlns.com/foaf/0.1/> SELECT ?this WHERE { ?this a foaf:Person . }"
                    ] .
            `;

            await loadTurtle(shaclTurtle);

            const inputSparql = `
                PREFIX ex: <http://example.org/>
                SELECT ?person WHERE {
                    ?person_1 a <http://example.org/PersonShape> .
                }
            `;

            const resultSparql = postProcessor.expandSparql(inputSparql, {});

            // Verify the result is valid
            expect(isValidSparql(resultSparql)).toBe(true);
            
            // Verify the foaf prefix was added
            expect(resultSparql).toContain('PREFIX foaf:');
        });

        it('should handle sh:target/sh:select with WHERE clause lacking final dot', async () => {
            const shaclTurtle = `
                @prefix ex: <http://example.org/> .
                @prefix sh: <http://www.w3.org/ns/shacl#> .

                ex:PersonShape
                    a sh:NodeShape ;
                    sh:target [
                        sh:select "SELECT ?this WHERE { ?this a <http://example.org/Person> }"
                    ] .
            `;

            await loadTurtle(shaclTurtle);

            const inputSparql = `
                PREFIX ex: <http://example.org/>
                SELECT ?person WHERE {
                    ?person_1 a <http://example.org/PersonShape> .
                }
            `;

            const resultSparql = postProcessor.expandSparql(inputSparql, {});

            // Verify the result is syntactically valid (should have added missing dot)
            expect(isValidSparql(resultSparql)).toBe(true);
        });
    });
});