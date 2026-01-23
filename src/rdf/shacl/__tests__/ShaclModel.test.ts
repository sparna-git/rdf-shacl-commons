import { RdfStore } from 'rdf-stores';
import { ShaclModel } from '../ShaclModel';
import { SH } from '../../vocabularies/SH';
import { RdfStoreReader } from '../../RdfStoreReader';
import { DataFactory } from 'rdf-data-factory';

const factory = new DataFactory();

describe('ShaclModel', () => {
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

    describe('addInversePropertyShapes', () => {
        it('should create inverse property shapes with sh:node references', async () => {
            // Setup: Create a simple property shape with a direct path using Turtle
            const turtleData = `
                @prefix ex: <http://example.org/> .
                @prefix sh: <http://www.w3.org/ns/shacl#> .
                @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
                @prefix owl: <http://www.w3.org/2002/07/owl#>.

                ex:FooShape
                    a sh:NodeShape ;
                    sh:property [
                        sh:path ex:test1 ;
                        sh:node ex:RangeShape ;
                    ] .
                
                ex:RangeShape
                    a sh:NodeShape .

                ex:inverseOfTest1 owl:inverseOf ex:test1 .
            `;

            await loadTurtle(turtleData);

            const rangeClass = factory.namedNode('http://example.org/RangeShape');

            // Execute: Add inverse property shapes
            ShaclModel.addInversePropertyShapes(store);

            // Verify: Check that inverse property shapes were created on the range class
            const inversePropertyShapes = store.getQuads(
                rangeClass,
                SH.PROPERTY,
                null,
                null
            );

            expect(inversePropertyShapes.length).toBeGreaterThan(0);
            
            // Verify the inverse property shape has the inverse path
            const inversePropertyShape = inversePropertyShapes[0]!.object;
            const inversePaths = store.getQuads(
                inversePropertyShape,
                SH.PATH,
                null,
                null
            );
            
            expect(inversePaths.length).toBeGreaterThan(0);
        });

        it('should not create duplicate inverse property shapes', async () => {
            // Setup: Create a property shape with a direct path and existing inverse
            const turtleData = `
                @prefix ex: <http://example.org/> .
                @prefix sh: <http://www.w3.org/ns/shacl#> .
                @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
                @prefix owl: <http://www.w3.org/2002/07/owl#>.

                ex:PersonShape
                    a sh:NodeShape ;
                    sh:property [
                        sh:path ex:test2 ;
                        sh:node ex:RangeShape ;
                    ] .

                ex:RangeShape
                    sh:property [
                        sh:path [ sh:inversePath ex:test2 ] ;
                    ] ;
                .

                ex:inverseOfTest2 owl:inverseOf ex:test2 .
            `;

            await loadTurtle(turtleData);

            const rangeClass = factory.namedNode('http://example.org/RangeShape');
            const countBefore = store.getQuads(rangeClass, SH.PROPERTY, null, null).length;

            // Execute: Add inverse property shapes
            ShaclModel.addInversePropertyShapes(store);

            const countAfter = store.getQuads(rangeClass, SH.PROPERTY, null, null).length;

            // Verify: No duplicate should be created
            expect(countAfter).toBe(countBefore);
        });

        it('should handle sh:or constraints', async () => {
            // Setup: Create a property shape with sh:or
            const turtleData = `
                @prefix ex: <http://example.org/> .
                @prefix sh: <http://www.w3.org/ns/shacl#> .
                @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
                @prefix owl: <http://www.w3.org/2002/07/owl#>.

                ex:PersonShape
                    a sh:NodeShape ;
                    sh:property [
                        sh:path ex:knows ;
                        sh:or (
                            [ sh:class ex:Foo ]
                            [ sh:class ex:Bar ]
                        ) ;
                    ] .

                ex:FooShape
                    a sh:NodeShape ;
                    sh:targetClass ex:Foo .
                    
                ex:BarShape
                    a sh:NodeShape ;
                    sh:targetClass ex:Bar .

                ex:inverseOfKnows owl:inverseOf ex:knows .
            `;

            await loadTurtle(turtleData);

            

            // Execute: Add inverse property shapes
            ShaclModel.addInversePropertyShapes(store);

            // Verify: Inverse shapes should be created for classes in sh:or
            const class1 = factory.namedNode('http://example.org/FooShape');
            const inverseShapesForClass1 = store.getQuads(class1, SH.PROPERTY, null, null);
            expect(inverseShapesForClass1.length).toBeGreaterThan(0);

            const class2 = factory.namedNode('http://example.org/BarShape');
            const inverseShapesForClass2 = store.getQuads(class2, SH.PROPERTY, null, null);
            expect(inverseShapesForClass2.length).toBeGreaterThan(0);
        });

        it('should skip non-NamedNode paths', async () => {
            // Setup: Create a property shape with a blank node path (complex path)
            const turtleData = `
                @prefix ex: <http://example.org/> .
                @prefix sh: <http://www.w3.org/ns/shacl#> .
                @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .

                ex:PersonShape
                    a sh:NodeShape ;
                    sh:property [ 
                        sh:path [ sh:zeroOrMorePath ex:knows ] ;
                        sh:class ex:Person
                    ] .
            `;

            await loadTurtle(turtleData);

            const rangeClass = factory.namedNode('http://example.org/Person');
            const countBefore = store.getQuads(rangeClass, SH.PROPERTY, null, null).length;

            // Execute: Add inverse property shapes
            ShaclModel.addInversePropertyShapes(store);

            const countAfter = store.getQuads(rangeClass, SH.PROPERTY, null, null).length;

            // Verify: No inverse shapes should be created for non-NamedNode paths
            expect(countAfter).toBe(countBefore);
        });
    });
});
