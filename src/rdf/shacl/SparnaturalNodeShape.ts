
import { DataFactory } from 'rdf-data-factory';
import { Resource } from '../Resource';
import { ShaclModel } from './ShaclModel';

import { NodeShape } from './NodeShape';
import { PropertyShape } from './PropertyShape';
import { SparnaturalPropertyShape, SparnaturalPropertyShapeFactory } from './SparnaturalPropertyShape';
import { Shape } from './Shape';

const factory = new DataFactory();

export class SparnaturalNodeShape {

    protected nodeShape:NodeShape;

    constructor(nodeShape:NodeShape) {
        this.nodeShape = nodeShape;
    }

    /**
     * @returns all valid sparnatural properties available on this node shape, including inherited properties from superclasses
     */
    getValidProperties(): PropertyShape[] {
        let validProperties = this.nodeShape.getProperties().filter(p => SparnaturalPropertyShapeFactory.buildSparnaturalPropertyShape(p.resource, this.nodeShape.graph).isValidSparnaturalSHACLSpecificationProperty() );

        // dedup, although probably dedup is not necessary here
        return [...new Set(validProperties)];
    }

}

