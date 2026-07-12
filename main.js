// --- 1. СОСТОЯНИЕ ПРИЛОЖЕНИЯ (STATE) ---
let appData = null; // Здесь хранится весь объект из data.json

// --- 2. ДОМ-ЭЛЕМЕНТЫ ---
const commentsWrapper = document.querySelector('.comments-wrapper');
// --- 8. УПРАВЛЕНИЕ МОДАЛЬНЫМ ОКНОМ УДАЛЕНИЯ ---
const modalOverlay = document.querySelector('.modal-overlay');
const cancelModalBtn = document.querySelector('.modal-box__btn--cancel');
const confirmModalBtn = document.querySelector('.modal-box__btn--confirm');

// Временные переменные для хранения ID карточки, которую хотим удалить
let idToDelete = null;

// --- 3. АСИНХРОННАЯ ЗАГРУЗКА ДАННЫХ ---
async function initApp() {
  try {
    // 1. Пытаемся достать данные из LocalStorage
    const localData = localStorage.getItem('interactive_comments_data');

    if (localData) {
      // Если данные там есть, превращаем строку обратно в JS-объект и записываем в appData
      appData = JSON.parse(localData);
      console.log("Данные успешно загружены из LocalStorage:", appData);
    } else {
      // 2. Если в LocalStorage пусто, загружаем оригинальный файл data.json
      const response = await fetch("./data.json");
      if (!response.ok) {
        throw new Error(`Ошибка загрузки: ${response.status}`);
      }
      appData = await response.json();
      console.log("Данные успешно загружены из data.json:", appData);

      // Сразу сохраняем их в память, чтобы в следующий раз брать оттуда
      saveToLocalStorage();
    }
    
    // Отрисовываем интерфейс
    saveToLocalStorage();
    renderComments();

  } catch (error) {
    console.error("Не удалось запустить приложение:", error);
  }
}


// --- 4. ШАБЛОН ДЛЯ ОДНОЙ КАРТОЧКИ КОММЕНТАРИЯ ---
function createCommentHTML(comment) {
  // Проверяем, является ли комментарий ответом
  const replyTag = comment.replyingTo 
    ? `<span class="comment__reply-to">@${comment.replyingTo} </span>` 
    : '';

  // Проверяем, принадлежит ли комментарий текущему пользователю 
  const isCurrentUser = comment.user.username === appData.currentUser.username;

  // Формируем блок кнопок в зависимости от автора комментария
  let actionsHTML = '';
  
  if (isCurrentUser) {
    // Если это комментарий текущего пользователя — выводим кнопки "Delete" и "Edit"
    actionsHTML = `
      <button type="button" class="comment__btn comment__btn--delete btn-reset">
        <img src="./images/icon-delete.svg" alt=""> Delete
      </button>
      <button type="button" class="comment__btn comment__btn--edit btn-reset">
        <img src="./images/icon-edit.svg" alt=""> Edit
      </button>
    `;
  } else {
    // Если нет— оставляем стандартную кнопку "Reply"
    actionsHTML = `
      <button type="button" class="comment__btn comment__btn--reply btn-reset">
        <img src="./images/icon-reply.svg" alt=""> Reply
      </button>
    `;
  }

  return `
    <article class="comment ${isCurrentUser ? 'comment--current-user' : ''}" data-id="${comment.id}">
      <!-- 1. Рейтинг (лайки) -->
      <div class="comment__rating rating">
        <button type="button" class="rating__btn rating__btn--plus btn-reset" aria-label="Upvote">
          <img src="./images/icon-plus.svg" alt="">
        </button>
        <span class="rating__value">${comment.score}</span>
        <button type="button" class="rating__btn rating__btn--minus btn-reset" aria-label="Downvote">
          <img src="./images/icon-minus.svg" alt="">
        </button>
      </div>

      <!-- 2. Контент -->
      <div class="comment__content">
        <div class="comment__header">
          <img class="comment__avatar" src="${comment.user.image.webp}" alt="${comment.user.username}">
          <span class="comment__username">${comment.user.username}</span>
          ${isCurrentUser ? '<span class="comment__badge">you</span>' : ''}
          <span class="comment__date">${comment.createdAt}</span>
        </div>
        <p class="comment__text">
          ${replyTag}${comment.content}
        </p>
      </div>

      <!-- 3. Действия -->
      <div class="comment__actions">
        ${actionsHTML}
      </div>
    </article>
  `;
}
// --- 5. ФУНКЦИЯ ОТРИСОВКИ ВСЕХ КОММЕНТАРИЕВ ---
function renderComments() {
  // 1. Очищаем контейнер перед новой отрисовкой (здесь стирается старый h1)
  commentsWrapper.innerHTML = '';

  // 2. ДОБАВЛЕНО: Сразу после очистки создаем и возвращаем h1 на место
  const mainTitle = document.createElement('h1');
  mainTitle.className = 'visually-hidden';
  mainTitle.textContent = 'Interactive comments section';
  commentsWrapper.appendChild(mainTitle); // Добавляем заголовок в самое начало

  // Сортируем главные комментарии по количеству лайков (score) от большего к меньшему
  const sortedComments = [...appData.comments].sort((a, b) => b.score - a.score);

  // Создаем виртуальный фрагмент для оптимизации 
  const documentFragment = document.createDocumentFragment();

  sortedComments.forEach(comment => {
    // Создаем контейнер для целой ветки (комментарий + его ответы)
    const branchContainer = document.createElement('div');
    branchContainer.className = 'comment-branch';

    // Генерируем HTML для главного комментария и вставляем внутрь ветки
    let branchHTML = createCommentHTML(comment);

    // Проверяем, есть ли у этого комментария ответы (replies)
    if (comment.replies && comment.replies.length > 0) {
      // Сортируем ответы по времени/id 
      const sortedReplies = [...comment.replies].sort((a, b) => a.id - b.id);

      branchHTML += `<div class="comment-branch__replies">`;
      
      // Генерируем HTML для каждого ответа и прибавляем к строке
      sortedReplies.forEach(reply => {
        branchHTML += createCommentHTML(reply);
      });

      branchHTML += `</div>`;
    }

    // Записываем весь накопленный HTML в контейнер ветки
    branchContainer.innerHTML = branchHTML;
    
    // Добавляем ветку во фрагмент
    documentFragment.appendChild(branchContainer);
  });

  // Вставляем всё в DOM за один раз (теперь карточки встанут аккуратно после h1)
  commentsWrapper.appendChild(documentFragment);
  renderMainForm(); 
}


