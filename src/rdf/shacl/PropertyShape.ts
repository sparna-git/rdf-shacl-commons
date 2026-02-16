
import { DataFactory, NamedNode } from 'rdf-data-factory';
import { Quad_Subject, Term } from "@rdfjs/types/data-model";

import { Shape } from './Shape';
import { Resource, ResourceFactory } from '../Resource';
import { ShaclModel } from './ShaclModel';
import { RDFS } from '../vocabularies/RDFS';
import { SH } from '../vocabularies/SH';
import { Model } from '../Model';
import { VOLIPI } from '../vocabularies/VOLIPI';
import { SKOS } from '../vocabularies/SKOS';
import { SearchWidgetIfc, SearchWidgetRegistry } from './SearchWidgets';
import { ShapeFactory } from './ShaclFactory';

import type { NodeShape } from './NodeShape';
import { PropertyPath } from './PropertyPath';
import { OWL } from '../vocabularies/OWL';
import { XSD } from '../..';

const factory = new DataFactory();

export class PropertyShape extends Shape {

    constructor(resource:Resource, graph:ShaclModel) {
        super(resource, graph);
    }

    getInverseShProperty(): NodeShape[] {
      let nodeShapes:NodeShape[] = 
            this.graph.findSubjectsOf(SH.PROPERTY, this.resource)
            .map(node => ShapeFactory.buildShape(node, this.graph) as NodeShape);

      return nodeShapes;
    }

    /**
     * @returns the sh:path of this property shape
     */
    getShPath(): Resource {
        let path = ResourceFactory.fromTerm(this.graph.readSingleProperty(this.resource, SH.PATH));
        if(!path) {
          throw new Error("Property shape " + this.resource.value + " has no sh:path");
        } else {
          return path;
        }        
    }

    /**
     * @returns this list of values defined in sh:in, if any, otherwise undefined
     */
    getShIn():Term[] | undefined {
      let values:Term[] = this.graph.readAsList(this.resource, SH.IN);
      return (values.length > 0) ? values : undefined;
    }

    /**
     * @returns The single value defined with sh:hasValue, if any
     */
    getShHasValue():Term | undefined {
      return this.graph.readSingleProperty(this.resource, SH.HAS_VALUE);
    }

    /**
     * @returns the sh:minCount number if defined, otherwise undefined
     */
    getShMinCount(): number | undefined {
      let minCount = this.graph.readSinglePropertyAsNumber(this.resource, SH.MIN_COUNT);
      return (minCount !== undefined) ? minCount : undefined;
    }

    /**
     * @returns the sh:maxCount number if defined, otherwise undefined
     */
    getShMaxCount(): number | undefined {
      let maxCount = this.graph.readSinglePropertyAsNumber(this.resource, SH.MAX_COUNT);
      return (maxCount !== undefined) ? maxCount : undefined;
    }

    /**
     * @returns the sh:qualifiedMinCount number if defined, otherwise undefined
     */
    getShQualifiedMinCount(): number | undefined {
      let minCount = this.graph.readSinglePropertyAsNumber(this.resource, SH.MIN_COUNT);
      return (minCount !== undefined) ? minCount : undefined;
    }

    /**
     * @returns the sh:qualifiedMaxCount number if defined, otherwise undefined
     */
    getShQualifiedMaxCount(): number | undefined {
      let maxCount = this.graph.readSinglePropertyAsNumber(this.resource, SH.MAX_COUNT);
      return (maxCount !== undefined) ? maxCount : undefined;
    }

    /**
     * @returns the sh:qualifiedValueShape if defined, otherwise undefined
     */
    getShQualifiedValueShape(): NodeShape | undefined {
      let qvs:NodeShape|undefined = 
            this.graph.readProperty(this.resource, SH.QUALIFIED_VALUE_SHAPE)
            .map(node => ShapeFactory.buildShape(node, this.graph) as NodeShape)[0];

      return qvs;
    }

    /**
     * @returns true if the shape is single line (sh:singleLine true^^xsd:boolean)
     */
    isSingleLine(): boolean {
      return this.graph.hasTriple(this.resource, SH.SINGLE_LINE, factory.literal("true", XSD.BOOLEAN));
    }

    getLabel(lang:string): string {
      // first try to read an sh:name
      let label = this.graph.readSinglePropertyInLang(this.resource, SH.NAME, lang)?.value;

      if(!label) {
        if(this.graph.hasTriple(this.resource,SH.PATH, null)) {
          let thePath = this.getShPath();
          if(thePath.termType === "NamedNode") {
            // try to read the rdfs:label of the property itself
            // note that we try to read an rdfs:label event in case the path is a blank node, e.g. sequence path
            label = this.graph.readSinglePropertyInLang(
              thePath,
              RDFS.LABEL, 
              lang)?.value;
          } else if(new PropertyPath(thePath, this.graph).isInversePath()) {
            let inversePath = new PropertyPath(thePath, this.graph).getInversePath();
            if(inversePath && inversePath.termType === "NamedNode") {
              // try to read the rdfs:label of the OWL property
              // that references this one with owl:inverseOf
              // be careful as owl:inverseOf may be expressed in either direction
              let inverseProperty = this.#getInverseOf(inversePath);
              if(inverseProperty) {
                label = this.graph.readSinglePropertyInLang(
                  inverseProperty,
                  RDFS.LABEL, 
                  lang)?.value;
              }
            }
          }
        }
      }

      // no sh:name present, no property label, display the sh:path without prefixes
      if(!label) {
        label = new PropertyPath(this.getShPath(), this.graph).toSparql( true);
      }      
      // or try to read the local part of the URI, but should not happen
      if(!label) {
        label = Model.getLocalName(this.resource.value) as string;
      }

      return label;
    }

