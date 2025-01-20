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

        if (!Typing::isObject($inputArray)) {
            throw new Exception('fn1 :: pickKeys,' . Typing::getType($inputArray));
        }

        $keysToPickFromInputArray = $this->arguments[1]->evaluate($scope);

        if (!Typing::isArray($keysToPickFromInputArray)) {
            throw new Exception('fn2 :: pickKeys,' . Typing::getType($keysToPickFromInputArray));
        }

        return (object)array_intersect_key((array)$inputArray, array_flip($keysToPickFromInputArray));
    }

    function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        return [
            '$let' => [
                'vars' => [
                    'inputArray' => $this->arguments[0]->toMongoExpression($localVariables, $fieldNames, $options),
                    'keysToPickFromInputArray' => $this->arguments[1]->toMongoExpression($localVariables, $fieldNames, $options),
                ],
                'in' => [
                    '$cond' => [
                        'if' => [
                            '$and' => [
                                [
                                    '$eq' => [
                                        ['$type' => '$$inputArray'],
                                        'object'
                                    ]
                                ],
                                [
                                    '$isArray' => '$$keysToPickFromInputArray'
                                ]
                            ]
                        ],
                        'then' => [
                            '$arrayToObject' => [
                                '$filter' => [
                                    'input' => [
                                        '$objectToArray' => '$$inputArray'
                                    ],
                                    'as' => 'item',
                                    'cond' => [
                                        '$gt' => [
                                            [
                                                '$indexOfArray' => [
                                                    '$$keysToPickFromInputArray',
                                                    '$$item.k'
                                                ]
                                            ],
                                            -1
                                        ]
                                    ]
                                ]
                            ]
                        ],
                        'else' => null
                    ]
                ]
            ],
        ];
    }
}