// --- 6. ШАБЛОН И ЛОГИКА ГЛАВНОЙ ФОРМЫ ОТПРАВКИ ---
function renderMainForm() {
  if (document.querySelector('.comment-form--main')) return;

  const formHTML = `
    <form class="comment-form comment-form--main">
      <img class="comment-form__avatar" src="${appData.currentUser.image.webp}" alt="${appData.currentUser.username}">
      <textarea class="comment-form__textarea" placeholder="Add a comment..." rows="3" required></textarea>
      <button type="submit" class="comment-form__btn btn-reset">SEND</button>
    </form>
  `;

    commentsWrapper.insertAdjacentHTML('beforeend', formHTML);

  // Находим созданную форму и её элементы
  const form = document.querySelector('.comment-form--main');
  const textarea = form.querySelector('.comment-form__textarea');

  // Вешаем слушатель события отправки (submit)
  form.addEventListener('submit', (e) => {
    e.preventDefault(); // Отменяем перезагрузку страницы

    const commentText = textarea.value.trim();
    if (!commentText) return; // Если текст пустой или из одних пробелов — ничего не делаем

    // Создаем объект нового комментария
    const newComment = {
      id: Date.now(), // Генерируем уникальный ID на основе текущего времени
      content: commentText,
      createdAt: "Just now", // для новых комментариев пишем статичную строку
      score: 0, // У нового комментария всегда 0 лайков
      user: appData.currentUser, // Автор —  текущий пользователь
      replies: [] // На этот комментарий пока никто не ответил, массив пустой
    };

    // Добавляем новый комментарий в общий массив данных приложения
    appData.comments.push(newComment);
saveToLocalStorage();
    // Перерисовываем список комментариев на странице, чтобы увидеть изменения
    renderComments();

    // Очищаем поле ввода для следующего комментария
    textarea.value = '';
  });
}