    hasInverseOfPredicate(): boolean {
      if(
        this.getShPath().termType === "NamedNode"
        &&
        this.#getInverseOf(this.getShPath()!)
      ) {
        return true;
      }
      return false;
    } 

    /**
     * 
     * @param property the *OWL property* to return the inverse of (not a property shape !)
     * @returns 
     */
    #getInverseOf(property:Term):Term|undefined {
      let inverses:Term[] = this.graph.readProperty(property, OWL.INVERSE_OF);
      if(inverses.length > 0) {
        return inverses[0];
      }

      // try the other direction
      inverses = this.graph.findSubjectsOf(OWL.INVERSE_OF, property);
      if(inverses.length > 0) {
        return inverses[0];
      }

      return undefined;
    }

    getTooltip(lang:string): string | undefined {
      let tooltip = this.graph.readSinglePropertyInLang(this.resource, VOLIPI.MESSAGE, lang)?.value;
      if(!tooltip) {
        // try with sh:description
        tooltip = this.graph.readSinglePropertyInLang(this.resource, SH.DESCRIPTION, lang)?.value;
      }

      // make sure we have a path to read properties on the property itself
      if(this.graph.hasTriple(this.resource,SH.PATH, null)) {
        if(!tooltip) {
          // try to read a skos:definition on the property
          // try to read the value of the property itself
          // note that we try to read an rdfs:comment even in case the path is a blank node, e.g. sequence path
          tooltip = this.graph.readSinglePropertyInLang(
            this.getShPath(),
            SKOS.DEFINITION, 
            lang)?.value;
        }

        if(!tooltip) {
          // try to read an rdfs:comment on the property
          // try to read the rdfs:label of the property itself
          // note that we try to read an rdfs:label event in case the path is a blank node, e.g. sequence path
          tooltip = this.graph.readSinglePropertyInLang(
            this.getShPath(),
            RDFS.COMMENT, 
            lang)?.value;
        }
      }

      return tooltip;
    }

    getSearchWidgetForRange(range:Resource): SearchWidgetIfc {
      // select the shape on which this is applied
      // either the property shape, or one of the shape in an inner sh:or

      // find the shapes in the sh:or that has the provided range as sh:class or sh:node
      var theShape:Shape|null = null;

      var orMembers:Shape[] = this.getShOr().map(m => ShapeFactory.buildShape(m, this.graph));
      orMembers.forEach(m => {
        if(m.resolveShNodeOrShClass().map(r => r.value).indexOf(range.value) > -1) {
          theShape = m;
        }
        // recurse one level more
        var orOrMembers:Shape[] = m.getShOr().map(m => ShapeFactory.buildShape(m, this.graph));
        orOrMembers.forEach(orOrMember => {
          if(orOrMember.resolveShNodeOrShClass().map(r => r.value).indexOf(range.value) > -1) {
            theShape = orOrMember;
          }
        });
      });

      // defaults to this property shape
      if(!theShape) {
        theShape = this;
      }

      // read the dash:searchWidget annotation
      let results:Resource[] = theShape.getDashSearchWidget();

      if(results.length) {
        return SearchWidgetRegistry.asSearchWidget(results[0] as NamedNode);
      } else {
        return theShape.getDefaultSearchWidget();
      }
    }

    /**
     * @returns the property shapes that target a superproperty of the property being the path of this shape.
     * In other words follow sh:path/owl:subPropertyOf/^sh:path on the same entity
     */
    getParentProperties(): PropertyShape[] {
      let parentsFromSuperProperties:Term[] = this.getSuperPropertiesOfPath()
      // note : we exclude blank nodes
      .filter(term => term.termType == "NamedNode")
      // we find the property shape having this property as a path
      .map(term => {
          let propertyShapesWithSuperProperty:Quad_Subject[] = this.graph.findSubjectsOf(SH.PATH, term);
          let result:Quad_Subject|undefined = undefined;          

          // we can find multiple property shapes with this super property
          // we need to filter them to find the one that is referenced from the same node shape as the one the current property is attached
          propertyShapesWithSuperProperty.forEach(ps => {
            // a potential issue is that this same property shape may be attached to multiple node shapes, so we need to check on each of them
            this.graph.findSubjectsOf(SH.PROPERTY, this.resource).forEach(nodeShape => {
              if(this.graph.hasTriple(
                nodeShape,
                SH.PROPERTY,
                ps
              )) {
                result = ps;
              }
            });
          })
          return result;
      })
      // remove those for which the shape was not found
      .filter(term => (term != undefined));
      
      // deduplicate set
      let parents = [...new Set([...parentsFromSuperProperties])];
      return parents
      // and simply return the string value
      .map(term => new PropertyShape(term as Resource, this.graph));
    }


    /**
     * @returns the super properties of the property being the path of this shape, following rdfs:subPropertyOf.
     * If the path is an anonymous node, then an empty array is returned.
     */
    getSuperPropertiesOfPath(): Resource[] {
      // retrieve property
      let property:Resource = this.getShPath();

      if(property.termType == "NamedNode") {
        // then retrieve super properties of this one
        let superProperties:Resource[] = this.graph.readProperty(property, RDFS.SUBPROPERTY_OF) as Resource[];
        return superProperties;
      } else {
        return [];
      }
    }



}

