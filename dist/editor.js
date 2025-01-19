class Comparison {
    static canCompareTypes(type) {
        if (type === Typing.TYPE_NUMBER)
            return true;
        if (type === Typing.TYPE_DATE)
            return true;
        if (type === Typing.TYPE_STRING)
            return true;
        if (type === Typing.TYPE_BOOLEAN)
            return true;
        if (type === Typing.TYPE_ARRAY)
            return true;
        if (type === Typing.TYPE_OBJECT)
            return true;
        return false;
    }
    static isEqual(left, right) {
        if (Typing.isDate(left) && Typing.isDate(right)) {
            // Даты сравниваем по меткам
            return left.getTime() === right.getTime();
        }
        if (Typing.isArray(left) && Typing.isArray(right)) {
            if (left.length !== right.length)
                return false;
            let index = 0;
            for (const leftItem of left) {
                if (!Comparison.isEqual(leftItem, right[index++]))
                    return false;
            }
            return true;
        }
        if (Typing.isObject(left) && Typing.isObject(right)) {
            const leftKeys = Object.keys(left);
            const rightKeys = Object.keys(right);
            if (leftKeys.length !== rightKeys.length)
                return false;
            let index = 0;
            for (const leftKey of leftKeys) {
                if (!Comparison.isEqual(leftKey, rightKeys[index]))
                    return false;
                if (!Comparison.isEqual(left[leftKey], right[rightKeys[index]]))
                    return false;
                index++;
            }
            return true;
        }
        if (Typing.isNaN(left) && Typing.isNaN(right)) {
            return true;
        }
        return left === right;
    }
    static isGreater(left, right) {
        const leftType = Typing.getType(left);
        const rightType = Typing.getType(right);
        const sameType = leftType === rightType;
        if (sameType && this.canCompareTypes(leftType)) {
            if (leftType === Typing.TYPE_ARRAY) {
                let index = 0;
                for (const leftValue of left) {
                    if (right.length < index + 1)
                        return true;
                    if (!this.isEqual(leftValue, right[index])) {
                        return this.isGreater(leftValue, right[index]);
                    }
                    index++;
                }
                return false;
            }
            else if (leftType === Typing.TYPE_OBJECT) {
                const leftKeys = Object.keys(left);
                const rightKeys = Object.keys(right);
                let index = 0;
                for (const leftKey of leftKeys) {
                    if (rightKeys.length < index + 1)
                        return true;
                    if (!this.isEqual(leftKey, rightKeys[index])) {
                        return this.isGreater(leftKey, rightKeys[index]);
                    }
                    if (!this.isEqual(left[leftKey], right[rightKeys[index]])) {
                        return this.isGreater(left[leftKey], right[rightKeys[index]]);
                    }
                    index++;
                }
                return false;
            }
            else if (!Typing.isNaN(left) && Typing.isNaN(right)) {
                return true;
            }
            else {
                return left > right;
            }
        }
        else {
            const order = [
                Typing.TYPE_NULL,
                Typing.TYPE_NUMBER,
                Typing.TYPE_STRING,
                Typing.TYPE_OBJECT,
                Typing.TYPE_ARRAY,
                Typing.TYPE_BOOLEAN,
                Typing.TYPE_DATE,
            ];
            return order.indexOf(leftType) > order.indexOf(rightType);
        }
    }
    static isLess(left, right) {
        return !this.isEqual(left, right) && !this.isGreater(left, right);
    }
}

class Convertation {
    static toBoolean(value) {
        if (Typing.isBoolean(value))
            return value;
        else if (Typing.isNumber(value))
            return !Typing.isZero(value);
        else if (Typing.isString(value))
            return value !== '';
        else if (Typing.isObject(value))
            return true;
        else if (Typing.isArray(value))
            return true;
        else if (Typing.isDate(value))
            return true;
        else
            return false; // null
    }
    static toNumber(value) {
        if (Typing.isString(value)) {
            if (value === '')
                throw new Error('convert4');
            else if (value.toLowerCase() === '+infinity' || value.toLowerCase() === 'infinity') {
                return Infinity;
            }
            else if (value.toLowerCase() === '+inf' || value.toLowerCase() === 'inf') {
                return Infinity;
            }
            else if (value.toLowerCase() === '-infinity' || value.toLowerCase() === '-inf') {
                return -Infinity;
            }
            else if (value.toLowerCase() === 'nan') {
                return NaN;
            }
            else {
                const match = value.match(/^[+-]?\d+\.?\d*(e[+-]?\d+)?$/i);
                if (match) {
                    const result = parseFloat(value);
                    if (Math.abs(result) > Typing.DOUBLE_RANGE)
                        throw new Error('convert6');
                    else
                        return result;
                }
                else
                    throw new Error('convert5');
            }
        }
        else if (Typing.isBoolean(value))
            return value ? 1 : 0;
        else if (Typing.isNumber(value))
            return value;
        else if (Typing.isNull(value))
            return 0;
        else if (Typing.isDate(value))
            return value.getTime();
        else
            throw new Error('convert1 :: ' + Typing.getType(value) + ',number');
    }
    static toString(value) {
        if (Typing.isString(value))
            return value;
        else if (Typing.isBoolean(value))
            return value ? 'true' : 'false';
        else if (Typing.isNumber(value))
            return value.toString();
        else if (Typing.isNull(value))
            return '';
        else if (Typing.isDate(value)) {
            const year = value.getUTCFullYear();
            if (year > 9999 || year < 0) {
                throw new Error('convert2 :: ' + year);
            }
            return value.toISOString();
        }
        else
            throw new Error('convert1 :: ' + Typing.getType(value) + ',string');
    }
    static toDate(value) {
        if (Typing.isDate(value)) {
            return value;
        }
        else if (Typing.isNumber(value)) {
            if (Typing.isNaN(value)) {
                throw new Error("convert7");
            }
            if (Math.abs(value) > Typing.TIMESTAMP_RANGE) {
                throw new Error("toDate1");
            }
            return new Date(value);
        }
        else if (Typing.isNull(value)) {
            return null;
        }
        else if (Typing.isString(value)) {
            if (value.match(Typing.ISO8601_PATTERN)) {
                // Приводим дату к формату ISO8601, иначе проблемы с браузерной совместимостью могут быть
                const parts = { date: null, time: null, zone: null };
                // Если даты нет, мы искусственно добавляем первое число
                const matchDate = value.match(/^\d\d\d\d-\d\d(-\d\d)?/);
                parts.date = matchDate[1] ? matchDate[0] : matchDate[0] + '-01';
                const matchTime = value.match(/([Tt ])(\d\d:\d\d)(:\d\d(\.\d+)?)?/);
                if (matchTime) {
                    // Если секунд нет, мы искусственно добавляем 00
                    parts.time = matchTime[3] ? matchTime[2] + matchTime[3] : matchTime[2] + ':00';
                }
                else {
                    parts.time = '00:00:00';
                }
                // Отсекаем дату, чтобы не путать день с часовым поясом
                const valueWithoutDate = value.match(/^\d\d\d\d-\d\d(-\d\d)?(.*)/)[2];
                const matchTimeZone = valueWithoutDate.match(/([Zz]|[+-]\d\d(:?\d\d)?)$/);
                if (matchTimeZone) {
                    if (matchTimeZone[0][0].toLowerCase() === 'z') {
                        parts.zone = 'Z';
                    }
                    else {
                        parts.zone = matchTimeZone[2] ? matchTimeZone[1] : matchTimeZone[1] + ':00';
                    }
                }
                else {
                    parts.zone = 'Z';
                }
                const date = new Date(`${parts.date}T${parts.time}${parts.zone}`);
                // Так мы определяем ошибку в формировании даты
                if (Number.isNaN(date.getDay()))
                    throw new Error('toDate1');
                const fulldate = value.match(/^\d\d\d\d-\d\d-\d\d/);
                if (fulldate) {
                    const parts = fulldate[0].split('-'), year = parts[0] * 1, month = parts[1] * 1 - 1, date = parts[2] * 1;
                    const utcDate = new Date(Date.UTC(year, month, date));
                    if (utcDate.getUTCFullYear() !== year || utcDate.getUTCMonth() !== month || utcDate.getUTCDate() !== date) {
                        // Автоматические смещения (с 2000-02-30 на 2000-03-02) не поддерживаем
                        throw new Error('toDate1');
                    }
                }
                return date;
            }
            else {
                throw new Error('toDate1');
            }
        }
        else
            throw new Error('convert1 :: ' + Typing.getType(value) + ',date');
    }
}

class Typing {
    static isNull(value) {
        return value === null;
    }
    static isNumber(value) {
        return typeof value === 'number';
    }
    static isFinite(value) {
        return Number.isFinite(value);
    }
    static hasFractionalPart(value) {
        return Math.trunc(value) !== value;
    }
    static isInfinite(value) {
        return !Number.isFinite(value) && !Number.isNaN(value);
    }
    static isNaN(value) {
        return Number.isNaN(value);
    }
    static isDate(value) {
        return value instanceof Date;
    }
    static is32BitInteger(value) {
        if (!this.isNumber(value))
            return false;
        // Проверка на целое число
        if (Math.round(value) !== value)
            return false;
        if (value < -this.INT32_RANGE || value > this.INT32_RANGE)
            return false;
        return true;
    }
    static isBoolean(value) {
        return value === true || value === false;
    }
    static isString(value) {
        return typeof value === 'string';
    }
    static isArray(value) {
        return value instanceof Array;
    }
    static isObject(value) {
        if (this.isArray(value))
            return false;
        if (this.isDate(value))
            return false;
        return typeof value === 'object' && value !== null;
    }
    static isZero(value) {
        return value === 0;
    }
    static getType(value) {
        if (this.isNumber(value))
            return this.TYPE_NUMBER;
        if (this.isBoolean(value))
            return this.TYPE_BOOLEAN;
        if (this.isString(value))
            return this.TYPE_STRING;
        if (this.isNull(value))
            return this.TYPE_NULL;
        if (this.isArray(value))
            return this.TYPE_ARRAY;
        if (this.isDate(value))
            return this.TYPE_DATE;
        if (this.isObject(value))
            return this.TYPE_OBJECT;
    }
    static fixNegativeZero(value) {
        return value + 0;
    }
}
Typing.TYPE_DATE = 'date';
Typing.TYPE_ARRAY = 'array';
Typing.TYPE_OBJECT = 'object';
Typing.TYPE_NUMBER = 'number';
Typing.TYPE_STRING = 'string';
Typing.TYPE_BOOLEAN = 'boolean';
Typing.TYPE_NULL = 'null';
Typing.ISO8601_PATTERN = new RegExp([
    '^',
    '\\d\\d\\d\\d',
    '-(0\\d|1[0-2])',
    '(',
    '-([0-2]\\d|3[01])',
    ')?',
    '(',
    '[Tt ]',
    '([01][0-9]|2[0-3])',
    ':[0-5]\\d',
    '(',
    ':[0-5]\\d',
    '(',
    '\\.\\d+',
    ')?',
    ')?',
    ')?',
    '(',
    '[Zz]',
    '|',
    ' ?',
    '[+-]',
    '([01][0-9]|2[0-3])',
    '(',
    ':?[0-5]\\d',
    ')?',
    ')?',
    '$',
].join(''));
// Диапазон времени, в котором безопасно работать:
// https://262.ecma-international.org/5.1/#sec-15.9.1.1
Typing.TIMESTAMP_RANGE = 8640000000000000;
// Допустимый диапазон 32 int
Typing.INT32_RANGE = 2147483647;
// Допустимый диапазон double
Typing.DOUBLE_RANGE = 1.7976931348623157e+308;
// Почему-то эти ограничения всплывают во многих местах в монге
Typing.MONGO_LONG_MIN = -9223372036854776832;
Typing.MONGO_LONG_MAX = 9223372036854775295;

var parseError = {
	ru: "Ошибка синтаксиса в формуле",
	en: "Syntax error in formula"
};
var evaluateError = {
	ru: "Ошибка выполнения формулы",
	en: "Formula execution error"
};
var validateError = {
	ru: "Ошибка чтения формулы",
	en: "Formula reading error"
};
var finalizeError = {
	ru: "Ошибка выполнения формулы",
	en: "Formula execution error"
};
var convertError = {
	ru: "Ошибка формирования запроса",
	en: "Query preparation error"
};
var preevalError = {
	ru: "Ошибка формирования запроса",
	en: "Query preparation error"
};
var pathTypeError = {
	ru: "Неверный путь",
	en: "Invalid path"
};
var parse1 = {
	ru: "Комментарий не закрыт, не хватает */",
	en: "Comment not closed, missing */"
};
var parse2 = {
	ru: "Неожиданный символ \"$1\"",
	en: "Unexpected character \"$1\""
};
var parse3 = {
	ru: "Ожидается выражение после $1",
	en: "Expression expected after $1"
};
var parse4 = {
	ru: "Отсутствует аргумент оператора",
	en: "Missing operator argument"
};
var parse5 = {
	ru: "Ожидается символ \"$1\"",
	en: "Expected character \"$1\""
};
var parse6 = {
	ru: "Название переменной не может начинаться с цифры ($1)",
	en: "Variable names must not start with a number ($1)"
};
var parse7 = {
	ru: "Число слишком большое",
	en: "Too large number"
};
var parse8 = {
	ru: "Незакрытая скобка $1",
	en: "Missing bracket $1"
};
var parse9 = {
	ru: "Отсутствует символ \"$1\"",
	en: "Missing character \"$1\""
};
var parse10 = {
	ru: "Неверный тип ключа",
	en: "Wrong key type"
};
var parse11 = {
	ru: "Ожидается свойство объекта",
	en: "Object property expected"
};
var parse12 = {
	ru: "Неверный ключ объекта",
	en: "Wrong object key"
};
var parse13 = {
	ru: "Неожиданный вызов функции",
	en: "Unexpected function call"
};
var parse14 = {
	ru: "Вызов неизвестной функции: $1",
	en: "Unknown function call: $1"
};
var parse15 = {
	ru: "Ожидается экспонента ($1)",
	en: "Expected exponent ($1)"
};
var parse16 = {
	ru: "Незакрытая кавычка после \"$1\"",
	en: "Missing quote after \"$1\""
};
var parse17 = {
	ru: "Неверный формат даты",
	en: "Wrong date format"
};
var parse18 = {
	ru: "Ожидается оператор присваивания",
	en: "Assignment operator expected"
};
var parse19 = {
	ru: "Ожидается идентификатор",
	en: "Identifier expected"
};
var var1 = {
	ru: "Переменной \"$1\" не существует",
	en: "Variable \"$1\" does not exist"
};
var add1 = {
	ru: "Складывать можно только числа и даты (не $1)",
	en: "Only numbers and dates can be added (не $1)"
};
var subtract1 = {
	ru: "Невозможно вычесть $1 из $2",
	en: "Unable to subtract $1 from $2"
};
var mod1 = {
	ru: "Делить (%) на ноль нельзя",
	en: "(%) cannot be divided by zero"
};
var mod2 = {
	ru: "Невозможно поделить (%) $1 на $2",
	en: "Unable to divide (%) $1 by $2"
};
var divide1 = {
	ru: "Делить на ноль нельзя",
	en: "Divide by zero is not allowed"
};
var divide2 = {
	ru: "Невозможно поделить $1 на $2",
	en: "Unable to divide $1 by $2"
};
var member1 = {
	ru: "Невозможно прочитать свойство типа $2 из $1",
	en: "Unable to read property of type $2 from $1"
};
var member2 = {
	ru: "Отсутствует свойство объекта или элемент массива ($1)",
	en: "Missing object property or array element ($1)"
};
var member3 = {
	ru: "Номер элемента массива должен быть целым 32-битным числом",
	en: "The array element number must be a 32-bit integer"
};
var fn1 = {
	ru: "Функция $1 работает только с массивами (передано $2)",
	en: "The $1 function works with arrays only ($1 passed)"
};
var arg_1st = {
	ru: "Первый аргумент",
	en: "First argument"
};
var arg_2nd = {
	ru: "Второй аргумент",
	en: "Second argument"
};
var arg_3rd = {
	ru: "Третий аргумент",
	en: "Third argument"
};
var fn2 = {
	ru: "$arg функции $1 должен быть числом (передано $2)",
	en: "$arg of the $1 function must be a number ($2 passed)"
};
var fn3 = {
	ru: "$arg функции $1 должен быть целым 32-битным числом",
	en: "$arg of the $1 function must be a 32-bit integer"
};
var fn4 = {
	ru: "$arg функции $1 должен быть строкой",
	en: "$arg of the $1 function must be a string"
};
var fn5 = {
	ru: "$arg функции $1 должен быть строкой (передано $2)",
	en: "$arg of the $1 function must be a string ($2 passed)"
};
var fn6 = {
	ru: "Функция $1 работает только со строками (передано $2)",
	en: "The $1 function works with strings only ($2 passed)"
};
var fn7 = {
	ru: "Функция $1 работает только с числами (передано $2)",
	en: "The $1 function works with numbers only ($2 passed)"
};
var slice2 = {
	ru: "Третий аргумент ($1) функции slice должен быть положительным числом",
	en: "The third argument ($1) of the slice function must be a positive number"
};
var slice3 = {
	ru: "Второй аргумент ($1) функции slice должен быть числом",
	en: "The second argument ($1) of the slice function must be a number"
};
var substr3 = {
	ru: "Второй аргумент функции substr не должен быть отрицательным числом",
	en: "The second argument of the substr function must not be a negative number"
};
var substr5 = {
	ru: "Третий аргумент функции substr не должен быть отрицательным числом",
	en: "The third argument of the substr function must not be a negative number"
};
var regexTest3 = {
	ru: "Третий аргумент функции regexTest не может быть выражением",
	en: "The third argument of the regexTest function cannot be an expression"
};
var regexTest4 = {
	ru: "Третий аргумент функции regexTest содержит неизвестные опции",
	en: "The third argument of the regexTest function consists of unknown options"
};
var regexMatch3 = {
	ru: "Третий аргумент функции regexMatch не может быть выражением",
	en: "The third argument of the regexMatch function cannot be an expression"
};
var regexMatch4 = {
	ru: "Третий аргумент функции regexMatch содержит неизвестные опции",
	en: "The third argument of the regexMatch function consists of unknown options"
};
var regexMatchAll3 = {
	ru: "Третий аргумент функции regexMatchAll не может быть выражением",
	en: "The third argument of the regexMatchAll function cannot be an expression"
};
var regexMatchAll4 = {
	ru: "Третий аргумент функции regexMatchAll содержит неизвестные опции",
	en: "The third argument of the regexMatchAll function consists of unknown options"
};
var range7 = {
	ru: "Третий аргумент функции range не может быть 0",
	en: "The third argument of the range function cannot be 0"
};
var pow3 = {
	ru: "Слишком большое число в результате выполнения функции pow",
	en: "Too large number as a result of the pow function"
};
var pow4 = {
	ru: "Ошибка выполнения функции pow",
	en: "Pow function error"
};
var log3 = {
	ru: "Первый аргумент функции log должен быть положительным числом",
	en: "The first argument of the log function must be a positive number"
};
var log4 = {
	ru: "Второй аргумент функции log должен быть положительным числом не равным 1",
	en: "The second argument of the log function must be a positive number not equal to 1"
};
var split3 = {
	ru: "Второй аргумент функции split не может быть пустой строкой",
	en: "The second argument of the split function must not be an empty string"
};
var convert1 = {
	ru: "Невозможно преобразовать $1 в $2",
	en: "Unable to convert $1 to $2"
};
var convert2 = {
	ru: "Дата, преобразуемая в строку должна быть в пределах 10 тысяч лет",
	en: "The date converted to a string must be within 10,000 years"
};
var convert3 = {
	ru: "Невозможно преобразовать $1 в $2",
	en: "Unable to convert $1 to $2"
};
var convert4 = {
	ru: "Невозможно преобразовать пустую строку в число",
	en: "Unable to convert the empty string to a number"
};
var convert5 = {
	ru: "Невозможно преобразовать строку в число: неверный формат",
	en: "Unable to convert the string to a number: invalid format"
};
var convert6 = {
	ru: "Невозможно преобразовать строку в число: число слишком велико",
	en: "Unable to convert the string to a number: the number is too large"
};
var convert7 = {
	ru: "Невозможно преобразовать NaN в число",
	en: "Cannot convert NaN to integer"
};
var round2 = {
	ru: "Второй аргумент функции round должен быть в диапазоне от -20 до 100",
	en: "The second argument of the round function must be from -20 to 100"
};
var round3 = {
	ru: "Второй аргумент функции round должен быть целым числом",
	en: "The second argument of the round function must be an integer"
};
var trunc2 = {
	ru: "Второй аргумент функции trunc должен быть в диапазоне от -20 до 100",
	en: "The second argument of the trunc function must be from -20 to 100"
};
var sqrt2 = {
	ru: "Функция sqrt не работает с отрицательными числами",
	en: "The sqrt function does not work with negative numbers"
};
var sin2 = {
	ru: "Функция sin работает только с конечными числами",
	en: "The sin function works with finite numbers only"
};
var cos2 = {
	ru: "Функция cos работает только с конечными числами",
	en: "The cos function works with finite numbers only"
};
var atanh2 = {
	ru: "Функция atanh работает только с числами в диапазоне от -1 до 1",
	en: "The atanh function works with numbers between -1 and 1 only"
};
var acos2 = {
	ru: "Функция acos работает только с числами в диапазоне от -1 до 1",
	en: "The acos function works with numbers between -1 and 1 only"
};
var acosh2 = {
	ru: "Функция acosh работает только с числами в диапазоне от 1",
	en: "The acosh function works with numbers in the range from 1"
};
var asin2 = {
	ru: "Функция asin работает только с числами в диапазоне от -1 до 1",
	en: "The asin function works with numbers between -1 and 1 only"
};
var tan2 = {
	ru: "Функция tan работает только с конечными числами",
	en: "The tan function works with finite numbers only"
};
var in1 = {
	ru: "Оператор in работает только с массивами (передано $1)",
	en: "The in operator works with arrays only ($1 passed)"
};
var general1 = {
	ru: "Слишком большое число",
	en: "Too large number"
};
var toDate1 = {
	ru: "Ошибка преобразования значения в дату",
	en: "Error converting the value to date"
};
var let1 = {
	ru: "Первый аргумент функции let должен быть статичным объектом",
	en: "The first argument of the let function must be a static object"
};
var let2 = {
	ru: "Названия переменных в функции let должны содержать только латинские буквы и цифры",
	en: "Variable names in the let function must consist of Latin letters and numbers only "
};
var indexOf1 = {
	ru: "Первый аргумент функции indexOf должен быть массивом (передано $1)",
	en: "The first argument of the indexOf function must be an array ($1 passed)"
};
var arrayToObject1 = {
	ru: "Функция arrayToObject работает только с массивами (передано $1)",
	en: "The arrayToObject function works with arrays only ($1 passed)"
};
var arrayToObject2 = {
	ru: "Функция arrayToObject ожидает массив из пар ключ-значение (передано $1)",
	en: ""
};
var arrayToObject3 = {
	ru: "Функция arrayToObject ожидает массив из пар ключ-значение, где ключ является строкой (передано $1)",
	en: ""
};
var arrayToObject4 = {
	ru: "Функция arrayToObject ожидает массив из пар ключ-значение размером в 2 элемента (передано $1)",
	en: ""
};
var arrayToObject5 = {
	ru: "Функция arrayToObject ожидает, что все элементы будут или массивами или объектами (передано $1, потом $2)",
	en: ""
};
var arrayToObject6 = {
	ru: "Функция arrayToObject ожидает, что все элементы будут объектами с полями \"k\" и \"v\", где \"k\" это строка (передано $1)",
	en: ""
};
var arrayToObject7 = {
	ru: "Функция arrayToObject ожидает массив объектов с двумя полями \"k\" и \"v\" (передано $1)",
	en: ""
};
var arrayToObject8 = {
	ru: "Функция arrayToObject ожидает массив объектов с двумя полями \"k\" и \"v\", отсутствует одно из них, или оба",
	en: ""
};
var objectToArray1 = {
	ru: "Функция objectToArray работает только с объектами (передано $1)",
	en: "The objectToArray function works with objects only ($1 passed)"
};
var dateAdd1 = {
	ru: "Аргумент 'unit' функции dateAdd должен быть строкой (передано $1)",
	en: "The ‘unit’ argument of the dateAdd function must be a string ($1 passed)"
};
var dateAdd2 = {
	ru: "Аргумент 'date' функции dateAdd должен быть датой",
	en: "The ‘date’ argument of the dateAdd function must be a date"
};
var dateAdd3 = {
	ru: "Аргумент 'unit' функции dateAdd не правильный",
	en: ""
};
var dateAdd4 = {
	ru: "Аргумент 'amount' функции dateAdd должен быть целым числом",
	en: "The ‘amount’ argument of the date Add function must be an integer"
};
var dateAdd5 = {
	ru: "Аргумент 'amount' функции dateAdd не правильный",
	en: ""
};
var dateSubtract1 = {
	ru: "Аргумент 'unit' функции dateSubtract должен быть строкой (передано $1)",
	en: "The ‘unit’ argument of the dateSubstract function must be a string ($1 passed)"
};
var dateSubtract2 = {
	ru: "Аргумент 'date' функции dateSubtract должен быть датой",
	en: "The ‘date’ argument of the dateSubstract function must be a date"
};
var dateSubtract3 = {
	ru: "Аргумент 'unit' функции dateSubtract не правильный",
	en: ""
};
var dateSubtract4 = {
	ru: "Аргумент 'amount' функции dateSubtract должен быть целым числом",
	en: "The ‘amount’ argument of the dateSubstract function must be an integer"
};
var dateSubtract5 = {
	ru: "Аргумент 'amount' функции dateSubtract не правильный",
	en: ""
};
var exists1 = {
	ru: "Неверный аргумент функции exists",
	en: ""
};
var unique1 = {
	ru: "Первый аргумент функции unique должен быть массивом (передано $1)",
	en: "The first argument of the unique function must be an array ($1 passed)"
};
var editor = {
	goto_playground: {
		ru: "Открыть в песочнице",
		en: "Open in playground"
	},
	playground_href: {
		ru: "https://cremax.ru/formula-playground",
		en: "https://crebase.com/formula-playground"
	}
};
var scope_viewer = {
	copy_path: {
		ru: "Скопировать путь: %path%",
		en: "Copy path: %path%"
	},
	copied: {
		ru: "Скопировано: %path%",
		en: "Copied: %path%"
	}
};
var toTable1 = {
	ru: "Ожидался массив, передано $1",
	en: "Array expected, $1 passed"
};
var toTable2 = {
	ru: "Ожидался массив объектов, найден элемент $1",
	en: ""
};
var translations = {
	parseError: parseError,
	evaluateError: evaluateError,
	validateError: validateError,
	finalizeError: finalizeError,
	convertError: convertError,
	preevalError: preevalError,
	pathTypeError: pathTypeError,
	parse1: parse1,
	parse2: parse2,
	parse3: parse3,
	parse4: parse4,
	parse5: parse5,
	parse6: parse6,
	parse7: parse7,
	parse8: parse8,
	parse9: parse9,
	parse10: parse10,
	parse11: parse11,
	parse12: parse12,
	parse13: parse13,
	parse14: parse14,
	parse15: parse15,
	parse16: parse16,
	parse17: parse17,
	parse18: parse18,
	parse19: parse19,
	var1: var1,
	add1: add1,
	subtract1: subtract1,
	mod1: mod1,
	mod2: mod2,
	divide1: divide1,
	divide2: divide2,
	member1: member1,
	member2: member2,
	member3: member3,
	fn1: fn1,
	arg_1st: arg_1st,
	arg_2nd: arg_2nd,
	arg_3rd: arg_3rd,
	fn2: fn2,
	fn3: fn3,
	fn4: fn4,
	fn5: fn5,
	fn6: fn6,
	fn7: fn7,
	slice2: slice2,
	slice3: slice3,
	substr3: substr3,
	substr5: substr5,
	regexTest3: regexTest3,
	regexTest4: regexTest4,
	regexMatch3: regexMatch3,
	regexMatch4: regexMatch4,
	regexMatchAll3: regexMatchAll3,
	regexMatchAll4: regexMatchAll4,
	range7: range7,
	pow3: pow3,
	pow4: pow4,
	log3: log3,
	log4: log4,
	split3: split3,
	convert1: convert1,
	convert2: convert2,
	convert3: convert3,
	convert4: convert4,
	convert5: convert5,
	convert6: convert6,
	convert7: convert7,
	round2: round2,
	round3: round3,
	trunc2: trunc2,
	sqrt2: sqrt2,
	sin2: sin2,
	cos2: cos2,
	atanh2: atanh2,
	acos2: acos2,
	acosh2: acosh2,
	asin2: asin2,
	tan2: tan2,
	in1: in1,
	general1: general1,
	toDate1: toDate1,
	let1: let1,
	let2: let2,
	indexOf1: indexOf1,
	arrayToObject1: arrayToObject1,
	arrayToObject2: arrayToObject2,
	arrayToObject3: arrayToObject3,
	arrayToObject4: arrayToObject4,
	arrayToObject5: arrayToObject5,
	arrayToObject6: arrayToObject6,
	arrayToObject7: arrayToObject7,
	arrayToObject8: arrayToObject8,
	objectToArray1: objectToArray1,
	dateAdd1: dateAdd1,
	dateAdd2: dateAdd2,
	dateAdd3: dateAdd3,
	dateAdd4: dateAdd4,
	dateAdd5: dateAdd5,
	dateSubtract1: dateSubtract1,
	dateSubtract2: dateSubtract2,
	dateSubtract3: dateSubtract3,
	dateSubtract4: dateSubtract4,
	dateSubtract5: dateSubtract5,
	exists1: exists1,
	unique1: unique1,
	editor: editor,
	scope_viewer: scope_viewer,
	toTable1: toTable1,
	toTable2: toTable2
};

