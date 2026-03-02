
import { DataFactory } from 'rdf-data-factory';
import { Resource } from '../Resource';
import { ShaclModel } from './ShaclModel';
import { ShapeFactory } from './ShaclFactory';

import type { NodeShape } from './NodeShape';
import { PropertyShape, StatisticsReader, XSD } from '../..';

const factory = new DataFactory();

export class SparnaturalPropertyShapeFactory {
  static buildSparnaturalPropertyShape(resource:Resource,shaclModel:ShaclModel) {
    return new SparnaturalPropertyShape(
      ShapeFactory.buildShape(resource, shaclModel) as PropertyShape
    );
  }
}

export class SparnaturalPropertyShape {

    private propertyShape:PropertyShape;

    constructor(propertyShape: PropertyShape) {
        this.propertyShape = propertyShape;
    }

    isValidSparnaturalSHACLSpecificationProperty():boolean {
      let statReader:StatisticsReader = new StatisticsReader(this.propertyShape.graph);

      return (
        !this.propertyShape.isDeactivated()
        &&
        !this.propertyShape.getShHasValue()
        &&
        // if there is a qualified value shape with a sh:hasValue, exclude too as this represents a fixed value that we don't want to query
        !(
          this.propertyShape.getShQualifiedValueShape()
          &&
          this.propertyShape.getShQualifiedValueShape()?.getShHasValue()
        )
        &&
        (
          (!statReader.hasStatistics(this.propertyShape.resource))
          ||
          statReader.getTriplesCountForShape(this.propertyShape.resource)! > 0
        )
      );
    }

    getRangeShapes(): NodeShape[] {
      let rangeShapes: Resource[] = [];

      // first read on property shape itself
      rangeShapes = this.propertyShape.resolveShNodeOrShClass() ;

      // still nothing, look on the sh:or members
      if(rangeShapes.length == 0) { 
        var rangesFromOrMembersLevel1: Resource[] = [];

        var orMembersLevel1:NodeShape[] = this.propertyShape.getShOr().map(m => ShapeFactory.buildShape(m, this.propertyShape.graph) as NodeShape);  
        orMembersLevel1?.forEach(orMemberLevel1 => {
          // read sh:class / sh:node
          var orMemberLevel1Range: Resource[] = orMemberLevel1.resolveShNodeOrShClass() ;

          // if still nothing, recurse one level more
          if(orMemberLevel1Range.length == 0) {
            var rangesFromOrMembersLevel2:Resource[] = [];

            var orMembersLevel2:NodeShape[] = orMemberLevel1.getShOr().map(m => ShapeFactory.buildShape(m, this.propertyShape.graph) as NodeShape);  
            orMembersLevel2?.forEach(orMemberLevel2 => {
              // read sh:class / sh:node
              var orMemberLevel2ShapeRanges: Resource[] = orMemberLevel2.resolveShNodeOrShClass();
              
              if(orMemberLevel2ShapeRanges.length == 0) {
                // if no range shape found for this or-member, we consider that the range shape is the or-member itself
                rangesFromOrMembersLevel2.push(orMemberLevel2.resource);
              } else {
                rangesFromOrMembersLevel2.push(...orMemberLevel2ShapeRanges);
              }
            });

            if(rangesFromOrMembersLevel2.length == 0) {
              // if no range shape found for this or-member, we consider that the range shape is the or-member itself
              orMemberLevel1Range.push(orMemberLevel1.resource);
            } else {
              orMemberLevel1Range.push(...rangesFromOrMembersLevel2);
            }
            
          }

          rangesFromOrMembersLevel1.push(...orMemberLevel1Range);       
        });

        rangeShapes.push(...rangesFromOrMembersLevel1);
      }

      return rangeShapes.map(r => ShapeFactory.buildShape(r, this.propertyShape.graph) as NodeShape);
    }

}

