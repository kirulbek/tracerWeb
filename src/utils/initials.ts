/**
 * Извлекает инициалы из ФИО
 * @param fullName Полное ФИО (например, "Киргизбаев Улан Абдылдаевич")
 * @returns Фамилия полностью, имя и отчество - инициалы (например, "Киргизбаев У. А.") или пустая строка, если ФИО не указано
 */
export function getInitials(fullName: string | undefined): string {
  if (!fullName || !fullName.trim()) {
    return '';
  }

  // Разделяем ФИО по пробелам и фильтруем пустые строки
  const parts = fullName.trim().split(/\s+/).filter(part => part.length > 0);
  
  if (parts.length === 0) {
    return '';
  }

  // Первое слово (фамилия) - полностью
  const surname = parts[0];
  
  // Остальные слова (имя, отчество) - только первая буква с точкой
  const nameInitials = parts.slice(1).map(part => {
    const firstChar = part.charAt(0).toUpperCase();
    return firstChar + '.';
  }).join(' ');

  // Объединяем: фамилия + пробел + инициалы имени и отчества
  return nameInitials ? `${surname} ${nameInitials}` : surname;
}

