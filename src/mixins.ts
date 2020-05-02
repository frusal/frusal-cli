import { BooleanType, CollectionType, NameUtils, NumericType, Property, ReferenceType, StringType } from "@frusal/library-for-node";

declare module "@frusal/library-for-node" {
    interface Type {
        tsDeclaration: (prop: Property) => string;
        tsMetaDeclaration: (prop: Property) => string;
    }
}

StringType.prototype.tsDeclaration = prop => `${NameUtils.toCamelCase(prop.name)}: string;`;
StringType.prototype.tsMetaDeclaration = prop => `readonly ${NameUtils.toCamelCase(prop.name)}_val: PrimitiveValue<string>;`;

BooleanType.prototype.tsDeclaration = prop => `${NameUtils.toCamelCase(prop.name)}: boolean;`;
BooleanType.prototype.tsMetaDeclaration = prop => `readonly ${NameUtils.toCamelCase(prop.name)}_val: PrimitiveValue<boolean>;`;

NumericType.prototype.tsDeclaration = prop => `${NameUtils.toCamelCase(prop.name)}: number;`;
NumericType.prototype.tsMetaDeclaration = prop => `readonly ${NameUtils.toCamelCase(prop.name)}_val: PrimitiveValue<number>;`;

CollectionType.prototype.tsDeclaration = function (this: CollectionType, prop) {
    return `${NameUtils.toCamelCase(prop.name)}: InversedSet<${NameUtils.toPascalCase(this.elementClass.name)}>;`;
}

ReferenceType.prototype.tsDeclaration = function (this: ReferenceType<any>, prop) {
    return `${NameUtils.toCamelCase(prop.name)}: ${NameUtils.toPascalCase(this.elementClass.name)};`;
}
ReferenceType.prototype.tsMetaDeclaration = function (this: ReferenceType<any>, prop) {
    return `readonly ${NameUtils.toCamelCase(prop.name)}_ref: ReferenceValue<${NameUtils.toPascalCase(this.elementClass.name)}>;`;
}
