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
  
  // Сохраняем информацию о пустых строках в исходном коде
  const originalEmptyLines = new Set<number>();
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '') {
      originalEmptyLines.add(i);
    }
  }
  
  // Определяем блоки между маркерами
  const customBlockRanges: Array<{ start: number; end: number }> = [];
  
  // Определяем используемые маркеры
  // Если blockStartMarker не задан или пустой - не ищем блоки
  // Если blockStartMarker задан - используем его
  const startMarkerValue = (blockStartMarker === undefined || blockStartMarker === null || blockStartMarker.trim() === '')
    ? null // Маркер не задан или пустой - не ищем блоки
    : blockStartMarker.trim(); // Используем заданное значение
  
  const endMarkerValue = (blockEndMarker === undefined || blockEndMarker === null || blockEndMarker.trim() === '')
    ? null // Маркер не задан или пустой
    : blockEndMarker.trim(); // Используем заданное значение
  
  // Если startMarkerValue === null или endMarkerValue === null, значит маркеры не заданы - не ищем блоки
  // Оба маркера должны быть заданы для работы
  if (startMarkerValue !== null && endMarkerValue !== null) {
    const startMarker = startMarkerValue;
    const endMarker = endMarkerValue;
    
    // Экранируем специальные символы для регулярного выражения
    const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Разрешаем пробелы и другие символы после маркера (например: //КУ-001 или //КУ-001 )
    // Маркер уже очищен от пробелов при сохранении (как СокрЛП в 1С), но в коде могут быть пробелы после //
    const startPattern = new RegExp(`^//${escapeRegex(startMarker)}(\\s|$)`, 'i');
    const endPattern = new RegExp(`^//${escapeRegex(endMarker)}(\\s|$)`, 'i');
    
    let blockStart: number | null = null;
    const isSameMarker = startMarker === endMarker; // Если маркеры одинаковые
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const isStartMarker = startPattern.test(line);
      const isEndMarker = endPattern.test(line);
      
      if (isStartMarker || isEndMarker) {
        if (blockStart === null) {
          // Начало нового блока
          blockStart = i;
        } else {
          // Конец текущего блока (или начало нового, если маркеры одинаковые)
          if (isSameMarker) {
            // Если маркеры одинаковые, закрываем предыдущий блок и начинаем новый
            customBlockRanges.push({ start: blockStart, end: i });
            blockStart = i; // Начинаем новый блок с этой же строки
          } else if (isEndMarker) {
            // Если маркеры разные и это маркер конца
            customBlockRanges.push({ start: blockStart, end: i });
            blockStart = null;
          }
        }
      }
    }
    
  }
  
  const processedLines: string[] = [];
  // Сохраняем соответствие между индексами обработанных строк и исходных
  const lineIndexMap: number[] = [];

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
    
    // Проверяем, является ли строка началом или концом блока
    const isBlockStart = customBlockRanges.some(range => lineIndex === range.start);
    const isBlockEnd = customBlockRanges.some(range => lineIndex === range.end);
    
    
    // Если это начало блока, добавляем открывающий div
    if (isBlockStart) {
      resultLine = '<div style="background-color: #f3ffe6; border-left: 4px solid #ffc107; padding: 2px 8px; margin: 0; display: block;">' + resultLine;
    }
    
    // Строки внутри блока (между началом и концом) - без дополнительных div
    // Они уже внутри открывающего div от начала блока
    
    // Если это конец блока, добавляем закрывающий div
    if (isBlockEnd) {
      resultLine = resultLine + '</div>';
    }
    
    processedLines.push(resultLine);
    lineIndexMap.push(lineIndex); // Сохраняем соответствие индексов
  }

  // Объединяем строки, сохраняя оригинальную структуру (включая пустые строки)
  // Особое внимание: сохраняем пустые строки перед началом блока и после конца блока
  let result = '';
  for (let i = 0; i < processedLines.length; i++) {
    const line = processedLines[i];
    const prevLine = i > 0 ? processedLines[i - 1] : '';
    const isLineEmpty = line.trim() === '';
    const isLineBlockStart = line.trim().startsWith('<div style="background-color: #f3ffe6');
    const isLineBlockEnd = line.trim().endsWith('</div>');
    const isPrevLineEmpty = prevLine.trim() === '';
    const isPrevLineBlockEnd = prevLine.trim().endsWith('</div>');
    
    // Если это не первая строка, добавляем <br>
    if (result !== '') {
      // Если текущая строка - начало блока
      if (isLineBlockStart) {
        // Если предыдущая строка была пустой - сохраняем её (добавляем <br> для пустой строки)
        if (isPrevLineEmpty) {
          result += '<br>';
        } else if (!isPrevLineBlockEnd) {
          // Если предыдущая строка не пустая и не конец блока - добавляем <br>
          result += '<br>';
        }
        // Если предыдущая строка - конец блока, не добавляем <br> (блоки идут подряд)
      } else if (isLineBlockEnd) {
        // Если текущая строка - конец блока
        // Если следующая строка пустая - она будет обработана в следующей итерации
        // Если предыдущая строка не пустая и не начало блока - добавляем <br>
        if (!isPrevLineEmpty && !prevLine.trim().startsWith('<div style="background-color: #f3ffe6')) {
          result += '<br>';
        }
      } else if (isPrevLineBlockEnd) {
        // После закрывающего </div> блока
        // Проверяем, была ли пустая строка в исходном коде после конца блока
        const prevOriginalIndex = lineIndexMap[i - 1]; // Индекс предыдущей строки в исходном коде (конец блока)
        const currentOriginalIndex = lineIndexMap[i]; // Индекс текущей строки в исходном коде
        
        // Если между концом блока и текущей строкой была пустая строка в исходном коде
        const hadEmptyLineAfter = currentOriginalIndex > prevOriginalIndex + 1 && 
          originalEmptyLines.has(prevOriginalIndex + 1);
        
        if (hadEmptyLineAfter) {
          // Была пустая строка в исходном коде - добавляем <br> для неё
          result += '<br>';
        }
        
        // Добавляем <br> для текущей строки только если:
        // 1. Текущая строка не пустая
        // 2. И строки НЕ идут подряд (была пустая строка между ними ИЛИ есть промежуток)
        if (!isLineEmpty) {
          // Если строки идут подряд (currentOriginalIndex === prevOriginalIndex + 1) - НЕ добавляем <br>
          // Если между ними была пустая строка или есть промежуток - добавляем <br>
          if (currentOriginalIndex > prevOriginalIndex + 1) {
            // Есть промежуток (пустые строки) - <br> уже добавлен выше для пустой строки
            // Добавляем <br> для текущей строки
            result += '<br>';
          }
          // Если currentOriginalIndex === prevOriginalIndex + 1, строки идут подряд - НЕ добавляем <br>
        }
      } else {
        // Обычная ситуация - добавляем <br>
        result += '<br>';
      }
    }
    
    result += line;
  }
  
  return result;
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