// @ts-ignore
class ErrorTranslator {
    static hasTranslationFor(message) {
        const parts = message.split(' :: ');
        return translations[parts[1]] !== undefined;
    }
    static translateTo(message, language) {
        try {
            const parts = message.split(' :: ');
            const stage = parts[0];
            if (stage === 'optimize' || stage === 'evaluate') {
                const errcode = parts[1];
                const errargs = parts.length > 2 ? parts[2].split(',') : [];
                if (translations.hasOwnProperty(errcode)) {
                    let translated = translations[errcode][language];
                    let index = 1;
                    for (const errarg of errargs) {
                        translated = translated.replace('$' + index++, errarg);
                    }
                    return `${translations.evaluateError.ru}: ${translated}`;
                }
                else {
                    return `${translations.evaluateError.ru}: ${message}`;
                }
            }
            else if (['parse', 'validate', 'finalize', 'convert', 'preeval'].includes(stage)) {
                const errcode = parts[1];
                const errarg = parts[2];
                let translated = translations[errcode][language].replace('$1', errarg);
                return `${translations[stage + 'Error'].ru}: ${translated}`;
            }
            else {
                return message;
            }
        }
        catch (e) {
            return message;
        }
    }
    static toRussian(message) {
        return this.translateTo(message, 'ru');
    }
}

class ToTable {
    static perform(data) {
        if (Typing.isNull(data)) {
            return {
                columns: [],
                rows: [],
                total_count: 0,
            };
        }
        else if (Typing.isArray(data)) {
            if (data.length === 0) {
                return {
                    columns: [],
                    rows: [],
                    total_count: 0,
                };
            }
            else {
                let keys = null;
                const rows = data.map(rawRow => {
                    if (!Typing.isObject(rawRow)) {
                        throw new Error('toTable2 :: ' + Typing.getType(rawRow));
                    }
                    if (keys === null) {
                        keys = Object.keys(rawRow);
                    }
                    let row = {};
                    keys.forEach((key) => {
                        var _a;
                        row[key] = (_a = rawRow[key]) !== null && _a !== void 0 ? _a : null;
                    });
                    return row;
                });
                return {
                    columns: keys.map(key => ({ id: key, name: key, type: 'any' })),
                    rows: rows,
                    total_count: data.length,
                };
            }
        }
        else {
            throw new Error('toTable1 :: ' + Typing.getType(data));
        }
    }
}

class ExpressionNode {
    constructor(Expr) {
        this.Expr = Expr;
    }
}

class Identifier extends ExpressionNode {
    constructor(Expr, node) {
        super(Expr);
        this.existsMode = false;
        if (!node || !node.hasOwnProperty('name')) {
            throw new Error('String without name');
        }
        if (!Typing.isString(node.name)) {
            throw new Error('Name is not string');
        }
        if (!node.hasOwnProperty('column')) {
            this.column = false;
        }
        else {
            this.column = !!node.column;
        }
        this.name = node.name;
    }
    enableExistsMode() {
        this.existsMode = true;
    }
    optimize() {
        return this;
    }
    _evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        if (this.column) {
            throw new Error('Column execution is not supported here');
        }
        return scope.hasOwnProperty(this.name);
    }
    evaluate(scope) {
        if (this._evaluate(scope)) {
            return scope[this.name];
        }
        else {
            if (this.existsMode) {
                return null;
            }
            else {
                throw new Error("var1 :: " + this.name);
            }
        }
    }
    evaluateExists(scope) {
        return this._evaluate(scope);
    }
    gatherExternalIdentifiers() {
        if (this.column) {
            // Возвращаем идентификатор с @, чтобы он точно не оптимизировался
            return ['@' + this.name];
        }
        else {
            return [this.name];
        }
    }
    preEvaluate(localVariables, scope) {
        if (this.column || localVariables.includes(this.name)) {
            return this;
        }
        else {
            return new OptimizedNode(this, scope);
        }
    }
    toCode() {
        return this.column ? '@' + this.name : this.name;
    }
}

class OptimizedNode extends ExpressionNode {
    constructor(node, scope = null) {
        super(node.Expr);
        this.source = node;
        this.result = node.evaluate(scope || {});
    }
    optimize() {
        return this;
    }
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        return this.result;
    }
    gatherExternalIdentifiers() {
        return [];
    }
    preEvaluate(localVariables, scope) {
        return this;
    }
    toCode() {
        return Expression.prettyPrint(this.result, false);
    }
}

class AbstractFunction extends ExpressionNode {
    constructor(Expr, args) {
        super(Expr);
        this.arguments = [];
        if (args.length > this.maxArguments()) {
            throw new Error('Too much arguments');
        }
        else if (args.length < this.minArguments()) {
            throw new Error('Not enough arguments');
        }
        for (const argument of args) {
            this.arguments.push(this.Expr.makeNode(argument));
        }
    }
    minArguments() { return 0; }
    ;
    maxArguments() { return 0; }
    ;
    optimize() {
        let canBeOptimized = true;
        for (let i = 0; i < this.arguments.length; i++) {
            this.arguments[i] = this.arguments[i].optimize();
            if (!(this.arguments[i] instanceof OptimizedNode)) {
                canBeOptimized = false;
            }
        }
        if (canBeOptimized) {
            return new OptimizedNode(this);
        }
        return this;
    }
    evaluate(scope) { }
    ;
    localVariableList() {
        return [];
    }
    gatherExternalIdentifiers() {
        let list = [];
        this.arguments.forEach(argument => {
            list = [...list, ...argument.gatherExternalIdentifiers()];
        });
        list = list.filter(item => !this.localVariableList().includes(item));
        return list;
    }
    preEvaluate(localVariables, scope) {
        const nestedLocalVariables = [...localVariables, ...this.localVariableList()];
        let canBeOptimized = true;
        this.arguments.forEach((argument, index) => {
            this.arguments[index] = argument.preEvaluate(nestedLocalVariables, scope);
            if (!(this.arguments[index] instanceof OptimizedNode)) {
                canBeOptimized = false;
            }
        });
        if (canBeOptimized) {
            return new OptimizedNode(this, scope);
        }
        else {
            if (Object.keys(this.gatherExternalIdentifiers()).length === 0) {
                return new OptimizedNode(this, scope);
            }
            else {
                return this;
            }
        }
    }
    toCode() {
        const fnName = Object.keys(Expression.FUNCTIONS).find(key => Expression.FUNCTIONS[key] === this.constructor);
        if (fnName) {
            return [
                fnName,
                '(',
                this.arguments.map(el => el.toCode()).join(', '),
                ')'
            ].join('');
        }
        const opName = Object.keys(Expression.BINARY_OPERATORS).find(key => Expression.BINARY_OPERATORS[key] === this.constructor);
        if (opName) {
            return [
                '(',
                this.arguments[0].toCode(),
                ' ' + opName + ' ',
                this.arguments[1].toCode(),
                ')'
            ].join('');
        }
        throw new Error('Unknown function');
    }
}

class CallFunction extends AbstractFunction {
    minArguments() { return 2; }
    ;
    maxArguments() { return 2; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        throw new Error('general2 :: call');
    }
    ;
}

class MapFunction extends AbstractFunction {
    minArguments() { return 2; }
    ;
    maxArguments() { return 2; }
    ;
    optimize() {
        for (let i = 0; i < this.arguments.length; i++) {
            this.arguments[i] = this.arguments[i].optimize();
        }
        return this;
    }
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const input = this.arguments[0].evaluate(scope);
        if (Typing.isNull(input)) {
            return null;
        }
        else if (Typing.isArray(input)) {
            return input.map(item => {
                const childScope = Object.assign({}, scope);
                childScope.item = item;
                return this.arguments[1].evaluate(childScope);
            });
        }
        else {
            throw new Error('fn1 :: map,' + Typing.getType(input));
        }
    }
    localVariableList() {
        return ['item'];
    }
}

class FilterFunction extends AbstractFunction {
    minArguments() { return 2; }
    ;
    maxArguments() { return 2; }
    ;
    optimize() {
        for (let i = 0; i < this.arguments.length; i++) {
            this.arguments[i] = this.arguments[i].optimize();
        }
        return this;
    }
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const input = this.arguments[0].evaluate(scope);
        if (Typing.isNull(input)) {
            return null;
        }
        else if (Typing.isArray(input)) {
            const result = [];
            input.forEach(item => {
                const childScope = Object.assign({}, scope);
                childScope.item = item;
                if (Convertation.toBoolean(this.arguments[1].evaluate(childScope))) {
                    result.push(item);
                }
            });
            return result;
        }
        else {
            throw new Error('fn1 :: filter,' + Typing.getType(input));
        }
    }
    localVariableList() {
        return ['item'];
    }
}

class ReduceFunction extends AbstractFunction {
    minArguments() { return 3; }
    ;
    maxArguments() { return 3; }
    ;
    optimize() {
        for (let i = 0; i < this.arguments.length; i++) {
            this.arguments[i] = this.arguments[i].optimize();
        }
        return this;
    }
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const input = this.arguments[0].evaluate(scope);
        if (Typing.isNull(input)) {
            return null;
        }
        else if (Typing.isArray(input)) {
            let result = this.arguments[2].evaluate(scope);
            input.forEach(item => {
                const childScope = Object.assign({}, scope);
                childScope.item = item;
                childScope.value = result;
                result = this.arguments[1].evaluate(childScope);
            });
            return result;
        }
        else {
            throw new Error('fn1 :: reduce,' + Typing.getType(input));
        }
    }
    localVariableList() {
        return ['value', 'item'];
    }
}

class CountFunction extends AbstractFunction {
    minArguments() { return 1; }
    ;
    maxArguments() { return 1; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const input = this.arguments[0].evaluate(scope);
        if (Typing.isArray(input)) {
            return input.length;
        }
        else {
            throw new Error('fn1 :: count,' + Typing.getType(input));
        }
    }
    ;
}

class ReverseFunction extends AbstractFunction {
    minArguments() { return 1; }
    ;
    maxArguments() { return 1; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const input = this.arguments[0].evaluate(scope);
        if (Typing.isNull(input)) {
            return null;
        }
        else if (Typing.isArray(input)) {
            return [...input].reverse();
        }
        else {
            throw new Error('fn1 :: reverse,' + Typing.getType(input));
        }
    }
    ;
}

class MergeFunction extends AbstractFunction {
    minArguments() { return 1; }
    ;
    maxArguments() { return 20; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const result = [];
        for (const argument of this.arguments) {
            const operand = argument.evaluate(scope);
            if (Typing.isNull(operand)) {
                return null;
            }
            else if (Typing.isArray(operand)) {
                result.push(...operand);
            }
            else {
                throw new Error('fn1 :: merge,' + Typing.getType(operand));
            }
        }
        return result;
    }
    ;
}

class RangeFunction extends AbstractFunction {
    minArguments() { return 2; }
    ;
    maxArguments() { return 3; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        let start = this.arguments[0].evaluate(scope);
        const end = this.arguments[1].evaluate(scope);
        let step = 1;
        if (this.arguments.length > 2) {
            step = this.arguments[2].evaluate(scope);
        }
        if (!Typing.isNumber(start)) {
            throw new Error("fn2 :: range,1st," + Typing.getType(start));
        }
        if (!Typing.is32BitInteger(start)) {
            throw new Error('fn3 :: range,1st');
        }
        if (!Typing.isNumber(end)) {
            throw new Error("fn2 :: range,2nd," + Typing.getType(end));
        }
        if (!Typing.is32BitInteger(end)) {
            throw new Error('fn3 :: range,2nd');
        }
        if (!Typing.isNumber(step)) {
            throw new Error("fn2 :: range,3rd," + Typing.getType(step));
        }
        if (!Typing.is32BitInteger(step)) {
            throw new Error('fn3 :: range,3rd');
        }
        if (step === 0) {
            throw new Error("range7");
        }
        const length = Math.max(Math.ceil((end - start) / step), 0);
        const range = Array(length);
        for (let idx = 0; idx < length; idx++, start += step) {
            range[idx] = start;
        }
        return range;
    }
    ;
}

class SortFunction extends AbstractFunction {
    minArguments() { return 1; }
    ;
    maxArguments() { return 2; }
    ;
    optimize() {
        for (let i = 0; i < this.arguments.length; i++) {
            this.arguments[i] = this.arguments[i].optimize();
        }
        return this;
    }
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const input = this.arguments[0].evaluate(scope);
        if (Typing.isNull(input)) {
            return null;
        }
        else if (Typing.isArray(input)) {
            if (this.arguments.length > 1) {
                return input.map(item => {
                    const childScope = Object.assign({}, scope);
                    childScope.item = item;
                    return {
                        item,
                        order: this.arguments[1].evaluate(childScope),
                    };
                }).sort(function (a, b) {
                    if (Comparison.isGreater(a.order, b.order))
                        return 1;
                    else if (Comparison.isLess(a.order, b.order))
                        return -1;
                    else
                        return 0;
                }).map(wrappedItem => wrappedItem.item);
            }
            else {
                return input.sort(function (a, b) {
                    if (Comparison.isGreater(a, b))
                        return 1;
                    else if (Comparison.isLess(a, b))
                        return -1;
                    else
                        return 0;
                });
            }
        }
        else {
            throw new Error('fn1 :: sort,' + Typing.getType(input));
        }
    }
    localVariableList() {
        return ['item'];
    }
}

class SliceFunction extends AbstractFunction {
    minArguments() { return 2; }
    ;
    maxArguments() { return 3; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const input = this.arguments[0].evaluate(scope);
        let start = this.arguments[1].evaluate(scope);
        if (Typing.isNull(input) || Typing.isNull(start)) {
            return null;
        }
        else if (Typing.isArray(input)) {
            if (!Typing.isNumber(start)) {
                throw new Error('slice3 :: ' + Typing.getType(start));
            }
            if (!Typing.isFinite(start) || Typing.hasFractionalPart(start)) {
                throw new Error('fn3 :: slice,2nd');
            }
            if (start < -input.length)
                start = -input.length;
            let count;
            if (this.arguments.length > 2) {
                count = this.arguments[2].evaluate(scope);
                if (Typing.isNull(count)) {
                    return null;
                }
                else if (!Typing.isFinite(count) || Typing.hasFractionalPart(count)) {
                    throw new Error('fn3 :: slice,3rd');
                }
                else if (count <= 0) {
                    throw new Error('slice2 :: ' + count);
                }
            }
            else {
                count = undefined;
            }
            return input.slice(start, count ? start + count : count);
        }
        else {
            throw new Error('fn1 :: slice,' + Typing.getType(input));
        }
    }
    ;
}

class InFunction extends AbstractFunction {
    minArguments() { return 2; }
    ;
    maxArguments() { return 2; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const element = this.arguments[0].evaluate(scope);
        const array = this.arguments[1].evaluate(scope);
        if (Typing.isArray(array)) {
            let result = false;
            for (const item of array) {
                if (Comparison.isEqual(item, element)) {
                    result = true;
                    break;
                }
            }
            return result;
        }
        else {
            throw new Error('in1 :: ' + Typing.getType(array));
        }
    }
    ;
}
InFunction.binaryOperatorPrecedence = 7;

class IndexOfFunction extends AbstractFunction {
    minArguments() { return 2; }
    ;
    maxArguments() { return 2; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const array = this.arguments[0].evaluate(scope);
        if (Typing.isNull(array)) {
            return null;
        }
        const element = this.arguments[1].evaluate(scope);
        if (Typing.isArray(array)) {
            let result = -1;
            let index = 0;
            for (const item of array) {
                if (Comparison.isEqual(item, element)) {
                    result = index;
                    break;
                }
                index++;
            }
            return result;
        }
        else {
            throw new Error('indexOf1 :: ' + Typing.getType(array));
        }
    }
    ;
}

class UniqueFunction extends AbstractFunction {
    minArguments() { return 1; }
    ;
    maxArguments() { return 1; }
    ;
    optimize() {
        return this;
    }
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const input = this.arguments[0].evaluate(scope);
        if (Typing.isNull(input)) {
            return null;
        }
        else if (Typing.isArray(input)) {
            const result = [];
            for (let i = 0; i < input.length; i++) {
                let isUnique = true;
                for (let j = 0; j < result.length; j++) {
                    if (Comparison.isEqual(input[i], result[j])) {
                        isUnique = false;
                        break;
                    }
                }
                if (isUnique)
                    result.push(input[i]);
            }
            return result;
        }
        else {
            throw new Error('unique1 :: ' + Typing.getType(input));
        }
    }
    ;
}

