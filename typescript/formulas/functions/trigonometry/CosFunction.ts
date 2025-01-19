import { Typing, AbstractFunction } from "../../internal.js"

export class CosFunction extends AbstractFunction {
    protected minArguments() { return 1 };
    protected maxArguments() { return 1 };

    evaluate(scope: any) {
        this.Expr.checkEvaluationLimits(this);

        const number = this.arguments[0].evaluate(scope);

        if (Typing.isNull(number)) {
            return null;
        }

        if (!Typing.isNumber(number)) {
            throw new Error("fn7 :: cos," + Typing.getType(number));
        }

        if (Typing.isInfinite(number)) {
            throw new Error("cos2");
        }

        return Math.cos(number);
    };
}