import UnionCase from "./union_case";

export default class Union {
  name: string;
  cases: UnionCase[];

  constructor(name: string, cases: UnionCase[]) {
    this.name = name;
    this.cases = cases;
  }


  private static findUnionCases(input: string): UnionCase[] {
    const unionCaseRegex = /factory(.*?);/g;
    const formatted = input.replace(/\n/g, "");
    let matches = formatted.match(unionCaseRegex);
  
    if (matches == null) {
      return [];
    }
  
    let unionCases: UnionCase[] = [];
  
    for (const match of matches) {
      const unionCase = UnionCase.fromMatchString(match);
  
      if (unionCase == null) {
        continue;
      }
  
      unionCases.push(unionCase);
    }
  
    return unionCases;
  }
  
   static fromString(input: string) : Union | null {
    const classNameRegex = /(?<=(class\s))([A-Z][a-zA-Z0-9]*)/;
  
    const match = input.match(classNameRegex);
  
    if (match == null) {
      return null;
    }
  
    const className = match[0];
  
    const cases = this.findUnionCases(input);
  
    return new Union(className, cases);
  }

  toWhenAsyncDartCode(): string {
    const whenArgs = this.cases.map((e) => e.toWhenAsyncArgDartCode()).join('\n    ');
    const whenIs = this.cases.map((e) => e.toWhenAsyncIsDartCode());
    const dartCode = `
  Future<Result> whenAsync<Result extends Object?>({\
    ${whenArgs}
  }) async {
    return switch (this) {
      ${whenIs}
  };
`;

    return dartCode;
  } 

  toMaybeWhenDartCode(): string {
    const maybeWhenArgs = this.cases.map((e) => e.toWhenOrNullArgDartCode()).join('\n    ');
    const whenIs = this.cases.map((e) => e.toMaybeWhenIsDartCode());
    const orElseArg = `required Result Function() orElse,`;
    const dartCode = `
  Result maybeWhen<Result extends Object?>({ 
    ${orElseArg}
    ${maybeWhenArgs}
  }) {
  return switch (this) {
${whenIs}
  };
`;

    return dartCode;
  }
  toMaybeWhenAsyncDartCode(): string {
    const maybeWhenArgs = this.cases.map((e) => e.toWhenOrNullAsyncArgDartCode()).join('\n    ');
    const whenIs = this.cases.map((e) => e.toMaybeWhenAsyncIsDartCode());
    const orElseArg = `required Future<Result> Function() orElse,`;
    const dartCode = `
  Future<Result> maybeWhenAsync<Result extends Object?>({ 
    ${orElseArg}
    ${maybeWhenArgs}
  }) async {
  return switch (this) {
${whenIs}
  };
`;

    return dartCode;
  }

  toWhenOrNullDartCode(): string {
    const maybeWhenArgs = this.cases.map((e) => e.toWhenOrNullArgDartCode()).join('\n    ');
    const whenIs = this.cases.map((e) => e.toWhenOrNullIsDartCode());
    const dartCode = `
  Result whenOrNull<Result extends Object?>({ 
    ${maybeWhenArgs}
  }) {
  return switch (this) {
${whenIs}
  };
`;

    return dartCode;
  }
  toWhenOrNullAsyncDartCode(): string {
    const maybeWhenArgs = this.cases.map((e) => e.toWhenOrNullAsyncArgDartCode()).join('\n    ');
    const whenIs = this.cases.map((e) => e.toWhenOrNullAsyncIsDartCode());
    const dartCode = `
  Future<Result> whenOrNullAsync<Result extends Object?>({ 
    ${maybeWhenArgs}
  }) async {
  return switch (this) {
${whenIs}
  };
`;

    return dartCode;
  }

  toWhenDartCode(): string {
    const whenArgs = this.cases.map((e) => e.toWhenArgDartCode()).join('\n    ');
    const whenIs = this.cases.map((e) => e.toWhenIsDartCode());
    const dartCode = `
  Result when<Result extends Object?>({
    ${whenArgs}
  }) {
    return switch (this) {
      ${whenIs}
  };
`;

    return dartCode;
  }

  toMaybeMapDartCode(): string {
    const maybeMapArgs = this.cases.map((e) => e.toMaybeMapArgDartCode()).join('\n    ');
    const mapIs = this.cases.map((e) => e.toMaybeMapIsDartCode()).join('\n');
    const orElseArg = `required R Function() orElse,`;
    const orElse = `return orElse.call();`;
    const dartCode = `
  R maybeMap<R>({
    ${orElseArg}
    ${maybeMapArgs}
  }) {
${mapIs}
    ${orElse}
  }
`;

    return dartCode;
  }


  toMapDartCode(): string {
    const mapArgs = this.cases.map((e) => e.toMapArgDartCode()).join('\n    ');
    const mapIs = this.cases.map((e) => e.toMapIsDartCode()).join('\n');
    const isDefault = `${this.cases[0].factoryName}.call(this as ${this.cases[0].name});`;
    const dartCode = `
  R map<R>({
    ${mapArgs}
  }) {
${mapIs}
    return ${isDefault}
  }
`;

    return dartCode;
  }

  toFromStringDartCode(): string {
    const fromStringFactories = this.cases.filter((e) => e.args.length == 0).map((e) => e.toFromStringDartCode(this.name)).join('\n');
    const isDefault = `return ${this.name}.${this.cases[0].factoryName}();`;
    const dartCode = `
   factory ${this.name}.fromString(String value) {
    ${fromStringFactories}

    ${isDefault}
   }
`;

    return dartCode;
  }

  toToStringDartCode(): string {
    const toStringCases = this.cases.map((e) => e.toToStringDartCode());
    const dartCode = `
    @override
   String toString() {
   return switch (this) {
    ${toStringCases}
   };
`;
    return dartCode;
  }
  
  toDartCode(): string {
    const factories = this.cases.map((e) => e.toFactoryDartCode(this.name)).join('\n  ');
    const classes = this.cases.map((e) => e.toClassDartCode(this.name)).join('\n');

    const dartCode = 
`
import 'package:equatable/equatable.dart';\n
sealed class ${this.name} extends Equatable{
  const ${this.name}();
  ${factories}
  ${this.toToStringDartCode()}
  }
}

extension ${this.name}Helper on ${this.name} {
  ${this.toWhenDartCode()}
  }
  ${this.toMaybeWhenDartCode()}
  }
  ${this.toWhenOrNullDartCode()}
}
${this.toWhenAsyncDartCode()}
}
${this.toMaybeWhenAsyncDartCode()}
}
${this.toWhenOrNullAsyncDartCode()}
}
}

${classes}
`;

    return dartCode;
  }
  
}