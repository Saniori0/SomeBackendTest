import {
    Typing, AbstractFunction
} from "../../internal.js"

export class PickKeysFunction extends AbstractFunction {
    protected minArguments() {
        return 2
    };

    protected maxArguments() {
        return 2
    };

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        const inputArray = this.arguments[0].evaluate(scope);

        if (Typing.isNull(inputArray)) {
            return null;
        }

        PickKeysFunction.validateValueIsArray(inputArray);

        const keysToPickFromInputArray = this.arguments[1].evaluate(scope);

        if (Typing.isNull(keysToPickFromInputArray)) {
            return inputArray;
        }

        PickKeysFunction.validateValueIsArray(keysToPickFromInputArray);

        return [];
    }

    static validateValueIsArray(value: any) {
        if (!Typing.isArray(value)) {
            throw new Error('fn1 :: pickKeys,' + Typing.getType(value));
        }
    }
}