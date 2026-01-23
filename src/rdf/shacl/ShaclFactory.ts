import { SH } from "../vocabularies/SH";
import { Term } from "@rdfjs/types/data-model";

import type { Shape } from "./Shape";
import type { ShaclModel } from "./ShaclModel";

export class ShapeFactory {

    static buildShape(resource: Term, graph: ShaclModel): Shape {
        // the resource must be a named node or blank node
        if (resource.termType != "NamedNode" && resource.termType != "BlankNode") {
            throw new Error("The shape resource must be a named node or a blank node");
        }

        // if the resource has an sh:path, it is a property shape
        // otherwise it is a node shape
        if(graph.hasTriple(resource, SH.PATH, null)) {
            // using dynamic import to avoid circular dependencies
            const { PropertyShape } = require('./PropertyShape');
            return new PropertyShape(resource, graph);
        } else {
            // using dynamic import to avoid circular dependencies
            const { NodeShape } = require('./NodeShape');
            return new NodeShape(resource, graph);
        }
    }

}