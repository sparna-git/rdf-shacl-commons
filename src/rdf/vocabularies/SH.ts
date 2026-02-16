import { DataFactory, NamedNode } from 'rdf-data-factory';

const factory = new DataFactory();

const SH_NAMESPACE = "http://www.w3.org/ns/shacl#";
export const SH = {
  AGENT_INSTRUCTION: factory.namedNode(SH_NAMESPACE + "agentInstruction") as NamedNode,   // SHACl 1.2
  ALTERNATIVE_PATH: factory.namedNode(SH_NAMESPACE + "alternativePath") as NamedNode,
  CLASS: factory.namedNode(SH_NAMESPACE + "class") as NamedNode,
  CODE_IDENTIFIER: factory.namedNode(SH_NAMESPACE + "codeIdentifier") as NamedNode,   // SHACl 1.2
  DATATYPE: factory.namedNode(SH_NAMESPACE + "datatype") as NamedNode,
  DEACTIVATED: factory.namedNode(SH_NAMESPACE + "deactivated") as NamedNode,
  DESCRIPTION: factory.namedNode(SH_NAMESPACE + "description") as NamedNode,
  HAS_VALUE: factory.namedNode(SH_NAMESPACE + "hasValue") as NamedNode,
  IN: factory.namedNode(SH_NAMESPACE + "in") as NamedNode,
  INTENT: factory.namedNode(SH_NAMESPACE + "intent") as NamedNode,   // SHACl 1.2
  INVERSE_PATH: factory.namedNode(SH_NAMESPACE + "inversePath") as NamedNode,
  IRI: factory.namedNode(SH_NAMESPACE + "IRI") as NamedNode,
  LANGUAGE_IN: factory.namedNode(SH_NAMESPACE + "languageIn") as NamedNode,
  LITERAL: factory.namedNode(SH_NAMESPACE + "Literal") as NamedNode,
  MAX_COUNT: factory.namedNode(SH_NAMESPACE + "maxCount") as NamedNode,
  MAX_LIST_LENGTH: factory.namedNode(SH_NAMESPACE + "maxListLength") as NamedNode,   // SHACl 1.2
  MEMBER_SHAPE: factory.namedNode(SH_NAMESPACE + "memberShape") as NamedNode,   // SHACl 1.2
  MIN_COUNT: factory.namedNode(SH_NAMESPACE + "minCount") as NamedNode,
  MIN_LIST_LENGTH: factory.namedNode(SH_NAMESPACE + "minListLength") as NamedNode,   // SHACl 1.2
  NAME: factory.namedNode(SH_NAMESPACE + "name") as NamedNode,
  NODE: factory.namedNode(SH_NAMESPACE + "node") as NamedNode,
  NODE_KIND: factory.namedNode(SH_NAMESPACE + "nodeKind") as NamedNode,
  NODE_SHAPE: factory.namedNode(SH_NAMESPACE + "NodeShape") as NamedNode,
  ONE_OR_MORE_PATH: factory.namedNode(SH_NAMESPACE + "oneOrMorePath") as NamedNode,
  OR: factory.namedNode(SH_NAMESPACE + "or") as NamedNode,
  ORDER: factory.namedNode(SH_NAMESPACE + "order") as NamedNode,
  PATH: factory.namedNode(SH_NAMESPACE + "path") as NamedNode,
  PATTERN: factory.namedNode(SH_NAMESPACE + "pattern") as NamedNode,
  PROPERTY: factory.namedNode(SH_NAMESPACE + "property") as NamedNode,
  QUALIFIED_MAX_COUNT: factory.namedNode(SH_NAMESPACE + "qualifiedMaxCount") as NamedNode,
  QUALIFIED_MIN_COUNT: factory.namedNode(SH_NAMESPACE + "qualifiedMinCount") as NamedNode,
  QUALIFIED_VALUE_SHAPE: factory.namedNode(SH_NAMESPACE + "qualifiedValueShape") as NamedNode,
  SELECT: factory.namedNode(SH_NAMESPACE + "select") as NamedNode,
  SINGLE_LINE: factory.namedNode(SH_NAMESPACE + "singleLine") as NamedNode,   // SHACl 1.2
  SOME_VALUE: factory.namedNode(SH_NAMESPACE + "someValue") as NamedNode,   // SHACl 1.2
  TARGET: factory.namedNode(SH_NAMESPACE + "target") as NamedNode,
  TARGET_CLASS: factory.namedNode(SH_NAMESPACE + "targetClass") as NamedNode,
  UNIQUE_LANG: factory.namedNode(SH_NAMESPACE + "uniqueLang") as NamedNode,
  UNIQUE_MEMBERS: factory.namedNode(SH_NAMESPACE + "uniqueMembers") as NamedNode,   // SHACl 1.2
  UNIT: factory.namedNode(SH_NAMESPACE + "unit") as NamedNode,   // SHACl 1.2
  ZERO_OR_MORE_PATH: factory.namedNode(SH_NAMESPACE + "zeroOrMorePath") as NamedNode,
  ZERO_OR_ONE_PATH: factory.namedNode(SH_NAMESPACE + "zeroOrOnePath") as NamedNode,
  PARENT: factory.namedNode(SH_NAMESPACE + "parent") as NamedNode,
};
