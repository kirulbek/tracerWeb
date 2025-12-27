import { getDatabase } from '../config/database.js';
import { getUserByUsername } from '../controllers/userController.js';

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
  'ОбработкаЗаполнения',
  'ОбработкаОтменыПроведения',
  'ОбработкаПередЗаписью',
  'ОбработкаПередУдалением',
  'ОбработкаПроведения',
  'ОбработкаПроверкиЗаполнения',
  'ОбработкаПроверкиПроведения',
  'ОбработкаПроверкиУдаления'
];

function getDb() {
  const db = getDatabase();
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export async function initTemplatesForAdmin() {
  try {
    const admin = getUserByUsername('admin');
    if (!admin) {
      console.log('Администратор не найден, шаблоны не будут созданы');
      return;
    }

    const db = getDb();
    
    // Проверяем, были ли уже инициализированы шаблоны для админа
    const existingTemplates = db.prepare('SELECT category FROM action_templates WHERE user_id = ?').all(admin.id) as any[];
    const categories = new Set(existingTemplates.map(t => t.category).filter(Boolean));
    
    const hasFormElement = categories.has('Форма Элемента');
    const hasFormList = categories.has('Форма Списка');
    const hasModuleObject = categories.has('МодульОбъекта');
    
    if (hasFormElement && hasFormList && hasModuleObject) {
      console.log('Все шаблоны для администратора уже инициализированы');
      return;
    }

    // Создаем шаблоны для "Форма Элемента" (только название, без текста)
    if (!hasFormElement) {
      for (const procName of FORM_ELEMENT_PROCEDURES) {
        const id = `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const name = `Процедура ${procName}()`;
        db.prepare(`
          INSERT INTO action_templates (id, name, text, category, usage_count, user_id, created_at)
          VALUES (?, ?, ?, ?, 0, ?, datetime('now'))
        `).run(id, name, '', 'Форма Элемента', admin.id);
      }
      console.log(`Инициализировано ${FORM_ELEMENT_PROCEDURES.length} шаблонов для "Форма Элемента"`);
    }

    // Создаем шаблоны для "Форма Списка" (только название, без текста)
    if (!hasFormList) {
      for (const procName of FORM_LIST_PROCEDURES) {
        const id = `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const name = `Процедура ${procName}()`;
        db.prepare(`
          INSERT INTO action_templates (id, name, text, category, usage_count, user_id, created_at)
          VALUES (?, ?, ?, ?, 0, ?, datetime('now'))
        `).run(id, name, '', 'Форма Списка', admin.id);
      }
      console.log(`Инициализировано ${FORM_LIST_PROCEDURES.length} шаблонов для "Форма Списка"`);
    }

    // Создаем шаблоны для "МодульОбъекта" (только название, без текста)
    if (!hasModuleObject) {
      for (const procName of MODULE_OBJECT_PROCEDURES) {
        const id = `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const name = `Процедура ${procName}()`;
        db.prepare(`
          INSERT INTO action_templates (id, name, text, category, usage_count, user_id, created_at)
          VALUES (?, ?, ?, ?, 0, ?, datetime('now'))
        `).run(id, name, '', 'МодульОбъекта', admin.id);
      }
      console.log(`Инициализировано ${MODULE_OBJECT_PROCEDURES.length} шаблонов для "МодульОбъекта"`);
    }

    console.log('Инициализация шаблонов для администратора завершена');
  } catch (error) {
    console.error('Ошибка инициализации шаблонов для администратора:', error);
  }
}


