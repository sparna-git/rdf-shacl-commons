
import { Quad, Term, NamedNode } from "@rdfjs/types/data-model";
import { RdfStore } from "rdf-stores";
import { Graph, PipelineInput } from "sparql-engine";
import { DataFactory } from "rdf-data-factory";
import ExecutionContext from "sparql-engine/dist/engine/context/execution-context";

/**
 * Wrapper class to adapt RdfStore to the Graph interface required by sparql-engine
 */
export class RdfStoreGraph extends Graph {
    private store: RdfStore;
    private factory = new DataFactory();

    constructor(store: RdfStore) {
        super();
        this.store = store;
    }

    /**
     * Find all quads matching the given pattern
     * @param triple Pattern with subject, predicate, object (null, string, or Term)
     * @param context Execution context (required by sparql-engine interface)
     * @returns Array of matching quads converted to TripleObject format
     */
    find(triple: any, context: ExecutionContext): PipelineInput<any> {
        // sparql-engine passes:
        // - Variables as strings starting with '?' (e.g., '?person')
        // - URIs as strings (e.g., 'http://example.org/name')
        // - Literals as Literal Term objects
        // - null for unconstrained positions
        
        const subject = this.normalizePattern(triple.subject);
        const predicate = this.normalizePattern(triple.predicate);
        const object = this.normalizePattern(triple.object);

        const results = this.store.getQuads(subject, predicate, object, null);
        
        // Convert Quads to sparql-engine's TripleObject format (strings)
        const triples = results.map(quad => ({
            subject: quad.subject.value,
            predicate: quad.predicate.value,
            object: quad.object.value
        }));
        
        return triples;
    }

    /**
     * Convert sparql-engine pattern values to RdfStore-compatible values
     * - SPARQL variables (strings starting with '?') become null
     * - URI strings become NamedNode Terms
     * - Term objects are returned as-is
     * - null/undefined stay null
     */
    private normalizePattern(value: any): Term | null {
        if (value === null || value === undefined) {
            return null;
        }

        // If it's a SPARQL variable, return null (wildcard)
        if (typeof value === 'string' && value.startsWith('?')) {
            return null;
        }

        // If it's a string (URI), convert to NamedNode
        if (typeof value === 'string') {
            return this.factory.namedNode(value);
        }

        // If it's already a Term object, return as-is
        return value;
    }

    /**
     * Estimate the cardinality (number of results) for a triple pattern
     * @param triple Pattern with subject, predicate, object
     * @returns Promise that resolves to the estimated number of results
     */
    estimateCardinality(triple: any): Promise<number> {
        const subject = this.normalizePattern(triple.subject);
        const predicate = this.normalizePattern(triple.predicate);
        const object = this.normalizePattern(triple.object);
        
        const quads = this.store.getQuads(subject, predicate, object, null);
        return Promise.resolve(quads.length);
    }

    /**
     * Insert a quad into the store
     * @param triple The triple to insert
     * @returns Promise that resolves when insertion is complete
     */
    insert(triple: any): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const subject = this.normalizePattern(triple.subject);
                const predicate = this.normalizePattern(triple.predicate);
                const object = this.normalizePattern(triple.object);
                
                // Only add if all required fields are present
                if (subject && predicate && object) {
                    const quad = this.factory.quad(subject as any, predicate as any, object as any);
                    this.store.addQuad(quad);
                }
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Delete a quad from the store
     * @param triple The triple to delete
     * @returns Promise that resolves when deletion is complete
     */
    delete(triple: any): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const subject = this.normalizePattern(triple.subject);
                const predicate = this.normalizePattern(triple.predicate);
                const object = this.normalizePattern(triple.object);
                
                // Only delete if all required fields are present
                if (subject && predicate && object) {
                    const quad = this.factory.quad(subject as any, predicate as any, object as any);
                    this.store.removeQuad(quad);
                }
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Clear all quads from the store
     * @returns Promise that resolves when the store is cleared
     */
    clear(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                // Get all quads and remove them
                const allQuads = this.store.getQuads(null, null, null, null);
                allQuads.forEach(quad => {
                    this.store.removeQuad(quad);
                });
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

}