class EqualFunction extends AbstractFunction {
    minArguments() { return 2; }
    ;
    maxArguments() { return 2; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const left = this.arguments[0].evaluate(scope);
        const right = this.arguments[1].evaluate(scope);
        return Comparison.isEqual(left, right);
    }
    ;
}
EqualFunction.binaryOperatorPrecedence = 6;

class NotEqualFunction extends AbstractFunction {
    minArguments() { return 2; }
    ;
    maxArguments() { return 2; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const left = this.arguments[0].evaluate(scope);
        const right = this.arguments[1].evaluate(scope);
        return !Comparison.isEqual(left, right);
    }
    ;
}
NotEqualFunction.binaryOperatorPrecedence = 6;

class GreaterFunction extends AbstractFunction {
    minArguments() { return 2; }
    ;
    maxArguments() { return 2; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const left = this.arguments[0].evaluate(scope);
        const right = this.arguments[1].evaluate(scope);
        return Comparison.isGreater(left, right);
    }
    ;
}
GreaterFunction.binaryOperatorPrecedence = 7;

class GreaterOrEqualFunction extends AbstractFunction {
    minArguments() { return 2; }
    ;
    maxArguments() { return 2; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const left = this.arguments[0].evaluate(scope);
        const right = this.arguments[1].evaluate(scope);
        return Comparison.isGreater(left, right) || Comparison.isEqual(left, right);
    }
    ;
}
GreaterOrEqualFunction.binaryOperatorPrecedence = 7;

class LessFunction extends AbstractFunction {
    minArguments() { return 2; }
    ;
    maxArguments() { return 2; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const left = this.arguments[0].evaluate(scope);
        const right = this.arguments[1].evaluate(scope);
        return Comparison.isLess(left, right);
    }
    ;
}
LessFunction.binaryOperatorPrecedence = 7;

class LessOrEqualFunction extends AbstractFunction {
    minArguments() { return 2; }
    ;
    maxArguments() { return 2; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const left = this.arguments[0].evaluate(scope);
        const right = this.arguments[1].evaluate(scope);
        return Comparison.isLess(left, right) || Comparison.isEqual(left, right);
    }
    ;
}
LessOrEqualFunction.binaryOperatorPrecedence = 7;

class NowFunction extends AbstractFunction {
    minArguments() { return 0; }
    ;
    maxArguments() { return 0; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const date = new Date();
        date.setMilliseconds(0);
        return date;
    }
    ;
}

class DateAddFunction extends AbstractFunction {
    minArguments() { return 3; }
    ;
    maxArguments() { return 3; }
    ;
    optimize() {
        if (this.arguments[0] instanceof NullLiteral) {
            return this.arguments[0].optimize();
        }
        return super.optimize();
    }
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const input = this.arguments[0].evaluate(scope);
        const unit = this.arguments[1].evaluate(scope);
        if (Typing.isNull(unit)) {
            return null;
        }
        else if (Typing.isString(unit)) {
            if (!['year', 'quarter', 'week', 'month', 'day', 'hour', 'minute', 'second', 'millisecond'].includes(unit)) {
                throw new Error('dateAdd3');
            }
        }
        else {
            throw new Error('dateAdd1 :: ' + Typing.getType(unit));
        }
        if (Typing.isNull(input)) {
            return null;
        }
        else if (Typing.isDate(input)) {
            const amount = this.arguments[2].evaluate(scope);
            if (Typing.isNull(amount)) {
                return null;
            }
            else if (Typing.isNumber(amount)) {
                if (Math.trunc(amount) === amount) {
                    if (unit === 'year') {
                        return this.addMonths(input, amount * 12);
                    }
                    else if (unit === 'quarter') {
                        return this.addMonths(input, amount * 3);
                    }
                    else if (unit === 'week') {
                        return this.addDays(input, amount * 7);
                    }
                    else if (unit === 'month') {
                        return this.addMonths(input, amount);
                    }
                    else if (unit === 'day') {
                        return this.addDays(input, amount);
                    }
                    else if (unit === 'hour') {
                        return this.addMinutes(input, amount * 60);
                    }
                    else if (unit === 'minute') {
                        return this.addMinutes(input, amount);
                    }
                    else if (unit === 'second') {
                        return this.addMilliseconds(input, amount * 1000);
                    }
                    else if (unit === 'millisecond') {
                        return this.addMilliseconds(input, amount);
                    }
                    else {
                        throw new Error('dateAdd3');
                    }
                }
                else {
                    throw new Error('dateAdd4');
                }
            }
            else {
                throw new Error('dateAdd4');
            }
        }
        else {
            throw new Error('dateAdd2');
        }
    }
    addMonths(date, amount) {
        const endDate = new Date(date);
        const originalDay = endDate.getUTCDate();
        endDate.setUTCMonth(endDate.getUTCMonth() + amount);
        if (endDate.getUTCDate() !== originalDay) {
            // Если был, например, день 31, мы добавили месяц и стал 01, то отматываем
            endDate.setUTCDate(0);
        }
        return endDate;
    }
    addDays(date, amount) {
        const endDate = new Date(date);
        endDate.setUTCDate(endDate.getUTCDate() + amount);
        return endDate;
    }
    addMinutes(date, amount) {
        return this.addMilliseconds(date, amount * 1000 * 60);
    }
    addMilliseconds(date, amount) {
        return new Date(+date + amount);
    }
}

class DateSubtractFunction extends AbstractFunction {
    minArguments() { return 3; }
    ;
    maxArguments() { return 3; }
    ;
    optimize() {
        if (this.arguments[0] instanceof NullLiteral) {
            return this.arguments[0].optimize();
        }
        return super.optimize();
    }
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const input = this.arguments[0].evaluate(scope);
        const unit = this.arguments[1].evaluate(scope);
        if (Typing.isNull(unit)) {
            return null;
        }
        else if (Typing.isString(unit)) {
            if (!['year', 'quarter', 'week', 'month', 'day', 'hour', 'minute', 'second', 'millisecond'].includes(unit)) {
                throw new Error('dateSubtract3');
            }
        }
        else {
            throw new Error('dateSubtract1 :: ' + Typing.getType(unit));
        }
        if (Typing.isNull(input)) {
            return null;
        }
        else if (Typing.isDate(input)) {
            const amount = this.arguments[2].evaluate(scope);
            if (Typing.isNull(amount)) {
                return null;
            }
            else if (Typing.isNumber(amount)) {
                if (Math.trunc(amount) === amount) {
                    if (unit === 'year') {
                        return this.subtractMonths(input, amount * 12);
                    }
                    else if (unit === 'quarter') {
                        return this.subtractMonths(input, amount * 3);
                    }
                    else if (unit === 'week') {
                        return this.subtractDays(input, amount * 7);
                    }
                    else if (unit === 'month') {
                        return this.subtractMonths(input, amount);
                    }
                    else if (unit === 'day') {
                        return this.subtractDays(input, amount);
                    }
                    else if (unit === 'hour') {
                        return this.subtractMinutes(input, amount * 60);
                    }
                    else if (unit === 'minute') {
                        return this.subtractMinutes(input, amount);
                    }
                    else if (unit === 'second') {
                        return this.subtractMilliseconds(input, amount * 1000);
                    }
                    else if (unit === 'millisecond') {
                        return this.subtractMilliseconds(input, amount);
                    }
                    else {
                        throw new Error('dateSubtract3');
                    }
                }
                else {
                    throw new Error('dateSubtract4');
                }
            }
            else {
                throw new Error('dateSubtract4');
            }
        }
        else {
            throw new Error('dateSubtract2');
        }
    }
    subtractMonths(date, amount) {
        const endDate = new Date(date);
        const originalDay = endDate.getUTCDate();
        endDate.setUTCMonth(endDate.getUTCMonth() - amount);
        if (endDate.getUTCDate() !== originalDay) {
            // Если был, например, день 31, мы отняли месяц и стал 01, то отнимаем еще
            endDate.setUTCDate(0);
        }
        return endDate;
    }
    subtractDays(date, amount) {
        const endDate = new Date(date);
        endDate.setUTCDate(endDate.getUTCDate() - amount);
        return endDate;
    }
    subtractMinutes(date, amount) {
        return this.subtractMilliseconds(date, amount * 1000 * 60);
    }
    subtractMilliseconds(date, amount) {
        return new Date(+date - amount);
    }
}

class AndFunction extends AbstractFunction {
    constructor(Expr, args) {
        super(Expr, args.map(arg => ({
            'type': 'CallExpression',
            'arguments': [arg],
            'callee': 'toBoolean',
            'location': [0, 0],
        })));
    }
    minArguments() { return 2; }
    ;
    maxArguments() { return 10; }
    ;
    optimize() {
        let index = 0;
        for (const argument of this.arguments) {
            this.arguments[index++] = argument.optimize();
        }
        for (const argument of this.arguments) {
            // Если любой из аргументов отрицательный на этапе оптимизации, его и возвращаем
            if (argument instanceof OptimizedNode) {
                if (!argument.result) {
                    this.arguments = [argument];
                    return new OptimizedNode(this);
                }
            }
        }
        return this;
    }
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const shelve = [];
        // Сначала проверяем все аргументы, которые не используют переменные
        for (const argument of this.arguments) {
            if (argument instanceof OptimizedNode) {
                if (!argument.evaluate(scope))
                    return false;
            }
            else {
                shelve.push(argument);
            }
        }
        // Затем все, что осталось
        for (const argument of shelve) {
            if (!argument.evaluate(scope))
                return false;
        }
        return true;
    }
    ;
}
AndFunction.binaryOperatorPrecedence = 2;

class IfFunction extends AbstractFunction {
    minArguments() { return 3; }
    ;
    maxArguments() { return 101; }
    ;
    constructor(Expr, args) {
        if ((args.length - 1) % 2 > 0) {
            throw new Error('Wrong argument count');
        }
        // Чтобы не модифицировать оригинальный объект
        args = [...args];
        for (let i = 0; i < (args.length - 1); i += 2) {
            args[i] = {
                'type': 'CallExpression',
                'arguments': [args[i]],
                'callee': 'toBoolean',
                'location': [0, 0],
            };
        }
        super(Expr, args);
    }
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        for (let i = 0; i < (this.arguments.length - 1); i += 2) {
            if (this.arguments[i].evaluate(scope)) {
                return this.arguments[i + 1].evaluate(scope);
            }
        }
        return this.arguments[this.arguments.length - 1].evaluate(scope);
    }
}

class OrFunction extends AbstractFunction {
    constructor(Expr, args) {
        super(Expr, args.map(arg => ({
            'type': 'CallExpression',
            'arguments': [arg],
            'callee': 'toBoolean',
            'location': [0, 0],
        })));
    }
    minArguments() { return 2; }
    ;
    maxArguments() { return 10; }
    ;
    optimize() {
        let index = 0;
        for (const argument of this.arguments) {
            this.arguments[index++] = argument.optimize();
        }
        for (const argument of this.arguments) {
            // Если любой из аргументов положительный на этапе оптимизации, его и возвращаем
            if (argument instanceof OptimizedNode) {
                if (argument.result) {
                    this.arguments = [argument];
                    return new OptimizedNode(this);
                }
            }
        }
        return this;
    }
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const shelve = [];
        // Сначала проверяем все аргументы, которые не используют переменные
        for (const argument of this.arguments) {
            if (argument instanceof OptimizedNode) {
                if (argument.evaluate(scope))
                    return true;
            }
            else {
                shelve.push(argument);
            }
        }
        // Затем все, что осталось
        for (const argument of shelve) {
            if (argument.evaluate(scope))
                return true;
        }
        return false;
    }
    ;
}
OrFunction.binaryOperatorPrecedence = 1;

class NotFunction extends AbstractFunction {
    minArguments() { return 1; }
    ;
    maxArguments() { return 1; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        return !Convertation.toBoolean(this.arguments[0].evaluate(scope));
    }
    ;
}

class LetFunction extends AbstractFunction {
    minArguments() { return 2; }
    ;
    maxArguments() { return 2; }
    ;
    assertId(key, returnFalse = false) {
        const match = /^[a-z]+[a-zA-Z0-9_]*$/.test(key);
        if (!match) {
            if (returnFalse)
                return false;
            throw new Error('let2 :: ' + key);
        }
        return true;
    }
    optimize() {
        return this;
    }
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        if (!(this.arguments[0] instanceof ObjectExpression)) {
            throw new Error('let1');
        }
        for (const key in this.arguments[0].object) {
            if (!LetFunction.IDRE.test(key)) {
                throw new Error('let2 :: ' + key);
            }
            scope = Object.assign({}, scope);
            scope[key] = this.arguments[0].object[key].evaluate(scope);
        }
        return this.arguments[1].evaluate(scope);
    }
    gatherExternalIdentifiers() {
        let localVariables = [];
        let list = [];
        for (const [key, value] of Object.entries(this.arguments[0].object)) {
            this.assertId(key);
            list = [
                ...list,
                ...value.gatherExternalIdentifiers().filter(id => !localVariables.includes(id))
            ];
            localVariables.push(key);
        }
        list = [
            ...list,
            ...this.arguments[1].gatherExternalIdentifiers().filter(id => !localVariables.includes(id))
        ];
        return list;
    }
    preEvaluate(localVariables, scope) {
        const nestedLocalVariables = [...localVariables];
        let canBeOptimized = true;
        for (const [key, value] of Object.entries(this.arguments[0].object)) {
            this.assertId(key);
            this.arguments[0].object[key] = value.preEvaluate(nestedLocalVariables, scope);
            if (this.arguments[0].object[key] instanceof OptimizedNode) {
                // Если переменная раскрывается, то добавляем ее в скоуп
                scope = Object.assign({}, scope);
                scope[key] = this.arguments[0].object[key].evaluate(scope);
            }
            else {
                // Иначе она попадает в список локальных переменных и не меняется больше
                canBeOptimized = false;
                nestedLocalVariables.push(key);
            }
        }
        this.arguments[1] = this.arguments[1].preEvaluate(nestedLocalVariables, scope);
        if (!(this.arguments[1] instanceof OptimizedNode)) {
            canBeOptimized = false;
        }
        if (canBeOptimized) {
            return new OptimizedNode(this, scope);
        }
        else {
            if (Object.keys(this.gatherExternalIdentifiers()).length === 0) {
                return new OptimizedNode(this, scope);
            }
            else {
                return this;
            }
        }
    }
}
LetFunction.IDRE = /^[a-z]+[a-zA-Z0-9_]*$/;

class DivideFunction extends AbstractFunction {
    minArguments() { return 2; }
    ;
    maxArguments() { return 2; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const left = this.arguments[0].evaluate(scope);
        const right = this.arguments[1].evaluate(scope);
        if (Typing.isNull(left) || Typing.isNull(right)) {
            return null;
        }
        if (!Typing.isNumber(left) || !Typing.isNumber(right)) {
            throw new Error("divide2 :: " + Typing.getType(left) + ',' + Typing.getType(right));
        }
        if (Typing.isZero(right)) {
            throw new Error('divide1');
        }
        return left / right;
    }
    ;
}
DivideFunction.binaryOperatorPrecedence = 10;

class ModFunction extends AbstractFunction {
    minArguments() { return 2; }
    ;
    maxArguments() { return 2; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const left = this.arguments[0].evaluate(scope);
        const right = this.arguments[1].evaluate(scope);
        if (Typing.isNull(left) || Typing.isNull(right)) {
            return null;
        }
        if (!Typing.isNumber(left) || !Typing.isNumber(right)) {
            throw new Error("mod2 :: " + Typing.getType(left) + ',' + Typing.getType(right));
        }
        if (Typing.isZero(right)) {
            throw new Error('mod1');
        }
        return left % right;
    }
    ;
}
ModFunction.binaryOperatorPrecedence = 10;

class PowFunction extends AbstractFunction {
    minArguments() { return 2; }
    ;
    maxArguments() { return 2; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const left = this.arguments[0].evaluate(scope);
        const right = this.arguments[1].evaluate(scope);
        if (Typing.isNull(left) || Typing.isNull(right)) {
            return null;
        }
        if (!Typing.isNumber(left)) {
            throw new Error("fn2 :: pow,1st," + Typing.getType(left));
        }
        if (!Typing.isNumber(right)) {
            throw new Error("fn2 :: pow,2nd," + Typing.getType(right));
        }
        const result = Math.pow(left, right);
        if (result > Typing.DOUBLE_RANGE) {
            throw new Error("pow3");
        }
        if (Typing.isNaN(result)) {
            throw new Error("pow4");
        }
        return result;
    }
    ;
}

class SqrtFunction extends AbstractFunction {
    minArguments() { return 1; }
    ;
    maxArguments() { return 1; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const number = this.arguments[0].evaluate(scope);
        if (Typing.isNull(number)) {
            return null;
        }
        if (!Typing.isNumber(number)) {
            throw new Error("fn7 :: sqrt," + Typing.getType(number));
        }
        if (number < 0) {
            throw new Error("sqrt2");
        }
        return Math.sqrt(number);
    }
    ;
}

class MultiplyFunction extends AbstractFunction {
    minArguments() { return 1; }
    ;
    maxArguments() { return 1; }
    ;
    optimize() {
        if (this.arguments[0] instanceof ArrayExpression) {
            const flatArguments = []; // Вложенные функции раскрываем в плоский список
            for (const node of this.arguments[0].array) {
                if (node instanceof MultiplyFunction) {
                    if (node.arguments[0] instanceof ArrayExpression) {
                        for (const nestedNode of node.arguments[0].array) {
                            flatArguments.push(nestedNode);
                        }
                    }
                    else {
                        flatArguments.push(node);
                    }
                }
                else {
                    flatArguments.push(node);
                }
            }
            this.arguments[0].array = flatArguments;
            let argumentsToOptimize = [];
            let argumentsToNotOptimize = [];
            for (const argument of this.arguments[0].array) {
                const optimizedNode = argument.optimize();
                if (optimizedNode instanceof OptimizedNode) {
                    argumentsToOptimize.push(optimizedNode);
                }
                else {
                    argumentsToNotOptimize.push(optimizedNode);
                }
            }
            if (argumentsToOptimize.length) {
                if (argumentsToOptimize.length > 1) {
                    this.arguments[0].array = argumentsToOptimize;
                    argumentsToOptimize = [new OptimizedNode(this)];
                }
                this.arguments[0].array = [...argumentsToNotOptimize, ...argumentsToOptimize];
            }
            if (!argumentsToNotOptimize.length) {
                return new OptimizedNode(this);
            }
        }
        return this;
    }
    multiply(operand) {
        if (Typing.isNull(operand)) {
            return null;
        }
        else if (Typing.isNumber(operand)) {
            // Mongo не умеет умножать конечные числа больше этого диапазона
            if (Typing.isFinite(operand)) {
                if (operand > Typing.MONGO_LONG_MAX || operand < Typing.MONGO_LONG_MIN) {
                    throw new Error('general1');
                }
            }
            return this.result *= operand;
        }
        else {
            throw new Error('fn7 :: multiply,' + Typing.getType(operand));
        }
    }
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        this.result = 1;
        if (this.arguments[0] instanceof ArrayExpression) {
            for (const argument of this.arguments[0].array) {
                if (this.multiply(argument.evaluate(scope)) === null)
                    return null;
            }
        }
        else {
            const input = this.arguments[0].evaluate(scope);
            if (Typing.isNull(input)) {
                return null;
            }
            else if (Typing.isArray(input)) {
                for (const operand of input) {
                    if (this.multiply(operand) === null)
                        return null;
                }
            }
            else {
                throw new Error('fn7 :: multiply,' + Typing.getType(input));
            }
        }
        return this.result;
    }
    ;
}
MultiplyFunction.binaryOperatorPrecedence = 10;

class SubtractFunction extends AbstractFunction {
    minArguments() { return 2; }
    ;
    maxArguments() { return 2; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const left = this.arguments[0].evaluate(scope);
        const right = this.arguments[1].evaluate(scope);
        if (Typing.isNull(left) || Typing.isNull(right)) {
            return null;
        }
        if (Typing.isDate(left) && Typing.isNumber(right)) {
            return Convertation.toDate(Convertation.toNumber(left) - right);
        }
        if (!Typing.isNumber(left) || !Typing.isNumber(right)) {
            throw new Error("subtract1 :: " + Typing.getType(right) + ',' + Typing.getType(left));
        }
        return left - right;
    }
    ;
}
SubtractFunction.binaryOperatorPrecedence = 9;

class SumFunction extends AbstractFunction {
    constructor() {
        super(...arguments);
        this.isDate = false;
    }
    minArguments() { return 1; }
    ;
    maxArguments() { return 1; }
    ;
    optimize() {
        if (this.arguments[0] instanceof ArrayExpression) {
            const flatArguments = []; // Вложенные функции раскрываем в плоский список
            for (const node of this.arguments[0].array) {
                if (node instanceof SumFunction) {
                    if (node.arguments[0] instanceof ArrayExpression) {
                        for (const nestedNode of node.arguments[0].array) {
                            flatArguments.push(nestedNode);
                        }
                    }
                    else {
                        flatArguments.push(node);
                    }
                }
                else {
                    flatArguments.push(node);
                }
            }
            this.arguments[0].array = flatArguments;
            let argumentsToOptimize = [];
            let argumentsToNotOptimize = [];
            for (const argument of this.arguments[0].array) {
                const optimizedNode = argument.optimize();
                if (optimizedNode instanceof OptimizedNode) {
                    argumentsToOptimize.push(optimizedNode);
                }
                else {
                    argumentsToNotOptimize.push(optimizedNode);
                }
            }
            if (argumentsToOptimize.length) {
                if (argumentsToOptimize.length > 1) {
                    this.arguments[0].array = argumentsToOptimize;
                    argumentsToOptimize = [new OptimizedNode(this)];
                }
                this.arguments[0].array = [...argumentsToNotOptimize, ...argumentsToOptimize];
            }
            if (!argumentsToNotOptimize.length) {
                return new OptimizedNode(this);
            }
        }
        return this;
    }
    add(operand) {
        if (Typing.isNull(operand)) {
            return null;
        }
        else if (Typing.isNumber(operand)) {
            return this.result += operand;
        }
        else if (Typing.isDate(operand)) {
            this.isDate = true;
            return this.result += Convertation.toNumber(operand);
        }
        else {
            throw new Error('add1 :: ' + Typing.getType(operand));
        }
    }
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        this.result = 0;
        if (this.arguments[0] instanceof ArrayExpression) {
            for (const argument of this.arguments[0].array) {
                if (this.add(argument.evaluate(scope)) === null)
                    return null;
            }
        }
        else {
            const input = this.arguments[0].evaluate(scope);
            if (Typing.isNull(input)) {
                return null;
            }
            else if (Typing.isArray(input)) {
                for (const operand of input) {
                    if (this.add(operand) === null)
                        return null;
                }
            }
            else {
                throw new Error('add1 :: ' + Typing.getType(input));
            }
        }
        if (this.isDate)
            return Convertation.toDate(this.result);
        else
            return this.result;
    }
    ;
}
SumFunction.binaryOperatorPrecedence = 9;

