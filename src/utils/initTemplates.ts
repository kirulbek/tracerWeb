import { saveTemplate, getTemplates } from './storage';
import { ActionTemplate } from '../types';

const FORM_ELEMENT_PROCEDURES = [
  'ПриСозданииНаСервере',
  'ПриЗагрузкеНаСервере',
  'ПередЗаписьюНаСервере',
  'ПриЗаписиНаСервере',
  'ПриУдаленииНаСервере',
  'ПриИзмененииНаСервере',
  'ПриВыбореНаСервере',
  'ПриОткрытии',
  'ПриЗакрытии',
  'ПередЗаписью',
  'ПриЗаписи',
  'ПриУдалении',
  'ПриИзменении',
  'ПриВыборе',
  'ОбработкаКоманды',
  'ОбработкаВыбора',
  'ОбработкаОжидания',
  'ОбработкаПроверкиЗаполнения',
  'ОбработкаЗаполнения',
  'ОбработкаПроверкиУдаления',
  'ОбработкаПередЗаписью',
  'ОбработкаПередУдалением',
  'ОбработкаПередЗакрытием'
];

const FORM_LIST_PROCEDURES = [
  'ПриСозданииНаСервере',
  'ПриЗагрузкеНаСервере',
  'ПередЗаписьюНаСервере',
  'ПриЗаписиНаСервере',
  'ПриУдаленииНаСервере',
  'ПриИзмененииНаСервере',
  'ПриВыбореНаСервере',
  'ПриОткрытии',
  'ПриЗакрытии',
  'ПередЗаписью',
  'ПриЗаписи',
  'ПриУдалении',
  'ПриИзменении',
  'ПриВыборе',
  'ОбработкаКоманды',
  'ОбработкаВыбора',
  'ОбработкаОжидания',
  'ОбработкаПроверкиЗаполнения',
  'ОбработкаЗаполнения',
  'ОбработкаПроверкиУдаления',
  'ОбработкаПередЗаписью',
  'ОбработкаПередУдалением',
  'ОбработкаПередЗакрытием',
  'ПриАктивацииСтроки',
  'ПриДеактивацииСтроки',
  'ПриИзмененииТекущейСтроки',
  'ПриНачалеРедактирования',
  'ПриЗавершенииРедактирования'
];

const MODULE_OBJECT_PROCEDURES = [
  'ОбработкаПроверкиЗаполнения',
  'ОбработкаЗаполнения',
  'ОбработкаПроверкиУдаления',
  'ОбработкаПередЗаписью',
  'ОбработкаПередУдалением',
  'ОбработкаПроверкиПроведения',
  'ОбработкаПроведения',
  'ОбработкаОтменыПроведения',
  'ОбработкаПроверкиПроведения'
];

function createTemplate(name: string, category: string): ActionTemplate {
  return {
    id: `template-${category}-${name}-${Date.now()}`,
    name: `Процедура ${name}()`,
    text: '', // Только название, без текста
    category,
    usageCount: 0,
    createdAt: new Date()
  };
}

export async function initializeTemplates(): Promise<void> {
  try {
    const existingTemplates = await getTemplates();
    
    // Проверяем, были ли уже инициализированы шаблоны
    const hasFormElement = existingTemplates.some(t => t.category === 'Форма Элемента');
    const hasFormList = existingTemplates.some(t => t.category === 'Форма Списка');
    const hasModuleObject = existingTemplates.some(t => t.category === 'МодульОбъекта');
    
    if (hasFormElement && hasFormList && hasModuleObject) {
      console.log('Все шаблоны уже инициализированы');
      return;
    }

    // Создаем шаблоны для "Форма Элемента"
    if (!hasFormElement) {
      for (const procName of FORM_ELEMENT_PROCEDURES) {
        const template = createTemplate(procName, 'Форма Элемента');
        await saveTemplate(template);
      }
      console.log(`Инициализировано ${FORM_ELEMENT_PROCEDURES.length} шаблонов для "Форма Элемента"`);
    }

    // Создаем шаблоны для "Форма Списка"
    if (!hasFormList) {
      for (const procName of FORM_LIST_PROCEDURES) {
        const template = createTemplate(procName, 'Форма Списка');
        await saveTemplate(template);
      }
      console.log(`Инициализировано ${FORM_LIST_PROCEDURES.length} шаблонов для "Форма Списка"`);
    }

    // Создаем шаблоны для "МодульОбъекта"
    if (!hasModuleObject) {
      for (const procName of MODULE_OBJECT_PROCEDURES) {
        const template = createTemplate(procName, 'МодульОбъекта');
        await saveTemplate(template);
      }
      console.log(`Инициализировано ${MODULE_OBJECT_PROCEDURES.length} шаблонов для "МодульОбъекта"`);
    }

    console.log('Инициализация шаблонов завершена');
  } catch (error) {
    console.error('Ошибка инициализации шаблонов:', error);
  }
}

