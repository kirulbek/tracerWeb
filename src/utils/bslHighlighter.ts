// Подсветчик синтаксиса BSL в стиле 1С:Предприятие
export function highlightBSLToHTML(code: string): string {
  // Очистка от HTML-тегов и сущностей
  let cleanCode = code
    .replace(/<[^>]*>/g, '') // Удаляем HTML-теги
    .replace(/&nbsp;/g, ' ') // Заменяем &nbsp; на пробел
    .replace(/&amp;/g, '&') // Восстанавливаем &
    .replace(/&lt;/g, '<') // Восстанавливаем <
    .replace(/&gt;/g, '>') // Восстанавливаем >
    .replace(/&quot;/g, '"') // Восстанавливаем "
    .replace(/&#39;/g, "'"); // Восстанавливаем '
  
  // Разбиваем на строки для обработки
  const lines = cleanCode.split('\n');
  const processedLines: string[] = [];
  
  for (const line of lines) {
    let processedLine = line;
    
    // Экранируем HTML символы
    processedLine = processedLine
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    processedLines.push(processedLine);
  }
  
  let html = processedLines.join('<br>');

  // Директивы препроцессора (#Если, #Область и т.д.) - КРАСНЫЙ, ЖИРНЫЙ (как в 1С)
  // Обрабатываем ПЕРВЫМ, чтобы не конфликтовать с другими правилами
  html = html.replace(/#(Если|ИначеЕсли|Иначе|КонецЕсли|Область|КонецОбласти|Клиент|Сервер|ТолстыйКлиентОбычноеПриложение|ТолстыйКлиентУправляемоеПриложение|ВнешнееСоединение|МобильноеПриложениеКлиент|МобильноеПриложениеСервер|Или|И|Не)\b/gi, 
    '<span style="color: #ff0000; font-weight: bold;">#$1</span>');
  
  // Ключевые слова BSL (синий цвет, жирный, как в 1С)
  const keywords = [
    'Процедура', 'Функция', 'КонецПроцедуры', 'КонецФункции',
    'Если', 'Тогда', 'Иначе', 'ИначеЕсли', 'КонецЕсли',
    'Пока', 'Цикл', 'КонецЦикла',
    'Для', 'Каждого', 'Из', 'По',
    'Попытка', 'Исключение', 'КонецПопытки',
    'Возврат', 'Продолжить', 'Прервать',
    'Перем', 'Перейти', 'ВызватьИсключение',
    'Истина', 'Ложь', 'Неопределено', 'Null',
    'И', 'Или', 'Не',
    'Новый', 'СоздатьОбъект', 'ПолучитьОбъект',
    'Выполнить', 'ВыполнитьСинхронно',
    'Экспорт',
    'ЗначениеЗаполнено', 'ТипЗнч', 'Вид', 'Тип',
    'ГДЕ', 'РазрешитьЧтение', 'РазрешитьИзменениеЕслиРазрешеноЧтение'
  ];

  // Типы данных
  const types = [
    'Строка', 'Число', 'Дата', 'Булево',
    'Массив', 'Соответствие', 'Структура', 'ФиксированнаяСтруктура',
    'ТаблицаЗначений', 'Запрос', 'РезультатЗапроса',
    'ДвоичныеДанные', 'УникальныйИдентификатор'
  ];

  // Встроенные функции
  const functions = [
    'СтрДлина', 'СтрНайти', 'СтрЗаменить', 'СтрРазделить',
    'Число', 'Строка', 'Формат', 'Лев', 'Прав', 'Сред',
    'ВРег', 'НРег', 'СокрЛ', 'СокрП', 'СокрЛП',
    'ТекущаяДата', 'ТекущаяДатаВремя', 'Год', 'Месяц', 'День',
    'Окр', 'Цел', 'Мин', 'Макс', 'СлучайноеЧисло',
    'Найти', 'НайтиПоПредставлению', 'ПолучитьИзВременногоХранилища',
    'Сообщить', 'Предупреждение', 'Вопрос', 'ОжидатьПрерываниеПользователя'
  ];

  // Подсветка строк (зеленый, как в 1С) - ПЕРВЫМ, чтобы не подсвечивать ключевые слова внутри строк
  // Обрабатываем строки с учетом экранированных кавычек и переносов строк
  html = html.replace(/"((?:[^"\\]|\\.|&quot;|<br>)*)"/g, '<span style="color: #008000;">"$1"</span>');

  // Подсветка комментариев (серый, курсив, как в 1С) - ВТОРЫМ, чтобы не конфликтовать со строками
  html = html.replace(/(\/\/.*?)(<br>|$)/g, '<span style="color: #808080; font-style: italic;">$1</span>$2');

  // Подсветка ключевых слов (синий, жирный, как в 1С)
  // Подсвечиваем только те ключевые слова, которые не находятся внутри уже подсвеченных элементов
  keywords.forEach(keyword => {
    // Ищем ключевые слова, которые не находятся внутри span тегов
    const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
    html = html.replace(regex, (match, p1, offset, string) => {
      // Проверяем, не находимся ли мы внутри уже подсвеченного элемента
      const before = string.substring(Math.max(0, offset - 50), offset);
      const after = string.substring(offset, Math.min(string.length, offset + match.length + 50));
      
      // Если перед нами открывающий span или после нас закрывающий - пропускаем
      if (before.includes('<span') && !before.includes('</span>')) {
        return match; // Уже внутри span
      }
      
      return `<span style="color: #0000ff; font-weight: bold;">${p1}</span>`;
    });
  });

  // Подсветка директив компиляции (&НаСервере, &НаКлиенте и т.д.) - синий, жирный
  html = html.replace(/&amp;([А-Яа-яЁёA-Za-z]+)/g, '<span style="color: #0000ff; font-weight: bold;">&$1</span>');

  // Подсветка чисел (оранжевый, как в 1С)
  html = html.replace(/\b(\d+\.?\d*)\b/g, (match, p1, offset, string) => {
    const before = string.substring(Math.max(0, offset - 50), offset);
    if (before.includes('<span') && !before.includes('</span>')) {
      return match;
    }
    return `<span style="color: #ff6600;">${p1}</span>`;
  });

  // Подсветка типов (темно-синий/бирюзовый, как в 1С)
  types.forEach(type => {
    const regex = new RegExp(`\\b(${type})\\b`, 'gi');
    html = html.replace(regex, (match, p1, offset, string) => {
      const before = string.substring(Math.max(0, offset - 50), offset);
      if (before.includes('<span') && !before.includes('</span>')) {
        return match;
      }
      return `<span style="color: #008080;">${p1}</span>`;
    });
  });

  // Подсветка встроенных функций (фиолетовый, как в 1С)
  functions.forEach(func => {
    const regex = new RegExp(`\\b(${func})\\s*\\(`, 'gi');
    html = html.replace(regex, (match, p1, offset, string) => {
      const before = string.substring(Math.max(0, offset - 50), offset);
      if (before.includes('<span') && !before.includes('</span>')) {
        return match;
      }
      return `<span style="color: #800080;">${p1}</span>(`;
    });
  });

  return html;
}

// Экспортируем как основную функцию highlightBSL для совместимости
export function highlightBSL(code: string): string {
  return highlightBSLToHTML(code);
}

