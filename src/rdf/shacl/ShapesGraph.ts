import { ShaclModel } from "./ShaclModel";
import { Resource, ResourceFactory } from "../Resource";
import { RDF } from "../vocabularies/RDF";
import { SH } from "../vocabularies/SH";
import { OWL } from "../vocabularies/OWL";
import { DCT } from "../vocabularies/DCT";

/**
 * Wraps a ShaclModel to expose metadata defined on the shapes graph entity,
 * i.e. the entity typed as sh:ShapesGraph or owl:Ontology.
 * Supports reading sh:agentInstruction, dcterms:title, and dcterms:description.
 */
export class ShapesGraph {

    graph: ShaclModel;

    constructor(graph: ShaclModel) {
        this.graph = graph;
    }

    /**
     * Finds the entity typed as sh:ShapesGraph or owl:Ontology.
     * sh:ShapesGraph is tested first, then owl:Ontology as fallback.
     * @returns The resource, or undefined if none is found.
     */
    getShapesGraphEntity(): Resource | undefined {
        const shapesGraphSubjects = this.graph.findSubjectsOf(RDF.TYPE, SH.SHAPES_GRAPH);
        if (shapesGraphSubjects.length > 0) {
            return ResourceFactory.fromTerm(shapesGraphSubjects[0]);
        }
        const ontologySubjects = this.graph.findSubjectsOf(RDF.TYPE, OWL.ONTOLOGY);
        if (ontologySubjects.length > 0) {
            return ResourceFactory.fromTerm(ontologySubjects[0]);
        }
        return undefined;
    }

    /**
     * Reads sh:agentInstruction on the shapes graph entity.
     * @param lang Preferred language tag (e.g. "en"). Falls back to literals with no language tag.
     * @returns The instruction string, or undefined if not found.
     */
    getAgentInstruction(lang: string): string | undefined {
        const entity = this.getShapesGraphEntity();
        if (!entity) return undefined;
        return this.graph.readSinglePropertyInLang(entity, SH.AGENT_INSTRUCTION, lang)?.value;
    }

    /**
     * Reads dcterms:title on the shapes graph entity.
     * @param lang Preferred language tag (e.g. "en"). Falls back to literals with no language tag.
     * @returns The title string, or undefined if not found.
     */
    getTitle(lang: string): string | undefined {
        const entity = this.getShapesGraphEntity();
        if (!entity) return undefined;
        return this.graph.readSinglePropertyInLang(entity, DCT.TITLE, lang)?.value;
    }

    /**
     * Reads dcterms:description on the shapes graph entity.
     * @param lang Preferred language tag (e.g. "en"). Falls back to literals with no language tag.
     * @returns The description string, or undefined if not found.
     */
    getDescription(lang: string): string | undefined {
        const entity = this.getShapesGraphEntity();
        if (!entity) return undefined;
        return this.graph.readSinglePropertyInLang(entity, DCT.DESCRIPTION, lang)?.value;
    }

}
