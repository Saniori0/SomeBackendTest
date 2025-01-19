<?php

namespace formulas\literals;

use DateTime;
use Exception;
use formulas\Expression;
use formulas\Typing;
use formulas\ExpressionNode;
use formulas\OptimizedNode;

class DateLiteral extends ExpressionNode
{
    public string $value;

    public function __construct(Expression $Expr, $node)
    {
        parent::__construct($Expr);

        if (!isset($node['value'])) {
            throw new Exception('Date without value');
        }

        if (!Typing::isString($node['value'])) {
            throw new Exception('Date is not string');
        }

        $this->value = $node['value'];
    }

    public function optimize(): OptimizedNode
    {
        return new OptimizedNode($this);
    }

    public function evaluate($scope)
    {
        $this->Expr->checkEvaluationLimits($this);

        return new DateTime($this->value);
    }

    public function gatherExternalIdentifiers()
    {
        return [];
    }

    public function preEvaluate(array $localVariables, object $scope): OptimizedNode
    {
        return new OptimizedNode($this, $scope);
    }

    public function toCode(): string
    {
        return Expression::prettyPrint($this->value);
    }

    public function toMongoExpression(array $localVariables, array $fieldNames, array $options)
    {
        return [
            '$toDate' => $this->value,
        ];
    }
}