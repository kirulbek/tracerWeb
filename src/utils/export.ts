import { getActionsByTaskId, getTasks, getCodeBlocksByActionId, getScreenshotsByActionId } from './storage';
import { ActionCodeBlock } from '../types';
import { highlightBSL } from './prism-bsl';
import { getInitials } from './initials';

function stripHTML(html: string): string {
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

function formatTime(hours: number, minutes: number): string {
  if (hours === 0 && minutes === 0) return '';
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}ч`);
  if (minutes > 0) parts.push(`${minutes}м`);
  return parts.join(' ');
}

function getDescriptionText(description: string): string {
  return stripHTML(description);
}

export const generateHTMLReport = async (taskId: string, userFullName?: string): Promise<string> => {
  const tasks = await getTasks();
  const task = tasks.find(t => t.id === taskId);
  if (!task) {
    throw new Error('Задача не найдена');
  }

  const actions = (await getActionsByTaskId(taskId)).filter(action => !action.excludeFromDescription);

  let html = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Отчет: ${task.name}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background-color: #fff;
    }
    h1 {
      color: #667eea;
      border-bottom: 3px solid #667eea;
      padding-bottom: 10px;
    }
    h2 {
      color: #764ba2;
      margin-top: 30px;
      border-bottom: 2px solid #e0e0e0;
      padding-bottom: 5px;
    }
    .action-item {
      margin: 20px 0;
      padding: 15px;
      background-color: #f9f9f9;
      border-left: 4px solid #667eea;
      border-radius: 5px;
    }
    .action-title {
      font-weight: bold;
      font-size: 1.1em;
      color: #667eea;
      margin-bottom: 10px;
    }
    .code-block {
      margin: 15px 0;
      background-color: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 5px;
      overflow: hidden;
    }
    .code-block-header {
      background-color: #e0e0e0;
      padding: 8px 15px;
      font-weight: bold;
      font-size: 0.9em;
      display: flex;
      justify-content: flex-start;
      align-items: center;
    }
    .code-block-toggle {
      background: none;
      border: none;
      color: #667eea;
      cursor: pointer;
      font-size: 1.2em;
      font-weight: bold;
      text-decoration: underline;
      padding: 5px 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .code-block-toggle:hover {
      color: #5568d3;
    }
    .code-block-toggle .arrow {
      font-size: 1em;
      transition: transform 0.3s;
    }
    .code-block-toggle.expanded .arrow {
      transform: rotate(180deg);
    }
    .code-block-content {
      padding: 15px;
    }
    .code-block-content.collapsed {
      display: none;
    }
    .code-block pre {
      margin: 0;
      padding: 15px;
      background-color: #f8f8f8;
      border-radius: 5px;
      border: 1px solid #e0e0e0;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 0.9em;
      line-height: 1.6;
      white-space: pre-wrap;
      word-wrap: break-word;
      overflow-x: auto;
    }
    .code-block code {
      background: transparent;
      padding: 0;
      font-size: inherit;
      color: #333;
    }
    .arsansoft-block {
      background-color: #f3ffe6;
      padding: 4px 8px;
      margin: 2px 0;
      border-left: 3px solid #ffc107;
      display: block;
      box-sizing: border-box;
    }
    /* Стили для highlight.js в отчетах - цветовая схема 1С */
    .code-block .hljs {
      background: #f8f8f8;
      color: #333;
    }
    .code-block .hljs-comment {
      color: #808080;
      font-style: italic;
    }
    .code-block .hljs-string {
      color: #008000;
    }
    .code-block .hljs-keyword {
      color: #0000ff;
      font-weight: bold;
    }
    .code-block .hljs-built_in {
      color: #0000ff;
      font-weight: bold;
    }
    .code-block .hljs-type {
      color: #0000ff;
      font-weight: bold;
    }
    .code-block .hljs-number {
      color: #ff6600;
    }
    .code-block .hljs-meta {
      color: #ff0000;
      font-weight: bold;
    }
    .code-block .hljs-operator {
      color: #333;
    }
    .screenshot {
      margin: 15px 0;
      max-width: 100%;
      height: auto;
      border: 1px solid #ddd;
      border-radius: 5px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e0e0e0;
      text-align: right;
      color: #666;
    }
  </style>
</head>
<body>
  <h1>${task.name}</h1>
`;

  for (let index = 0; index < actions.length; index++) {
    const action = actions[index];
    const actionTitle = action.name || `Пункт ${index + 1}`;
    html += `
  <div class="action-item">
    <div class="action-title">${actionTitle}</div>
    <div>${action.description}</div>
`;

    // Code blocks - загружаем из базы данных
    const codeBlocks = await getCodeBlocksByActionId(action.id);
    codeBlocks.forEach((codeBlock: ActionCodeBlock) => {
      const blockId = `code-block-${codeBlock.id}`;
      // Очищаем код от HTML перед подсветкой
      let cleanCode = (codeBlock.codeText || '')
        .replace(/<br\s*\/?>/gi, '\n') // Заменяем <br> на \n перед удалением тегов
        .replace(/<[^>]*>/g, '') // Удаляем остальные HTML-теги
        .replace(/&nbsp;/g, ' ') // Заменяем &nbsp; на пробел
        .replace(/&amp;/g, '&') // Восстанавливаем &
        .replace(/&lt;/g, '<') // Восстанавливаем <
        .replace(/&gt;/g, '>') // Восстанавливаем >
        .replace(/&quot;/g, '"') // Восстанавливаем "
        .replace(/&#39;/g, "'") // Восстанавливаем '
        .replace(/\r/g, '') // Удаляем \r (Windows-стиль переносов)
        .trim();
      
      // Применяем подсветку синтаксиса для BSL
      // Для <pre> тега нужно использовать \n вместо <br>
      let highlightedCode = codeBlock.language === 'BSL' 
        ? highlightBSL(cleanCode).replace(/<br>/g, '\n')
        : cleanCode
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
      
      if (codeBlock.collapsible) {
        html += `
    <div class="code-block">
      <div class="code-block-header">
        <button class="code-block-toggle" onclick="toggleCodeBlock('${blockId}')">
          <span class="arrow">▼</span>
          <span>Просмотр кода</span>
        </button>
      </div>
      <div class="code-block-content collapsed" id="${blockId}">
        <pre><code>${highlightedCode}</code></pre>
      </div>
    </div>
`;
      } else {
        html += `
    <div class="code-block">
      <pre><code>${highlightedCode}</code></pre>
    </div>
`;
      }
    });

    // Screenshots - загружаем из базы данных
    const screenshots = await getScreenshotsByActionId(action.id);
    screenshots.forEach((screenshot: any) => {
      html += `
    <img src="${screenshot.dataUrl}" alt="Скриншот" class="screenshot" />
`;
    });

    html += `
  </div>
`;
  }

  const userInitials = userFullName ? getInitials(userFullName) : '';
  html += `
  <div class="footer">
    <p>${userInitials ? `${userInitials} ` : ''}Дата: ${new Date().toLocaleDateString('ru-RU')}</p>
  </div>
  <script>
    function toggleCodeBlock(id) {
      const content = document.getElementById(id);
      const button = content.previousElementSibling.querySelector('.code-block-toggle');
      const arrow = button.querySelector('.arrow');
      const text = button.querySelector('span:last-child');
      if (content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
        button.classList.add('expanded');
        text.textContent = 'Скрыть код';
      } else {
        content.classList.add('collapsed');
        button.classList.remove('expanded');
        text.textContent = 'Просмотр кода';
      }
    }
  </script>
</body>
</html>
`;

  return html;
};

export const generateCompactReport = async (taskId: string, userFullName?: string): Promise<string> => {
  const tasks = await getTasks();
  const task = tasks.find(t => t.id === taskId);
  if (!task) {
    throw new Error('Задача не найдена');
  }

  const actions = await getActionsByTaskId(taskId);
  
  let totalHours = 0;
  let totalMinutes = 0;

  let html = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Общий отчет: ${task.name}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background-color: #fff;
    }
    h1 {
      color: #667eea;
      border-bottom: 3px solid #667eea;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    thead {
      background-color: #667eea;
      color: white;
    }
    th {
      padding: 12px;
      text-align: left;
      font-weight: bold;
      border: 1px solid #667eea;
    }
    td {
      padding: 10px 12px;
      border: 1px solid #e0e0e0;
      vertical-align: top;
    }
    tbody tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    tbody tr:hover {
      background-color: #f0f0f0;
    }
    .action-name {
      font-weight: bold;
      color: #667eea;
    }
    .action-description {
      color: #666;
    }
    .action-time {
      color: #999;
      white-space: nowrap;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #e0e0e0;
      text-align: right;
      color: #666;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <h1>${task.name}</h1>
  <table>
    <thead>
      <tr>
        <th style="width: 25%;">Название</th>
        <th style="width: 60%;">Короткое описание</th>
        <th style="width: 15%;">Затраченное время</th>
      </tr>
    </thead>
    <tbody>
`;

  actions.forEach((action, index) => {
    const actionTitle = action.name || `Пункт ${index + 1}`;
    const descriptionText = action.shortDescription || getDescriptionText(action.description);
    const timeStr = formatTime(action.timeHours, action.timeMinutes);
    
    totalHours += action.timeHours;
    totalMinutes += action.timeMinutes;

    html += `
      <tr>
        <td class="action-name">${escapeHtml(actionTitle)}</td>
        <td class="action-description">${escapeHtml(descriptionText)}</td>
        <td class="action-time">${escapeHtml(timeStr || '-')}</td>
      </tr>
`;
  });

  // Конвертируем минуты в часы
  totalHours += Math.floor(totalMinutes / 60);
  totalMinutes = totalMinutes % 60;

  const userInitials = userFullName ? getInitials(userFullName) : '';
  html += `
    </tbody>
  </table>
  <div class="footer">
    <p>Итого потрачено: ${formatTime(totalHours, totalMinutes)}</p>
    <p>${userInitials ? `${userInitials} ` : ''}Дата: ${new Date().toLocaleDateString('ru-RU')}</p>
  </div>
</body>
</html>
`;

  return html;
};

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}


