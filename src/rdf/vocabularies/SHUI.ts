import { DataFactory, NamedNode } from 'rdf-data-factory';

const factory = new DataFactory();

const SHUI_NAMESPACE = "http://www.w3.org/ns/shacl-ui#";
export const DASH = {
  DEPICTION_ROLE: factory.namedNode(SHUI_NAMESPACE + "DepictionRole") as NamedNode,
  DESCRIPTION_ROLE: factory.namedNode(SHUI_NAMESPACE + "DescriptionRole") as NamedNode,
  ICON_ROLE: factory.namedNode(SHUI_NAMESPACE + "IconRole") as NamedNode,
  ID_ROLE: factory.namedNode(SHUI_NAMESPACE + "IDRole") as NamedNode,
  KEY_INFO_ROLE: factory.namedNode(SHUI_NAMESPACE + "KeyInfoRole") as NamedNode,
  LABEL_ROLE: factory.namedNode(SHUI_NAMESPACE + "LabelRole") as NamedNode,
  PROPERTY_ROLE: factory.namedNode(SHUI_NAMESPACE + "propertyRole") as NamedNode,
  SEARCH_WIDGET: factory.namedNode(SHUI_NAMESPACE + "searchWidget") as NamedNode,
  SEARCH_WIDGET_CLASS: factory.namedNode(SHUI_NAMESPACE + "SearchWidget") as NamedNode,
};
