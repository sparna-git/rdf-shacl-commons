import { Term } from "@rdfjs/types/data-model";

import { Model } from "../Model";
import { RDF } from "../vocabularies/RDF";
import { SH } from "../vocabularies/SH";


/**
 * Represents a SHACL Property Path. It can be serialized to SPARQL property path syntax.
 */
export class PropertyPath {

  resource: Term;
  graph:Model;

  constructor(resource:Term, graph:Model) {
    this.resource = resource;
    this.graph = graph;
  }

  isInversePath(): boolean {
    if (this.resource.termType === "BlankNode") {
        return this.graph.hasProperty(this.resource, SH.INVERSE_PATH);
    }
    return false;
  }

  getInversePath(): Term | undefined {
    if (this.isInversePath()) {
        return this.graph.readSingleProperty(this.resource, SH.INVERSE_PATH);
    }
    return undefined;
  }

  /**
   * Renders the provided SHACL property path as a SPARQL property path syntax, either
   * using full URIs or local names.
   * @param path The SHACL property path to render in SPARQL.
   * @param useLocalName True to use local names only for human rendering, false to use full URIs.
   * @return The rendered SPARQL property path.
   */
  toSparql(useLocalName: boolean = false): string {
      if (this.resource.termType === "NamedNode") {
          if (useLocalName) {
                return Model.getLocalName(this.resource.value);
          } else {
              return `<${this.resource.value}>`;
          }
      } else if (this.resource.termType === "BlankNode") {
          if (this.graph.store.getQuads(this.resource, RDF.FIRST, null, null).length > 0) {
              // This is an RDF list, indicating a sequence path
              const sequence: Term[] = this.graph.readListContent(this.resource);              
              return sequence.map(t => new PropertyPath(t, this.graph).toSparql(useLocalName)).join("/");
          } else {
              if (this.graph.hasProperty(this.resource, SH.ONE_OR_MORE_PATH)) {
                  return new PropertyPath(
                    this.graph.readSingleProperty(this.resource, SH.ONE_OR_MORE_PATH)!,
                    this.graph
                  ).toSparql(useLocalName) + "+";
              }
              if (this.graph.hasProperty(this.resource, SH.INVERSE_PATH)) {
                const inversedPath = this.graph.readSingleProperty(this.resource, SH.INVERSE_PATH)!;
                if(inversedPath.termType === "NamedNode") {
                    return "^" + new PropertyPath(
                        this.graph.readSingleProperty(this.resource, SH.INVERSE_PATH)!,
                        this.graph
                    ).toSparql(useLocalName);
                } else {
                    return "^" + "(" + new PropertyPath(
                    this.graph.readSingleProperty(this.resource, SH.INVERSE_PATH)!,
                    this.graph
                  ).toSparql(useLocalName) + ")";
                }                  
              }
              if (this.graph.hasProperty(this.resource, SH.ALTERNATIVE_PATH)) {
                  const list = this.graph.readSingleProperty(this.resource, SH.ALTERNATIVE_PATH)!;
                  const sequence: Term[] = this.graph.readListContent(list);
                  return `(${sequence.map(t => new PropertyPath(t, this.graph).toSparql(useLocalName)).join("|")})`;
              }
              if (this.graph.hasProperty(this.resource, SH.ZERO_OR_MORE_PATH)) {
                  return new PropertyPath(
                    this.graph.readSingleProperty(this.resource, SH.ZERO_OR_MORE_PATH)!,
                    this.graph
                  ).toSparql(useLocalName) + "*";
              }
              if (this.graph.hasProperty(this.resource, SH.ZERO_OR_ONE_PATH)) {
                  return new PropertyPath(
                    this.graph.readSingleProperty(this.resource, SH.ZERO_OR_ONE_PATH)!,
                    this.graph
                  ).toSparql(useLocalName) + "?";
              }
          }
      }
      throw new Error("Unsupported SHACL property path");
  }
}