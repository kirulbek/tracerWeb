// Определение языка BSL для CodeMirror 6
import { StreamLanguage, LanguageSupport, HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t, Tag } from '@lezer/highlight';

// Создаем кастомный тег для Процедура/Функция (красные)
// Создаем независимый тег, не наследуемый от keyword
const procedureFunctionTag = Tag.define();

// Определяем язык BSL используя StreamParser
const bslLanguage = StreamLanguage.define({
  name: 'bsl',
  tokenTable: {
    'comment': t.comment,
    'string': t.string,
    'preprocessor': t.meta,
    'procedure-function': procedureFunctionTag,
    'keyword': t.keyword,
    'type': t.typeName,
    'number': t.number,
    'operator': t.operator,
  },
  token: (stream: any) => {
    // Комментарии
    if (stream.match(/\/\/.*/)) {
      return 'comment';
    }
    
    // Строки (включая многострочные)
    if (stream.match(/"/)) {
      stream.match(/[^"]*"/);
      return 'string';
    }
    
    // Директивы препроцессора (#Если, #Область и т.д.) - красные, жирные
    if (stream.match(/#(?:Если|ИначеЕсли|Иначе|КонецЕсли|Область|КонецОбласти|Клиент|Сервер|ТолстыйКлиентОбычноеПриложение|ТолстыйКлиентУправляемоеПриложение|ВнешнееСоединение|МобильноеПриложениеКлиент|МобильноеПриложениеСервер|Или|И|Не)\b/i)) {
      return 'preprocessor';
    }
    
    // Директивы компиляции (&НаСервере, &НаКлиенте) - синие, жирные
    if (stream.match(/&[А-Яа-яЁёA-Za-z]+/)) {
      return 'keyword';
    }
    
    // Ключевые слова определения (Процедура, Функция) - красные, жирные
    if (stream.match(/\b(?:Процедура|Функция)\b/i)) {
      return 'procedure-function';
    }
    
    // Ключевые слова завершения - синие, жирные
    if (stream.match(/\b(?:КонецПроцедуры|КонецФункции)\b/i)) {
      return 'keyword';
    }
    
    // Остальные ключевые слова - синие, жирные
    if (stream.match(/\b(?:Если|Тогда|Иначе|ИначеЕсли|КонецЕсли|Пока|Цикл|КонецЦикла|Для|Каждого|Из|По|Попытка|Исключение|КонецПопытки|Возврат|Продолжить|Прервать|Перем|Перейти|ВызватьИсключение|Истина|Ложь|Неопределено|Null|И|Или|Не|Новый|СоздатьОбъект|ПолучитьОбъект|Выполнить|ВыполнитьСинхронно|Экспорт|Знач|ЗначениеЗаполнено|ТипЗнч|Вид|Тип|ГДЕ|РазрешитьЧтение|РазрешитьИзменениеЕслиРазрешеноЧтение)\b/i)) {
      return 'keyword';
    }
    
    // Типы данных - синие, жирные
    if (stream.match(/\b(?:Строка|Число|Дата|Булево|Массив|Соответствие|Структура|ФиксированнаяСтруктура|ТаблицаЗначений|Запрос|РезультатЗапроса|ДвоичныеДанные|УникальныйИдентификатор)\b/i)) {
      return 'type';
    }
    
    // Числа - оранжевые
    if (stream.match(/\b\d+\.?\d*\b/)) {
      return 'number';
    }
    
    // Операторы
    if (stream.match(/[=<>]+|[+\-*/]|\./)) {
      return 'operator';
    }
    
    // Пропускаем пробелы и другие символы
    stream.next();
    return null;
  }
});

// Определяем стили подсветки для BSL в стиле 1С
// ВАЖНО: Порядок имеет значение - более специфичные теги должны быть раньше
const bslHighlightStyle = HighlightStyle.define([
  // Ключевые слова определения (Процедура, Функция) - красные, жирные (ПЕРВЫМИ!)
  { tag: procedureFunctionTag, color: '#ff0000', fontWeight: 'bold' },
  // Директивы препроцессора (#Если, #Область) - красные, жирные
  { tag: t.meta, color: '#ff0000', fontWeight: 'bold' },
  // Остальные ключевые слова - синие, жирные
  { tag: t.keyword, color: '#0000ff', fontWeight: 'bold' },
  // Типы данных - синие, жирные
  { tag: t.typeName, color: '#0000ff', fontWeight: 'bold' },
  // Комментарии - серые, курсив
  { tag: t.comment, color: '#808080', fontStyle: 'italic' },
  // Строки - зеленые
  { tag: t.string, color: '#008000' },
  // Числа - оранжевые
  { tag: t.number, color: '#ff6600' },
  // Операторы
  { tag: t.operator, color: '#333' },
]);

// Создаем расширение для подсветки
const bslHighlight = syntaxHighlighting(bslHighlightStyle);

// Создаем поддержку языка с подсветкой
// ВАЖНО: bslHighlight должен быть в массиве support, чтобы подсветка работала
export const bslLanguageSupport = new LanguageSupport(bslLanguage, [bslHighlight]);

// Экспортируем также отдельно расширение подсветки на случай, если нужно использовать напрямую
export { bslHighlight, bslHighlightStyle };

