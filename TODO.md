# Creatium Formulas

Оптимизировать целые куски кода с flatArguments

acceptArray сделать все-таки адекватно

DateTimeInterface::ISO8601_EXPANDED вместо условий моих???


Есть идея оптимизировать цепочки field1.subfield.x чтобы это в монге было так:
$ifNull: ['$field1.subfield.x', null], и по идее работать будет идентично тому, что сейчас?
Даже если там ошибка, можно проверку делать на mising

Но тоже стоит делать по умному - если там сравнение, то смысла приводить к null никакого нет, и можно остаивть как есть, получив максимально нативное выражение

Оптимизация со скоупом, чтобы можно было формулы выполнять частично на сервере

В редакторе, в калькуляторах у меня используется чистый JS, из-за чего я на самом деле не знаю, какие поля от каких полей зависят, то есть я не могу вычислить зависимости, поэтому мне приходится фактически выполнять все формулы во всех полях, чтобы детектить изменения.
В общем, важно, чтобы на этапе парсинга формулы можно было точно определить, какие другие переменные используются в ней. Тогда можно будет построить граф зависимостей и очень эффективно и быстро обновлять фронтенд.
А для этого нужно запретить использование выражений для доступа к полям, которые мы хотим определять в зависимостях.
То есть чтобы нельзя было обращаться к form.fields["Название" + " поля"], потому что на этапе парсинга тут невозможно определить, что подразумевается form.fields["Название поля"], и соответственно, зафиксировать зависимость.

Делать ограничение по времени выполнения и объему используемой памяти с помощью
https://www.php.net/manual/en/function.memory-get-usage.php ?


urlEncode в JS не соответствует RFC-3986, нужно это учитывать

Возможно, есть смысл тестировать монгу не только в $addFields, но и в $match и еще как-нибудь

'%' => 'ModFunction', удалить может быть??


Template system

{{_expr_}}

{#for key, user in _expr_}
* {{ user.name }}
{:else}
No users have been found.
{/for}


{% if product.stock > 10 %}
Available
{% else if product.stock > 0 %}
Only {{ product.stock }} left!
{% else %}
Sold-out!
{% end if %}