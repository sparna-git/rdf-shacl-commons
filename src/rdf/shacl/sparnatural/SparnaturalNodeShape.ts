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
   * @returns the label of the underlying NodeShape
   */
  getLabel(lang: string): string | undefined {
    return this.nodeShape.getLabel(lang);
  }

  /**
   * @returns the sh:order value if any
   */
  getOrder(): string | undefined {
    const order = this.nodeShape.getShOrder();
    return order ? order.value : undefined;
  }

  /**
   * @returns the tooltip/description of the underlying NodeShape
   */
  getTooltip(lang: string): string | undefined {
    return this.nodeShape.getTooltip(lang);
  }

  /**
   * @returns the underlying NodeShape
   */
  getNodeShape(): NodeShape {
    return this.nodeShape;
  }

  /**
   * @returns true if the underlying NodeShape is deactivated (sh:deactivated true)
   */
  isDeactivated(): boolean {
    return this.nodeShape.isDeactivated();
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

  /**
   * Returns a comparator function for sorting SparnaturalNodeShapes by sh:order then by label
   * @param lang the language for label comparison
   */
  static compare(
    lang: string,
  ): (item1: SparnaturalNodeShape, item2: SparnaturalNodeShape) => number {
    return (item1: SparnaturalNodeShape, item2: SparnaturalNodeShape) => {
      const order1 = item1.getOrder();
      const order2 = item2.getOrder();

      if (order1) {
        if (order2) {
          if (order1 === order2) {
            const label1 = item1.getLabel(lang);
            const label2 = item2.getLabel(lang);
            if (!label1) return -1;
            if (!label2) return 1;
            return label1.localeCompare(label2);
          } else {
            if (!isNaN(Number(order1)) && !isNaN(Number(order2))) {
              return Number(order1) - Number(order2);
            } else {
              return order1 > order2 ? 1 : -1;
            }
          }
        } else {
          return -1;
        }
      } else {
        if (order2) {
          return 1;
        } else {
          const label1 = item1.getLabel(lang);
          const label2 = item2.getLabel(lang);
          if (!label1) return -1;
          if (!label2) return 1;
          return label1.localeCompare(label2);
        }
      }
    };
  }
}
