import { DataFactory, NamedNode } from 'rdf-data-factory';

const factory = new DataFactory();

const DASH_NAMESPACE = "http://datashapes.org/dash#";
export const DASH = {
  DEPICTION_ROLE: factory.namedNode(DASH_NAMESPACE + "DepictionRole") as NamedNode,
  DESCRIPTION_ROLE: factory.namedNode(DASH_NAMESPACE + "DescriptionRole") as NamedNode,
  ICON_ROLE: factory.namedNode(DASH_NAMESPACE + "IconRole") as NamedNode,
  ID_ROLE: factory.namedNode(DASH_NAMESPACE + "IDRole") as NamedNode,
  KEY_INFO_ROLE: factory.namedNode(DASH_NAMESPACE + "KeyInfoRole") as NamedNode,
  LABEL_ROLE: factory.namedNode(DASH_NAMESPACE + "LabelRole") as NamedNode,
  PROPERTY_ROLE: factory.namedNode(DASH_NAMESPACE + "propertyRole") as NamedNode,
  SEARCH_WIDGET: factory.namedNode(DASH_NAMESPACE + "searchWidget") as NamedNode,
  SEARCH_WIDGET_CLASS: factory.namedNode(DASH_NAMESPACE + "SearchWidget") as NamedNode,
};