class RoundFunction extends AbstractFunction {
    minArguments() { return 1; }
    ;
    maxArguments() { return 2; }
    ;
    roundHalfToEven(number) {
        if (Math.abs(number % 1) === 0.5) {
            return 2 * Math.round(number / 2);
        }
        else {
            return Math.round(number);
        }
    }
    roundHalfTowardZero(number) {
        if (Math.abs(number % 1) === 0.5) {
            return Math.round(number - 0.5 * Math.sign(number));
        }
        else {
            return Math.round(number);
        }
    }
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const number = this.arguments[0].evaluate(scope);
        let precision = 0;
        if (this.arguments.length > 1) {
            precision = this.arguments[1].evaluate(scope);
        }
        if (Typing.isNull(number) || Typing.isNull(precision)) {
            return null;
        }
        if (!Typing.isNumber(number)) {
            throw new Error("fn7 :: round," + Typing.getType(number));
        }
        if (!Typing.isNumber(precision)) {
            throw new Error("convert3 :: " + Typing.getType(precision) + ",number");
        }
        if (!Typing.isFinite(precision)) {
            throw new Error("general1");
        }
        if (Typing.hasFractionalPart(precision)) {
            throw new Error('round3');
        }
        if (precision < -20 || precision > 100) {
            throw new Error("round2 :: " + precision);
        }
        const multabs = Math.pow(10, Math.abs(precision));
        const mult = precision < 0 ? 1 / multabs : multabs;
        if (precision > 0) {
            return Typing.fixNegativeZero(this.roundHalfTowardZero(number * mult) / mult);
        }
        else {
            return Typing.fixNegativeZero(this.roundHalfToEven(number * mult) / mult);
        }
    }
    ;
}

class FloorFunction extends AbstractFunction {
    minArguments() { return 1; }
    ;
    maxArguments() { return 1; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const number = this.arguments[0].evaluate(scope);
        if (Typing.isNull(number)) {
            return null;
        }
        if (!Typing.isNumber(number)) {
            throw new Error("fn7 :: floor," + Typing.getType(number));
        }
        return Math.floor(number);
    }
    ;
}

class CeilFunction extends AbstractFunction {
    minArguments() { return 1; }
    ;
    maxArguments() { return 1; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const number = this.arguments[0].evaluate(scope);
        if (Typing.isNull(number)) {
            return null;
        }
        if (!Typing.isNumber(number)) {
            throw new Error("fn7 :: ceil," + Typing.getType(number));
        }
        return Math.ceil(number);
    }
    ;
}

class AbsFunction extends AbstractFunction {
    minArguments() { return 1; }
    ;
    maxArguments() { return 1; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const number = this.arguments[0].evaluate(scope);
        if (Typing.isNull(number)) {
            return null;
        }
        if (!Typing.isNumber(number)) {
            throw new Error("fn7 :: abs," + Typing.getType(number));
        }
        return Math.abs(number);
    }
    ;
}

class RandomFunction extends AbstractFunction {
    minArguments() { return 0; }
    ;
    maxArguments() { return 0; }
    ;
    optimize() {
        return this;
    }
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        return Math.random();
    }
    ;
}

class MinFunction extends AbstractFunction {
    minArguments() { return 1; }
    ;
    maxArguments() { return 1; }
    ;
    optimize() {
        if (this.arguments[0] instanceof ArrayExpression) {
            return super.optimize();
        }
        else {
            return this;
        }
    }
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const input = this.arguments[0].evaluate(scope);
        if (Typing.isNull(input)) {
            return null;
        }
        else if (!Typing.isArray(input)) {
            throw new Error('fn1 :: min,' + Typing.getType(input));
        }
        if (input.length === 0)
            return null;
        let result = null;
        for (const item of input) {
            if (Typing.isNull(item))
                continue;
            if (result === null || Comparison.isLess(item, result)) {
                result = item;
            }
        }
        return result;
    }
    ;
}

class MaxFunction extends AbstractFunction {
    minArguments() { return 1; }
    ;
    maxArguments() { return 1; }
    ;
    optimize() {
        if (this.arguments[0] instanceof ArrayExpression) {
            return super.optimize();
        }
        else {
            return this;
        }
    }
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const input = this.arguments[0].evaluate(scope);
        if (Typing.isNull(input)) {
            return null;
        }
        else if (!Typing.isArray(input)) {
            throw new Error('fn1 :: max,' + Typing.getType(input));
        }
        if (input.length === 0)
            return null;
        let result = null;
        for (const item of input) {
            if (Typing.isNull(item))
                continue;
            if (result === null || Comparison.isGreater(item, result)) {
                result = item;
            }
        }
        return result;
    }
    ;
}

class LogFunction extends AbstractFunction {
    minArguments() { return 2; }
    ;
    maxArguments() { return 2; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const left = this.arguments[0].evaluate(scope);
        const right = this.arguments[1].evaluate(scope);
        if (Typing.isNull(left) || Typing.isNull(right)) {
            return null;
        }
        if (!Typing.isNumber(left)) {
            throw new Error("fn2 :: log,1st," + Typing.getType(left));
        }
        else if (left <= 0) {
            throw new Error("log3");
        }
        if (!Typing.isNumber(right)) {
            throw new Error("fn2 :: log,2nd," + Typing.getType(right));
        }
        else if (right <= 0 || right === 1) {
            throw new Error("log4");
        }
        // https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Math/log#example:_using_math.log_with_a_different_base
        return Math.log(left) / Math.log(right);
    }
    ;
}

class ExpFunction extends AbstractFunction {
    minArguments() { return 1; }
    ;
    maxArguments() { return 1; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const number = this.arguments[0].evaluate(scope);
        if (Typing.isNull(number)) {
            return null;
        }
        if (!Typing.isNumber(number)) {
            throw new Error("fn7 :: exp," + Typing.getType(number));
        }
        return Math.exp(number);
    }
    ;
}

class TruncFunction extends AbstractFunction {
    minArguments() { return 1; }
    ;
    maxArguments() { return 2; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const number = this.arguments[0].evaluate(scope);
        let precision = 0;
        if (this.arguments.length > 1) {
            precision = this.arguments[1].evaluate(scope);
        }
        if (Typing.isNull(number) || Typing.isNull(precision)) {
            return null;
        }
        if (!Typing.isNumber(number)) {
            throw new Error("fn7 :: trunc," + Typing.getType(number));
        }
        if (!Typing.isNumber(precision)) {
            throw new Error("convert3 :: " + Typing.getType(precision) + ",number");
        }
        if (precision < -20 || precision > 100) {
            throw new Error("trunc2 :: " + precision);
        }
        const mult = Math.pow(10, precision);
        return Typing.fixNegativeZero(Math.trunc(number * mult) / mult);
    }
    ;
}

class CosFunction extends AbstractFunction {
    minArguments() { return 1; }
    ;
    maxArguments() { return 1; }
    ;
    evaluate(scope) {
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
    }
    ;
}

class AcosFunction extends AbstractFunction {
    minArguments() { return 1; }
    ;
    maxArguments() { return 1; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const number = this.arguments[0].evaluate(scope);
        if (Typing.isNull(number)) {
            return null;
        }
        if (!Typing.isNumber(number)) {
            throw new Error("fn7 :: acos," + Typing.getType(number));
        }
        if (number < -1 || number > 1) {
            throw new Error("acos2 :: " + Convertation.toString(number));
        }
        return Math.acos(number);
    }
    ;
}

class AcoshFunction extends AbstractFunction {
    minArguments() { return 1; }
    ;
    maxArguments() { return 1; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const number = this.arguments[0].evaluate(scope);
        if (Typing.isNull(number)) {
            return null;
        }
        if (!Typing.isNumber(number)) {
            throw new Error("fn7 :: acosh," + Typing.getType(number));
        }
        if (number < 1) {
            throw new Error("acosh2 :: " + number);
        }
        return Math.acosh(number);
    }
    ;
}

class AsinFunction extends AbstractFunction {
    minArguments() { return 1; }
    ;
    maxArguments() { return 1; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const number = this.arguments[0].evaluate(scope);
        if (Typing.isNull(number)) {
            return null;
        }
        if (!Typing.isNumber(number)) {
            throw new Error("fn7 :: asin," + Typing.getType(number));
        }
        if (number < -1 || number > 1) {
            throw new Error("asin2 :: " + Convertation.toString(number));
        }
        return Math.asin(number);
    }
    ;
}

class AsinhFunction extends AbstractFunction {
    minArguments() { return 1; }
    ;
    maxArguments() { return 1; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const number = this.arguments[0].evaluate(scope);
        if (Typing.isNull(number)) {
            return null;
        }
        if (!Typing.isNumber(number)) {
            throw new Error("fn7 :: asinh," + Typing.getType(number));
        }
        return Math.asinh(number);
    }
    ;
}

class Atan2Function extends AbstractFunction {
    minArguments() { return 2; }
    ;
    maxArguments() { return 2; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const left = this.arguments[0].evaluate(scope);
        const right = this.arguments[1].evaluate(scope);
        if (Typing.isNull(left) || Typing.isNull(right)) {
            return null;
        }
        if (!Typing.isNumber(left)) {
            throw new Error("fn7 :: atan2," + Typing.getType(left));
        }
        if (!Typing.isNumber(right)) {
            throw new Error("fn7 :: atan2," + Typing.getType(right));
        }
        // https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Math/atan2#example:_using_math.atan2_with_a_different_base
        return Math.atan2(left, right);
    }
    ;
}

class AtanFunction extends AbstractFunction {
    minArguments() { return 1; }
    ;
    maxArguments() { return 1; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const number = this.arguments[0].evaluate(scope);
        if (Typing.isNull(number)) {
            return null;
        }
        if (!Typing.isNumber(number)) {
            throw new Error("fn7 :: atan," + Typing.getType(number));
        }
        return Math.atan(number);
    }
    ;
}

class AtanhFunction extends AbstractFunction {
    minArguments() { return 1; }
    ;
    maxArguments() { return 1; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const number = this.arguments[0].evaluate(scope);
        if (Typing.isNull(number)) {
            return null;
        }
        if (!Typing.isNumber(number)) {
            throw new Error("fn7 :: atanh," + Typing.getType(number));
        }
        if (number < -1 || number > 1) {
            throw new Error("atanh2 :: " + Convertation.toString(number));
        }
        return Math.atanh(number);
    }
    ;
}

class CoshFunction extends AbstractFunction {
    minArguments() { return 1; }
    ;
    maxArguments() { return 1; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const number = this.arguments[0].evaluate(scope);
        if (Typing.isNull(number)) {
            return null;
        }
        if (!Typing.isNumber(number)) {
            throw new Error("fn7 :: cosh," + Typing.getType(number));
        }
        return Math.cosh(number);
    }
    ;
}

class SinFunction extends AbstractFunction {
    minArguments() { return 1; }
    ;
    maxArguments() { return 1; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const number = this.arguments[0].evaluate(scope);
        if (Typing.isNull(number)) {
            return null;
        }
        if (!Typing.isNumber(number)) {
            throw new Error("fn7 :: sin," + Typing.getType(number));
        }
        if (Typing.isInfinite(number)) {
            throw new Error("sin2");
        }
        return Math.sin(number);
    }
    ;
}

class SinhFunction extends AbstractFunction {
    minArguments() { return 1; }
    ;
    maxArguments() { return 1; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const number = this.arguments[0].evaluate(scope);
        if (Typing.isNull(number)) {
            return null;
        }
        if (!Typing.isNumber(number)) {
            throw new Error("fn7 :: sinh," + Typing.getType(number));
        }
        return Math.sinh(number);
    }
    ;
}

class TanFunction extends AbstractFunction {
    minArguments() { return 1; }
    ;
    maxArguments() { return 1; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const number = this.arguments[0].evaluate(scope);
        if (Typing.isNull(number)) {
            return null;
        }
        if (!Typing.isNumber(number)) {
            throw new Error("fn7 :: tan," + Typing.getType(number));
        }
        if (Typing.isInfinite(number)) {
            throw new Error("tan2");
        }
        return Math.tan(number);
    }
    ;
}

class TanhFunction extends AbstractFunction {
    minArguments() { return 1; }
    ;
    maxArguments() { return 1; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const number = this.arguments[0].evaluate(scope);
        if (Typing.isNull(number)) {
            return null;
        }
        if (!Typing.isNumber(number)) {
            throw new Error("fn7 :: tanh," + Typing.getType(number));
        }
        return Math.tanh(number);
    }
    ;
}

class JoinFunction extends AbstractFunction {
    minArguments() { return 1; }
    ;
    maxArguments() { return 2; }
    ;
    optimize() {
        if (this.arguments[0] instanceof ArrayExpression) {
            if (this.arguments.length === 1) {
                const flatArguments = []; // Вложенные функции раскрываем в плоский список
                for (const node of this.arguments[0].array) {
                    if (node instanceof JoinFunction) {
                        if (node.arguments.length === 1 && node.arguments[0] instanceof ArrayExpression) {
                            for (const nestedNode of node.arguments[0].array) {
                                flatArguments.push(nestedNode);
                            }
                        }
                        else {
                            flatArguments.push(node);
                        }
                    }
                    else {
                        flatArguments.push(node);
                    }
                }
                this.arguments[0].array = flatArguments;
                let index = 0;
                for (const argument of this.arguments[0].array) {
                    const optimizedNode = argument.optimize();
                    if (optimizedNode instanceof OptimizedNode) {
                        optimizedNode.result = Convertation.toString(optimizedNode.result);
                        this.arguments[0].array[index] = optimizedNode;
                    }
                    index++;
                }
            }
            else {
                this.arguments[0] = this.arguments[0].optimize();
                this.arguments[1] = this.arguments[1].optimize();
            }
        }
        return this;
    }
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const input = this.arguments[0].evaluate(scope);
        let delimiter = '';
        if (this.arguments.length > 1) {
            delimiter = this.arguments[1].evaluate(scope);
        }
        if (Typing.isString(input)) {
            return input;
        }
        else if (Typing.isNull(input)) {
            return '';
        }
        else if (Typing.isArray(input)) {
            if (!Typing.isString(delimiter)) {
                throw new Error('fn5 :: join,2nd,' + Typing.getType(delimiter));
            }
            let result = '';
            let index = 0;
            for (const operand of input) {
                if (index++ > 0)
                    result += delimiter;
                if (Typing.isNull(operand))
                    continue;
                result += Convertation.toString(operand);
            }
            return result;
        }
        else {
            throw new Error('fn6 :: join,' + Typing.getType(input));
        }
    }
    ;
}
JoinFunction.binaryOperatorPrecedence = 8;

class LengthFunction extends AbstractFunction {
    minArguments() { return 1; }
    ;
    maxArguments() { return 1; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const input = this.arguments[0].evaluate(scope);
        if (Typing.isString(input)) {
            // spread оператор корректно обрабатывает эмодзи
            return [...input].length;
        }
        else {
            throw new Error('fn6 :: length,' + Typing.getType(input));
        }
    }
    ;
}

class SubstrFunction extends AbstractFunction {
    minArguments() { return 1; }
    ;
    maxArguments() { return 3; }
    ;
    constructor(Expr, args) {
        // Оригинальный объект не мутируем
        args = [...args];
        if (args.length === 1) {
            args.push({ 'type': 'Number', 'value': 0 });
        }
        if (args.length === 2) {
            args.push({ 'type': 'Number', 'value': Typing.INT32_RANGE });
        }
        super(Expr, args);
    }
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        let input = this.arguments[0].evaluate(scope);
        const start = this.arguments[1].evaluate(scope);
        const length = this.arguments[2].evaluate(scope);
        if (Typing.isNumber(input) || Typing.isBoolean(input)) {
            input = Convertation.toString(input);
        }
        else if (Typing.isNull(input)) {
            return '';
        }
        else if (!Typing.isString(input) && !Typing.isDate(input)) {
            throw new Error('convert1 :: ' + Typing.getType(input) + ',string');
        }
        if (!Typing.isNumber(start)) {
            throw new Error('fn2 :: substr,2nd,' + Typing.getType(start));
        }
        else if (!Typing.is32BitInteger(start)) {
            throw new Error('fn3 :: substr,2nd');
        }
        if (!Typing.isNumber(length)) {
            throw new Error('fn2 :: substr,3rd,' + Typing.getType(length));
        }
        else if (!Typing.is32BitInteger(length)) {
            throw new Error('fn3 :: substr,3rd');
        }
        if (start < 0) {
            throw new Error('substr3');
        }
        if (length < 0) {
            throw new Error('substr5');
        }
        if (Typing.isDate(input)) {
            input = Convertation.toString(input);
        }
        // spread оператор корректно обрабатывает эмодзи
        return [...input].slice(start, start + length).join('');
    }
    ;
}

/** Поиск с учетом эмодзи */
function spreadIndexOf(input, needle, start = 0) {
    const characters = [...input];
    const needleChars = [...needle];
    const needleLength = needleChars.length;
    for (let i = start; i <= characters.length - needleLength; i++) {
        if (characters.slice(i, i + needleLength).join('') === needle) {
            return i;
        }
    }
    return -1;
}
class LocateFunction extends AbstractFunction {
    minArguments() { return 2; }
    ;
    maxArguments() { return 3; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const input = this.arguments[0].evaluate(scope);
        const needle = this.arguments[1].evaluate(scope);
        if (Typing.isNull(input)) {
            return null;
        }
        else if (!Typing.isString(input)) {
            throw new Error('fn5 :: locate,1st,' + Typing.getType(input));
        }
        if (!Typing.isString(needle)) {
            throw new Error('fn5 :: locate,2nd,' + Typing.getType(needle));
        }
        let start = 0;
        if (this.arguments.length > 2) {
            start = this.arguments[2].evaluate(scope);
        }
        return spreadIndexOf(input, needle, start);
    }
    ;
}

class TrimFunction extends AbstractFunction {
    minArguments() { return 1; }
    ;
    maxArguments() { return 1; }
    ;
    trim(str, charlist) {
        let start = 0;
        let end = str.length;
        while (start < end && charlist.indexOf(str[start]) >= 0) {
            ++start;
        }
        while (end > start && charlist.indexOf(str[end - 1]) >= 0) {
            --end;
        }
        return (start > 0 || end < str.length) ? str.substring(start, end) : str;
    }
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const input = this.arguments[0].evaluate(scope);
        if (Typing.isNull(input)) {
            return null;
        }
        else if (Typing.isString(input)) {
            return this.trim(input, TrimFunction.WHITESPACE);
        }
        else {
            throw new Error('fn6 :: trim,' + Typing.getType(input));
        }
    }
    ;
}
// https://mongodb.com/docs/manual/reference/operator/aggregation/trim/#std-label-trim-white-space
TrimFunction.WHITESPACE = ("\u{0000}\u{0020}\u{0009}\u{000A}\u{000B}" +
    "\u{000C}\u{000D}\u{00A0}\u{1680}\u{2000}" +
    "\u{2001}\u{2002}\u{2003}\u{2004}\u{2005}" +
    "\u{2006}\u{2007}\u{2008}\u{2009}\u{200A}");

class TrimStartFunction extends AbstractFunction {
    minArguments() { return 1; }
    ;
    maxArguments() { return 1; }
    ;
    trimStart(str, charlist) {
        let start = 0;
        let end = str.length;
        while (start < end && charlist.indexOf(str[start]) >= 0) {
            ++start;
        }
        return (start > 0 || end < str.length) ? str.substring(start, end) : str;
    }
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const input = this.arguments[0].evaluate(scope);
        if (Typing.isNull(input)) {
            return null;
        }
        else if (Typing.isString(input)) {
            return this.trimStart(input, TrimFunction.WHITESPACE);
        }
        else {
            throw new Error('fn6 :: trimStart,' + Typing.getType(input));
        }
    }
    ;
}

class TrimEndFunction extends AbstractFunction {
    minArguments() { return 1; }
    ;
    maxArguments() { return 1; }
    ;
    trimEnd(str, charlist) {
        let start = 0;
        let end = str.length;
        while (end > start && charlist.indexOf(str[end - 1]) >= 0) {
            --end;
        }
        return (start > 0 || end < str.length) ? str.substring(start, end) : str;
    }
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const input = this.arguments[0].evaluate(scope);
        if (Typing.isNull(input)) {
            return null;
        }
        else if (Typing.isString(input)) {
            return this.trimEnd(input, TrimFunction.WHITESPACE);
        }
        else {
            throw new Error('fn6 :: trimEnd,' + Typing.getType(input));
        }
    }
    ;
}

class SplitFunction extends AbstractFunction {
    minArguments() { return 2; }
    ;
    maxArguments() { return 2; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const input = this.arguments[0].evaluate(scope);
        const delimiter = this.arguments[1].evaluate(scope);
        if (Typing.isNull(input) || Typing.isNull(delimiter)) {
            return null;
        }
        if (!Typing.isString(input)) {
            throw new Error('fn5 :: split,1st,' + Typing.getType(input));
        }
        if (!Typing.isString(delimiter)) {
            throw new Error('fn5 :: split,2nd,' + Typing.getType(delimiter));
        }
        if (delimiter === '') {
            throw new Error('split3');
        }
        return input.split(delimiter);
    }
    ;
}

class ReplaceFunction extends AbstractFunction {
    minArguments() { return 3; }
    ;
    maxArguments() { return 3; }
    ;
    optimize() {
        for (let i = 0; i < this.arguments.length; i++) {
            this.arguments[i] = this.arguments[i].optimize();
        }
        return this;
    }
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        let input = this.arguments[0].evaluate(scope);
        const find = this.arguments[1].evaluate(scope);
        const replacement = this.arguments[2].evaluate(scope);
        if (!Typing.isNull(input) && !Typing.isString(input)) {
            throw new Error('fn5 :: replace,1st,' + Typing.getType(input));
        }
        if (!Typing.isNull(find) && !Typing.isString(find)) {
            throw new Error('fn5 :: replace,2nd,' + Typing.getType(find));
        }
        if (!Typing.isNull(replacement) && !Typing.isString(replacement)) {
            throw new Error('fn5 :: replace,3rd,' + Typing.getType(replacement));
        }
        if (Typing.isNull(input) || Typing.isNull(find) || Typing.isNull(replacement)) {
            return null;
        }
        return input.replace(find, replacement);
    }
    ;
}