// --- 7. ДЕЛЕГИРОВАНИЕ СОБЫТИЙ: REPLY (ОТКРЫТИЕ И ОТПРАВКА) ---
commentsWrapper.addEventListener('click', (e) => {
  const replyBtn = e.target.closest('.comment__btn--reply');
  if (!replyBtn) return;

  const parentComment = replyBtn.closest('.comment');
  const parentId = Number(parentComment.dataset.id); // Превращаем ID в число
  const parentBranch = parentComment.parentElement;

  // Тоггл (переключатель) формы: если уже открыта — удаляем
  if (parentBranch.querySelector('.comment-form--reply')) {
    parentBranch.querySelector('.comment-form--reply').remove();
    return;
  }

  const usernameToReply = parentComment.querySelector('.comment__username').textContent.trim();

  const replyFormHTML = `
    <form class="comment-form comment-form--reply" data-parent-id="${parentId}">
      <img class="comment-form__avatar" src="${appData.currentUser.image.webp}" alt="${appData.currentUser.username}">
      <textarea class="comment-form__textarea" rows="3" required>@${usernameToReply} </textarea>
      <button type="submit" class="comment-form__btn btn-reset">REPLY</button>
    </form>
  `;

  parentComment.insertAdjacentHTML('afterend', replyFormHTML);

  const replyForm = parentBranch.querySelector('.comment-form--reply');
  const textarea = replyForm.querySelector('.comment-form__textarea');

  textarea.focus();
  textarea.setSelectionRange(textarea.value.length, textarea.value.length);

  // ---Обработка отправки формы ответа ---
  replyForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const fullText = textarea.value.trim();
    const tag = `@${usernameToReply}`;

    // Проверяем, оставил ли пользователь тег. Если да, отрезаем его от чистого контента
    let cleanContent = fullText;
    if (fullText.startsWith(tag)) {
      cleanContent = fullText.slice(tag.length).trim();
    }

    if (!cleanContent) return; // Если текста кроме тега нет — ничего не делаем

    // Создаем объект нового ответа
    const newReply = {
      id: Date.now(),
      content: cleanContent,
      createdAt: "Just now",
      score: 0,
      replyingTo: usernameToReply, // Кому отвечаем
      user: appData.currentUser // Автор 
    };

    // Ищем в appData главный комментарий (или ветку), к которому относится этот ответ
    // По ТЗ Frontend Mentor все ответы (даже если ответили на ответ) хранятся в массиве replies главного комментария
    const targetComment = appData.comments.find(c => {
      // Ищем либо сам главный комментарий с таким id
      if (c.id === parentId) return true;
      // Либо проверяем, вдруг кликнули "Reply" внутри его ответов
      if (c.replies && c.replies.some(r => r.id === parentId)) return true;
      return false;
    });

    if (targetComment) {
      // Пушим ответ в массив replies найденного главного комментария
      targetComment.replies.push(newReply);
      saveToLocalStorage();
      // Перерисовываем интерфейс
      renderComments();
    }
  });
});

// --- 8. ДЕЛЕГИРОВАНИЕ СОБЫТИЙ: УДАЛЕНИЕ КОММЕНТАРИЯ (DELETE) ---
// Слушаем клик по кнопке Delete в списке комментариев
commentsWrapper.addEventListener('click', (e) => {
  const deleteBtn = e.target.closest('.comment__btn--delete');
  if (!deleteBtn) return;

  const commentElement = deleteBtn.closest('.comment');
  
  // Запоминаем ID элемента, который собираемся удалить
  idToDelete = Number(commentElement.dataset.id);

  // Показываем  модалку (просто убираем скрывающий класс)
  modalOverlay.classList.remove('modal-overlay--hidden');
});

// Клик по кнопке "NO, CANCEL" (закрываем окно)
cancelModalBtn.addEventListener('click', () => {
  modalOverlay.classList.add('modal-overlay--hidden');
  idToDelete = null; // Очищаем id
});

// Клик по серому фону вокруг модалки тоже закроет её
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) {
    modalOverlay.classList.add('modal-overlay--hidden');
    idToDelete = null;
  }
});

