import { Resource } from "../../Resource";
import { NodeShape } from "../NodeShape";
import { PropertyShape } from "../PropertyShape";
import { ShapeFactory } from "../ShaclFactory";
import { ShaclModel } from "../ShaclModel";
import { Shape } from "../Shape";
import { SparnaturalNodeShape } from "./SparnaturalNodeShape";
import { SparnaturalPropertyShape } from "./SparnaturalPropertyShape";


export class SparnaturalShapeFactory {

    /**
     * Build either a SparnaturalNodeShape or a SparnaturalPropertyShape from initial resource + model
     * @returns 
     */
    static buildSparnaturalShape(resource:Resource,shaclModel:ShaclModel):SparnaturalPropertyShape|SparnaturalNodeShape {
        let s:Shape = ShapeFactory.buildShape(resource, shaclModel);

        if(s instanceof PropertyShape) {
            return new SparnaturalPropertyShape(
                ShapeFactory.buildShape(resource, shaclModel) as PropertyShape
            );
        }

        if(s instanceof NodeShape) {
            return new SparnaturalNodeShape(
                ShapeFactory.buildShape(resource, shaclModel) as NodeShape
            );
        }

        throw new Error("SparnaturalShapeFactory : input shape is neither NodeShape nor PropertyShape");
    }

    /**
     * Build a SparnaturalPropertyShape from initial resource + model
     * @returns 
     */
    static buildSparnaturalPropertyShape(resource:Resource,shaclModel:ShaclModel):SparnaturalPropertyShape {
        return SparnaturalShapeFactory.buildSparnaturalShape(resource, shaclModel) as SparnaturalPropertyShape;
    }

    /**
     * Build a SparnaturalNodeShape from initial resource + model
     * @returns 
     */
    static buildSparnaturalNodeShape(resource:Resource,shaclModel:ShaclModel):SparnaturalNodeShape {
        return SparnaturalShapeFactory.buildSparnaturalShape(resource, shaclModel) as SparnaturalNodeShape;
    }
}