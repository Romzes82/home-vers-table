перед загрузкой проверить все инн и телефоны тк, результат записать в V и F
при изменении значения в F будет добавляться массив адресов в V
т.е в DisplayData в handleChange надо еще вызывать поиск в бд адресов но названию тк, результат толко F записываем в LocFor через onCellChange
касательно V при его изменении тоже записываем результат в LocFor через onCellChange, но уже другим хендлером(выбранный адрес будет 1ым в массиве)

доработать handleUpload с учетом того, что надо обновить и V
сделать заглушки для V, типа для всех строк в V массив ['адрес_1','адрес_2']
как бы проверить новые строки - по значениям счетов, если новый, то в стобце Х прописать new. В то же время надо проверить вообще все значения стобцов, итог: либо new, del, change_NAME_COLUMN/или просто имя столбца
и тогда на странице имея классы закрышиваем красным номер п/п или счета, del - всю строку, а change_NAME_COLUMN - надо как-то закрасить именно ту колонку
это потом, а сейчас

самое главное сохранять в locFor F как строку, и V  как массив!!!
потом тупо соритровка и как-то по условиям наличия адреса подчеркивание строки

сейчас надо, если F изменено, то V очищать, т.е. Ф меняется далее запрос в бд если что-то находим заменям В, елси ничего не находим записываем в В пустой объект - делать это перед onCellChange(newData);

проблема с Забираем и Отвозим. Надо делать так: если есть файл txt, то читаем его; в нем с каждой новой строки новый забор. На страницу будут записаны значния по нулям, единственная ячейка, которая будет заполнена эта комментарий. Руками заполнятся тип отгрузки и адрес. Надо что-то прописывать в номере счета, например номер строки в txt файле. Также надо эту точку сохранять с бд. Для бд все Заборы и Отвозы будут под одним ИНН - н-р 999111999. Также надо, чтоб на фронте при обновлении не терялась эта строка. Для этого надо в Upload каждый раз делать еще и запрос к текстовому файлу и брать из него массив этих комментариев и прицеплять г готовому массиву асд+ом.

надо добавить еще три столбца - плательщик W, паллеты X, комментарий Y.
в Y автоматом при первом обновлении копировать данные их комментария.
в W массив, три значения - пусто, Т, Д. Без возможности редактировать
в X массив, только двузначные числа. Без возможности редактировать. Но пока пусть просто числовое значение

поработать с шапкой(закрепить области), затем переходим к серверу
серверную часть надо порпобовать сделать отдельным приложением. Потом если что можно слепить воедино

надо добавить еще один столбец Z - для сохранения номера счета, если 
МиО: несколько юр. лиц едут на один адрес
ТК: по нескольким юр. лицам грузополучатель один
счет, который копируется д.б. уже имеющимся определенным адресом
При Мо грузополучатели с внесенным счетом-ссылкой не перечеркиваются, при ТК - перечеркиваются.

(Кстати, в маршрутном листе в графе адрес будет, откорретированный адрес и получается тот адрес/город который будет указан при отправке, в доставках будет пустой, хотя пусть он будет не пустой, а будет содержать именно откорректорованный адрес, а в комменте коммент. А в тк тот адрес, который указан в 1С - город, но в комменте откорректрованный адрес(###). И т.к. нам потребуется кроме адреса еще и время работы ТК, тел., то мы их можем удидеть щелкнув по адресу терминала, а уже в маршрутный лист ### будет прописываться в самое НАЧАЛО откорректированного коммента
### - адрес из бд | коммент из бд/тк из бд/тел из бд/время из бд
получается в откорректированный коммент будет 
вот так вот не надо - ?доп. столбец, в котором динамически будет все кроме адрес из бд, т.е. коммент из бд/тк из бд/тел из бд/время из бд. В то же время проще/быстрее сделать один запрос вместо двух и выдать
адрес из бд * коммент из бд/тк из бд/тел из бд/время из бд
где * - это точка с запятой, до которой будет браться адрес для я.мар. Т.е. при записи адресов в бд ТК надо проверять обязательное отсутствие ; и если она есть заменять ее на запятую например.
На будущее вообще если такая ТК/доставка в бд уже есть, то надо записывать в скрытые столбцы долготу и широту и далее при формировании карты смотреть, если координаты есть, то их уже не надо определять по адресу, а можно сразу отрисовывать на карте, выигрывая при этом в скорости.)

с Z понятно, вроде есть смысл. Но как быть в тех случаях, когда надо изменить/зачеркнуть город доставки. Можно сделать так - если есть в столбце номер счета, который равен самому этому счету, то город черкаем. Если есть счет не равный самому счету, то зачеркивается
если в Z один счет, то
- если он равен самому счету, то черкаем город
- если он не равен самому счету, то черкаем название, а грузополучателя прописываем того, чей счет прописан
если с Z два счета, то 
- они не одинаковы, иначе ошибка красим все красным
    - один них точно д.б. равен самому счету, иначе ошибка, красим все красным
        - счет-ссылка д.б. в списке всех имеющихся счетов, иначе ошибка, красим все красным
            - черкаем и получателя(т.к. есть счет-ссылка) и город(самого счета)

формировать массив этих счетов по маске ##1-числа. Тут же на странице зачеркавать, то что следует. Т.е. в ф-цию передавать массив с двумя/одним счетом, она будет присваивать класс "cross-cell" в столбцах Получатель - E и Адрес - Q всех счетов по этому клинету. Определяем это по его ИНН, если ИНН нет, то по названию Получателя.
это сработает, но как решить сортировку - надо чтобы счет-икс с заполенной Z шел сразу за тем счетом-игрек, номер которого указан в счете-икс, и так со всеми ИНН счета-икс. Т.е. чтоб этот клиент прилипал снизу к счету, ссылка на который в Z у клиента. Получается после сорироваки по стобдцам надо проделывать такую процедуру с осторитованным массивом.
В итоге много закрученного кода.
Вариант:
Правый клик на названии или городе и черкаем ячейку. Отлично, но надо где-то хранить массив объектов с значениями row, column
[
    {
        row: 5,
        column: 3
    },    
    {
        row: 5,
        column: 4
    },
]
или

{
    value: '', 
    crossedCell: [
        {
         row: 5,
         column: 3
        },
        {
         row: 5,
         column: 4
        }
    ]
}

или проще 
{   
    crossedCellClient: true,
    crossedCellAddress: true,
    linkCell: 'МО1-000123'
}
пожалуй так, только можно убрать linkCell и брать его из осторированного массива из предыдущего объекта и Z тогда не понадобится. Тогда надо иметь возможность таскать руками строки. Итог: две задачи
1) Таскать руками
2) Клик правой кнопкой мыши!!!! можно просто клик с alt-ом 
?? 2) Доп. ключ Z с значением объект!!!! можно проще воткнуть в имеющийся ключ