class ReplaceAllFunction extends AbstractFunction {
    minArguments() { return 3; }
    ;
    maxArguments() { return 3; }
    ;
    optimize() {
        for (let i = 0; i < this.arguments.length; i++) {
            this.arguments[i] = this.arguments[i].optimize();
        }
        return this;
    }
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        let input = this.arguments[0].evaluate(scope);
        const find = this.arguments[1].evaluate(scope);
        const replacement = this.arguments[2].evaluate(scope);
        if (!Typing.isNull(input) && !Typing.isString(input)) {
            throw new Error('fn5 :: replaceAll,1st,' + Typing.getType(input));
        }
        if (!Typing.isNull(find) && !Typing.isString(find)) {
            throw new Error('fn5 :: replaceAll,2nd,' + Typing.getType(find));
        }
        if (!Typing.isNull(replacement) && !Typing.isString(replacement)) {
            throw new Error('fn5 :: replaceAll,3rd,' + Typing.getType(replacement));
        }
        if (Typing.isNull(input) || Typing.isNull(find) || Typing.isNull(replacement)) {
            return null;
        }
        let result = input;
        let findIndex, fromIndex = 0;
        while (1) {
            findIndex = result.indexOf(find, fromIndex);
            if (findIndex < 0)
                break;
            result = result.substr(0, findIndex) + replacement + result.substr(findIndex + find.length);
            fromIndex = findIndex + replacement.length;
        }
        return result;
    }
    ;
}

class UpperFunction extends AbstractFunction {
    minArguments() { return 1; }
    ;
    maxArguments() { return 1; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const input = this.arguments[0].evaluate(scope);
        if (Typing.isNull(input)) {
            return null;
        }
        else if (Typing.isString(input)) {
            return input.toUpperCase();
        }
        else {
            throw new Error('fn6 :: upper,' + Typing.getType(input));
        }
    }
    ;
}

class LowerFunction extends AbstractFunction {
    minArguments() { return 1; }
    ;
    maxArguments() { return 1; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const input = this.arguments[0].evaluate(scope);
        if (Typing.isNull(input)) {
            return null;
        }
        else if (Typing.isString(input)) {
            return input.toLowerCase();
        }
        else {
            throw new Error('fn6 :: lower,' + Typing.getType(input));
        }
    }
    ;
}

class RegexTestFunction extends AbstractFunction {
    minArguments() { return 2; }
    ;
    maxArguments() { return 3; }
    ;
    static validateFlags(flags) {
        return flags.match(/^[ims]*$/) !== null;
    }
    optimize() {
        this.arguments[1] = this.arguments[1].optimize();
        if (this.arguments[1] instanceof OptimizedNode) {
            if (!Typing.isNull(this.arguments[1].result) && !Typing.isString(this.arguments[1].result)) {
                throw new Error('fn4 :: regexTest,2nd');
            }
        }
        return this;
    }
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const input = this.arguments[0].evaluate(scope);
        const regex = this.arguments[1].evaluate(scope);
        if (Typing.isNull(input)) {
            return false;
        }
        else if (!Typing.isString(input)) {
            throw new Error('fn4 :: regexTest,1st');
        }
        if (Typing.isNull(regex)) {
            return false;
        }
        else if (!Typing.isString(regex)) {
            throw new Error('fn4 :: regexTest,2nd');
        }
        let flags = '';
        if (this.arguments.length > 2) {
            if (this.arguments[2] instanceof StringLiteral) {
                flags = this.arguments[2].evaluate(scope);
                if (!RegexTestFunction.validateFlags(flags)) {
                    throw new Error('regexTest4');
                }
            }
            else {
                throw new Error('regexTest3');
            }
        }
        let re;
        try {
            re = new RegExp(regex, flags + 'u');
        }
        catch (e) {
            throw new Error('regexTest3');
        }
        return re.test(input);
    }
    ;
}

class RegexMatchFunction extends AbstractFunction {
    minArguments() { return 2; }
    ;
    maxArguments() { return 3; }
    ;
    optimize() {
        this.arguments[1] = this.arguments[1].optimize();
        if (this.arguments[1] instanceof OptimizedNode) {
            if (!Typing.isNull(this.arguments[1].result) && !Typing.isString(this.arguments[1].result)) {
                throw new Error('fn4 :: regexMatch,2nd');
            }
        }
        return this;
    }
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const input = this.arguments[0].evaluate(scope);
        const regex = this.arguments[1].evaluate(scope);
        if (Typing.isNull(input)) {
            return null;
        }
        else if (!Typing.isString(input)) {
            throw new Error('fn4 :: regexMatch,1st');
        }
        if (Typing.isNull(regex)) {
            return null;
        }
        else if (!Typing.isString(regex)) {
            throw new Error('fn4 :: regexMatch,2nd');
        }
        let flags = '';
        if (this.arguments.length > 2) {
            if (this.arguments[2] instanceof StringLiteral) {
                flags = this.arguments[2].evaluate(scope);
                if (!RegexTestFunction.validateFlags(flags)) {
                    throw new Error('regexMatch4');
                }
            }
            else {
                throw new Error('regexMatch3');
            }
        }
        let re;
        try {
            re = new RegExp(regex, flags + 'u');
        }
        catch (e) {
            throw new Error('regexMatch3');
        }
        const result = re.exec(input);
        return result ? {
            match: result[0],
            idx: result.index,
            captures: result.slice(1).map(c => c === undefined ? null : c),
        } : null;
    }
    ;
}

class RegexMatchAllFunction extends AbstractFunction {
    minArguments() { return 2; }
    ;
    maxArguments() { return 3; }
    ;
    optimize() {
        this.arguments[1] = this.arguments[1].optimize();
        if (this.arguments[1] instanceof OptimizedNode) {
            if (!Typing.isNull(this.arguments[1].result) && !Typing.isString(this.arguments[1].result)) {
                throw new Error('fn4 :: regexMatchAll,2nd');
            }
        }
        return this;
    }
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const input = this.arguments[0].evaluate(scope);
        const regex = this.arguments[1].evaluate(scope);
        if (Typing.isNull(input)) {
            return [];
        }
        else if (!Typing.isString(input)) {
            throw new Error('fn4 :: regexMatchAll,1st');
        }
        if (Typing.isNull(regex)) {
            return [];
        }
        else if (!Typing.isString(regex)) {
            throw new Error('fn4 :: regexMatchAll,2nd');
        }
        let flags = '';
        if (this.arguments.length > 2) {
            if (this.arguments[2] instanceof StringLiteral) {
                flags = this.arguments[2].evaluate(scope);
                if (!RegexTestFunction.validateFlags(flags)) {
                    throw new Error('regexMatchAll4');
                }
            }
            else {
                throw new Error('regexMatchAll3');
            }
        }
        let re;
        try {
            re = new RegExp(regex, flags + 'ug');
        }
        catch (e) {
            throw new Error('regexMatchAll3');
        }
        const matches = [];
        let nextResult;
        while ((nextResult = re.exec(input)) !== null) {
            matches.push({
                match: nextResult[0],
                idx: nextResult.index,
                captures: nextResult.slice(1).map(c => c === undefined ? null : c),
            });
        }
        return matches;
    }
    ;
}

class ToBooleanFunction extends AbstractFunction {
    minArguments() { return 1; }
    ;
    maxArguments() { return 1; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        return Convertation.toBoolean(this.arguments[0].evaluate(scope));
    }
    ;
}

class ToStringFunction extends AbstractFunction {
    minArguments() { return 1; }
    ;
    maxArguments() { return 1; }
    ;
    optimize() {
        return this;
    }
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        return Convertation.toString(this.arguments[0].evaluate(scope));
    }
    ;
}

class ToNumberFunction extends AbstractFunction {
    minArguments() { return 1; }
    ;
    maxArguments() { return 1; }
    ;
    optimize() {
        return this;
    }
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        return Convertation.toNumber(this.arguments[0].evaluate(scope));
    }
    ;
}

class ToDateFunction extends AbstractFunction {
    minArguments() { return 1; }
    ;
    maxArguments() { return 1; }
    ;
    optimize() {
        return this;
    }
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        return Convertation.toDate(this.arguments[0].evaluate(scope));
    }
    ;
}

class TypeFunction extends AbstractFunction {
    minArguments() { return 1; }
    ;
    maxArguments() { return 1; }
    ;
    optimize() {
        return this;
    }
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        return Typing.getType(this.arguments[0].evaluate(scope));
    }
    ;
}

class NullCoalescingFunction extends AbstractFunction {
    constructor(Expr, args) {
        super(Expr, args);
        if (this.arguments[0] instanceof MemberExpression) {
            this.arguments[0].disableNullSafety();
        }
    }
    minArguments() { return 1; }
    ;
    maxArguments() { return 2; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const left = this.arguments[0].evaluate(scope);
        if (this.arguments.length > 1) {
            return left !== null && left !== void 0 ? left : this.arguments[1].evaluate(scope);
        }
        else {
            return left !== null && left !== void 0 ? left : null;
        }
    }
    ;
}
NullCoalescingFunction.binaryOperatorPrecedence = 11;
NullCoalescingFunction.rightAssociative = true;

class ExistsFunction extends AbstractFunction {
    minArguments() { return 1; }
    ;
    maxArguments() { return 1; }
    ;
    constructor(Expr, args) {
        super(Expr, args);
        if (!(this.arguments[0] instanceof BooleanLiteral ||
            this.arguments[0] instanceof StringLiteral ||
            this.arguments[0] instanceof NumberLiteral ||
            this.arguments[0] instanceof NullLiteral ||
            this.arguments[0] instanceof DateLiteral ||
            this.arguments[0] instanceof ArrayExpression ||
            this.arguments[0] instanceof ObjectExpression ||
            this.arguments[0] instanceof MemberExpression ||
            this.arguments[0] instanceof Identifier)) {
            throw new Error('exists1');
        }
        if (this.arguments[0] instanceof MemberExpression || this.arguments[0] instanceof Identifier) {
            this.arguments[0].enableExistsMode();
        }
    }
    optimize() {
        return this;
    }
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        if (this.arguments[0] instanceof BooleanLiteral ||
            this.arguments[0] instanceof StringLiteral ||
            this.arguments[0] instanceof NumberLiteral ||
            this.arguments[0] instanceof NullLiteral ||
            this.arguments[0] instanceof DateLiteral ||
            this.arguments[0] instanceof ArrayExpression ||
            this.arguments[0] instanceof ObjectExpression) {
            return true;
        }
        if (this.arguments[0] instanceof OptimizedNode) {
            return true;
        }
        if (this.arguments[0] instanceof MemberExpression || this.arguments[0] instanceof Identifier) {
            return this.arguments[0].evaluateExists(scope);
        }
        return false;
    }
    preEvaluate(localVariables, scope) {
        try {
            if (this.arguments[0] instanceof Identifier) {
                const result = this.arguments[0].evaluateExists(scope);
                return new OptimizedNode(new BooleanLiteral(this.Expr, { 'type': 'Boolean', 'value': result }));
            }
            return super.preEvaluate(localVariables, scope);
        }
        catch (e) {
            if (e.message === 'undefined') {
                return new OptimizedNode(new BooleanLiteral(this.Expr, { 'type': 'Boolean', 'value': false }));
            }
            throw e;
        }
    }
}

class ArrayToObjectFunction extends AbstractFunction {
    minArguments() { return 1; }
    ;
    maxArguments() { return 1; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const input = this.arguments[0].evaluate(scope);
        if (Typing.isNull(input)) {
            return null;
        }
        if (Typing.isArray(input)) {
            const result = {};
            let mode = null; // array|object
            for (const item of input) {
                if (mode === 'array') {
                    if (!Typing.isArray(item)) {
                        throw new Error('arrayToObject5 :: array,' + Typing.getType(item));
                    }
                }
                else if (mode === 'object') {
                    if (!Typing.isObject(item)) {
                        throw new Error('arrayToObject5 :: object,' + Typing.getType(item));
                    }
                }
                else {
                    if (Typing.isArray(item)) {
                        mode = 'array';
                    }
                    else if (Typing.isObject(item)) {
                        mode = 'object';
                    }
                    else {
                        throw new Error('arrayToObject2 :: ' + Typing.getType(item));
                    }
                }
                if (mode === 'array') {
                    if (item.length !== 2) {
                        throw new Error('arrayToObject4 :: ' + item.length);
                    }
                    if (!Typing.isString(item[0])) {
                        throw new Error('arrayToObject3 :: ' + Typing.getType(item[0]));
                    }
                    result[item[0]] = item[1];
                }
                else if (mode === 'object') {
                    const count = Object.keys(item).length;
                    if (count !== 2) {
                        throw new Error('arrayToObject7 :: ' + count);
                    }
                    if (!item.hasOwnProperty('k') || !item.hasOwnProperty('v')) {
                        throw new Error('arrayToObject8');
                    }
                    if (!Typing.isString(item.k)) {
                        throw new Error('arrayToObject6 :: ' + Typing.getType(item.k));
                    }
                    result[item.k] = item.v;
                }
            }
            return result;
        }
        else {
            throw new Error('arrayToObject1 :: ' + Typing.getType(input));
        }
    }
    ;
}

class ObjectToArrayFunction extends AbstractFunction {
    minArguments() { return 1; }
    ;
    maxArguments() { return 1; }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const input = this.arguments[0].evaluate(scope);
        if (Typing.isNull(input)) {
            return null;
        }
        if (Typing.isObject(input)) {
            const result = [];
            for (const key in input) {
                result.push({ k: key, v: input[key] });
            }
            return result;
        }
        else {
            throw new Error('objectToArray1 :: ' + Typing.getType(input));
        }
    }
    ;
}

class NumberLiteral extends ExpressionNode {
    constructor(Expr, node) {
        super(Expr);
        if (!node || !node.hasOwnProperty('value')) {
            throw new Error('Number without value');
        }
        if (node.value === 'NaN') {
            this.value = NaN;
            return;
        }
        if (node.value === 'Infinity') {
            this.value = Infinity;
            return;
        }
        if (!Typing.isNumber(node.value)) {
            throw new Error('Number is not number');
        }
        this.value = node.value;
    }
    optimize() {
        return new OptimizedNode(this);
    }
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        return this.value;
    }
    gatherExternalIdentifiers() {
        return [];
    }
    preEvaluate(localVariables, scope) {
        return new OptimizedNode(this, scope);
    }
    toCode() {
        return Expression.prettyPrint(this.value);
    }
}

class StringLiteral extends ExpressionNode {
    constructor(Expr, node) {
        super(Expr);
        if (!node || !node.hasOwnProperty('value')) {
            throw new Error('String without value');
        }
        if (!Typing.isString(node.value)) {
            throw new Error('String is not string');
        }
        this.value = node.value;
    }
    optimize() {
        return new OptimizedNode(this);
    }
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        return this.value;
    }
    gatherExternalIdentifiers() {
        return [];
    }
    preEvaluate(localVariables, scope) {
        return new OptimizedNode(this, scope);
    }
    toCode() {
        return Expression.prettyPrint(this.value);
    }
}

class DateLiteral extends ExpressionNode {
    constructor(Expr, node) {
        super(Expr);
        if (!node || !node.hasOwnProperty('value')) {
            throw new Error('Date without value');
        }
        if (!Typing.isString(node.value)) {
            throw new Error('Date is not string');
        }
        this.value = node.value;
    }
    optimize() {
        return new OptimizedNode(this);
    }
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        return new Date(this.value);
    }
    gatherExternalIdentifiers() {
        return [];
    }
    preEvaluate(localVariables, scope) {
        return new OptimizedNode(this, scope);
    }
    toCode() {
        return Expression.prettyPrint(this.value);
    }
}

class NullLiteral extends ExpressionNode {
    constructor(Expr, node) {
        super(Expr);
        this.value = null;
    }
    optimize() {
        return new OptimizedNode(this);
    }
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        return this.value;
    }
    gatherExternalIdentifiers() {
        return [];
    }
    preEvaluate(localVariables, scope) {
        return new OptimizedNode(this, scope);
    }
    toCode() {
        return Expression.prettyPrint(this.value);
    }
}

class BooleanLiteral extends ExpressionNode {
    constructor(Expr, node) {
        super(Expr);
        if (!node || !node.hasOwnProperty('value')) {
            throw new Error('Boolean without value');
        }
        if (!Typing.isBoolean(node.value)) {
            throw new Error('Boolean is not boolean');
        }
        this.value = node.value;
    }
    optimize() {
        return new OptimizedNode(this);
    }
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        return this.value;
    }
    gatherExternalIdentifiers() {
        return [];
    }
    preEvaluate(localVariables, scope) {
        return new OptimizedNode(this, scope);
    }
    toCode() {
        return Expression.prettyPrint(this.value);
    }
}

class ObjectExpression extends ExpressionNode {
    constructor(Expr, node) {
        super(Expr);
        if (!node) {
            throw new Error('Wrong node');
        }
        if (!node.hasOwnProperty('properties')) {
            throw new Error('Object without properties');
        }
        this.object = {};
        for (const property of node.properties) {
            if (!property.hasOwnProperty('key')) {
                throw new Error('Object property without key');
            }
            if (typeof property.key !== 'string') {
                throw new Error('Object property key is not string');
            }
            if (!property.hasOwnProperty('value')) {
                throw new Error('Object property without value');
            }
            this.object[property.key] = this.Expr.makeNode(property.value);
        }
    }
    optimize() {
        let canBeOptimized = true;
        for (const key in this.object) {
            this.object[key] = this.object[key].optimize();
            if (!(this.object[key] instanceof OptimizedNode)) {
                canBeOptimized = false;
            }
        }
        if (canBeOptimized) {
            return new OptimizedNode(this);
        }
        return this;
    }
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const result = {};
        for (const key in this.object) {
            result[key] = this.object[key].evaluate(scope);
        }
        return result;
    }
    gatherExternalIdentifiers() {
        let list = [];
        for (const key in this.object) {
            list = [...list, ...this.object[key].gatherExternalIdentifiers()];
        }
        return list;
    }
    preEvaluate(localVariables, scope) {
        let canBeOptimized = true;
        for (const [key, node] of Object.entries(this.object)) {
            this.object[key] = node.preEvaluate(localVariables, scope);
            if (!(this.object[key] instanceof OptimizedNode)) {
                canBeOptimized = false;
            }
        }
        if (canBeOptimized) {
            return new OptimizedNode(this, scope);
        }
        return this;
    }
    toCode() {
        return [
            '{',
            Object.keys(this.object).map(key => Expression.prettyPrint(key) + ': ' + this.object[key].toCode()).join(', '),
            '}'
        ].join('');
    }
}

class ArrayExpression extends ExpressionNode {
    constructor(Expr, node) {
        super(Expr);
        if (!node) {
            throw new Error('Wrong node');
        }
        if (!node.hasOwnProperty('elements')) {
            throw new Error('Array without elements');
        }
        this.array = [];
        for (const element of node.elements) {
            this.array.push(this.Expr.makeNode(element));
        }
    }
    optimize() {
        let canBeOptimized = true;
        for (let i = 0; i < this.array.length; i++) {
            this.array[i] = this.array[i].optimize();
            if (!(this.array[i] instanceof OptimizedNode)) {
                canBeOptimized = false;
            }
        }
        if (canBeOptimized) {
            return new OptimizedNode(this);
        }
        return this;
    }
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const result = [];
        for (const node of this.array) {
            result.push(node.evaluate(scope));
        }
        return result;
    }
    gatherExternalIdentifiers() {
        let list = [];
        this.array.forEach(node => {
            list = [...list, ...node.gatherExternalIdentifiers()];
        });
        return list;
    }
    preEvaluate(localVariables, scope) {
        let canBeOptimized = true;
        for (const [key, node] of Object.entries(this.array)) {
            this.array[key] = node.preEvaluate(localVariables, scope);
            if (!(this.array[key] instanceof OptimizedNode)) {
                canBeOptimized = false;
            }
        }
        if (canBeOptimized) {
            return new OptimizedNode(this, scope);
        }
        return this;
    }
    toCode() {
        return [
            '[',
            this.array.map(el => el.toCode()).join(', '),
            ']'
        ].join('');
    }
}

class MemberExpression extends ExpressionNode {
    constructor(Expr, node) {
        super(Expr);
        this.nullSafe = true;
        this.existsMode = false;
        if (!node) {
            throw new Error('Wrong node');
        }
        if (!node.hasOwnProperty('object')) {
            throw new Error('Member expression without object');
        }
        if (!node.hasOwnProperty('property')) {
            throw new Error('Member expression without property');
        }
        this.object = this.Expr.makeNode(node.object);
        this.property = this.Expr.makeNode(node.property);
    }
    disableNullSafety() {
        this.nullSafe = false;
        if (this.object instanceof MemberExpression) {
            this.object.disableNullSafety();
        }
    }
    enableExistsMode() {
        this.existsMode = true;
        if (this.object instanceof MemberExpression || this.object instanceof Identifier) {
            this.object.enableExistsMode();
        }
    }
    optimize() {
        this.object = this.object.optimize();
        this.property = this.property.optimize();
        // Странно, но монга не идет дальше этого и не оптимизирует до конца
        return this;
    }
    evaluate(scope, existsMode = false) {
        this.Expr.checkEvaluationLimits(this);
        const object = this.object.evaluate(scope);
        let property = this.property.evaluate(scope);
        if (Typing.isNull(object) && this.nullSafe === false) {
            return null;
        }
        else if (Typing.isArray(object) && Typing.isNumber(property)) {
            if (Typing.is32BitInteger(property)) {
                const propertyFixed = property < 0 ? object.length + property : property;
                if (object.hasOwnProperty(propertyFixed)) {
                    return object[propertyFixed];
                }
                else {
                    // Все равно обращаемся к несуществующему элементу, чтобы Proxy это могли зафиксировать
                    object[propertyFixed];
                    if (this.nullSafe) {
                        if (this.existsMode) {
                            throw new Error('undefined');
                        }
                        else {
                            throw new Error('member2 :: ' + property);
                        }
                    }
                    else {
                        return null;
                    }
                }
            }
            else {
                throw new Error('member3');
            }
        }
        else if (Typing.isObject(object) && Typing.isString(property)) {
            if (object.hasOwnProperty(property)) {
                return object[property];
            }
            else {
                // Все равно обращаемся к несуществующему элементу, чтобы Proxy это могли зафиксировать
                object[property];
                if (this.nullSafe) {
                    if (this.existsMode) {
                        throw new Error('undefined');
                    }
                    else {
                        throw new Error('member2 :: ' + property);
                    }
                }
                else {
                    return null;
                }
            }
        }
        else {
            if (this.existsMode) {
                throw new Error('undefined');
            }
            else {
                throw new Error('member1 :: ' + Typing.getType(object) + ',' + Typing.getType(property));
            }
        }
    }
    evaluateExists(scope) {
        try {
            this.evaluate(scope);
            return true;
        }
        catch (e) {
            if (e.message === 'undefined') {
                return false;
            }
            throw e;
        }
    }
    gatherExternalIdentifiers() {
        return [
            ...this.object.gatherExternalIdentifiers(),
            ...this.property.gatherExternalIdentifiers()
        ];
    }
    preEvaluate(localVariables, scope) {
        this.object = this.object.preEvaluate(localVariables, scope);
        this.property = this.property.preEvaluate(localVariables, scope);
        if (this.object instanceof OptimizedNode) {
            if (this.property instanceof OptimizedNode) {
                return new OptimizedNode(this, scope);
            }
        }
        return this;
    }
    toCode() {
        return [
            this.object.toCode(),
            '[',
            this.property.toCode(),
            ']',
        ].join('');
    }
}

