<?php

namespace formulas\functions\arrays;

use Exception;
use formulas\functions\AbstractFunction;
use formulas\Typing;

class PickKeysFunction extends AbstractFunction
{
    protected int $minArguments = 2;
    protected int $maxArguments = 2;

    function evaluate(object $scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        $inputArray = $this->arguments[0]->evaluate($scope);

        if (Typing::isNull($inputArray)) {
            return null;
        }

        if (!Typing::isObject($inputArray)) {
            throw new Exception('fn1 :: pickKeys,' . Typing::getType($inputArray));
        }

        $keysToPickFromInputArray = $this->arguments[1]->evaluate($scope);

        if (Typing::isNull($keysToPickFromInputArray)) {
            return $inputArray;
        }

        if (!Typing::isArray($keysToPickFromInputArray)) {
            throw new Exception('fn1 :: pickKeys,' . Typing::getType($keysToPickFromInputArray));
        }

        return array_intersect_key((array)$inputArray, array_flip($keysToPickFromInputArray));
    }

    function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        return [
            '$arrayToObject' => [
                '$filter' => [
                    'input' => [
                        '$objectToArray' => $this->arguments[0]->toMongoExpression($localVariables, $fieldNames, $options)
                    ],
                    'as' => 'item',
                    'cond' => [
                        '$gt' => [
                            [
                                '$indexOfArray' => [
                                    $this->arguments[1]->toMongoExpression($localVariables, $fieldNames, $options),
                                    '$$item.k'
                                ]
                            ],
                            -1
                        ]
                    ]
                ]
            ]
        ];
    }
}