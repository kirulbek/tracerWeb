// Точная подсветка синтаксиса BSL в стиле 1С:Предприятие
// Основано на анализе реального редактора 1С

export function highlightBSL(code: string, blockStartMarker?: string, blockEndMarker?: string): string {
  if (!code || code.trim() === '') return code;
  
  // Очистка от HTML-тегов и сущностей (всегда очищаем, чтобы переобработать)
  let cleanCode = code
    .replace(/<br\s*\/?>/gi, '\n') // Заменяем <br> на \n перед удалением тегов
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\r/g, ''); // Удаляем \r (Windows-стиль переносов)

  // Разбиваем на строки для обработки
  const lines = cleanCode.split('\n');
  
  // Определяем блоки между маркерами
  const customBlockRanges: Array<{ start: number; end: number }> = [];
  
  // Определяем используемые маркеры
  // Если blockStartMarker === undefined или null - используем "АрсанСофт" (по умолчанию)
  // Если blockStartMarker === "" (пустая строка) - не ищем блоки (пользователь очистил)
  // Если blockStartMarker задан - используем его
  const startMarkerValue = blockStartMarker === undefined || blockStartMarker === null
    ? 'АрсанСофт' // По умолчанию для новых задач
    : blockStartMarker.trim() === ''
    ? null // Пользователь очистил поле - не ищем блоки
    : blockStartMarker.trim(); // Используем заданное значение
  
  const endMarkerValue = blockEndMarker === undefined || blockEndMarker === null
    ? startMarkerValue // По умолчанию используем маркер начала
    : blockEndMarker.trim() === ''
    ? null // Пользователь очистил поле
    : blockEndMarker.trim(); // Используем заданное значение
  
  // Если startMarkerValue === null, значит пользователь очистил поле - не ищем блоки
  if (startMarkerValue !== null) {
    const startMarker = startMarkerValue;
    const endMarker = endMarkerValue || startMarker; // Если endMarker очищен, используем startMarker
    
    // Экранируем специальные символы для регулярного выражения
    const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const startPattern = new RegExp(`^//${escapeRegex(startMarker)}$`, 'i');
    const endPattern = new RegExp(`^//${escapeRegex(endMarker)}$`, 'i');
    
    let blockStart: number | null = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // Ищем начало блока: //{startMarker}
      if (startPattern.test(line)) {
        blockStart = i;
      }
      // Ищем конец блока: //{endMarker}
      else if (endPattern.test(line) && blockStart !== null) {
        customBlockRanges.push({ start: blockStart, end: i });
        blockStart = null;
      }
    }
  }
  
  const processedLines: string[] = [];

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    let line = lines[lineIndex];
    
    // Экранируем HTML символы
    line = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Разбиваем строку на части: комментарии, строки и остальное
    const parts: Array<{ type: 'text' | 'comment' | 'string'; content: string; start: number; end: number }> = [];
    let currentPos = 0;

    // Находим комментарии
    const commentIndex = line.indexOf('//');
    if (commentIndex !== -1) {
      if (commentIndex > currentPos) {
        parts.push({ type: 'text', content: line.substring(currentPos, commentIndex), start: currentPos, end: commentIndex });
      }
      parts.push({ type: 'comment', content: line.substring(commentIndex), start: commentIndex, end: line.length });
      currentPos = line.length;
    }

    // Если нет комментария, обрабатываем всю строку
    if (currentPos === 0) {
      parts.push({ type: 'text', content: line, start: 0, end: line.length });
    }

    // Обрабатываем каждую часть
    let resultLine = '';
    for (const part of parts) {
      if (part.type === 'comment') {
        // Комментарии - зеленые
        resultLine += '<span style="color: #008000;">' + part.content + '</span>';
      } else if (part.type === 'string') {
        // Строки в кавычках - черные
        resultLine += '<span style="color: #000000;">' + part.content + '</span>';
      } else {
        // Обрабатываем текстовую часть: сначала строки, потом остальное
        let textPart = part.content;
        
        // Находим и обрабатываем строки
        const stringRegex = /"([^"\\]|\\.)*"/g;
        const stringMatches: Array<{ match: string; index: number }> = [];
        let match: RegExpExecArray | null;
        stringRegex.lastIndex = 0;
        
        while ((match = stringRegex.exec(textPart)) !== null) {
          stringMatches.push({ match: match[0], index: match.index });
        }
        
        // Разбиваем на части: до строки, строка, после строки
        if (stringMatches.length > 0) {
          let processedText = '';
          let lastIndex = 0;
          
          for (const strMatch of stringMatches) {
            // Текст до строки
            if (strMatch.index > lastIndex) {
              processedText += highlightPart(textPart.substring(lastIndex, strMatch.index));
            }
            // Строка в кавычках - черная
            processedText += '<span style="color: #000000;">' + strMatch.match + '</span>';
            lastIndex = strMatch.index + strMatch.match.length;
          }
          
          // Текст после последней строки
          if (lastIndex < textPart.length) {
            processedText += highlightPart(textPart.substring(lastIndex));
          }
          
          resultLine += processedText;
        } else {
          // Нет строк, просто обрабатываем
          resultLine += highlightPart(textPart);
        }
      }
    }
    
    // Проверяем начало и конец блока АрсанСофт
    const isBlockStart = customBlockRanges.some(range => lineIndex === range.start);
    const isBlockEnd = customBlockRanges.some(range => lineIndex === range.end);
    
    // Если это начало блока АрсанСофт, добавляем открывающий div
    if (isBlockStart) {
      resultLine = '<div style="background-color: #f3ffe6; border-left: 4px solid #ffc107; padding: 2px 8px; margin: 0; display: block;">' + resultLine;
    }
    
    // Если это конец блока АрсанСофт, добавляем закрывающий div
    if (isBlockEnd) {
      resultLine = resultLine + '</div>';
    }
    
    processedLines.push(resultLine);
  }

  return processedLines.join('<br>');
}

