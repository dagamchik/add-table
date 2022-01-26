(() => {
  const TABLE_COLUMN_COUNT = 6;
  const firmColorClass = 'firm-color';
  const elemHiddenClass = 'element-hidden';
  const urlApi = new URL('http://localhost:3000/api/clients');
  const dateFormat = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  };
  const timeFormat = {
    hour: 'numeric',
    minute: 'numeric',
  };
  let gottenData;

  async function getData() {
    const response = await fetch(urlApi);
    const data = await response.json();

    return data;
  }

  async function getClient(id) {
    const urlWithId = new URL(`clients/${id}`, urlApi);
    const response = await fetch(urlWithId);
    const data = await response.json();

    return data;
  }

  async function searchClients(subStr) {
    urlApi.searchParams.set('search', subStr);
    const response = await fetch(urlApi);
    const data = await response.json();

    return data;
  }

  async function checkResponse(response) {
    const data = await response.json();
    let responseObj = {};
    responseObj.error = null;

    if (response.status !== 200 && response.status !== 201) {
      if (response.status === 404) {
        responseObj.error = 'Client not found';
        responseObj.message = 'Клиент с таким id не найден';

        return responseObj;
      }
      if (response.status > 499 && response.status < 600) {
        responseObj.error = 'ServerError';
        responseObj.message = 'странно, но сервер сломался :(\nОбратитесь к куратору Skillbox, чтобы решить проблему';

        return responseObj;
      }
      if (response.status === 422) {
        responseObj.error = 'inputs are not filled';
        responseObj.message = '';
        data.errors.forEach(error => {
          if (!responseObj.message) {
            responseObj.message = error.message;
          } else {
            responseObj.message = responseObj.message + '\n' + error.message;
          }
        });

        return responseObj;
      }
      responseObj.error = 'Unknown error';
      responseObj.message = 'Что-то пошло не так...';

      return responseObj;
    }

    return responseObj;
  }


  async function postData(clientName, clientSurname, clientLastName, clientContacts) {
    const response = await fetch(urlApi, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: clientName,
        surname: clientSurname,
        lastName: clientLastName,
        contacts: clientContacts,
      }),
    });

    return checkResponse(response);
  }

  async function editClientInfo(clientId, clientName, clientSurname, clientLastName, clientContacts) {
    const userUrl = new URL(`clients/${clientId}`, urlApi)
    const response = await fetch(userUrl, {
      method: 'PATCH',
      body: JSON.stringify({
        name: clientName,
        surname: clientSurname,
        lastName: clientLastName,
        contacts: clientContacts,
      }),
      header: { 'Content-Type': 'application/json' },
    });

     return checkResponse(response);
  }

  function deleteClient(clientId) {
    const userUrl = new URL(`clients/${clientId}`, urlApi)
    fetch(userUrl, {
      method: 'DELETE',
    });
  }

  function sortBy(sortingBy, sortDirection) {
    if (sortingBy === 'id') {
      gottenData.sort((a, b) => {
        if (sortDirection === 'up') return a.id - b.id;
        else return b.id - a.id;
      });
    }

    if (sortingBy === 'alphabet') {
      gottenData.sort((a, b) => {
        const surnameA = a.surname.toLowerCase();
        const surnameB = b.surname.toLowerCase();
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        const lastNameA = a.lastName.toLowerCase();
        const lastNameB = b.lastName.toLowerCase();
        const fullNameA = `${surnameA} ${nameA} ${lastNameA}`;
        const fullNameB = `${surnameB} ${nameB} ${lastNameB}`;

        if (sortDirection === 'up') {
          if (fullNameA > fullNameB) return 1;
          if (fullNameA < fullNameB) return -1;
          return 0;
        } else {
          if (fullNameA < fullNameB) return 1;
          if (fullNameA > fullNameB) return -1;
          return 0;
        }
      });
    }

    if (sortingBy === 'createdAt' || sortingBy === 'updatedAt') {
      gottenData.sort((a, b) => {
        const timeA = Date.parse(a[`${sortingBy}`]);
        const timeB = Date.parse(b[`${sortingBy}`]);
        if (sortDirection === 'up') {
          return timeA - timeB;
        } else {
          return timeB - timeA;
        }
      });
    }
  }

  function fillAutocomplete(holder, input) {
    gottenData.forEach(client => {
      const li = createAutoCompleteRow(client, input);
      holder.append(li);
    });
  }

  function createAutoCompleteRow({ id, name, surname, lastName }, input) {
    const li = document.createElement('li');
    const link = document.createElement('a');

    li.classList.add('autocomplete__row');
    link.classList.add('autocomplete__link');
    link.textContent = `${surname} ${name} ${lastName}`;
    link.href = id;

    li.append(link);

    link.addEventListener('click', function (event) {
      event.preventDefault();
      const href = link.getAttribute('href');
      let targetClient = document.getElementById(href);
      if (!targetClient) {
        const tableBody = document.querySelector('.table__body');
        fillTable(gottenData, tableBody);
        targetClient = document.getElementById(href);
      }
      console.log(targetClient);
      targetClient.scrollIntoView();
      targetClient.classList.add('highlight-elem');
      input.value = '';
    });

    return li;
  }

  function createHeader() {
    const header = document.createElement('header');
    const link = document.createElement('a');
    const logo = document.createElement('img');
    const form = document.createElement('form');
    const input = document.createElement('input');
    const autoCompleteHolder = document.createElement('ul');
    let autocompleteTimeout;

    header.classList.add('header');
    link.classList.add('header__logo');
    link.setAttribute('aria-label', 'сслыка на Skillbus');
    logo.classList.add('header__img');
    logo.src = 'img/logo.svg';
    logo.alt = 'Логотип компании Skillbus'
    form.classList.add('header__form');
    form.action = urlApi;
    form.method = 'GET';
    input.classList.add('header__input');
    input.type = 'text';
    input.placeholder = 'Введите запрос';
    autoCompleteHolder.classList.add('autocomplete');


    link.append(logo);
    form.append(input);
    form.append(autoCompleteHolder);
    header.append(link);
    header.append(form);

    link.addEventListener('click', event => {
      event.stopPropagation();
      if (innerWidth < 768) {
        form.classList.toggle('header__form--show');
      }
    });

    form.addEventListener('submit', async event => {
      event.stopPropagation();
      event.preventDefault();
    });

    input.addEventListener('input', event => {
      if (!input.value) return;

      autoCompleteHolder.innerHTML = '';
      clearTimeout(autocompleteTimeout);
      autocompleteTimeout = setTimeout(async () => {
        gottenData = await searchClients(input.value);
        fillAutocomplete(autoCompleteHolder, input);
      }, 300);
      urlApi.searchParams.delete('search');
    });

    input.addEventListener('click', event => {
      event.stopPropagation();
    });

    document.addEventListener("click", event => {
      autoCompleteHolder.innerHTML = '';
      form.classList.remove('header__form--show');
    });

    return {
      header,
      form,
      input,
      autoCompleteHolder
    };
  }

  function createMain() {
    const main = document.createElement('main');
    main.classList.add('main');

    return main;
  }

  function createContainer() {
    const container = document.createElement('div');
    container.classList.add('container', 'clients');

    return container;
  }


  function createPreloader() {
    const preloader = document.createElement('div');
    const spinner = document.createElement('div');

    preloader.classList.add('preloader');
    spinner.classList.add('preloader__donut');

    preloader.append(spinner);

    return preloader;
  }


  function deleteElement(element) {
    element.remove();
  }

  function createTable(data) {
    const table = document.createElement('table');
    const caption = document.createElement('caption');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');
    const headingRow = document.createElement('tr');
    const preloader = createPreloader();

    for (let columnNumber = 1; columnNumber <= TABLE_COLUMN_COUNT; columnNumber++) {
      const th = document.createElement('th');
      th.classList.add('table__col-title');

      if (columnNumber < 5) {
        const btn = document.createElement('button');
        btn.classList.add('table__btn-title');
        th.append(btn);
      }
      headingRow.append(th);
    }

    const idCell = headingRow.childNodes[0].firstChild;
    const fullNameCell = headingRow.childNodes[1].firstChild;
    const creationDateCell = headingRow.childNodes[2].firstChild;
    const updateDateCell = headingRow.childNodes[3].firstChild;
    const contactsCell = headingRow.childNodes[4];
    const actionsCell = headingRow.childNodes[5];
    const buttonsArr = [idCell, fullNameCell, creationDateCell, updateDateCell];
    const abcSort = document.createElement('span');

    table.classList.add('clients__table', 'table');
    caption.classList.add('table__caption');
    caption.textContent = 'Клиенты';
    thead.classList.add('table__head');
    tbody.classList.add('table__body');
    headingRow.classList.add('table__heading-row');
    idCell.classList.add('table__btn-title--arrow', 'table__btn-title--arrow-up', firmColorClass);
    idCell.textContent = 'ID';
    idCell.dataset.sortDirection = 'up';
    fullNameCell.classList.add('table__btn-title--fullname');
    fullNameCell.textContent = 'Фамилия Имя Отчество';
    abcSort.classList.add('table__abc-sort', elemHiddenClass);
    creationDateCell.textContent = 'Дата и время создания';
    updateDateCell.textContent = 'Полсдение изменения';
    contactsCell.textContent = 'Контакты';
    actionsCell.textContent = 'Действия';

    fullNameCell.append(abcSort);
    thead.append(headingRow);
    tbody.append(preloader);
    table.append(caption);
    table.append(thead);
    table.append(tbody);

    fillTable(data, tbody);
    setTimeout(deleteElement, 300, preloader);


    buttonsArr.forEach(btn => {
      btn.addEventListener('click', async event => {
        buttonsArr.forEach(button => {
          if (button !== btn) {
            button.classList.remove('table__btn-title--arrow');
            button.classList.remove(firmColorClass);
            button.dataset.sortDirection = '';
          }
        })
        btn.classList.add('table__btn-title--arrow');
        if (btn.dataset.sortDirection !== 'up') {
          btn.dataset.sortDirection = 'up';
          btn.classList.add(firmColorClass);
          btn.classList.add('table__btn-title--arrow-up');
        } else {
          btn.dataset.sortDirection = 'down';
          btn.classList.remove('table__btn-title--arrow-up');
        }
        abcSort.classList.add(elemHiddenClass);
        tbody.innerHTML = '';
        if (buttonsArr.indexOf(btn) === 0) sortBy('id', btn.dataset.sortDirection);
        if (buttonsArr.indexOf(btn) === 1) {
          sortBy('alphabet', btn.dataset.sortDirection);
          abcSort.classList.remove(elemHiddenClass);
          if (btn.dataset.sortDirection === 'down') abcSort.textContent = 'Я-А';
          else abcSort.textContent = 'А-Я';
        }
        if (buttonsArr.indexOf(btn) === 2) sortBy('createdAt', btn.dataset.sortDirection);
        if (buttonsArr.indexOf(btn) === 3) sortBy('updatedAt', btn.dataset.sortDirection);
        fillTable(gottenData, tbody);
        setTimeout(deleteElement, 300, preloader);
      });
    });

    return {
      table,
      tbody
    };
  }

  function fillTable(data, tbody) {
    data.forEach(client => {
      const tr = createClientRow(client);
      tbody.append(tr);
    });
  }

  function createClientRow({ id, name, surname, lastName, contacts, createdAt, updatedAt }) {
    const tr = document.createElement('tr');

    tr.classList.add('table__row');
    tr.id = id;

    for (let columnNumber = 1; columnNumber <= TABLE_COLUMN_COUNT; columnNumber++) {
      const td = document.createElement('td');

      td.classList.add('table__cell');

      if (columnNumber === 3 || columnNumber === 4) {
        let fullDate;
        const timeElem = document.createElement('span');

        if (columnNumber === 3) fullDate = new Date(createdAt);
        if (columnNumber === 4) fullDate = new Date(updatedAt);

        td.textContent = fullDate.toLocaleString("ru", dateFormat);
        timeElem.classList.add('time-span');
        timeElem.textContent = fullDate.toLocaleString("ru", timeFormat);

        td.append(timeElem);
      }
      if (columnNumber === 5) {
        contacts.forEach(contact => {
          const tooltip = document.createElement('span');
          const tooltipBtn = document.createElement('button');
          const tooltipDesc = document.createElement('span');
          const tooltipLink = document.createElement('a');
          const contactNumber = contacts.indexOf(contact) + 1;
          const hiddenContacts = contacts.length - 4;
          const showMoreContactsBtn = document.createElement('button');

          tooltip.classList.add('table__tooltip', 'tooltip');
          tooltipDesc.classList.add('tooltip__desc');
          tooltipDesc.setAttribute('role', 'tooltip');
          tooltipDesc.id = `${id} contact ${contacts.indexOf(contact) + 1}`;
          tooltipDesc.textContent = `${contact.type}: `;
          tooltipLink.classList.add('tooltip__link');
          tooltipBtn.classList.add('tooltip__btn');
          tooltipBtn.setAttribute('aria-describedby', tooltipDesc.id);
          tooltipLink.href = contact.value;
          tooltipLink.textContent = contact.value;
          showMoreContactsBtn.classList.add('table__show-contacts');

          if (contact.type === 'vk') {
            tooltipBtn.classList.add('tooltip__btn--vk');
            tooltipBtn.setAttribute('aria-label', 'страница клиента Bконтакте');
          }
          if (contact.type === 'Facebook') {
            tooltipBtn.classList.add('tooltip__btn--fb');
            tooltipBtn.setAttribute('aria-label', 'страница клиента в Facebook');
          }
          if (contact.type === 'Другое') {
            tooltipBtn.classList.add('tooltip__btn--other');
            tooltipBtn.setAttribute('aria-label', 'Другие контакты клиента');
          }
          if (contact.type === 'Email') {
            tooltipBtn.classList.add('tooltip__btn--mail');
            tooltipBtn.setAttribute('aria-label', 'Электронная почта клиента');
            tooltipLink.href = `mailto:${contact.value}`;
          }
          if (contact.type === 'Телефон') {
            tooltipBtn.classList.add('tooltip__btn--phone');
            tooltipBtn.setAttribute('aria-label', 'Телефон клиента');
            tooltipLink.href = `tel:${contact.value}`;
          }
          if (contactNumber > 4) {
            tooltip.classList.add(elemHiddenClass);
          }
          if (tooltipDesc.style.opacity === 0) {
            tooltipLink.tabIndex = '-1';
          } else {
            tooltipLink.tabIndex = '1';
          }

          tooltipDesc.append(tooltipLink);
          tooltip.append(tooltipBtn);
          tooltip.append(tooltipDesc);
          td.append(tooltip);

          if (contactNumber === 5) {
            showMoreContactsBtn.textContent = `+${hiddenContacts}`;
            td.append(showMoreContactsBtn);
          }

          showMoreContactsBtn.addEventListener('click', () => {
            td.childNodes.forEach(child => {
              child.classList.remove(elemHiddenClass);
            });
            showMoreContactsBtn.remove();
          });
        });
      }

      if (columnNumber === 6) {
        const clientCardLink = document.createElement('a');
        const deleteButton = document.createElement('button');

        clientCardLink.classList.add('table__actions', 'table__actions--edit');
        clientCardLink.textContent = 'Изменить';
        clientCardLink.href = '#' + id;
        deleteButton.classList.add('table__actions', 'table__actions--delete');
        deleteButton.textContent = 'Удалить';

        td.append(clientCardLink);
        td.append(deleteButton);

        clientCardLink.addEventListener('click', async event => {
          clientCardLink.classList.add('table__actions--edit--loading');
          const client = await getClient(id);

          setTimeout(() => {
            createModal(client);
            clientCardLink.classList.remove('table__actions--edit--loading');
          }, 200);
          // добавил таймаут для имитации загрузки
        });

        deleteButton.addEventListener('click', async event => {
          deleteButton.classList.add('table__actions--delete--loading');
          const clientRow = deleteButton.parentNode.parentNode;

          setTimeout(() => {
            createDialogAboutDelete(clientRow.id);
            deleteButton.classList.remove('table__actions--delete--loading');
          }, 200);
          // добавил таймаут для имитации загрузки
        });
      }
      tr.append(td);
    }

    const idCell = tr.childNodes[0];
    const fullNameCell = tr.childNodes[1];

    idCell.classList.add('table__cell--id');
    idCell.textContent = id;
    fullNameCell.textContent = `${surname} ${name} ${lastName}`;

    return tr;
  }


  function createModal(client) {
    const modal = document.createElement('div');
    const form = document.createElement('form');
    const validationMessage = document.createElement('div');
    const btnClose = document.createElement('button');
    const saveClientInfoBtn = document.createElement('button');
    const deleteClientBtn = document.createElement('button');

    modal.classList.add('modal');
    form.classList.add('modal__form');
    form.action = urlApi;
    form.method = 'POST';
    validationMessage.classList.add('modal__validation-info');
    saveClientInfoBtn.classList.add('modal__save-btn');
    btnClose.classList.add('modal__close-btn');
    saveClientInfoBtn.textContent = 'Сохранить';
    deleteClientBtn.classList.add('modal__delete-btn');
    deleteClientBtn.textContent = 'Удалить клиента';


    for (let fieldsetCount = 1; fieldsetCount <= 2; fieldsetCount++) {
      const fieldset = document.createElement('fieldset');
      const legend = document.createElement('legend');

      fieldset.classList.add('modal__fieldset');
      legend.textContent = 'Изменить данные';
      if (!client) {
        legend.textContent = 'Новый клиент';
      }

      fieldset.append(legend);

      if (fieldsetCount === 1) {
        const spanId = document.createElement('span');

        fieldset.classList.add('fullname');
        legend.classList.add('fullname__legend');
        spanId.classList.add('fullname__span');
        if (client) {
          spanId.textContent = `ID: ${client.id}`;
        }

        for (let inputNumber = 1; inputNumber <= 3; inputNumber++) {
          const inputGroup = document.createElement('div');
          const label = document.createElement('label');
          const star = document.createElement('span');
          const input = document.createElement('input');

          inputGroup.classList.add('fullname__group-input')
          label.classList.add('fullname__label');
          star.classList.add('fullname__star');
          star.textContent = '*';
          input.classList.add('fullname__input');
          if (client) {
            label.classList.add('fullname__label--active');
          }
          if (inputNumber === 1) {
            inputGroup.classList.add('fullname__group-input--surname');
            label.textContent = 'Фамилия';
            if (client) input.value = client.surname;
          }
          if (inputNumber === 2) {
            inputGroup.classList.add('fullname__group-input--name');
            label.textContent = 'Имя';
            if (client) input.value = client.name;
          }
          if (inputNumber === 3) {
            label.textContent = 'Отчество';
            inputGroup.classList.add('fullname__group-input--last-name');
            if (client) input.value = client.lastName;
          }

          if (inputNumber === 1 || inputNumber === 2) label.append(star);
          inputGroup.append(label);
          inputGroup.append(input);
          fieldset.append(inputGroup);

          input.addEventListener('focus', event => {
            validationMessage.classList.remove('modal__validation-info--shown');
            input.classList.remove('input-error');
            label.classList.add('fullname__label--active');
          });

          input.addEventListener('blur', event => {
            if (!input.value) {
              label.classList.remove('fullname__label--active');
            }
          });
        }

        legend.append(spanId);
      }

      if (fieldsetCount === 2) {
        const addContactBtn = document.createElement('button');

        fieldset.classList.add('add-contact');
        fieldset.dataset.contactsCount = 0;
        legend.classList.add('add-contact__legend', 'visually-hidden');
        legend.textContent = 'Добавить контакт';
        addContactBtn.classList.add('add-contact__btn');
        addContactBtn.textContent = 'Добавить контакт';

        fieldset.append(legend);
        fieldset.append(addContactBtn);

        if (client) {
          let contactsCounter = Number(fieldset.dataset.contactsCount) + 1;
          client.contacts.forEach(contact => {
            const elementContact = createContactSelect(contact.type, contact.value);

            fieldset.dataset.contactsCount = contactsCounter++;
            disableAddingContact(fieldset, addContactBtn);

            legend.after(elementContact);
          });
        }

        addContactBtn.addEventListener('click', event => {
          event.preventDefault();
          const newContact = createContactSelect();
          let contactsCounter = Number(fieldset.dataset.contactsCount);

          fieldset.dataset.contactsCount = ++contactsCounter;
          disableAddingContact(fieldset, addContactBtn);

          addContactBtn.before(newContact);
        });
      }
      form.append(fieldset);
    }

    form.append(btnClose);
    form.append(validationMessage);
    form.append(saveClientInfoBtn);
    if (client) form.append(deleteClientBtn);
    modal.append(form);
    document.body.append(modal);

    modal.addEventListener('click', event => {
      modal.remove();
      history.pushState({}, '', 'index.html');
    });

    form.addEventListener('submit', async event => {
      event.preventDefault();

      const tableBody = document.querySelector('.table__body');
      const surnameInput = document.querySelector('.fullname__group-input--surname').lastChild;
      const nameInput = document.querySelector('.fullname__group-input--name').lastChild;
      const lastNameInput = document.querySelector('.fullname__group-input--last-name').lastChild;
      const contactInputs = document.querySelectorAll('.add-contact__input');
      const preloader = createPreloader();
      const contactsArr = [];
      let stopHandler = false;
      let response;

      preloader.classList.add('preloader-modal');
      contactInputs.forEach(contactInput => {
        if (!contactInput.value) {
          if (!surnameInput.value && !nameInput.value) {
            validationMessage.textContent = 'Введите фамилию и имя\nВведите контактные данные';
            surnameInput.classList.add('input-error');
            nameInput.classList.add('input-error');
          } else if (!surnameInput.value) {
            validationMessage.textContent = 'Введите фамилию\nВведите контактные данные';
            surnameInput.classList.add('input-error');
          } else if (!nameInput.value) {
            validationMessage.textContent = 'Введите имя\nВведите контактные данные';
            nameInput.classList.add('input-error');
          } else {
            validationMessage.textContent = 'Внесите контактные данные';
          }
          validationMessage.classList.add('modal__validation-info--shown');
          contactInput.classList.add('input-error');

          return stopHandler = true;
        }
      });

      if (stopHandler) {
        return;
      }
      if (!surnameInput.value && !nameInput.value) {
        validationMessage.textContent = 'Введите фамилию и имя';
        validationMessage.classList.add('modal__validation-info--shown');
        surnameInput.classList.add('input-error');
        nameInput.classList.add('input-error');

        return;
      }
      if (!surnameInput.value) {
        validationMessage.textContent = 'Введите фамилию';
        validationMessage.classList.add('modal__validation-info--shown');
        surnameInput.classList.add('input-error');

        return;
      }
      if (!nameInput.value) {
        validationMessage.textContent = 'Введите имя';
        validationMessage.classList.add('modal__validation-info--shown');
        nameInput.classList.add('input-error');

        return;
      }

      contactInputs.forEach(contactInput => {
        const selectValue = contactInput.previousSibling.firstChild.textContent;
        const contactObject = {};

        contactObject.type = selectValue;
        contactObject.value = contactInput.value;
        contactsArr.push(contactObject);
      });

      form.append(preloader);

      if (client) {
        response = await editClientInfo(client.id, nameInput.value, surnameInput.value, lastNameInput.value, contactsArr);
      } else {
        response = await postData(nameInput.value, surnameInput.value, lastNameInput.value, contactsArr);
      }
      setTimeout(deleteElement, 300, preloader);
      if (response.error !== null) {
        validationMessage.textContent = response.message;
        validationMessage.classList.add('modal__validation-info--shown');

        return;
      }
      modal.remove();
      history.pushState({}, '', 'index.html');
      preloader.classList.remove('preloader-modal');
      tableBody.innerHTML = '';
      tableBody.append(preloader);
      gottenData = await getData();
      fillTable(gottenData, tableBody);
      setTimeout(deleteElement, 3000, preloader);
    });

    form.addEventListener('click', event => {
      event.stopPropagation();
      const openedDropdown = document.querySelector('[data-dropdown="opened"]');

      if (openedDropdown !== null && typeof openedDropdown !== 'undefined') {
        openedDropdown.dataset.dropdown = 'closed';
        openedDropdown.classList.add(elemHiddenClass);
      }
    });

    btnClose.addEventListener('click', event => {
      event.preventDefault();
      modal.remove();
      history.pushState({}, '', 'index.html');
    })

    deleteClientBtn.addEventListener('click', event => {
      const itsModalButton = true;
      modal.remove();
      history.pushState({}, '', 'index.html');
      createDialogAboutDelete(client.id, itsModalButton);
    });
  }

  function disableAddingContact(fieldset, button) {
    if (Number(fieldset.dataset.contactsCount) >= 10) {
      button.classList.add(elemHiddenClass);
    } else {
      button.classList.remove(elemHiddenClass);
    }
  }

  function createContactSelect(type, value) {
    const contactWrap = document.createElement('div');
    const selectWrap = document.createElement('div');
    const selectedItem = document.createElement('span');
    const dropdown = document.createElement('ul');
    const input = document.createElement('input');
    const tooltipAboutDel = document.createElement('span');
    const deleteContactBtn = document.createElement('button');
    const tooltipDesc = document.createElement('span');
    const contactTypeCount = 5;

    contactWrap.classList.add('add-contact__wrapper');
    selectWrap.classList.add('add-contact__select', 'select');
    selectedItem.textContent = 'Телефон';
    selectedItem.classList.add('select__selected-item');
    dropdown.classList.add('select__dropdown', elemHiddenClass);
    dropdown.dataset.dropdown = 'closed';
    input.classList.add('add-contact__input');
    input.type = 'text';
    tooltipAboutDel.classList.add('add-contact__tooltip', 'tooltip');
    deleteContactBtn.classList.add('tooltip__btn', 'add-contact__delete-btn');
    tooltipDesc.classList.add('add-contact__desc-tooltip', 'tooltip__desc');
    tooltipDesc.textContent = 'Удалить контакт';

    if (typeof type !== 'undefined') {
      selectedItem.textContent = type;
      input.value = value;
    }

    for (let contactTypeNumber = 1; contactTypeNumber <= contactTypeCount; contactTypeNumber++) {
      const dropdownItem = document.createElement('li');

      dropdownItem.classList.add('select__item');

      if (contactTypeNumber === 1) dropdownItem.textContent = 'Телефон';
      if (contactTypeNumber === 2) dropdownItem.textContent = 'Email';
      if (contactTypeNumber === 3) dropdownItem.textContent = 'Facebook';
      if (contactTypeNumber === 4) dropdownItem.textContent = 'vk';
      if (contactTypeNumber === 5) dropdownItem.textContent = 'Другое';
      if (dropdownItem.textContent === type) dropdownItem.classList.add(elemHiddenClass);
      if (typeof type === 'undefined' && contactTypeNumber === 1) {
        dropdownItem.classList.add(elemHiddenClass);
      }

      dropdown.append(dropdownItem);

      dropdownItem.addEventListener('click', event => {
        const itemSelected = dropdownItem.parentNode.previousSibling;

        dropdown.dataset.dropdown = 'closed';
        dropdown.classList.add(elemHiddenClass);
        dropdown.childNodes.forEach(item => {
          item.classList.remove(elemHiddenClass);
        });
        dropdownItem.classList.add(elemHiddenClass);
        itemSelected.textContent = dropdownItem.textContent;
        input.value = '';
      });
    }

    tooltipAboutDel.append(deleteContactBtn);
    tooltipAboutDel.append(tooltipDesc);
    selectWrap.append(selectedItem);
    selectWrap.append(dropdown);
    contactWrap.append(selectWrap);
    contactWrap.append(input);
    if (input.value) contactWrap.append(tooltipAboutDel);


    selectedItem.addEventListener('click', event => {
      event.stopPropagation();
      const openedDropdown = document.querySelector('[data-dropdown="opened"]');
      const thisDropdown = selectedItem.nextSibling;

      if (openedDropdown !== thisDropdown && openedDropdown !== null) {
        openedDropdown.dataset.dropdown = 'closed';
        openedDropdown.classList.add(elemHiddenClass);
        openedDropdown.previousSibling.classList.remove('select__selected-item--active');
      }
      if (dropdown.dataset.dropdown === 'opened') {
        dropdown.dataset.dropdown = 'closed';
        dropdown.classList.add(elemHiddenClass);
        selectedItem.classList.remove('select__selected-item--active');
      } else {
        dropdown.dataset.dropdown = 'opened';
        dropdown.classList.remove(elemHiddenClass);
        selectedItem.classList.add('select__selected-item--active');
      }
    });

    document.body.addEventListener('click', event => {
      const openedSelectedItem = document.querySelector('.select__selected-item--active');

      dropdown.dataset.dropdown = 'closed';
      dropdown.classList.add(elemHiddenClass);
      if (openedSelectedItem !== null) {
        openedSelectedItem.classList.remove('select__selected-item--active');
      }
    });

    deleteContactBtn.addEventListener('click', event => {
      event.preventDefault();
      const wrapper = deleteContactBtn.parentNode.parentNode;
      const fieldset = wrapper.parentNode;
      const btnAdd = fieldset.lastChild;
      let contactsCounter = Number(fieldset.dataset.contactsCount);

      wrapper.remove();
      fieldset.dataset.contactsCount = --contactsCounter;
      disableAddingContact(fieldset, btnAdd);
    });

    input.addEventListener('focus', event => {
      const validationMessage = document.querySelector('.modal__validation-info');

      validationMessage.classList.remove('modal__validation-info--shown');
      input.classList.remove('input-error');
    });

    input.addEventListener('input', event => {
      contactWrap.append(tooltipAboutDel);
    });

    return contactWrap;
  }



  function createDialogAboutDelete(id, modalButton) {
    const overlay = document.createElement('div');
    const dialog = document.createElement('div');
    const title = document.createElement('h1');
    const question = document.createElement('p');
    const btnClose = document.createElement('button');
    const btnDelete = document.createElement('button');
    const btnCancel = document.createElement('button');

    overlay.classList.add('modal');
    dialog.classList.add('modal__dialog-delete', 'dialog');
    title.classList.add('dialog__title');
    title.textContent = 'Удалить клиента';
    question.classList.add('dialog__question');
    question.textContent = 'Вы действительно хотите удалить данного клиента?';
    btnClose.classList.add('dialog__close-btn');
    btnDelete.classList.add('dialog__del-btn');
    btnDelete.textContent = 'Удалить';
    btnCancel.classList.add('dialog__cancel-btn');
    btnCancel.textContent = 'Отмена';

    dialog.append(title);
    dialog.append(question);
    dialog.append(btnClose);
    dialog.append(btnDelete);
    dialog.append(btnCancel);
    overlay.append(dialog);
    document.body.append(overlay);

    async function deleteOverlay() {
      if (modalButton) {
        const client = await getClient(id);
        createModal(client)
      }
      overlay.remove();
    }

    btnDelete.addEventListener('click', event => {
      const clientRow = document.getElementById(id);

      deleteClient(id);

      clientRow.remove();
      overlay.remove();
    });

    btnCancel.addEventListener('click', event => {
      deleteOverlay()
    });

    btnClose.addEventListener('click', event => {
      deleteOverlay()
    });

    overlay.addEventListener('click', event => {
      deleteOverlay()
    });

    dialog.addEventListener('click', event => {
      event.stopPropagation();
    });

  }

  function createAddClientBtn() {
    const btnWrapper = document.createElement('div');
    const btn = document.createElement('button');

    btnWrapper.classList.add('clients__wrapper-btn');
    btn.textContent = 'Добавить пользователя';
    btn.classList.add('clients__btn');

    btnWrapper.append(btn);

    btn.addEventListener('click', event => {
      createModal();
    });

    return btnWrapper;
  }

  async function openClientCard() {
    const clientId = window.location.hash.split('#')[1];
    const client = await getClient(clientId);

    createModal(client);
  }

  async function createCustomerDataApp() {
    gottenData = await getData();
    const header = createHeader();
    const main = createMain();
    const container = createContainer();
    const table = createTable(gottenData);
    const addClientBtn = createAddClientBtn();


    document.body.append(header.header);
    document.body.append(main);
    container.append(table.table);
    main.append(container);
    main.append(addClientBtn);

    if (window.location.hash) {
      openClientCard();
    }

  }

  window.createCustomerDataApp = createCustomerDataApp;
})();