получается черкаем -> перечеркиваются все ячейки столбца с этим ИНН(названием, если нет ИНН) - тут вопрос, т.к. могут быть исключения. Лучше черкать руками
в конце соритовки все счета с этим инн И перечернутые следуют за счетом-ссылкой и так для все перечернутых по названию поочереди!
Все, должно сработать, но тогда с таким Z
{   
    crossedCellClient: true,
    crossedCellAddress: true,
    linkCell: 'МО1-000123'
}
проверка - там где почеркано название должно быть значение счета-ссылки, иначе красное. Там где внесен счет-ссылка, он прописываетсы во всех Z с этим инн. Хотя могут быть исключения, поэтому так делать не надо, а надо черкать все по отдельности.

Если исключить linkCell, и оставить алгоритм такой - самая первая загрузка счетов происходит по сортировке по столбцам, далее таскаем все ручками. Если ячейки черкаем, то ?как ни крути? надо учитывать столбец Z в котором для соединения юр. лиц при доставки и ТК был основной счет-ссылка по которому будет разделение всех этих счетов. Самое простое для идентификации - это для всех почерканых в Z иметь счет-ссылку.

можно попробовать все-таки имея отсортированный массив в локалфоредж, при почерканых ячейках смотреть предыдущие непочерканные, т.е. так - отделяем только в том случае, если клинеты отличаются/ТК отличается/была Мио стала ТК или забираем/закончились почерканые - это будет применяться в маршрутных листах, т.е. столбец Z отображать нет необходимости.

задача: 
v - реализуем наличие ключа Z, не показываем его.
  - реализуем перетаскивание с сохранением очередности. 
  - реализуем перечеркивание.

итак, все красиво и вроде готово к взаимодействию с серверной частью. На что стоит обратить внимание
- разовую сортировку по инн и типу отгрзуки: МиО -> тк -> забираем. Остальное будем таскать руками.
- затем по всему массиву желательно определить адреса и ТК с терминалами. По МиО - для всех разных ИНН(если нет инн, то учитываем вместо него название), для ТК при наличии номера телефона в комменте. Тут важно при обновлении смотреть если Инн/клиент такой уже есть, то для него адрес не определять, но для начала лучше определять для всех новых счетов.
- возможно нужно сразу позаботиться о наличии полей в строках-объектах с координатами. Допустим в поля ключа Z - lat, lon. Т.е. всегда успеем, единственное, надо заранее позаботиться о их наличии в бд ТК и МиО. Тут интересный момент - как они будут меняться в зависимости от выбора адресов из селекта/инпута - можно все прописывать в V в конец после ;
- адрес из бд ; коммент из бд/тк из бд/тел из бд/время из бд ; координаты из бд

- что решено с адресами терминалов? - адрес из бд ; коммент из бд/тк из бд/тел из бд/время из бд ; координаты из бд

есть. Данные подготовлены и визуальная часть тоже. Остается 
- по действиям пользователя при onBlur обращаться к бд - и только на Типе отгрузки тк в конкретной ячейке.
- один раз по загрузке из хлс просматривать все комменты и с них выбирать телефоны, по ним обращения к бд с получением ТК и все инфы по ней ИЛИ
для простоты вывести кнопку "Определить ТК" и определить "Доставки"
 Дальше надо прикрутить кнопки StartMap и EndMap

 возможно для ТК лучше проверять только инфу в столбце L, смотрим сперва "тк ***" на like из массива всех тк из бд, если находим, то обращаемся к бд по названию этой тк. Если не находим, то собираем телефоны в массив и с ним обращаемся к бд. 
 И возможно для единичных распознаваний адресов надо сделать выпадающее меню (проверено, т.е. убирет желтый цвет со всей строки/определить ТК) по правому клику мыши "определить ТК", тогда при нахождении информации по названию или телефону в Y, удаляются старые адреса V и название ТК F и прописываются новые. 
 И последнее при смене ТК в столбце F задается вопрос пользователю и меняются адреса в V

 т.к. вся инфа о ТК не помещается в V, то надо прописывать ее в title td и менять при каждой смене филиала
