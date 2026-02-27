import { RdfStore } from 'rdf-stores';
import { ShaclModel } from '../ShaclModel';
import { SH } from '../../vocabularies/SH';
import { RDF } from '../../vocabularies/RDF';
import { RdfStoreReader } from '../../RdfStoreReader';
import { DataFactory } from 'rdf-data-factory';
import { PropertyPath } from '../PropertyPath';

const factory = new DataFactory();

describe('PropertyPath', () => {
    let store: RdfStore;
    let shaclModel: ShaclModel;

    beforeEach(() => {
        // Create a new RdfStore before each test
        store = RdfStore.createDefault();
        shaclModel = new ShaclModel(store);
    });

    /**
     * Helper to load Turtle data into the store
     */
    function loadTurtle(turtleData: string): Promise<void> {
        return new Promise((resolve, reject) => {
            RdfStoreReader.populateStore(store, turtleData, 'test.ttl', (loadedStore: RdfStore) => {
                resolve();
            });
        });
    }

    describe('toSparql', () => {
        it('should render a simple NamedNode path as a full URI', async () => {
            const turtleData = `
                @prefix ex: <http://example.org/> .
                @prefix sh: <http://www.w3.org/ns/shacl#> .

                ex:PersonShape
                    sh:path ex:knows .
            `;

            await loadTurtle(turtleData);

            const pathNode = factory.namedNode('http://example.org/knows');
            const propertyPath = new PropertyPath(pathNode, shaclModel);
            const sparqlPath = propertyPath.toSparql(false);

            expect(sparqlPath).toBe('<http://example.org/knows>');
        });

        it('should render a the local name of the predicate when asked to', async () => {
            const turtleData = `
                @prefix ex: <http://example.org/> .
                @prefix sh: <http://www.w3.org/ns/shacl#> .

                ex:PersonShape
                    sh:path ex:knows .
            `;

            await loadTurtle(turtleData);

            const pathNode = factory.namedNode('http://example.org/knows');
            const propertyPath = new PropertyPath(pathNode, shaclModel);
            // asks for local names
            const sparqlPath = propertyPath.toSparql(true);

            expect(sparqlPath).toBe('knows');
        });

        it('should render a sequence path (/) as slash-separated URIs', async () => {
            const turtleData = `
                @prefix ex: <http://example.org/> .
                @prefix sh: <http://www.w3.org/ns/shacl#> .
                @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .

                ex:PersonShape
                    sh:path (
                        ex:knows
                        ex:name
                    ) .
            `;

            await loadTurtle(turtleData);

            // Get the path list from the shape
            const pathList = shaclModel.readSingleProperty(
                factory.namedNode('http://example.org/PersonShape'),
                SH.PATH
            )!;

            const propertyPath = new PropertyPath(pathList, shaclModel);
            const sparqlPath = propertyPath.toSparql(false);

            expect(sparqlPath).toBe('<http://example.org/knows>/<http://example.org/name>');
        });

        it('should render a one-or-more path (+) as URI with plus suffix', async () => {
            const turtleData = `
                @prefix ex: <http://example.org/> .
                @prefix sh: <http://www.w3.org/ns/shacl#> .

                ex:PersonShape
                    sh:path [ sh:oneOrMorePath ex:knows ] .
            `;

            await loadTurtle(turtleData);

            const pathList = shaclModel.readSingleProperty(
                factory.namedNode('http://example.org/PersonShape'),
                SH.PATH
            )!;

            const propertyPath = new PropertyPath(pathList, shaclModel);
            const sparqlPath = propertyPath.toSparql(false);

            expect(sparqlPath).toBe('<http://example.org/knows>+');
        });

        it('should render an inverse path (^) as caret-prefixed URI', async () => {
            const turtleData = `
                @prefix ex: <http://example.org/> .
                @prefix sh: <http://www.w3.org/ns/shacl#> .

                ex:PersonShape
                    sh:path [ sh:inversePath ex:knows ] .
            `;

            await loadTurtle(turtleData);

            const pathList = shaclModel.readSingleProperty(
                factory.namedNode('http://example.org/PersonShape'),
                SH.PATH
            )!;

            const propertyPath = new PropertyPath(pathList, shaclModel);
            const sparqlPath = propertyPath.toSparql(false);

            expect(sparqlPath).toBe('^<http://example.org/knows>');
        });

        it('should render a zero-or-more path (*) as URI with asterisk suffix', async () => {
            const turtleData = `
                @prefix ex: <http://example.org/> .
                @prefix sh: <http://www.w3.org/ns/shacl#> .

                ex:PersonShape
                    sh:path [ sh:zeroOrMorePath ex:knows ] .
            `;

            await loadTurtle(turtleData);

            const pathList = shaclModel.readSingleProperty(
                factory.namedNode('http://example.org/PersonShape'),
                SH.PATH
            )!;

            const propertyPath = new PropertyPath(pathList, shaclModel);
            const sparqlPath = propertyPath.toSparql(false);

            expect(sparqlPath).toBe('<http://example.org/knows>*');
        });

        it('should render a zero-or-one path (?) as URI with question mark suffix', async () => {
            const turtleData = `
                @prefix ex: <http://example.org/> .
                @prefix sh: <http://www.w3.org/ns/shacl#> .

                ex:PersonShape
                    sh:path [ sh:zeroOrOnePath ex:knows ] .
            `;

            await loadTurtle(turtleData);

            const pathList = shaclModel.readSingleProperty(
                factory.namedNode('http://example.org/PersonShape'),
                SH.PATH
            )!;

            const propertyPath = new PropertyPath(pathList, shaclModel);
            const sparqlPath = propertyPath.toSparql(false);

            expect(sparqlPath).toBe('<http://example.org/knows>?');
        });

        it('should render an alternative path (|) as pipe-separated URIs in parentheses', async () => {
            const turtleData = `
                @prefix ex: <http://example.org/> .
                @prefix sh: <http://www.w3.org/ns/shacl#> .
                @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .

                ex:PersonShape
                    sh:path [ sh:alternativePath (
                        ex:knows
                        ex:colleague
                        ex:friend
                    ) ] .
            `;

            await loadTurtle(turtleData);

            const pathList = shaclModel.readSingleProperty(
                factory.namedNode('http://example.org/PersonShape'),
                SH.PATH
            )!;

            const propertyPath = new PropertyPath(pathList, shaclModel);
            const sparqlPath = propertyPath.toSparql(false);

            expect(sparqlPath).toBe('(<http://example.org/knows>|<http://example.org/colleague>|<http://example.org/friend>)');
        });

        it('should render a complex nested path correctly', async () => {
            const turtleData = `
                @prefix ex: <http://example.org/> .
                @prefix sh: <http://www.w3.org/ns/shacl#> .

                ex:PersonShape
                    sh:path [ sh:oneOrMorePath (
                        ex:knows
                        ex:name
                    ) ] .
            `;

            await loadTurtle(turtleData);

            const pathList = shaclModel.readSingleProperty(
                factory.namedNode('http://example.org/PersonShape'),
                SH.PATH
            )!;

            const propertyPath = new PropertyPath(pathList, shaclModel);
            const sparqlPath = propertyPath.toSparql(false);

            expect(sparqlPath).toBe('<http://example.org/knows>/<http://example.org/name>+');
        });

        it('should render an inverse sequence path correctly', async () => {
            const turtleData = `
                @prefix ex: <http://example.org/> .
                @prefix sh: <http://www.w3.org/ns/shacl#> .

                ex:PersonShape
                    sh:path [ sh:inversePath (
                        ex:knows
                        ex:name
                    ) ] .
            `;

            await loadTurtle(turtleData);

            const pathList = shaclModel.readSingleProperty(
                factory.namedNode('http://example.org/PersonShape'),
                SH.PATH
            )!;

            const propertyPath = new PropertyPath(pathList, shaclModel);
            const sparqlPath = propertyPath.toSparql(false);

            expect(sparqlPath).toBe('^(<http://example.org/knows>/<http://example.org/name>)');
        });
    });
});
