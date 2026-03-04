import { NodeShape } from "../NodeShape";
import { PropertyShape } from "../PropertyShape";
import { SparnaturalShapeFactory } from "./SparnaturalShapeFactory";

export class SparnaturalNodeShape {
  protected nodeShape: NodeShape;

  constructor(nodeShape: NodeShape) {
    this.nodeShape = nodeShape;
  }

  /**
   * @returns the parent NodeShape URIs
   */
  getParents(): string[] {
    return (this.nodeShape as NodeShape).getParents().map((r) => r.value);
  }

  /**
   * @returns the children NodeShape URIs
   */
  getChildren(): string[] {
    return (this.nodeShape as NodeShape).getChildren().map((r) => r.value);
  }

  /**
   * @returns the URI of the underlying NodeShape
   */
  getId(): string {
    return this.nodeShape.resource.value;
  }

  /**
   * @returns the underlying NodeShape
   */
  getNodeShape(): NodeShape {
    return this.nodeShape;
  }

  /**
   * @returns all valid sparnatural properties available on this node shape, including inherited properties from superclasses
   */
  getValidProperties(): PropertyShape[] {
    let validProperties = this.nodeShape
      .getProperties()
      .filter((p) =>
        SparnaturalShapeFactory.buildSparnaturalPropertyShape(
          p.resource,
          this.nodeShape.graph,
        ).isValidSparnaturalSHACLSpecificationProperty(),
      );

    // dedup, although probably dedup is not necessary here
    return [...new Set(validProperties)];
  }
}
