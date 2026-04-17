import { RdfStore } from 'rdf-stores';
import { ShaclModel } from '../ShaclModel';
import { SH } from '../../vocabularies/SH';
import { DASH } from '../../vocabularies/DASH';
import { RdfStoreReader } from '../../RdfStoreReader';
import { DataFactory } from 'rdf-data-factory';
import { NodeShape } from '../NodeShape';

const factory = new DataFactory();

describe('NodeShape', () => {
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

    describe('findPropertyShapesByDashPropertyRole', () => {
        it('should return property shapes with DASH.LABEL_ROLE', async () => {
            const turtle = `
                @prefix ex: <http://example.org/> .
                @prefix sh: <http://www.w3.org/ns/shacl#> .
                @prefix dash: <http://datashapes.org/dash#> .

                ex:PersonShape
                    a sh:NodeShape ;
                    sh:property [
                        sh:path ex:name ;
                        dash:propertyRole dash:LabelRole ;
                    ] .
            `;

            await loadTurtle(turtle);

            const shapeNode = factory.namedNode('http://example.org/PersonShape');
            const nodeShape = new NodeShape(shapeNode, shaclModel);
            const labelProperties = nodeShape.findPropertyShapesByDashPropertyRole(DASH.LABEL_ROLE);

            expect(labelProperties).toHaveLength(1);
            expect(labelProperties[0]!.getShPath().value).toBe('http://example.org/name');
        });
    });

    describe('findPropertyShapesByDashPropertyRole', () => {
        it('should return property shapes with DASH.KEY_INFO_ROLE', async () => {
            const turtle = `
                @prefix ex: <http://example.org/> .
                @prefix sh: <http://www.w3.org/ns/shacl#> .
                @prefix dash: <http://datashapes.org/dash#> .

                ex:PersonShape
                    a sh:NodeShape ;
                    sh:property [
                        sh:path ex:foo ;
                        dash:propertyRole dash:KeyInfoRole ;
                    ] ;
                    sh:property [
                        sh:path ex:bar ;
                        dash:propertyRole dash:KeyInfoRole ;
                    ] .
            `;

            await loadTurtle(turtle);

            const shapeNode = factory.namedNode('http://example.org/PersonShape');
            const nodeShape = new NodeShape(shapeNode, shaclModel);
            const keyInfoProperties = nodeShape.findPropertyShapesByDashPropertyRole(DASH.KEY_INFO_ROLE);

            expect(keyInfoProperties).toHaveLength(2);
        });
    });

    describe('getDefaultLabelProperty', () => {
        it('should return property shapes with DASH.LABEL_ROLE', async () => {
            const turtle = `
                @prefix ex: <http://example.org/> .
                @prefix sh: <http://www.w3.org/ns/shacl#> .
                @prefix dash: <http://datashapes.org/dash#> .

                ex:PersonShape
                    a sh:NodeShape ;
                    sh:property [
                        sh:path ex:name ;
                        dash:propertyRole dash:LabelRole ;
                    ] .
            `;

            await loadTurtle(turtle);

            const shapeNode = factory.namedNode('http://example.org/PersonShape');
            const nodeShape = new NodeShape(shapeNode, shaclModel);
            const defaultLabelProp = nodeShape.getDefaultLabelProperty();

            expect(defaultLabelProp).not.toBeNull();
            expect(defaultLabelProp!.getShPath().value).toBe('http://example.org/name');
        });
    });

    describe('getDefaultLabelProperty', () => {
        it('should return property shape of path skos:prefLabel', async () => {
            const turtle = `
                @prefix ex: <http://example.org/> .
                @prefix sh: <http://www.w3.org/ns/shacl#> .
                @prefix dash: <http://datashapes.org/dash#> .
                @prefix skos: <http://www.w3.org/2004/02/skos/core#> .

                ex:PersonShape
                    a sh:NodeShape ;
                    sh:property [
                        sh:path skos:prefLabel ;
                    ] .
            `;

            await loadTurtle(turtle);

            const shapeNode = factory.namedNode('http://example.org/PersonShape');
            const nodeShape = new NodeShape(shapeNode, shaclModel);
            const defaultLabelProp = nodeShape.getDefaultLabelProperty();

            expect(defaultLabelProp).not.toBeNull();
            expect(defaultLabelProp!.getShPath().value).toBe('http://www.w3.org/2004/02/skos/core#prefLabel');
        });
    });
});