// Функция для подсветки части кода (без комментариев и строк)
function highlightPart(text: string): string {
  if (!text || text.trim() === '') return text;
  
  let result = text;

  // 1. СНАЧАЛА ПРИМЕНЯЕМ КРАСНЫЕ КЛЮЧЕВЫЕ СЛОВА
  // ДИРЕКТИВЫ ПРЕПРОЦЕССОРА - КРАСНЫЙ, ЖИРНЫЙ (#Если, #Область и т.д.)
  result = result.replace(/#(Если|ИначеЕсли|Иначе|КонецЕсли|Область|КонецОбласти|Клиент|Сервер|ТолстыйКлиентОбычноеПриложение|ТолстыйКлиентУправляемоеПриложение|ВнешнееСоединение|МобильноеПриложениеКлиент|МобильноеПриложениеСервер|Или|И|Не)\b/gi, 
    '<span style="color: #ff0000; font-weight: bold;">#$1</span>');

  // КЛЮЧЕВЫЕ СЛОВА ОПРЕДЕЛЕНИЯ - КРАСНЫЙ, ЖИРНЫЙ (Процедура, Функция)
  result = result.replace(/(^|[^А-Яа-яЁёA-Za-z0-9_])(Процедура|Функция)(?=[^А-Яа-яЁёA-Za-z0-9_]|$)/gi, 
    '$1<span style="color: #ff0000; font-weight: bold;">$2</span>');

  // КЛЮЧЕВЫЕ СЛОВА ЗАВЕРШЕНИЯ - КРАСНЫЙ, ЖИРНЫЙ
  result = result.replace(/(^|[^А-Яа-яЁёA-Za-z0-9_])(КонецПроцедуры|КонецФункции)(?=[^А-Яа-яЁёA-Za-z0-9_]|$)/gi, 
    '$1<span style="color: #ff0000; font-weight: bold;">$2</span>');

  // ДОПОЛНИТЕЛЬНЫЕ КРАСНЫЕ КЛЮЧЕВЫЕ СЛОВА
  const redKeywords = [
    'Если', 'Тогда', 'Иначе', 'КонецЕсли',
    'НЕ', 'Не',
    'Истина',
    'Экспорт',
    'Знач',
    'ИЛИ', 'Или',
    'Новый',
    'Ложь',
    'Неопределено',
    'Прервать',
    'Попытка',
    'Исключение',
    'Продолжить',
    'КонецПопытки',
    'Возврат'
  ];
  
  redKeywords.forEach(keyword => {
    const regex = new RegExp(`(^|[^А-Яа-яЁёA-Za-z0-9_])(${keyword})(?=[^А-Яа-яЁёA-Za-z0-9_]|$)`, 'gi');
    result = result.replace(regex, '$1<span style="color: #ff0000; font-weight: bold;">$2</span>');
  });

  // 2. ПРИМЕНЯЕМ СИНИЕ КЛЮЧЕВЫЕ СЛОВА (ЖИРНЫЕ)
  const otherKeywords = [
    'ИначеЕсли',
    'Пока', 'Цикл', 'КонецЦикла',
    'Для', 'Каждого', 'Из', 'По',
    'Перем', 'Перейти', 'ВызватьИсключение',
    'Null',
    'И',
    'СоздатьОбъект', 'ПолучитьОбъект',
    'Выполнить', 'ВыполнитьСинхронно',
    'ЗначениеЗаполнено', 'ТипЗнч', 'Вид', 'Тип',
    'ГДЕ', 'РазрешитьЧтение', 'РазрешитьИзменениеЕслиРазрешеноЧтение'
  ];
  
  otherKeywords.forEach(keyword => {
    const regex = new RegExp(`(^|[^А-Яа-яЁёA-Za-z0-9_])(${keyword})(?=[^А-Яа-яЁёA-Za-z0-9_]|$)`, 'gi');
    result = result.replace(regex, '$1<span style="color: #0000ff; font-weight: bold;">$2</span>');
  });

  // ДИРЕКТИВЫ КОМПИЛЯЦИИ - СИНИЙ, ЖИРНЫЙ (&НаСервере, &НаКлиенте)
  result = result.replace(/&amp;([А-Яа-яЁёA-Za-z]+)/g, 
    '<span style="color: #0000ff; font-weight: bold;">&$1</span>');

  // ТИПЫ ДАННЫХ - СИНИЙ, ЖИРНЫЙ
  const types = [
    'Строка', 'Число', 'Дата', 'Булево',
    'Массив', 'Соответствие', 'Структура', 'ФиксированнаяСтруктура',
    'ТаблицаЗначений', 'Запрос', 'РезультатЗапроса',
    'ДвоичныеДанные', 'УникальныйИдентификатор'
  ];
  
  types.forEach(type => {
    const regex = new RegExp(`(^|[^А-Яа-яЁёA-Za-z0-9_])(${type})(?=[^А-Яа-яЁёA-Za-z0-9_]|$)`, 'gi');
    result = result.replace(regex, '$1<span style="color: #0000ff; font-weight: bold;">$2</span>');
  });

  // ВСТРОЕННЫЕ ФУНКЦИИ И МЕТОДЫ - СИНИЙ, ЖИРНЫЙ
  const builtInFunctionsList = [
    'СтрДлина', 'СтрНайти', 'СтрЗаменить', 'СтрРазделить',
    'Число', 'Строка', 'Формат', 'Лев', 'Прав', 'Сред',
    'ВРег', 'НРег', 'СокрЛ', 'СокрП', 'СокрЛП',
    'ТекущаяДата', 'ТекущаяДатаВремя', 'Год', 'Месяц', 'День',
    'Окр', 'Цел', 'Мин', 'Макс', 'СлучайноеЧисло',
    'Найти', 'НайтиПоПредставлению', 'ПолучитьИзВременногоХранилища',
    'Сообщить', 'Предупреждение', 'Вопрос', 'ОжидатьПрерываниеПользователя',
    'ЧтениеОбъектаРазрешено', 'ИзменениеОбъектаРазрешено',
    'Добавить', 'УдалитьНепроверяемыеРеквизитыИзМассива',
    'ОбработкаПроверкиЗаполнения', 'ОбработкаЗаполнения',
    'ПриЗаполненииОграниченияДоступа', 'ПередЗаписью', 'ПриЗаписи',
    'ПриКопировании', 'ОбработкаПроведения', 'ОбработкаОтменыПроведения',
    'ПустаяДата'
  ];

  builtInFunctionsList.forEach(func => {
    const regex = new RegExp(`(^|[^А-Яа-яЁёA-Za-z0-9_])(${func})\\s*\\(`, 'gi');
    result = result.replace(regex, '$1<span style="color: #0000ff; font-weight: bold;">$2</span>(');
  });

  // 3. ЧИСЛА - ОРАНЖЕВЫЙ (только если не внутри span)
  result = result.replace(/\b(\d+\.?\d*)\b/g, (match, p1, offset, string) => {
    const before = string.substring(Math.max(0, offset - 100), offset);
    const openSpans = (before.match(/<span[^>]*>/g) || []).length;
    const closeSpans = (before.match(/<\/span>/g) || []).length;
    
    if (openSpans > closeSpans) {
      return match;
    }
    
    return '<span style="color: #ff6600;">' + p1 + '</span>';
  });

  // 4. ВСЕ ОСТАЛЬНОЕ ОБОРАЧИВАЕМ В СИНИЙ
  // Разбиваем на части: уже обработанные span и обычный текст
  // Оборачиваем обычный текст в синий span
  const parts: string[] = [];
  let lastIndex = 0;
  const spanRegex = /<span[^>]*>.*?<\/span>/g;
  let spanMatch: RegExpExecArray | null;
  spanRegex.lastIndex = 0;
  
  while ((spanMatch = spanRegex.exec(result)) !== null) {
    // Текст до span
    if (spanMatch.index > lastIndex) {
      const textBefore = result.substring(lastIndex, spanMatch.index);
      if (textBefore.trim()) {
        parts.push('<span style="color: #0000ff;">' + textBefore + '</span>');
      } else {
        parts.push(textBefore);
      }
    }
    // Сам span
    parts.push(spanMatch[0]);
    lastIndex = spanMatch.index + spanMatch[0].length;
  }
  
  // Текст после последнего span
  if (lastIndex < result.length) {
    const textAfter = result.substring(lastIndex);
    if (textAfter.trim()) {
      parts.push('<span style="color: #0000ff;">' + textAfter + '</span>');
    } else {
      parts.push(textAfter);
    }
  }
  
  // Если не было span, оборачиваем весь текст
  if (parts.length === 0) {
    result = '<span style="color: #0000ff;">' + result + '</span>';
  } else {
    result = parts.join('');
  }

  return result;
}
