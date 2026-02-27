import { RdfStore } from 'rdf-stores';
import { ShaclModel } from '../ShaclModel';
import { SH } from '../../vocabularies/SH';
import { RdfStoreReader } from '../../RdfStoreReader';
import { BlankNode, DataFactory } from 'rdf-data-factory';
import { ShapeFactory } from '../ShaclFactory';
import { PropertyShape } from '../PropertyShape';

const factory = new DataFactory();

describe('PropertyShape', () => {
    let store: RdfStore;
    let shaclModel: ShaclModel;

    beforeEach(() => {
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

    describe('getRangeShapes', () => {
        it('should return the single range class when defined directly on the property shape', async () => {
            const turtle = `
                @prefix ex: <http://example.org/> .
                @prefix sh: <http://www.w3.org/ns/shacl#> .

                ex:PersonShape
                    a sh:NodeShape ;
                    sh:property [
                        sh:path ex:knows ;
                        sh:node ex:Foo ;
                    ] .
            `;

            await loadTurtle(turtle);

            const shapeNode = factory.namedNode('http://example.org/PersonShape');
            const prop = shaclModel.readProperty(shapeNode, SH.PROPERTY)[0];
            const propertyShape = ShapeFactory.buildShape(prop as BlankNode, shaclModel) as PropertyShape;

            const ranges = propertyShape.getRangeShapes();
            expect(ranges.length).toBe(1);
            expect(ranges[0]!.resource.value).toBe('http://example.org/Foo');
        });

        it('should return both classes defined inside a top-level sh:or', async () => {
            const turtle = `
                @prefix ex: <http://example.org/> .
                @prefix sh: <http://www.w3.org/ns/shacl#> .

                ex:PersonShape
                    a sh:NodeShape ;
                    sh:property [
                        sh:path ex:knows ;
                        sh:or (
                            [ sh:node ex:Foo ]
                            [ sh:node ex:Bar ]
                        )
                    ] .
            `;

            await loadTurtle(turtle);

            const shapeNode = factory.namedNode('http://example.org/PersonShape');
            const prop = shaclModel.readProperty(shapeNode, SH.PROPERTY)[0];
            const propertyShape = ShapeFactory.buildShape(prop as BlankNode, shaclModel) as PropertyShape;

            const ranges = propertyShape.getRangeShapes();
            const values = ranges.map(r => r.resource.value).sort();
            expect(values).toEqual([
                'http://example.org/Bar',
                'http://example.org/Foo'
            ]);
        });

        it('should dig one level deeper in nested sh:or structures', async () => {
            const turtle = `
                @prefix ex: <http://example.org/> .
                @prefix sh: <http://www.w3.org/ns/shacl#> .

                ex:PersonShape
                    a sh:NodeShape ;
                    sh:property [
                        sh:path ex:knows ;
                        sh:or (
                            [ sh:or (
                                [ sh:node ex:Baz ]
                            ) ]
                        )
                    ] .
            `;

            await loadTurtle(turtle);

            const shapeNode = factory.namedNode('http://example.org/PersonShape');
            const prop = shaclModel.readProperty(shapeNode, SH.PROPERTY)[0];
            const propertyShape = ShapeFactory.buildShape(prop as BlankNode, shaclModel) as PropertyShape;

            const ranges = propertyShape.getRangeShapes();
            expect(ranges.length).toBe(1);
            expect(ranges[0]!.resource.value).toBe('http://example.org/Baz');
        });

        it('should work with anonymous nodes', async () => {
            const turtle = `
                @prefix ex: <http://example.org/> .
                @prefix sh: <http://www.w3.org/ns/shacl#> .
                @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
                @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

                ex:PersonShape
                    a sh:NodeShape ;
                    sh:property [
                        sh:path ex:knows ;
                        sh:or (
                            [ sh:datatype xsd:string ]
                            [ sh:datatype rdf:langString ]
                        )
                    ] .
            `;

            await loadTurtle(turtle);

            const shapeNode = factory.namedNode('http://example.org/PersonShape');
            const prop = shaclModel.readProperty(shapeNode, SH.PROPERTY)[0];
            const propertyShape = ShapeFactory.buildShape(prop as BlankNode, shaclModel) as PropertyShape;

            const ranges = propertyShape.getRangeShapes();
            expect(ranges.length).toBe(2);
            expect(ranges[0]!.getShDatatype()[0]!.getUri().value).toBe('http://www.w3.org/2001/XMLSchema#string');
            expect(ranges[0]!.resource.termType).toBe('BlankNode');
            expect(ranges[1]!.getShDatatype()[0]!.getUri().value).toBe('http://www.w3.org/1999/02/22-rdf-syntax-ns#langString');
            expect(ranges[1]!.resource.termType).toBe('BlankNode');
        });


        it('should work with Nakala config', async () => {
            const turtle = `
                @prefix ex: <http://example.org/> .
                @prefix sh: <http://www.w3.org/ns/shacl#> .
                @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
                @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

                ex:PersonShape
                    a sh:NodeShape ;
                    sh:property [
                        sh:path ex:knows ;
                        sh:or (
                            [ sh:nodeKind sh:IRI ]
                            [ sh:nodeKind sh:Literal ; sh:or ( [ sh:datatype xsd:string ] [ sh:datatype rdf:langString ] ) ]
                        )
                    ] .
            `;

            await loadTurtle(turtle);

            const shapeNode = factory.namedNode('http://example.org/PersonShape');
            const prop = shaclModel.readProperty(shapeNode, SH.PROPERTY)[0];
            const propertyShape = ShapeFactory.buildShape(prop as BlankNode, shaclModel) as PropertyShape;

            const ranges = propertyShape.getRangeShapes();
            expect(ranges.length).toBe(3);
            expect(ranges[0]!.getShNodeKind()?.value).toBe('http://www.w3.org/ns/shacl#IRI');
            expect(ranges[1]!.getShDatatype()[0]!.getUri().value).toBe('http://www.w3.org/2001/XMLSchema#string');
            expect(ranges[2]!.getShDatatype()[0]!.getUri().value).toBe('http://www.w3.org/1999/02/22-rdf-syntax-ns#langString');
        });

        it('should return an empty array when no range is defined', async () => {
            const turtle = `
                @prefix ex: <http://example.org/> .
                @prefix sh: <http://www.w3.org/ns/shacl#> .

                ex:PersonShape
                    a sh:NodeShape ;
                    sh:property [
                        sh:path ex:knows
                    ] .
            `;

            await loadTurtle(turtle);

            const shapeNode = factory.namedNode('http://example.org/PersonShape');
            const prop = shaclModel.readProperty(shapeNode, SH.PROPERTY)[0];
            const propertyShape = ShapeFactory.buildShape(prop as BlankNode, shaclModel) as PropertyShape;

            const ranges = propertyShape.getRangeShapes();
            expect(ranges).toEqual([]);
        });
    });
});