class PickKeysFunction extends AbstractFunction {
    minArguments() {
        return 2;
    }
    ;
    maxArguments() {
        return 2;
    }
    ;
    evaluate(scope) {
        this.Expr.checkEvaluationLimits(this);
        const inputArray = this.arguments[0].evaluate(scope);
        const keysToPickFromInputArray = this.arguments[1].evaluate(scope);
        if (Typing.isNull(inputArray)) {
            return null;
        }
        PickKeysFunction.validateValueIsArray(inputArray);
        if (Typing.isNull(keysToPickFromInputArray)) {
            return inputArray;
        }
        PickKeysFunction.validateValueIsArray(keysToPickFromInputArray);
        return Object.keys(inputArray)
            .filter(key => keysToPickFromInputArray.includes(key))
            .reduce((obj, key) => {
            obj[key] = inputArray[key];
            return obj;
        }, {});
    }
    static validateValueIsArray(value) {
        if (!Typing.isArray(value)) {
            throw new Error('fn1 :: pickKeys,' + Typing.getType(value));
        }
    }
}

class Expression {
    constructor(ast, limitMode) {
        this.limitMode = 0;
        this.evaluationCounter = 0;
        if (limitMode === undefined) {
            throw new Error('limitNode is required');
        }
        this.ast = ast;
        this.limitMode = limitMode;
    }
    isEmpty() {
        return this.ast.error === null && this.ast.source === null;
    }
    makeNode(source) {
        if (!source || !source.hasOwnProperty('type')) {
            throw new Error('Node without type');
        }
        if (source.type === 'CallExpression') {
            if (!source.hasOwnProperty('arguments')) {
                throw new Error('Call expression without arguments');
            }
            if (!source.hasOwnProperty('callee')) {
                throw new Error('Call expression without callee');
            }
            if (!Expression.FUNCTIONS[source.callee]) {
                throw new Error('Unknown function call');
            }
            return new Expression.FUNCTIONS[source.callee](this, source.arguments);
        }
        else if (source.type === 'UnaryExpression') {
            if (!source.hasOwnProperty('argument')) {
                throw new Error('Unary operator without argument');
            }
            if (!source.hasOwnProperty('operator')) {
                throw new Error('Unary operator without operator');
            }
            if (source.operator === '+') {
                return new SumFunction(this, [{
                        'type': 'ArrayExpression',
                        'elements': [
                            {
                                'type': 'Number',
                                'value': 0,
                                'location': [0, 0],
                            },
                            source.argument
                        ],
                        'location': [0, 0],
                    }]);
            }
            else if (source.operator === '-') {
                return new SubtractFunction(this, [
                    {
                        'type': 'Number',
                        'value': 0,
                        'location': [0, 0],
                    },
                    source.argument
                ]);
            }
            else if (source.operator === '?') {
                return new NullCoalescingFunction(this, [
                    source.argument, { 'type': 'Null', 'location': [0, 0] }
                ]);
            }
            else {
                throw new Error('Unknown unary operator');
            }
        }
        else if (source.type === 'BinaryExpression') {
            if (!source.hasOwnProperty('left')) {
                throw new Error('Binary operator without left');
            }
            if (!source.hasOwnProperty('right')) {
                throw new Error('Binary operator without right');
            }
            if (!Expression.BINARY_OPERATORS[source.operator]) {
                throw new Error('Unknown binary operator');
            }
            let args;
            if (['&', '+', '*'].includes(source.operator)) {
                // Для некоторых операторов мы аргументы оборачиваем в массив
                args = [{
                        'type': 'ArrayExpression',
                        'elements': [source.left, source.right],
                        'location': [0, 0],
                    }];
            }
            else {
                args = [source.left, source.right];
            }
            return new Expression.BINARY_OPERATORS[source.operator](this, args);
        }
        if (!Expression.NODES[source.type]) {
            throw new Error('Unknown node type');
        }
        // @ts-ignore непонятная ошибка
        return new Expression.NODES[source.type](this, source);
    }
    resetEvaluationLimits() {
        this.evaluationCounter = 0;
    }
    checkEvaluationLimits(node) {
        if (this.limitMode && node instanceof AbstractFunction) {
            this.evaluationCounter++;
            if (this.limitMode === Expression.LIMIT_MODE_10K && this.evaluationCounter > 10000) {
                throw new Error('Limit 10k exceeded');
            }
            if (this.limitMode === Expression.LIMIT_MODE_1M && this.evaluationCounter > 1000000) {
                throw new Error('Limit 1 million exceeded');
            }
        }
    }
    evaluate(scope) {
        this.resetEvaluationLimits();
        const started = Date.now();
        if (this.isEmpty()) {
            return {
                error: null,
                result: null,
                time: Date.now() - started,
            };
        }
        if (this.ast.error === null) {
            try {
                const rootNode = this.makeNode(this.ast.source);
                try {
                    const optimizedNode = rootNode.optimize();
                    try {
                        return {
                            error: null,
                            result: optimizedNode.evaluate(scope),
                            time: Date.now() - started,
                        };
                    }
                    catch (e) {
                        return {
                            error: 'evaluate :: ' + e.message,
                            result: null,
                            time: Date.now() - started,
                        };
                    }
                }
                catch (e) {
                    return {
                        error: 'optimize :: ' + e.message,
                        result: null,
                        time: Date.now() - started,
                    };
                }
            }
            catch (e) {
                return {
                    error: 'validate :: ' + e.message,
                    result: null,
                    time: Date.now() - started,
                };
            }
        }
        else {
            return {
                error: 'parse :: ' + this.ast.error.message,
                result: null,
                time: Date.now() - started,
            };
        }
    }
    evaluateToBoolean(scope) {
        const output = this.evaluate(scope);
        if (output.error)
            return output;
        try {
            return {
                error: null,
                result: Convertation.toBoolean(output.result)
            };
        }
        catch (e) {
            return {
                error: 'finalize :: ' + e.message,
                result: null
            };
        }
    }
    evaluateToString(scope) {
        const output = this.evaluate(scope);
        if (output.error)
            return output;
        try {
            return {
                error: null,
                result: Convertation.toString(output.result)
            };
        }
        catch (e) {
            return {
                error: 'finalize :: ' + e.message,
                result: null
            };
        }
    }
    evaluateToNumber(scope) {
        const output = this.evaluate(scope);
        if (output.error)
            return output;
        try {
            return {
                error: null,
                result: Convertation.toNumber(output.result)
            };
        }
        catch (e) {
            return {
                error: 'finalize :: ' + e.message,
                result: null
            };
        }
    }
    evaluateToTable(scope) {
        const output = this.evaluate(scope);
        if (output.error)
            return output;
        try {
            return {
                error: null,
                result: ToTable.perform(output.result)
            };
        }
        catch (e) {
            return {
                error: 'finalize :: ' + e.message,
                result: null
            };
        }
    }
    static prettyPrint(input, indent = '') {
        const noIndent = indent === false;
        const nextIndent = noIndent ? false : indent + '  ';
        if (Typing.isObject(input)) {
            if (Object.keys(input).length === 0)
                return '{}';
            else {
                const lines = [];
                for (const key in input) {
                    lines.push([
                        noIndent ? '' : nextIndent,
                        JSON.stringify(key),
                        ': ',
                        Expression.prettyPrint(input[key], nextIndent)
                    ].join(''));
                }
                return [
                    noIndent ? '{' : '{\n',
                    lines.join(noIndent ? ', ' : ',\n'),
                    noIndent ? '}' : '\n' + indent + '}',
                ].join('');
            }
        }
        else if (Typing.isArray(input)) {
            if (input.length === 0)
                return '[]';
            else {
                const lines = [];
                for (const value of input) {
                    lines.push([
                        noIndent ? '' : nextIndent,
                        Expression.prettyPrint(value, nextIndent)
                    ].join(''));
                }
                return [
                    noIndent ? '[' : '[\n',
                    lines.join(noIndent ? ', ' : ',\n'),
                    noIndent ? ']' : '\n' + indent + ']',
                ].join('');
            }
        }
        else if (Typing.isDate(input)) {
            return '#' + Convertation.toString(input) + '#';
        }
        else if (Typing.isString(input)) {
            return JSON.stringify(Convertation.toString(input));
        }
        else if (Typing.isNumber(input)) {
            return Convertation.toString(input);
        }
        else if (Typing.isNull(input)) {
            return 'null';
        }
        else if (Typing.isBoolean(input)) {
            return Convertation.toString(input);
        }
        else {
            throw new Error('Unknown type');
        }
    }
    static encodeTypes(object) {
        if (Typing.isDate(object)) {
            return {
                __formula_encoded_type__: 'date',
                date: Convertation.toString(object),
            };
        }
        else if (Typing.isArray(object)) {
            const array2 = [...object];
            let index = 0;
            for (const element of array2) {
                array2[index++] = this.encodeTypes(element);
            }
            return array2;
        }
        else if (Typing.isObject(object)) {
            const object2 = Object.assign({}, object);
            for (const key in object2) {
                object2[key] = this.encodeTypes(object2[key]);
            }
            return object2;
        }
        else if (Number.isNaN(object)) {
            return {
                __formula_encoded_type__: 'NaN',
            };
        }
        else if (object === Infinity) {
            return {
                __formula_encoded_type__: 'Infinity',
            };
        }
        else if (object === -Infinity) {
            return {
                __formula_encoded_type__: '-Infinity',
            };
        }
        else {
            return object;
        }
    }
    static encodeDataToJSON(object, pretty = false) {
        return JSON.stringify(this.encodeTypes(object), null, pretty ? 2 : null);
    }
    static decodeTypes(object) {
        if ((object === null || object === void 0 ? void 0 : object.__formula_encoded_type__) !== undefined) {
            if (object.__formula_encoded_type__ === 'date') {
                // timestamp стал deprecated с 6 ноября 2022 года
                return Convertation.toDate(object.date || object.timestamp);
            }
            else if (object.__formula_encoded_type__ === 'NaN') {
                return NaN;
            }
            else if (object.__formula_encoded_type__ === 'Infinity') {
                return Infinity;
            }
            else if (object.__formula_encoded_type__ === '-Infinity') {
                return -Infinity;
            }
            else
                return object;
        }
        else if (Typing.isArray(object)) {
            const array2 = [...object];
            let index = 0;
            for (const element of array2) {
                array2[index++] = this.decodeTypes(element);
            }
            return array2;
        }
        else if (Typing.isObject(object)) {
            const object2 = Object.assign({}, object);
            for (const key in object2) {
                object2[key] = this.decodeTypes(object2[key]);
            }
            return object2;
        }
        else {
            return object;
        }
    }
    static decodeDataFromJSON(source) {
        return this.decodeTypes(JSON.parse(source));
    }
    static deepClone(object) {
        // Эту функцию можно очень сильно оптимизировать, если не делать реальную конвертацию в JSON,
        // а просто обойти дерево и создать копии всех объектов, массивов и дат
        return this.decodeDataFromJSON(this.encodeDataToJSON(object));
    }
    preEvaluate(scope) {
        const started = Date.now();
        if (this.isEmpty()) {
            return {
                error: null,
                result: null,
                time: Date.now() - started,
            };
        }
        if (this.ast.error === null) {
            try {
                let rootNode = this.makeNode(this.ast.source);
                try {
                    rootNode = rootNode.preEvaluate([], scope);
                }
                catch (e) {
                    return {
                        error: 'preeval :: ' + e.message,
                        result: null
                    };
                }
                try {
                    return {
                        error: null,
                        result: rootNode.toCode()
                    };
                }
                catch (e) {
                    return {
                        error: 'convert :: ' + e.message,
                        result: null
                    };
                }
            }
            catch (e) {
                return {
                    error: 'validate :: ' + e.message,
                    result: null,
                    time: Date.now() - started,
                };
            }
        }
        else {
            return {
                error: 'parse :: ' + this.ast.error.message,
                result: null,
                time: Date.now() - started,
            };
        }
    }
}
Expression.ErrorTranslator = ErrorTranslator;
Expression.Typing = Typing;
Expression.Comparison = Comparison;
Expression.NODES = {
    'Number': NumberLiteral,
    'String': StringLiteral,
    'Date': DateLiteral,
    'Boolean': BooleanLiteral,
    'Null': NullLiteral,
    'Identifier': Identifier,
    'ObjectExpression': ObjectExpression,
    'ArrayExpression': ArrayExpression,
    'MemberExpression': MemberExpression,
};
Expression.FUNCTIONS = {
    'pickKeys': PickKeysFunction,
    'if': IfFunction,
    'mod': ModFunction,
    'multiply': MultiplyFunction,
    'sum': SumFunction,
    'round': RoundFunction,
    'floor': FloorFunction,
    'ceil': CeilFunction,
    'abs': AbsFunction,
    'random': RandomFunction,
    'min': MinFunction,
    'max': MaxFunction,
    'pow': PowFunction,
    'sqrt': SqrtFunction,
    'log': LogFunction,
    'exp': ExpFunction,
    'trunc': TruncFunction,
    'acos': AcosFunction,
    'acosh': AcoshFunction,
    'asin': AsinFunction,
    'asinh': AsinhFunction,
    'atan2': Atan2Function,
    'atan': AtanFunction,
    'atanh': AtanhFunction,
    'cos': CosFunction,
    'cosh': CoshFunction,
    'sin': SinFunction,
    'sinh': SinhFunction,
    'tan': TanFunction,
    'tanh': TanhFunction,
    'toBoolean': ToBooleanFunction,
    'toString': ToStringFunction,
    'toNumber': ToNumberFunction,
    'toDate': ToDateFunction,
    'join': JoinFunction,
    'call': CallFunction,
    'not': NotFunction,
    'let': LetFunction,
    'map': MapFunction,
    'filter': FilterFunction,
    'reduce': ReduceFunction,
    'range': RangeFunction,
    'count': CountFunction,
    'reverse': ReverseFunction,
    'merge': MergeFunction,
    'sort': SortFunction,
    'slice': SliceFunction,
    'indexOf': IndexOfFunction,
    'unique': UniqueFunction,
    'type': TypeFunction,
    'exists': ExistsFunction,
    'now': NowFunction,
    'dateAdd': DateAddFunction,
    'dateSubtract': DateSubtractFunction,
    'length': LengthFunction,
    'substr': SubstrFunction,
    'locate': LocateFunction,
    'trim': TrimFunction,
    'trimStart': TrimStartFunction,
    'trimEnd': TrimEndFunction,
    'split': SplitFunction,
    'replace': ReplaceFunction,
    'replaceAll': ReplaceAllFunction,
    'lower': LowerFunction,
    'upper': UpperFunction,
    'regexTest': RegexTestFunction,
    'regexMatch': RegexMatchFunction,
    'regexMatchAll': RegexMatchAllFunction,
    'objectToArray': ObjectToArrayFunction,
    'arrayToObject': ArrayToObjectFunction,
};
Expression.UNARY_OPERATORS = {
    '+': SumFunction,
    '-': SubtractFunction,
};
Expression.BINARY_OPERATORS = {
    '&': JoinFunction,
    '+': SumFunction,
    '-': SubtractFunction,
    '*': MultiplyFunction,
    '/': DivideFunction,
    '%': ModFunction,
    '==': EqualFunction,
    '!=': NotEqualFunction,
    '>': GreaterFunction,
    '>=': GreaterOrEqualFunction,
    '<': LessFunction,
    '<=': LessOrEqualFunction,
    'or': OrFunction,
    'and': AndFunction,
    '??': NullCoalescingFunction,
    'in': InFunction,
};
/** Режим без ограничений по выполнению */
Expression.LIMIT_MODE_NONE = 0;
/** Выполнение ограничено 10 000 вызовами функций */
Expression.LIMIT_MODE_10K = 1;
/** Выполнение ограничено 1 000 000 вызовов функций */
Expression.LIMIT_MODE_1M = 2;

const AST_VERSION = 1;
const TAB_CODE = 9;
const LF_CODE = 10;
const CR_CODE = 13;
const SPACE_CODE = 32;
const HASH_CODE = 35;
const FSLSH_CODE = 47; // /
const ASTSK_CODE = 42; // *
const PERIOD_CODE = 46; // .
const COMMA_CODE = 44; // ,
const SQUOTE_CODE = 39; // '
const DQUOTE_CODE = 34; // "
const OPAREN_CODE = 40; // (
const CPAREN_CODE = 41; // )
const SEMCOL_CODE = 59; // ;
const QUESTION_CODE = 63; // ?
const OBRACK_CODE = 91; // [
const CBRACK_CODE = 93; // ]
const COLON_CODE = 58; // :
const OCURLY_CODE = 123; // {
const CCURLY_CODE = 125; // }
const MAX_UNOP_LEN = Math.max(0, ...Object.keys(Expression.UNARY_OPERATORS).map(k => k.length));
const MAX_BINOP_LEN = Math.max(0, ...Object.keys(Expression.BINARY_OPERATORS).map(k => k.length));
/**
 * @param ch a character code in the next three functions
 */
function isDecimalDigit(ch) {
    return (ch >= 48 && ch <= 57); // 0...9
}
/**
 * Returns the precedence of a binary operator or `0` if it isn't a binary operator. Can be float.
 */
