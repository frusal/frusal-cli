import { BooleanType, CollectionType, NameUtils, NumericType, Property, ReferenceType, StringType } from "@frusal/library-for-node";

declare module "@frusal/library-for-node" {
    interface Type {
        tsDeclaration: (prop: Property) => string[];
    }
}
StringType.prototype.tsDeclaration = prop => [ `${NameUtils.toCamelCase(prop.name)}: string;`, `readonly ${NameUtils.toCamelCase(prop.name)}_val: types.PrimitiveValue<string>;` ];
BooleanType.prototype.tsDeclaration = prop => [ `${NameUtils.toCamelCase(prop.name)}: boolean;`, `readonly ${NameUtils.toCamelCase(prop.name)}_val: types.PrimitiveValue<boolean>;` ];
NumericType.prototype.tsDeclaration = prop => [ `${NameUtils.toCamelCase(prop.name)}: number;`, `readonly ${NameUtils.toCamelCase(prop.name)}_val: types.PrimitiveValue<number>;` ];

CollectionType.prototype.tsDeclaration = prop => [ `${NameUtils.toCamelCase(prop.name)}: boolean;`, `readonly ${NameUtils.toCamelCase(prop.name)}_val: types.PrimitiveValue<boolean>;` ];
ReferenceType.prototype.tsDeclaration = prop => [ `${NameUtils.toCamelCase(prop.name)}: boolean;`, `readonly ${NameUtils.toCamelCase(prop.name)}_val: types.PrimitiveValue<boolean>;` ];