// Клик по кнопке "YES, DELETE" (выполняем удаление)
confirmModalBtn.addEventListener('click', () => {
  if (!idToDelete) return;

  // 1. Ищем в главных комментариях
  const mainCommentIndex = appData.comments.findIndex(c => c.id === idToDelete);

  if (mainCommentIndex !== -1) {
    appData.comments.splice(mainCommentIndex, 1);
  } else {
    // 2. Ищем внутри ответов
    appData.comments.forEach(mainComment => {
      if (mainComment.replies && mainComment.replies.length > 0) {
        const replyIndex = mainComment.replies.findIndex(r => r.id === idToDelete);
        if (replyIndex !== -1) {
          mainComment.replies.splice(replyIndex, 1);
        }
      }
    });
  }

  // Закрываем модалку
  modalOverlay.classList.add('modal-overlay--hidden');
  idToDelete = null;
saveToLocalStorage();
  // Перерисовываем интерфейс
  renderComments();
});
// --- 9. ДЕЛЕГИРОВАНИЕ СОБЫТИЙ: ИЗМЕНЕНИЕ РЕЙТИНГА (SCORE) ---
commentsWrapper.addEventListener('click', (e) => {
  // Находим, был ли клик по кнопке плюс или минус
  const plusBtn = e.target.closest('.rating__btn--plus');
  const minusBtn = e.target.closest('.rating__btn--minus');
  
  if (!plusBtn && !minusBtn) return; // Если кликнули мимо кнопок рейтинга — выходим

  // Определяем, какая именно кнопка нажата, и находим карточку
  const currentBtn = plusBtn || minusBtn;
  const commentElement = currentBtn.closest('.comment');
  const commentId = Number(commentElement.dataset.id);

  // Функция для поиска объекта комментария в нашей базе данных appData
  let targetComment = null;

  // Сначала ищем среди главных комментариев
  targetComment = appData.comments.find(c => c.id === commentId);

  // Если не нашли в главных, ищем внутри ответов (replies)
  if (!targetComment) {
    for (const mainComment of appData.comments) {
      if (mainComment.replies) {
        targetComment = mainComment.replies.find(r => r.id === commentId);
        if (targetComment) break; // Если нашли — прерываем цикл
      }
    }
  }

  // Если комментарий успешно найден в данных, меняем его score
  if (targetComment) {
    if (plusBtn) {
      targetComment.score += 1;
    } else if (minusBtn) {
      // Рейтинг не должен падать ниже 0
      if (targetComment.score > 0) {
        targetComment.score -= 1;
      }
    }
saveToLocalStorage();
    // Перерисовываем интерфейс, чтобы обновить цифру на экране
    renderComments();
  }
});

// --- 10. ДЕЛЕГИРОВАНИЕ СОБЫТИЙ: РЕДАКТИРОВАНИЕ (EDIT & UPDATE) ---
commentsWrapper.addEventListener('click', (e) => {
  // 1. ПОЙМАЛИ КЛИК ПО КНОПКЕ EDIT
  const editBtn = e.target.closest('.comment__btn--edit');
  if (editBtn) {
    const commentElement = editBtn.closest('.comment');
    
    // Если пользователь уже редактирует этот комментарий, игнорируем повторный клик
    if (commentElement.classList.contains('comment--editing')) return;

    commentElement.classList.add('comment--editing');

    // Находим блок с текстом комментария
    const textElement = commentElement.querySelector('.comment__text');
    
    // Получаем чистый текст без тега @username (если это был ответ)
    // Для этого  временно уберем спан с тегом из выборки, если он есть
    const replyTagElement = textElement.querySelector('.comment__reply-to');
    const originalText = replyTagElement 
      ? textElement.textContent.replace(replyTagElement.textContent, '').trim()
      : textElement.textContent.trim();

    // Заменяем текстовый блок на форму редактирования inside карточки
    textElement.innerHTML = `
      <div class="comment__edit-block">
        <textarea class="comment-form__textarea comment__edit-textarea" rows="3">${originalText}</textarea>
        <button type="button" class="comment-form__btn comment__btn--update btn-reset">UPDATE</button>
      </div>
    `;

    // Ставим фокус на поле ввода и уводим курсор в конец текста
    const textarea = textElement.querySelector('.comment__edit-textarea');
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    return;
  }

  // 2. ПОЙМАЛИ КЛИК ПО КНОПКЕ UPDATE
  const updateBtn = e.target.closest('.comment__btn--update');
  if (updateBtn) {
    const commentElement = updateBtn.closest('.comment');
    const commentId = Number(commentElement.dataset.id);
    const textarea = commentElement.querySelector('.comment__edit-textarea');
    
    const newContent = textarea.value.trim();
    if (!newContent) return; // Не даем сохранить пустой комментарий

    // Ищем объект комментария в данных appData для обновления текста
    let targetComment = appData.comments.find(c => c.id === commentId);

    if (!targetComment) {
      for (const mainComment of appData.comments) {
        if (mainComment.replies) {
          targetComment = mainComment.replies.find(r => r.id === commentId);
          if (targetComment) break;
        }
      }
    }

    if (targetComment) {
      // Обновляем текст в состоянии приложения
      targetComment.content = newContent;
      saveToLocalStorage();
      // Перерисовываем интерфейс, чтобы карточка вернулась в обычный вид с новым текстом
      renderComments();
    }
  }
});

// --- 11. СОХРАНЕНИЕ ДАННЫХ В LOCALSTORAGE ---
function saveToLocalStorage() {
  localStorage.setItem('interactive_comments_data', JSON.stringify(appData));
}


// Запускаем приложение при старте страницы
initApp();
