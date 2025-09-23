import { SH } from "../vocabularies/SH";
import { NodeShape } from "./NodeShape";
import { PropertyShape } from "./PropertyShape";
import { ShaclModel } from "./ShaclModel";
import { Shape } from "./Shape";
import { Term } from "@rdfjs/types/data-model";

export class ShapeFactory {

    static buildShape(resource: Term, graph: ShaclModel): Shape {
        // the resource must be a named node or blank node
        if (resource.termType != "NamedNode" && resource.termType != "BlankNode") {
            throw new Error("The shape resource must be a named node or a blank node");
        }

        // if the resource has an sh:path, it is a property shape
        // otherwise it is a node shape
        if(graph.hasTriple(resource, SH.PATH, null)) {
            return new PropertyShape(resource, graph);
        } else {
            return new NodeShape(resource, graph);
        }
    }

}