function binaryPrecedence(op_val) {
    var _a;
    return ((_a = Expression.BINARY_OPERATORS[op_val]) === null || _a === void 0 ? void 0 : _a.binaryOperatorPrecedence) || 0;
}
function isRightAssociative(op_val) {
    var _a;
    return ((_a = Expression.BINARY_OPERATORS[op_val]) === null || _a === void 0 ? void 0 : _a.rightAssociative) || false;
}
function isIdentifierStartOrPart(ch) {
    return (ch >= 65 && ch <= 90) || // A...Z
        (ch >= 97 && ch <= 122) || // a...z
        (['$', '_'].includes(String.fromCharCode(ch))); // additional characters
}
function isIdentifierStart(ch) {
    return isIdentifierStartOrPart(ch) || String.fromCharCode(ch) === '@';
}
function isIdentifierPart(ch) {
    return isIdentifierStartOrPart(ch) || isDecimalDigit(ch);
}
// Highly based on https://github.com/EricSmekens/jsep
class Jsep {
    /**
     * @param expr a string with the passed in express
     */
    constructor(expr) {
        // `index` stores the character number we are currently at
        // All of the gobbles below will modify `index` as we move along
        this.expr = expr;
        this.index = 0;
    }
    get char() {
        return this.expr.charAt(this.index);
    }
    get code() {
        return this.expr.charCodeAt(this.index);
    }
    ;
    throwError(message, index) {
        throw new Error(message + ' at character ' + (index !== null && index !== void 0 ? index : this.index));
    }
    /**
     * Push `index` up to the next non-space character
     */
    gobbleSpaces() {
        let ch = this.code;
        while (ch === SPACE_CODE || ch === TAB_CODE || ch === LF_CODE || ch === CR_CODE) {
            ch = this.expr.charCodeAt(++this.index);
        }
        this.gobbleComment();
    }
    gobbleComment() {
        if (this.code === FSLSH_CODE) {
            let ch = this.expr.charCodeAt(this.index + 1);
            if (ch === FSLSH_CODE) {
                // '//': read to end of line/input
                this.index++;
                while (ch !== LF_CODE && !isNaN(ch)) {
                    ch = this.expr.charCodeAt(++this.index);
                }
                this.gobbleSpaces();
            }
            else if (ch === ASTSK_CODE) {
                // read to */ or end of input
                this.index += 2;
                while (!isNaN(ch)) {
                    ch = this.expr.charCodeAt(this.index++);
                    if (ch === ASTSK_CODE) {
                        ch = this.expr.charCodeAt(this.index++);
                        if (ch === FSLSH_CODE) {
                            this.gobbleSpaces();
                            return;
                        }
                    }
                }
                // missing closing */
                this.throwError('parse1');
            }
        }
    }
    /**
     * Top-level method to parse all expressions and returns compound or single node
     */
    parse() {
        const nodes = this.gobbleExpressions();
        if (nodes.length === 0) {
            return null;
        }
        else if (nodes.length === 1) {
            return nodes[0];
        }
        else {
            const properties = nodes.slice(0, nodes.length - 1).map(node => {
                if (node.type !== 'BinaryExpression' || node.operator !== '=') {
                    this.throwError('parse18', node.location[0]);
                }
                node = node;
                if (node.left.type !== 'Identifier') {
                    this.throwError('parse19', node.left.location[0]);
                }
                node.left = node.left;
                return {
                    key: node.left.name,
                    value: node.right,
                    location: node.left.location,
                };
            });
            return {
                type: 'CallExpression',
                arguments: [{
                        type: 'ObjectExpression',
                        properties: properties,
                        location: [0, 0],
                    }, nodes[nodes.length - 1]],
                callee: 'let',
                location: [0, 0],
            };
        }
    }
    /**
     * Top-level parser
     */
    gobbleExpressions() {
        let nodes = [], node;
        while (this.index < this.expr.length) {
            node = this.gobbleExpression();
            if (node)
                nodes.push(node);
            // Expressions should be separated by semicolons
            if (this.code === SEMCOL_CODE) {
                this.index++;
                continue;
            }
            if (this.index < this.expr.length) {
                this.throwError('parse2 :: ' + this.char);
            }
        }
        return nodes;
    }
    /**
     * The main parsing function.
     */
    gobbleExpression() {
        const node = this.gobbleBinaryExpression();
        this.gobbleSpaces();
        return node;
    }
    /**
     * Search for the operation portion of the string (e.g. `+`, `===`)
     * Start by taking the longest possible binary operations (3 characters: `===`, `!==`, `>>>`)
     * and move down from 3 to 2 to 1 character until a matching binary operation is found
     * then, return that binary operation
     */
    gobbleBinaryOp() {
        this.gobbleSpaces();
        let to_check = this.expr.substr(this.index, MAX_BINOP_LEN);
        let tc_len = to_check.length;
        while (tc_len > 0) {
            const exists = Expression.BINARY_OPERATORS.hasOwnProperty(to_check) || to_check == '=';
            // Don't accept a binary op when it is an identifier.
            // Binary ops that start with a identifier-valid character must be followed
            // by a non identifier-part valid character
            if (exists && (!isIdentifierStart(this.code) ||
                (this.index + to_check.length < this.expr.length && !isIdentifierPart(this.expr.charCodeAt(this.index + to_check.length))))) {
                this.index += tc_len;
                return to_check;
            }
            to_check = to_check.substr(0, --tc_len);
        }
        return false;
    }
    /**
     * This function is responsible for gobbling an individual expression,
     * e.g. `1`, `1+2`, `a+(b*2)-Math.sqrt(2)`
     */
    gobbleBinaryExpression() {
        let node, biop, prec, stack, biop_info, right, i, cur_biop;
        // First, try to get the leftmost thing
        // Then, check to see if there's a binary operator operating on that leftmost thing
        // Don't gobbleBinaryOp without a left-hand-side
        const left = this.gobbleToken();
        if (!left) {
            return left;
        }
        biop = this.gobbleBinaryOp();
        // If there wasn't a binary operator, just return the leftmost node
        if (!biop) {
            return left;
        }
        // Otherwise, we need to start a stack to properly place the binary operations in their
        // precedence structure
        biop_info = {
            value: biop,
            prec: binaryPrecedence(biop),
            location: [this.index - biop.length, this.index],
            right_a: isRightAssociative(biop),
        };
        right = this.gobbleToken();
        if (!right) {
            this.throwError("parse3 :: " + biop);
        }
        stack = [left, biop_info, right];
        // Properly deal with precedence using [recursive descent](http://www.engr.mun.ca/~theo/Misc/exp_parsing.htm)
        while ((biop = this.gobbleBinaryOp())) {
            prec = binaryPrecedence(biop);
            biop_info = {
                value: biop,
                prec,
                location: [this.index - biop.length, this.index],
                right_a: isRightAssociative(biop),
            };
            cur_biop = biop;
            // Reduce: make a binary expression from the three topmost entries.
            const comparePrev = p => biop_info.right_a && p.right_a ? prec > p.prec : prec <= p.prec;
            while ((stack.length > 2) && comparePrev(stack[stack.length - 2])) {
                const right = stack.pop();
                const biop_info2 = stack.pop();
                const left = stack.pop();
                stack.push({
                    type: 'BinaryExpression',
                    operator: biop_info2.value,
                    left,
                    right,
                    location: biop_info2.location,
                });
            }
            node = this.gobbleToken();
            if (!node) {
                this.throwError("parse3 :: " + cur_biop);
            }
            stack.push(biop_info, node);
        }
        i = stack.length - 1;
        node = stack[i];
        while (i > 1) {
            node = {
                type: 'BinaryExpression',
                operator: stack[i - 1].value,
                left: stack[i - 2],
                right: node,
                location: stack[i - 1].location,
            };
            i -= 2;
        }
        return node;
    }
    /**
     * An individual part of a binary expression:
     * e.g. `foo.bar(baz)`, `1`, `"abc"`, `(a % 2)` (because it's in parenthesis)
     */
    gobbleToken() {
        this.gobbleSpaces();
        const ch = this.code;
        let node;
        if (isDecimalDigit(ch)) {
            node = this.gobbleNumericLiteral();
        }
        else if (ch === SQUOTE_CODE || ch === DQUOTE_CODE || ch === FSLSH_CODE) {
            node = this.gobbleStringLiteral();
        }
        else if (ch === HASH_CODE) {
            node = this.gobbleDateLiteral();
        }
        else if (ch === OBRACK_CODE) {
            node = this.gobbleArray();
        }
        else if (ch === OCURLY_CODE) {
            node = this.gobbleObjectExpression();
        }
        else {
            let to_check = this.expr.substr(this.index, MAX_UNOP_LEN);
            let tc_len = to_check.length;
            while (tc_len > 0) {
                // Don't accept an unary op when it is an identifier.
                // Unary ops that start with a identifier-valid character must be followed
                // by a non identifier-part valid character
                if (Expression.UNARY_OPERATORS.hasOwnProperty(to_check) && (!isIdentifierStart(this.code) ||
                    (this.index + to_check.length < this.expr.length && !isIdentifierPart(this.expr.charCodeAt(this.index + to_check.length))))) {
                    this.index += tc_len;
                    const location = [this.index - tc_len, this.index];
                    const argument = this.gobbleToken();
                    if (!argument) {
                        this.throwError('parse4');
                    }
                    return {
                        type: 'UnaryExpression',
                        operator: to_check,
                        argument,
                        location,
                    };
                }
                to_check = to_check.substr(0, --tc_len);
            }
            if (isIdentifierStart(ch)) {
                node = this.gobbleIdentifier();
                if (node.name === 'true' || node.name === 'false') {
                    node = {
                        type: 'Boolean',
                        value: node.name === 'true',
                        location: node.location,
                    };
                }
                else if (node.name === 'null') {
                    node = {
                        type: 'Null',
                        location: node.location,
                    };
                }
                else if (node.name === 'Infinity') {
                    node = {
                        type: 'Number',
                        value: 'Infinity',
                        location: node.location,
                    };
                }
                else if (node.name === 'NaN') {
                    node = {
                        type: 'Number',
                        value: 'NaN',
                        location: node.location,
                    };
                }
            }
            else if (ch === OPAREN_CODE) {
                node = this.gobbleGroup() || node;
            }
        }
        return this.gobbleTokenProperty(node);
    }
    /**
     * Gobble properties of identifiers/strings/arrays/groups.
     * e.g. `foo`, `bar.baz`, `foo['bar'].baz`
     * It also gobbles function calls: foo(bar)
     */
    gobbleTokenProperty(node) {
        this.gobbleSpaces();
        let ch = this.code;
        while (ch === PERIOD_CODE || ch === OBRACK_CODE || ch === OPAREN_CODE) {
            if (!node) {
                // That can be after gobbleGroup, which can return undefined in case `()`
                this.throwError('parse2 :: ' + this.char);
            }
            this.index++;
            if (ch === OBRACK_CODE) {
                const property = this.gobbleExpression();
                this.gobbleSpaces();
                ch = this.code;
                if (ch !== CBRACK_CODE) {
                    this.throwError('parse8 :: [');
                }
                if (!property) {
                    this.throwError('parse2 :: ' + this.char + '');
                }
                this.index++;
                node = {
                    type: 'MemberExpression',
                    object: node,
                    property,
                    location: [node.location[0], this.index],
                };
            }
            else if (ch === PERIOD_CODE) {
                this.gobbleSpaces();
                const property = this.gobbleIdentifier();
                node = {
                    type: 'MemberExpression',
                    object: node,
                    property: {
                        type: 'String',
                        value: property.name,
                        location: property.location,
                    },
                    location: [node.location[0], property.location[1]],
                };
            }
            else if (ch === OPAREN_CODE) {
                if (node.type === 'Identifier') {
                    if (!Expression.FUNCTIONS[node.name]) {
                        this.throwError('parse14 :: ' + node.name);
                    }
                    node = {
                        type: 'CallExpression',
                        arguments: this.gobbleArguments(CPAREN_CODE),
                        callee: node.name,
                        location: node.location,
                    };
                }
                else {
                    if (node.type === 'MemberExpression' && node.property.type === 'String') {
                        if (!Expression.FUNCTIONS[node.property.value]) {
                            this.throwError('parse14 :: ' + node.property.value);
                        }
                        node = {
                            type: 'CallExpression',
                            arguments: [
                                node.object,
                                ...this.gobbleArguments(CPAREN_CODE)
                            ],
                            callee: node.property.value,
                            location: node.property.location,
                        };
                    }
                    else {
                        this.throwError('parse13');
                    }
                }
            }
            this.gobbleSpaces();
            ch = this.code;
        }
        if (ch === QUESTION_CODE) {
            if (this.expr.charCodeAt(this.index + 1) !== QUESTION_CODE) {
                this.index++;
                node = {
                    type: 'UnaryExpression',
                    operator: '?',
                    argument: node,
                    location: [this.index - 1, this.index],
                };
            }
        }
        return node;
    }
    /**
     * Parse simple numeric literals: `12`, `3.4`, `.5`. Do this by using a string to
     * keep track of everything in the numeric literal and then calling `parseFloat` on that string
     */
    gobbleNumericLiteral() {
        let number = '';
        const start = this.index;
        while (isDecimalDigit(this.code)) {
            number += this.expr.charAt(this.index++);
        }
        if (this.code === PERIOD_CODE) {
            number += this.expr.charAt(this.index++);
            while (isDecimalDigit(this.code)) {
                number += this.expr.charAt(this.index++);
            }
        }
        let ch = this.char;
        if (ch === 'e' || ch === 'E') { // exponent marker
            number += this.expr.charAt(this.index++);
            ch = this.char;
            if (ch === '+' || ch === '-') { // exponent sign
                number += this.expr.charAt(this.index++);
            }
            while (isDecimalDigit(this.code)) { // exponent itself
                number += this.expr.charAt(this.index++);
            }
            if (!isDecimalDigit(this.expr.charCodeAt(this.index - 1))) {
                this.throwError('parse15 :: ' + number + this.char);
            }
        }
        const chCode = this.code;
        // Check to make sure this isn't a variable name that start with a number (123abc)
        if (isIdentifierStart(chCode)) {
            this.throwError('parse6 :: ' + number + this.char);
        }
        else if (chCode === PERIOD_CODE || (number.length === 1 && number.charCodeAt(0) === PERIOD_CODE)) {
            this.throwError('parse2 :: .');
        }
        const value = parseFloat(number);
        if (value > Number.MAX_VALUE) {
            this.throwError('parse7');
        }
        return {
            type: 'Number',
            value: value,
            location: [start, this.index],
        };
    }
    /**
     * Parses a string literal, staring with single or double quotes with basic support for escape codes
     * e.g. `"hello world"`, `'this is\nJSEP'`
     */
    gobbleStringLiteral() {
        let str = '';
        const start = this.index;
        const quote = this.expr.charAt(this.index++);
        let closed = false;
        while (this.index < this.expr.length) {
            let ch = this.expr.charAt(this.index++);
            if (ch === quote) {
                closed = true;
                break;
            }
            else if (ch === '\\') {
                // Check for all the common escape codes
                ch = this.expr.charAt(this.index++);
                if (quote === '/') {
                    str += '\\' + ch;
                }
                else {
                    switch (ch) {
                        case 'n':
                            str += '\n';
                            break;
                        case 'r':
                            str += '\r';
                            break;
                        case 't':
                            str += '\t';
                            break;
                        case 'b':
                            str += '\b';
                            break;
                        case 'f':
                            str += '\f';
                            break;
                        case 'v':
                            str += '\x0B';
                            break;
                        default: str += ch;
                    }
                }
            }
            else {
                str += ch;
            }
        }
        if (!closed) {
            this.throwError('parse16 :: ' + str);
        }
        return {
            type: 'String',
            value: str,
            location: [start, this.index],
        };
    }
    /**
     * Parses a date literal, wrapped by #
     * e.g. `#2022-07-02T13:38:47.700Z#`, `#2020-01-01 00:00:00#`
     */
    gobbleDateLiteral() {
        const start = this.index;
        const end = this.expr.indexOf('#', this.index + 1) + 1;
        const str = this.expr.substring(start + 1, end - 1);
        let date;
        try {
            date = Convertation.toDate(str);
        }
        catch (e) {
            this.throwError('parse17');
        }
        this.index = end;
        return {
            type: 'Date',
            value: date.toISOString(),
            location: [start, end],
        };
    }
    /**
     * Gobbles only identifiers
     * e.g.: `foo`, `_value`, `$x1`
     * Also, this function checks if that identifier is a literal:
     * (e.g. `true`, `false`, `null`) or `this`
     */
    gobbleIdentifier() {
        let ch = this.code;
        const start = this.index;
        if (isIdentifierStart(ch)) {
            this.index++;
        }
        else {
            this.throwError('parse2 :: ' + this.char);
        }
        while (this.index < this.expr.length) {
            ch = this.code;
            if (isIdentifierPart(ch)) {
                this.index++;
            }
            else {
                break;
            }
        }
        const name = this.expr.slice(start, this.index);
        if (name[0] === '@') {
            return {
                type: 'Identifier',
                column: true,
                name: name.slice(1),
                location: [start, this.index],
            };
        }
        else {
            return {
                type: 'Identifier',
                column: false,
                name: name,
                location: [start, this.index],
            };
        }
    }
    /**
     * Gobbles a list of arguments within the context of a function call
     * or array literal. This function also assumes that the opening character
     * `(` or `[` has already been gobbled, and gobbles expressions and commas
     * until the terminator character `)` or `]` is encountered.
     * e.g. `foo(bar, baz)`, `my_func()`, or `[bar, baz]`
     */
    gobbleArguments(termination) {
        const args = [];
        let closed = false;
        let separator_count = 0;
        while (this.index < this.expr.length) {
            this.gobbleSpaces();
            let ch_i = this.code;
            if (ch_i === termination) { // done parsing
                closed = true;
                this.index++;
                if (termination === CPAREN_CODE && separator_count && separator_count >= args.length) {
                    this.throwError('parse2 :: ' + String.fromCharCode(termination));
                }
                break;
            }
            else if (ch_i === COMMA_CODE) { // between expressions
                this.index++;
                separator_count++;
                if (separator_count !== args.length) { // missing argument
                    this.throwError('parse2 :: ,');
                }
            }
            else if (args.length !== separator_count) {
                this.throwError('parse5 :: ,');
            }
            else {
                const node = this.gobbleExpression();
                if (!node) {
                    this.throwError('parse5 :: ,');
                }
                args.push(node);
            }
        }
        if (!closed) {
            this.throwError('parse5 :: ' + String.fromCharCode(termination));
        }
        return args;
    }
    /**
     * Responsible for parsing expression within parentheses `()`
     * that have no identifier in front (so not a function call)
     */
    gobbleGroup() {
        this.index++;
        const node = this.gobbleExpression();
        if (this.code === CPAREN_CODE) {
            this.index++;
            return node;
        }
        else {
            this.throwError('parse8 :: (');
        }
    }
    /**
     * Responsible for parsing Array literals `[1, 2, 3]`
     * This function assumes that it needs to gobble the opening bracket
     * and then tries to gobble the expressions as arguments.
     */
    gobbleArray() {
        const start = this.index;
        this.index++;
        const elements = this.gobbleArguments(CBRACK_CODE);
        return {
            type: 'ArrayExpression',
            elements,
            location: [start, this.index],
        };
    }
    /**
     * Responsible for parsing Object literals `{x: 1, "y": 2}`
     */
    gobbleObjectExpression() {
        const start = this.index;
        this.index++;
        const properties = [];
        let closed = false;
        while (!isNaN(this.code)) {
            this.gobbleSpaces();
            if (this.code === CCURLY_CODE) {
                this.index++;
                closed = true;
                break;
            }
            if (properties.length) {
                if (this.code === COMMA_CODE) {
                    this.index++;
                    // } after trailing ,
                    this.gobbleSpaces();
                    // @ts-ignore не видит изменения
                    if (this.code === CCURLY_CODE) {
                        this.index++;
                        closed = true;
                        break;
                    }
                }
                else {
                    this.throwError('parse9 :: ,');
                }
            }
            const key = this.gobbleExpression();
            if (!key)
                break; // missing }
            let keyName, keyLocation = key.location;
            if (key.type === 'Identifier') {
                keyName = key.name;
            }
            else if (key.type === 'String') {
                keyName = key.value;
            }
            else if (key.type === 'Null') {
                keyName = 'null';
            }
            else {
                this.throwError('parse10');
            }
            this.gobbleSpaces();
            if (this.code === COLON_CODE) {
                this.index++;
                const value = this.gobbleExpression();
                if (!value) {
                    this.throwError('parse11');
                }
                properties.push({
                    key: keyName,
                    value: value,
                    location: keyLocation,
                });
                this.gobbleSpaces();
            }
            else {
                this.throwError('parse12');
            }
        }
        if (closed) {
            return this.gobbleTokenProperty({
                type: 'ObjectExpression',
                properties,
                location: [start, this.index],
            });
        }
        else {
            this.throwError('parse9 :: }');
        }
    }
}
function parseExpression(code) {
    try {
        return {
            version: AST_VERSION,
            code: code,
            source: new Jsep(code).parse(),
            error: null,
        };
    }
    catch (e) {
        let message = e.message;
        let character = 0;
        const parts = e.message.split(' at character ');
        if (parts.length > 1) {
            message = parts[0];
            character = parts[1] * 1;
        }
        return {
            version: AST_VERSION,
            code: code,
            source: null,
            error: { message, character },
        };
    }
}

function defineMode(CM) {
    if (CM.getMode({}, 'formula').name === 'formula')
        return;
    else
        CM.defineMode("formula", function (config, parserConfig) {
            var wordRE = /[\w$\xa1-\uffff]/;
            var operatorRE = /[+\-*&%=<>!\/?]/;
            function tokenBase(stream, state) {
                if (stream.sol()) {
                    state.sol = true;
                }
                else if (stream.pos > stream.indentation()) {
                    state.sol = false;
                }
                stream.eatSpace();
                if (stream.current().length)
                    return;
                var ch = stream.next();
                if (ch == '"' || ch == "'") {
                    state.tokenize = tokenString(ch);
                    return state.tokenize(stream, state);
                }
                if (ch == "/") {
                    if (stream.eat("*")) {
                        state.tokenize = tokenComment;
                        return tokenComment(stream, state);
                    }
                    else if (stream.eat("/")) {
                        stream.skipToEnd();
                        return "comment";
                    }
                    else {
                        let allowRegexLiteral = false;
                        if (state.previousToken === null)
                            allowRegexLiteral = true;
                        else if (state.previousToken === 'operator')
                            allowRegexLiteral = true;
                        else if (state.previousToken === 'comma')
                            allowRegexLiteral = true;
                        else if (state.previousToken === 'parentheses-open')
                            allowRegexLiteral = true;
                        if (allowRegexLiteral) {
                            state.tokenize = tokenString(ch);
                            return state.tokenize(stream, state);
                        }
                    }
                }
                if (ch == '#') {
                    state.tokenize = tokenDate();
                    return state.tokenize(stream, state);
                }
                if (ch === '(' || ch === '[' || ch === '{') {
                    return `parentheses-open ${{
                        "(": "parentheses-type-a",
                        "[": "parentheses-type-b",
                        "{": "parentheses-type-c",
                    }[ch]}`;
                }
                if (ch === ')' || ch === ']' || ch === '}') {
                    return `parentheses-close ${{
                        ")": "parentheses-type-a",
                        "]": "parentheses-type-b",
                        "}": "parentheses-type-c",
                    }[ch]}`;
                }
                if (ch == "0" && stream.match(/^(?:x[\dA-Fa-f_]+|o[0-7_]+|b[01_]+)n?/)) {
                    return "number";
                }
                if (/\d/.test(ch)) {
                    stream.match(/^[\d_]*(?:n|(?:\.[\d_]*)?(?:[eE][+\-]?[\d_]+)?)?/);
                    return "number";
                }
                if (operatorRE.test(ch)) {
                    stream.eatWhile(operatorRE);
                    return "operator";
                }
                if (ch === '@') {
                    stream.eatWhile(wordRE);
                    return "column";
                }
                if (wordRE.test(ch)) {
                    stream.eatWhile(wordRE);
                    const word = stream.current();
                    stream.eatSpace();
                    if (stream.peek() === '(' && Expression.FUNCTIONS[word]) {
                        return "function";
                    }
                    else if (Expression.BINARY_OPERATORS[word]) {
                        return "operator";
                    }
                    else {
                        return "variable";
                    }
                }
                if (ch === ',') {
                    return "comma";
                }
            }
            function tokenString(quote) {
                return function (stream, state) {
                    var escaped = false, next;
                    while (next = stream.next()) {
                        if (next == quote && !escaped) {
                            state.tokenize = tokenBase;
                            break;
                        }
                        escaped = !escaped && next == "\\";
                    }
                    return "string";
                };
            }
            function tokenDate() {
                return function (stream, state) {
                    var next;
                    while (next = stream.next()) {
                        if (next == '#') {
                            state.tokenize = tokenBase;
                            break;
                        }
                    }
                    return "date";
                };
            }
            function tokenComment(stream, state) {
                var maybeEnd = false, next;
                while (next = stream.next()) {
                    if (next == "/" && maybeEnd) {
                        state.tokenize = tokenBase;
                        break;
                    }
                    maybeEnd = next == "*";
                }
                return "comment";
            }
            return {
                startState: function (base) {
                    return {
                        tokenize: tokenBase,
                        previousToken: null,
                        baseIndent: base || 0,
                        level: 0,
                        sol: false,
                        eol: false,
                    };
                },
                token: function (stream, state) {
                    const style = state.tokenize(stream, state);
                    state.eol = stream.eol();
                    const current = stream.current();
                    if (current === '(' || current === '[' || current === '{') {
                        if (state.eol)
                            state.level++;
                    }
                    else if (current === ')' || current === ']' || current === '}') {
                        if (state.sol)
                            state.level--;
                    }
                    if (style) {
                        state.previousToken = style.split(' ')[0];
                    }
                    return style;
                },
                indent: function (state, textAfter) {
                    let level = state.level;
                    if (/^[\}\]\)]/.test(textAfter))
                        level -= 1;
                    return state.baseIndent + level * config.indentUnit;
                },
                electricChars: '}])',
            };
        });
}

function highlightParentheses(cm) {
    function redrawParentheses(instance) {
        var _a, _b;
        const doc = instance.getDoc();
        for (const mark of doc.getAllMarks()) {
            if (mark.className.indexOf('parentheses') === 0) {
                mark.clear();
            }
        }
        let opens = [];
        const blocks = [];
        // @ts-ignore: похоже, в типах это свойство отсутствует
        const countOfLines = doc.size;
        for (let line = 0; line < countOfLines; line++) {
            let lineTokens = instance.getLineTokens(line);
            for (const nextToken of lineTokens) {
                if (((_a = nextToken.type) === null || _a === void 0 ? void 0 : _a.indexOf('parentheses-open')) === 0) {
                    opens.push({
                        type: nextToken.type.match(/parentheses-type-([abc])/)[1],
                        start: { line: line, ch: nextToken.start },
                        end: { line: line, ch: nextToken.start + 1 },
                    });
                }
                else if (((_b = nextToken.type) === null || _b === void 0 ? void 0 : _b.indexOf('parentheses-close')) === 0) {
                    const close = {
                        type: nextToken.type.match(/parentheses-type-([abc])/)[1],
                        start: { line: line, ch: nextToken.start },
                        end: { line: line, ch: nextToken.start + 1 },
                    };
                    let open, brokens = [];
                    for (const openCandidate of opens.slice().reverse()) {
                        if (openCandidate.type === close.type) {
                            open = openCandidate;
                            opens = opens.slice(0, opens.indexOf(openCandidate));
                            break;
                        }
                        else {
                            brokens.push(openCandidate);
                        }
                    }
                    if (open) {
                        for (const broken of brokens) {
                            doc.markText(broken.start, broken.end, {
                                className: 'parentheses-error',
                            });
                        }
                        doc.markText(open.start, open.end, {
                            className: `parentheses-${opens.length + 1}`,
                        });
                        doc.markText(close.start, close.end, {
                            className: `parentheses-${opens.length + 1}`,
                        });
                        if (instance.getSelection().length === 0) {
                            const cursor = instance.getCursor();
                            const cursorAfterOpen1 = cursor.line > open.start.line;
                            const cursorAfterOpen2 = cursor.line === open.start.line && cursor.ch >= open.start.ch;
                            if (cursorAfterOpen1 || cursorAfterOpen2) {
                                const cursorBeforeClose1 = cursor.line < close.start.line;
                                const cursorBeforeClose2 = cursor.line === close.start.line && cursor.ch <= close.start.ch + 1;
                                if (cursorBeforeClose1 || cursorBeforeClose2) {
                                    blocks.push({ open, close });
                                }
                            }
                        }
                    }
                    else {
                        doc.markText(close.start, close.end, {
                            className: 'parentheses-error',
                        });
                    }
                }
            }
        }
        for (const open of opens) {
            doc.markText(open.start, open.end, {
                className: 'parentheses-error',
            });
        }
        if (blocks.length) {
            doc.markText(blocks[0].open.start, blocks[0].open.end, {
                className: 'parentheses-match',
            });
            doc.markText(blocks[0].close.start, blocks[0].close.end, {
                className: 'parentheses-match',
            });
            doc.markText(blocks[0].open.start, blocks[0].close.end, {
                className: 'parentheses-block',
            });
        }
    }
    cm.on('cursorActivity', redrawParentheses);
    redrawParentheses(cm);
}

