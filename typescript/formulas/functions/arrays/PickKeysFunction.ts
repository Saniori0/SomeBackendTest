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

        let inputArray = this.arguments[0].evaluate(scope);

        if (Typing.isNull(inputArray)) {
            return null;
        }

        if (!Typing.isObject(inputArray)) {
            throw new Error('fn1 :: pickKeys,' + Typing.getType(inputArray));
        }

        let keysToPickFromInputArray = this.arguments[1].evaluate(scope);

        if (Typing.isNull(keysToPickFromInputArray)) {
            return inputArray;
        }

        if (!Typing.isArray(keysToPickFromInputArray)) {
            throw new Error('fn1 :: pickKeys,' + Typing.getType(keysToPickFromInputArray));
        }

        return Object.keys(inputArray)
            .filter(key => keysToPickFromInputArray.includes(key))
            .reduce((obj, key) => {
                obj[key] = inputArray[key];
                return obj;
            }, {} as { [key: string]: number });
    }
}