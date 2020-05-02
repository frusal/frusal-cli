import { BooleanType, CollectionType, NameUtils, NumericType, Property, ReferenceType, StringType } from "@frusal/library-for-node";

declare module "@frusal/library-for-node" {
    interface Type {
        tsDeclaration: (prop: Property) => string[];
    }
}

StringType.prototype.tsDeclaration = prop => [ `${NameUtils.toCamelCase(prop.name)}: string;`, `readonly ${NameUtils.toCamelCase(prop.name)}_val: PrimitiveValue<string>;` ];
BooleanType.prototype.tsDeclaration = prop => [ `${NameUtils.toCamelCase(prop.name)}: boolean;`, `readonly ${NameUtils.toCamelCase(prop.name)}_val: PrimitiveValue<boolean>;` ];
NumericType.prototype.tsDeclaration = prop => [ `${NameUtils.toCamelCase(prop.name)}: number;`, `readonly ${NameUtils.toCamelCase(prop.name)}_val: PrimitiveValue<number>;` ];

CollectionType.prototype.tsDeclaration = function (this: CollectionType, prop) {
    const name = NameUtils.toCamelCase(prop.name);
    const element = NameUtils.toPascalCase(this.elementClass.name);
    return [ `${name}: InversedSet<${element}>;` ];
}

ReferenceType.prototype.tsDeclaration = function (this: ReferenceType<any>, prop) {
    const name = NameUtils.toCamelCase(prop.name);
    const element = NameUtils.toPascalCase(this.elementClass.name);
    return [ `${name}: ${element};`, `readonly ${name}_ref: ReferenceValue<${element}>;` ];
}