function indexToPosition(code, index) {
    let line = 0;
    let ch = index;
    for (let i = 0; i < index; i++) {
        if (code[i] === '\n') {
            line++;
            ch = index - i - 1;
        }
    }
    return {
        ch: ch,
        line: line
    };
}
class ExpressionAnalyzer {
    static evaluate(ast, scope) {
        const results = [];
        ExpressionAnalyzer.patchExpression(results);
        new Expression(ast, Expression.LIMIT_MODE_1M).evaluate(scope);
        ExpressionAnalyzer.restoreExpression();
        const sorted1 = [];
        for (const item of results) {
            sorted1[item.location[0]] = sorted1[item.location[0]] || [];
            sorted1[item.location[0]].push(item);
        }
        const sorted2 = [];
        for (const list of sorted1) {
            if (list)
                sorted2.push(...list);
        }
        const final = {};
        for (const item of sorted2) {
            const location = `${item.location[0]}-${item.location[1]}`;
            final[location] = final[location] || [];
            final[location].push(item.result);
        }
        return final;
    }
    static patchExpression(results) {
        Expression.prototype.__makeNode = Expression.prototype.makeNode;
        Expression.prototype.makeNode = (...args) => {
            const node = Expression.prototype.__makeNode(...args);
            node.__source = args[0];
            return node;
        };
        for (const nodeClass of [
            ...Object.values(Expression.BINARY_OPERATORS),
            ...Object.values(Expression.UNARY_OPERATORS),
            ...Object.values(Expression.FUNCTIONS),
            Expression.NODES.Identifier,
        ]) {
            ExpressionAnalyzer.patchNode(nodeClass, results);
        }
        Expression.NODES.ObjectExpression.prototype.__evaluate = Expression.NODES.ObjectExpression.prototype.evaluate;
        Expression.NODES.ObjectExpression.prototype.evaluate = function (...args) {
            const __source = this.__source;
            for (const key in this.object) {
                if (!this.object[key].hasOwnProperty('evaluate')) {
                    const __evaluate = this.object[key].evaluate;
                    this.object[key].evaluate = function (...args) {
                        const result = __evaluate.call(this, ...args);
                        results.push({
                            location: __source.properties.find(prop => prop.key === key).location,
                            result: JSON.parse(JSON.stringify(result)),
                        });
                        return result;
                    };
                }
            }
            return Expression.NODES.ObjectExpression.prototype.__evaluate.call(this, ...args);
        };
        Expression.NODES.MemberExpression.prototype.__evaluate = Expression.NODES.MemberExpression.prototype.evaluate;
        Expression.NODES.MemberExpression.prototype.evaluate = function (...args) {
            const result = Expression.NODES.MemberExpression.prototype.__evaluate.call(this, ...args);
            if (this.__source.property.type === 'Number' || this.__source.property.type === 'String') {
                results.push({
                    location: [
                        this.__source.property.location[0],
                        this.__source.property.location[1]
                    ],
                    result: JSON.parse(JSON.stringify(result)),
                });
            }
            return result;
        };
    }
    static patchNode(nodeClass, results) {
        if (nodeClass.prototype.__evaluate)
            return;
        nodeClass.prototype.__evaluate = nodeClass.prototype.evaluate;
        nodeClass.prototype.evaluate = function (...args) {
            if (nodeClass === LetFunction) {
                const __source = this.__source;
                for (const key in this.arguments[0].object) {
                    if (!this.arguments[0].object[key].hasOwnProperty('evaluate')) {
                        const __evaluate = this.arguments[0].object[key].evaluate;
                        this.arguments[0].object[key].evaluate = function (...args) {
                            const result = __evaluate.call(this, ...args);
                            results.push({
                                location: __source.arguments[0].properties.find(prop => prop.key === key).location,
                                result: JSON.parse(JSON.stringify(result)),
                            });
                            return result;
                        };
                    }
                }
                return nodeClass.prototype.__evaluate.call(this, ...args);
            }
            else {
                const result = nodeClass.prototype.__evaluate.call(this, ...args);
                results.push({
                    location: this.__source.location,
                    result: JSON.parse(JSON.stringify(result)),
                });
                return result;
            }
        };
    }
    static restoreExpression() {
        Expression.prototype.makeNode = Expression.prototype.__makeNode;
        delete Expression.prototype.__makeNode;
        for (const nodeClass of [
            ...Object.values(Expression.BINARY_OPERATORS),
            ...Object.values(Expression.UNARY_OPERATORS),
            ...Object.values(Expression.FUNCTIONS),
            Expression.NODES.Identifier,
        ]) {
            ExpressionAnalyzer.restoreNode(nodeClass);
        }
        Expression.NODES.ObjectExpression.prototype.evaluate = Expression.NODES.ObjectExpression.prototype.__evaluate;
        delete Expression.NODES.ObjectExpression.prototype.__evaluate;
        Expression.NODES.MemberExpression.prototype.evaluate = Expression.NODES.MemberExpression.prototype.__evaluate;
        delete Expression.NODES.MemberExpression.prototype.__evaluate;
    }
    static restoreNode(nodeClass) {
        if (!nodeClass.prototype.__evaluate)
            return;
        nodeClass.prototype.evaluate = nodeClass.prototype.__evaluate;
        delete nodeClass.prototype.__evaluate;
    }
    static enableAnalyzer(instance, result, callback) {
        instance.setOption('readOnly', 'nocursor');
        const doc = instance.getDoc();
        const code = instance.getDoc().getValue();
        const markers = [];
        for (const key in result) {
            const location = key.split('-').map(item => parseInt(item));
            markers.push(doc.markText(indexToPosition(code, location[0]), indexToPosition(code, location[1]), {
                className: 'analyzer',
                attributes: {
                    'data-location': key,
                },
                startStyle: 'analyzer-start',
                endStyle: 'analyzer-end',
            }));
        }
        instance.on('mousedown', (cm, event) => {
            const pos = cm.coordsChar({ left: event.clientX, top: event.clientY });
            for (const mark of doc.getAllMarks()) {
                if (mark.className.indexOf('analyzer-active') === 0) {
                    mark.clear();
                }
            }
            for (let marker of markers) {
                const range = marker.find();
                if (range && pos.line >= range.from.line && pos.line <= range.to.line &&
                    ((pos.line !== range.from.line && pos.line !== range.to.line) ||
                        (pos.ch >= range.from.ch && pos.ch <= range.to.ch))) {
                    doc.markText(range.from, range.to, {
                        className: 'analyzer-active',
                    });
                    callback(result[marker.attributes['data-location']]);
                    return;
                }
            }
            callback(null);
        });
    }
    static disableAnalyzer(instance) {
        instance.setOption('readOnly', false);
        const doc = instance.getDoc();
        for (const mark of doc.getAllMarks()) {
            if (mark.className.indexOf('analyzer') === 0) {
                mark.clear();
            }
        }
    }
}

if (typeof HTMLElement === 'undefined') {
    // @ts-ignore
    global.HTMLElement = class HTMLElement {
    };
}
/**
 * Encode a string to be used in HTML
 */
function htmlEncode(t) {
    return (typeof t !== "undefined" && t !== null) ? t.toString()
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        : '';
}
/**
 * Completely escape a json string
 */
function jsString(s) {
    // Slice off the surrounding quotes
    s = JSON.stringify(s).slice(1, -1);
    return htmlEncode(s);
}
function isBareProp(prop) {
    return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(prop);
}
/**
 * Surround value with a span, including the given className
 */
function decorateWithSpan(value, className) {
    return `<span class="${className}">${htmlEncode(value)}</span>`;
}
function copyToClipboard(text) {
    // @ts-ignore
    if (window.clipboardData && window.clipboardData.setData) {
        // IE specific code path to prevent textarea being shown while dialog is visible.
        // @ts-ignore
        return clipboardData.setData("Text", text);
    }
    else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
        var textarea = document.createElement("textarea");
        textarea.textContent = text;
        textarea.style.position = "fixed"; // Prevent scrolling to bottom of page in MS Edge.
        document.body.appendChild(textarea);
        textarea.select();
        try {
            return document.execCommand("copy"); // Security exception may be thrown by some browsers.
        }
        catch (ex) {
            console.warn("Copy to clipboard failed.", ex);
            return false;
        }
        finally {
            document.body.removeChild(textarea);
        }
    }
}
function clickHandler(event) {
    const collapser = event.target.closest('.sv-collapser');
    if (collapser) {
        event.stopPropagation();
        collapser.classList.toggle('sv-collapsed');
    }
    const prop = event.target.closest('.sv-prop');
    if (prop && prop.hasAttribute('data-copy')) {
        event.stopPropagation();
        if (copyToClipboard(prop.getAttribute('data-copy')) !== false) {
            const alert = document.createElement('span');
            alert.classList.add('expression-scope-viewer-copied');
            alert.innerText = translations.scope_viewer.copied[this._lang].replace('%path%', prop.getAttribute('data-copy'));
            document.body.append(alert);
            const rect1 = prop.getBoundingClientRect();
            const rect2 = alert.getBoundingClientRect();
            alert.style.top = `${Math.round(rect1.top - rect2.top - rect2.height)}px`;
            alert.style.left = `${Math.round(rect1.left - rect2.left)}px`;
            window.requestAnimationFrame(function () {
                alert.classList.add('sv-animated1');
                setTimeout(function () {
                    alert.classList.add('sv-animated2');
                    setTimeout(function () {
                        alert.remove();
                    }, 600);
                }, 600);
            });
        }
    }
}
class ExpressionScopeViewerElement extends HTMLElement {
    constructor() {
        super();
        this._value = '';
        this._lang = 'en';
        this._copyable = false;
    }
    static define() {
        if (customElements.get("expression-scope-viewer") === undefined) {
            customElements.define("expression-scope-viewer", ExpressionScopeViewerElement);
        }
    }
    valueToHTML(value, path) {
        const valueType = typeof value;
        if (value === null) {
            return decorateWithSpan('null', 'sv-null');
        }
        else if (Array.isArray(value)) {
            return this.arrayToHTML(value, path);
        }
        else if (value instanceof Date) {
            return decorateWithSpan(Expression.prettyPrint(value), 'sv-date');
        }
        else if (valueType === 'object') {
            return this.objectToHTML(value, path);
        }
        else if (valueType === 'number') {
            return decorateWithSpan(value, 'sv-num');
        }
        else if (valueType === 'string' &&
            value.charCodeAt(0) === 8203 &&
            !isNaN(value.slice(1))) {
            return decorateWithSpan(value.slice(1), 'sv-num');
        }
        else if (valueType === 'string') {
            return `<span class="sv-string">&quot;${jsString(value)}&quot;</span>`;
        }
        else if (valueType === 'boolean') {
            return decorateWithSpan(value, 'sv-bool');
        }
        return '';
    }
    arrayToHTML(json, path) {
        if (json.length === 0) {
            return '[ ]';
        }
        let output = '';
        for (let i = 0; i < json.length; i++) {
            const subPath = `${path}[${i}]`;
            const title = htmlEncode(translations.scope_viewer.copy_path[this._lang].replace('%path%', subPath));
            const copy_attr = this._copyable ? `title="${title}" data-copy="${htmlEncode(subPath)}"` : '';
            output += `<li><span class="sv-index sv-prop" data-text="${i}" ${copy_attr}></span>`;
            output += `<span class="sv-index" data-text=": "></span>`;
            output += `${this.valueToHTML(json[i], subPath)}`;
            if (i < json.length - 1) {
                output += ',';
            }
            output += '</li>';
        }
        const counter = `<span class="sv-collapsed-counter" data-text="…${json.length}"></span>`;
        return `<span class="sv-collapser"></span>[<ul class="sv-array sv-collapsible">${output}</ul>${counter}]`;
    }
    objectToHTML(json, path) {
        let numProps = Object.keys(json).length;
        if (numProps === 0) {
            return '{ }';
        }
        const counter = `<span class="sv-collapsed-counter" data-text="…${numProps}"></span>`;
        let output = '';
        for (const prop in json) {
            let subPath = '';
            let escapedProp = JSON.stringify(prop).slice(1, -1);
            const bare = isBareProp(prop);
            // TODO defis
            if (bare) {
                subPath = path.length ? `${path}.${escapedProp}` : escapedProp;
            }
            else {
                // path.length не проверяем, потому что в корне не должно быть таких имен
                subPath = `${path}["${escapedProp}"]`;
            }
            const title = htmlEncode(translations.scope_viewer.copy_path[this._lang].replace('%path%', subPath));
            const copy_attr = this._copyable ? `title="${title}" data-copy="${htmlEncode(subPath)}"` : '';
            output += `<li><span class="sv-prop" ${copy_attr}>`;
            if (!bare)
                output += '&quot;';
            output += jsString(prop);
            if (!bare)
                output += '&quot;';
            output += `</span>: ${this.valueToHTML(json[prop], subPath)}`;
            if (numProps > 1)
                output += ',';
            output += '</li>';
            numProps--;
        }
        return `<span class="sv-collapser"></span>{<ul class="sv-obj sv-collapsible">${output}</ul>${counter}}`;
    }
    set value(value) {
        if (value !== this._value) {
            this._value = value;
            this._lang = this.getAttribute('lang') || 'en';
            this._copyable = this.getAttribute('copyable') !== null;
            this.innerHTML = this.valueToHTML(value, '');
            console.log('scope-view redraw');
        }
    }
    get value() {
        return this._value;
    }
    connectedCallback() {
        this.addEventListener('click', clickHandler, false);
    }
    destroy() {
    }
    disconnectedCallback() {
        this.removeEventListener('click', clickHandler);
    }
}

const errorVector = `<svg width="13px" height="5px" viewBox="0 0 13 5" xmlns="http://www.w3.org/2000/svg">
    <g stroke="#FF0000" stroke-width="0.5" fill="none" fill-rule="evenodd">
        <polygon fill="#FF0000" transform="translate(6.5, 3.5) rotate(-315) translate(-6.5, -3.5) " points="2 8 2 3 6 3 6 -1 11 -1 11 0 7 0 7 4 3 4 3 8"></polygon>
    </g>
</svg>`;
let CodeMirror = null;
function initialize(root, options) {
    defineMode(CodeMirror);
    root.classList.add('theme-' + options.theme);
    const container = document.createElement('div');
    container.classList.add('expression-editor_container');
    root.append(container);
    // Этот container нужен только для того, чтобы глушить эти странные события,
    // которые идут от textarea, и ловятся только на внешних елементах
    container.addEventListener('change', event => {
        event.stopPropagation();
    });
    const leftLabel = document.createElement('div');
    container.append(leftLabel);
    leftLabel.classList.add('expression-editor_left-label');
    const leftMenu = document.createElement('div');
    leftLabel.append(leftMenu);
    leftMenu.classList.add('expression-editor_left-menu');
    const fxIcon = document.createElement('div');
    leftMenu.append(fxIcon);
    fxIcon.classList.add('expression-editor_fx-icon');
    root._fxIcon = fxIcon;
    const linkContainer = document.createElement('div');
    leftMenu.append(linkContainer);
    linkContainer.classList.add('expression-editor_link-container');
    root._leftMenu = leftMenu;
    const linkElement = document.createElement('a');
    linkContainer.append(linkElement);
    linkElement.classList.add('expression-editor_link-element');
    linkElement.setAttribute('target', '_blank');
    linkElement.innerText = translations.editor.goto_playground[root._lang];
    // TODO сделать так, чтобы в формулу уходило ТОЛЬКО ТО, ЧТО ИСПОЛЬЗУЕТСЯ, А НЕ ВСЕ
    fxIcon.addEventListener('click', event => {
        if (leftMenu.classList.contains('expandable')) {
            if (leftMenu.classList.contains('expanded')) {
                leftMenu.classList.remove('expanded');
            }
            else {
                leftMenu.classList.add('expanded');
                const link = [
                    translations.editor.playground_href[root._lang],
                    '?formula=' + encodeURIComponent(root._currentValue),
                    '&scope=' + encodeURIComponent(Expression.prettyPrint(root._currentScope, '')),
                ].join('');
                linkElement.setAttribute('href', link);
            }
        }
    });
    leftMenu.addEventListener('mouseleave', event => {
        if (leftMenu.classList.contains('expandable') && leftMenu.classList.contains('expanded')) {
            leftMenu.classList.remove('expanded');
        }
    });
    const textarea = document.createElement('textarea');
    textarea.textContent = options.value;
    container.append(textarea);
    const cm = CodeMirror.fromTextArea(textarea, {
        lineNumbers: false,
        indentWithTabs: false,
        indentUnit: 2,
        tabSize: 2,
        mode: "formula",
        theme: "formula",
        smartIndent: true,
        electricChars: true,
        scrollbarStyle: "overlay",
        extraKeys: {
            // https://github.com/codemirror/codemirror5/issues/988#issuecomment-549644684
            Tab: cm => {
                if (cm.somethingSelected()) {
                    cm.execCommand('indentMore');
                }
                else {
                    cm.execCommand('insertSoftTab');
                }
            },
            'Shift-Tab': cm => cm.execCommand('indentLess')
        }
    });
    cm.setOption('viewportMargin', Infinity);
    cm.setSize(options.width || '100%', options.height || 'auto');
    highlightParentheses(cm);
    const errorDecor = document.createElement('div');
    errorDecor.classList.add('error-mark');
    errorDecor.innerHTML = errorVector;
    function clearErrors(instance) {
        errorDecor.remove();
        root.classList.remove('has-error');
    }
    function checkErrors(instance) {
        const doc = instance.getDoc();
        const parsed = parseExpression(doc.getValue());
        if (parsed.error === null)
            return;
        const ruError = Expression.ErrorTranslator.toRussian('parse :: ' + parsed.error.message);
        let charSkipped = 0;
        // @ts-ignore: похоже, в типах это свойство отсутствует
        const countOfLines = doc.size;
        for (let line = 0; line < countOfLines; line++) {
            const lineChars = instance.getLine(line).length;
            if (charSkipped + lineChars < parsed.error.character) {
                charSkipped += lineChars + 1;
            }
            else {
                showError({
                    line,
                    ch: parsed.error.character - charSkipped
                }, ruError);
                return;
            }
        }
        showError({ line: 0, ch: 0 }, ruError);
    }
    function showError(pos, message) {
        root.classList.add('has-error');
        errorDecor.setAttribute('title', message);
        cm.addWidget(pos, errorDecor, false);
    }
    let checkTimeout;
    cm.on('change', instance => {
        clearErrors();
        clearTimeout(checkTimeout);
        checkTimeout = setTimeout(() => checkErrors(instance), 2000);
    });
    checkErrors(cm);
    return cm;
}
if (typeof HTMLElement === 'undefined') {
    // @ts-ignore
    global.HTMLElement = class HTMLElement {
    };
}
class ExpressionEditorElement extends HTMLElement {
    constructor() {
        super();
        this.cm = null;
        this._currentValue = '';
        this._delayedValue = '';
        this._currentScope = null;
        this._delayedScope = null;
        this._lang = 'en';
        this.addEventListener('change', event => {
            // CodeMirror генерирует странные событие, исходящие от textarea,
            // которые мешают, и мы только в это месте можем их убить
            if (event.target !== this)
                event.stopPropagation();
        });
    }
    static define(CM) {
        if (CodeMirror === null) {
            CodeMirror = CM;
            if (customElements.get("expression-editor") === undefined) {
                customElements.define("expression-editor", ExpressionEditorElement);
            }
        }
        else {
            if (CodeMirror !== CM) {
                throw new Error('ScenarioEditor element is already defined with another CodeMirror');
            }
        }
    }
    set value(value) {
        if (!this.cm) {
            // Данные пришли, когда компонент еще не подключен к DOM
            this._delayedValue = value;
            return;
        }
        if (this._currentValue !== value) {
            const doc = this.cm.getDoc();
            // @ts-ignore этих свойств нет среди типов doc
            const scrollLeft = doc.scrollLeft, scrollTop = doc.scrollTop;
            doc.setValue(value);
            this.cm.scrollTo(scrollLeft, scrollTop);
        }
    }
    get value() {
        return this._currentValue;
    }
    connectedCallback() {
        if (this.cm)
            return; // Уже подключено
        const initialValue = this._delayedValue || this.getAttribute('value') || '';
        this._lang = this.getAttribute('lang') || 'en';
        this.cm = initialize(this, {
            theme: this.getAttribute('theme') || 'redactor',
            width: this.getAttribute('width') || '100%',
            height: this.getAttribute('height') || 'auto',
            value: initialValue,
        });
        this._currentValue = this.cm.getDoc().getValue();
        if (this._delayedScope)
            this.evaluate(this._delayedScope);
        this.cm.on('change', event => {
            this._currentValue = this.cm.getDoc().getValue();
            this.dispatchEvent(new CustomEvent('change'));
        });
        this.cm.on('focus', event => {
            this.dispatchEvent(new CustomEvent('focus'));
        });
        this.cm.on('blur', event => {
            this.dispatchEvent(new CustomEvent('blur'));
        });
        // @ts-ignore
        if (this.cm.display.wrapper.offsetWidth === 0) {
            (function waitForVisible() {
                if (this.cm.display.wrapper.offsetWidth)
                    this.cm.refresh();
                else
                    setTimeout(waitForVisible.bind(this), 100);
            }.bind(this))();
        }
    }
    evaluate(scope) {
        if (!this.cm) {
            this._delayedScope = scope;
            return;
        }
        this._currentScope = scope;
        this._fxIcon.removeAttribute('title');
        this._leftMenu.classList.remove('expandable');
        const parsed = parseExpression(this._currentValue);
        if (parsed.error)
            return;
        const expr = new Expression(parsed, Expression.LIMIT_MODE_10K);
        const output = expr.evaluate(scope);
        if (output.error)
            return;
        this._fxIcon.setAttribute('title', Expression.prettyPrint(output.result));
        this._leftMenu.classList.add('expandable');
    }
    enableAnalyzer(result, callback) {
        ExpressionAnalyzer.enableAnalyzer(this.cm, result, callback);
    }
    disableAnalyzer() {
        ExpressionAnalyzer.disableAnalyzer(this.cm);
    }
    destroy() {
        this.cm.toTextArea();
        this.innerHTML = '';
    }
    disconnectedCallback() { }
}

export { Expression, ExpressionAnalyzer, ExpressionEditorElement, ExpressionScopeViewerElement, parseExpression };
