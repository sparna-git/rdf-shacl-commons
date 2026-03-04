import { ShaclModel } from "../ShaclModel";
import { ShapeFactory } from "../ShaclFactory";
import { StatisticsReader } from "../StatisticsReader";
import { Dag, DagIfc, DagNodeIfc } from "../dag/Dag";
import { SparnaturalNodeShape } from "./SparnaturalNodeShape";
import { Shape } from "../Shape";
import { SH } from "../../vocabularies/SH";
import { DataFactory } from "rdf-data-factory";
import type { NodeShape } from "../NodeShape";

const factory = new DataFactory();

export class SparnaturalShaclModel {
  private shaclModel: ShaclModel;

  constructor(shaclModel: ShaclModel) {
    this.shaclModel = shaclModel;
  }

  /**
   * Builds a DAG of entry point NodeShapes, i.e. the NodeShapes that are in the domain
   * of at least one valid Sparnatural property.
   * Children and parent NodeShapes are added recursively.
   * Parent NodeShapes that are not themselves entry points are marked as disabled.
   * Statistics counts are added to root nodes.
   *
   * This is the equivalent of getEntitiesTreeInDomainOfAnyProperty() in Sparnatural.
   *
   * @param lang the language for sorting labels
   * @returns a DAG of SparnaturalNodeShapes
   */
  getEntryPointsNodeShapes(lang: string): DagIfc<SparnaturalNodeShape> {
    // 1. get the entities that are in a domain of a property
    let entities: SparnaturalNodeShape[] = this.getInitialEntityList(lang);

    // 2. add the children of these entities - recursively
    // while the children of every entity is not found in our flat list of entities, continue adding children
    while (
      !entities.every((entity) => {
        return entity.getChildren().every((child) => {
          // avoid testing deactivated shapes
          const childShape = new SparnaturalNodeShape(
            ShapeFactory.buildShape(
              factory.namedNode(child),
              this.shaclModel,
            ) as NodeShape,
          );
          return (
            childShape.getNodeShape().isDeactivated() ||
            entities.find((e) => e.getId() === child) !== undefined
          );
        });
      })
    ) {
      const childrenToAdd: SparnaturalNodeShape[] = [];
      entities.forEach((entity) => {
        entity.getChildren().forEach((child) => {
          const childShape = new SparnaturalNodeShape(
            ShapeFactory.buildShape(
              factory.namedNode(child),
              this.shaclModel,
            ) as NodeShape,
          );
          if (
            !childShape.getNodeShape().isDeactivated() &&
            !entities.find((e) => e.getId() === child)
          ) {
            childrenToAdd.push(childShape);
          }
        });
      });
      childrenToAdd.forEach((p) => entities.push(p));
    }

    // 3. complement the initial list with their parents
    let disabledList: string[] = [];
    while (
      !entities.every((entity) => {
        return entity.getParents().every((parent) => {
          return entities.find((e) => e.getId() === parent) !== undefined;
        });
      })
    ) {
      const parentsToAdd: SparnaturalNodeShape[] = [];
      entities.forEach((entity) => {
        entity.getParents().forEach((parent) => {
          if (!entities.find((e) => e.getId() === parent)) {
            parentsToAdd.push(
              new SparnaturalNodeShape(
                ShapeFactory.buildShape(
                  factory.namedNode(parent),
                  this.shaclModel,
                ) as NodeShape,
              ),
            );
          }
        });
      });
      parentsToAdd.forEach((p) => entities.push(p));
      // also keep that as a disabled node
      parentsToAdd.forEach((p) => disabledList.push(p.getId()));
    }

    const dag: Dag<SparnaturalNodeShape> = new Dag<SparnaturalNodeShape>();
    dag.initFromParentableAndIdAbleEntity(entities, disabledList);

    const statisticsReader: StatisticsReader = new StatisticsReader(
      this.shaclModel,
    );

    // add count
    dag.traverseBreadthFirst((node: DagNodeIfc<SparnaturalNodeShape>) => {
      if (node.parents.length === 0) {
        // if this is a root, add a count to it
        node.count = statisticsReader.getEntitiesCountForShape(
          factory.namedNode(node.payload.getId()),
        );
      } else {
        // otherwise make absolutely sure the count is undefined
        node.count = undefined;
      }
    });

    // sort tree using Shape's comparator on underlying NodeShapes
    const shapeCompare = Shape.compare(lang);
    dag.sort((a: SparnaturalNodeShape, b: SparnaturalNodeShape) => {
      return shapeCompare(a.getNodeShape(), b.getNodeShape());
    });

    return dag;
  }

  /**
   * Returns the list of NodeShapes that are in the domain of at least one valid Sparnatural property,
   * excluding deactivated NodeShapes.
   * This is the equivalent of getInitialEntityList() in SHACLSpecificationProvider.
   * These are the "root subject" classes (Category A) that can be used as query entry points.
   *
   * @param lang the language for sorting
   * @returns a sorted array of SparnaturalNodeShapes
   */
  private getInitialEntityList(lang: string): SparnaturalNodeShape[] {
    // get the subjects of sh:property triples - these are the NodeShapes that have properties
    const nodeShapeTerms = this.shaclModel.store
      .getQuads(null, SH.PROPERTY, null, null)
      .map((triple) => triple.subject);

    // deduplicate
    const dedupTerms = [...new Set(nodeShapeTerms.map((t) => t.value))];

    // build SparnaturalNodeShapes, filter deactivated, filter those with no valid properties
    let entities: SparnaturalNodeShape[] = dedupTerms
      .map(
        (uri) =>
          new SparnaturalNodeShape(
            ShapeFactory.buildShape(
              factory.namedNode(uri),
              this.shaclModel,
            ) as NodeShape,
          ),
      )
      .filter((sns) => !sns.getNodeShape().isDeactivated())
      .filter((sns) => sns.getValidProperties().length > 0);

    // sort using Shape's comparator on underlying NodeShapes
    const shapeCompare = Shape.compare(lang);
    entities.sort((a: SparnaturalNodeShape, b: SparnaturalNodeShape) => {
      return shapeCompare(a.getNodeShape(), b.getNodeShape());
    });

    return entities;
  }
}
