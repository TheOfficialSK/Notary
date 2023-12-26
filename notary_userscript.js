// ==UserScript==
// @name         Notary
// @description  Save highlighted text to cards in a sidebar
// @version      1.1
// @author       Salman Khattak
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function () {
   'use strict';

   GM_addStyle(`
        :root {
            --notary-sidebar-bg: #f5f5f5;
            --notary-border-color: #CCC;
            --notary-card-bg: #fff;
            --notary-card-selected-bg: #e0f7fa;
            --notary-button-bg: #8e62e3;
            --notary-button-hover-bg: #472885;
            --notary-header-footer-bg: #bba2eb;
        }

        * {
            padding: 0;
            margin: 0;
        }
        #cardsSidebar {
            position: fixed;
            top: 0;
            left: 0;
            width: 250px !important;
            min-width: 250px !important;
            height: 100%;
            background-color: var(--notary-sidebar-bg);
            border-right: 1px solid var(--notary-border-color);
            overflow-y: auto;
            overflow-x: hidden;
            padding: 0;
            z-index: 10000000;
            transform: translateX(-100%);
            box-shadow: 0 1px 10px rgba(0, 0, 0, 0.357);
          border-top-right-radius: 10px;
            border-bottom-right-radius: 10px;
        }
        #cardsSidebar.expanded {
            transform: translateX(0);
        }
        #cardsContainer {
            display: flex;
            flex-direction: column;
            gap: 16px;
            overflow-y: auto;
            padding: 16px;
            padding-left: 5px;
            position: absolute;
            top: 50px;
            bottom: 60px;
            width: 100%;
        }
        .notaryCard {
            background-color: var(--notary-card-bg);
            border: 1px solid var(--notary-border-color);
            border-radius: 4px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
            padding: 8px;
            max-width: 220px;
            font-size: 14px;
            white-space: pre-wrap;
            cursor: pointer;
            color: black;
        }
        .notaryCard.selected {
            background-color: var(--notary-card-selected-bg);
        }
        #addCardButton, #removeCardButton, #toggleSidebarButton, #removeAllButton {
            background-color: var(--notary-button-bg);
            color: #fff;
            border: none;
            border-radius: 10px;
            padding: 8px 10px;
            font-size: 16px;
            cursor: pointer;
            box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
        }
        #addCardButton, #removeCardButton {
            position: fixed;
            bottom: 10px;
            z-index: 10000001;
            transition: left 0.3s ease-in-out;
        }
        #removeAllButton {
            font-size: 12px;
            height: 39px;
            position: fixed;
            top: 0px;
            left: 10px;
            z-index: 10000001;
            transition: left 0.3s ease-in-out;
        }
        #addCardButton:hover, #removeCardButton:hover, #removeAllButton:hover {
            background-color: var(--notary-button-hover-bg);
        }
        #toggleSidebarButton {
            position: fixed;
            top: 0px;
            left: 0px;
            z-index: 10000001;
            width: 30px;
            padding: 0;
            border-radius: 0;
            height: 39px;
            font-size: 16px;
            writing-mode: unset;
            justify-content: flex-end;
            text-align: center;
            align-items: center;
            padding-right: 4px;
        }
        #toggleSidebarButton:hover {
            background-color: var(--notary-button-hover-bg);
        }
        #cardsSidebar {
            transition: transform 0.3s ease-in-out;
        }
        #notaryTitle {
            color: var(--notary-button-bg);
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 16px;
            position: absolute;
            left: 75px;
            top: 7px;
          text-shadow: 0px 0px 0.5px rgba(0, 0, 0, 0.357);
        }

        #notaryHeader {
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: var(--notary-header-footer-bg);
            padding: 8px 0;
            border-bottom: 1px solid var(--notary-border-color);
            height: 50px;
          box-shadow: 0 5px 10px rgba(0, 0, 0, 0.357);
        }
        #notaryFooter {
            display: flex;
            justify-content: space-around;
            align-items: center;
            background-color: var(--notary-header-footer-bg);
            padding: 8px 0;
            border-top: 1px solid var(--notary-border-color);
            position: absolute;
            bottom: 0;
            width: 100%;
            height: 60px;
          box-shadow: 0 -3px 10px rgba(0, 0, 0, 0.357);
        }
    `);

   (function () {
      'use strict';

      function createSidebar() {
         const sidebar = document.createElement('div');
         sidebar.id = 'cardsSidebar';

         const header = document.createElement('div');
         header.id = 'notaryHeader';
         sidebar.appendChild(header);

         const notaryTitle = document.createElement('div');
         notaryTitle.id = 'notaryTitle';
         notaryTitle.innerText = 'Notary';
         header.appendChild(notaryTitle);

         const cardsContainer = document.createElement('div');
         cardsContainer.id = 'cardsContainer';
         sidebar.appendChild(cardsContainer);

         const footer = document.createElement('div');
         footer.id = 'notaryFooter';
         sidebar.appendChild(footer);

         document.body.appendChild(sidebar);
      }

      // This function creates the add card button which is used to clip text from a page.
      function createAddCardButton() {
      const button = document.createElement('button');
      button.id = 'addCardButton';
      button.innerText = 'Add to Cards';
      button.style.display = 'none'; // Hide button initially
      button.addEventListener('click', () => {
         const selectedText = window.getSelection().toString().trim();
         const currentUrl = window.location.href;
         const siteTitle = document.title || currentUrl;

         if (selectedText && !cardExists(selectedText, currentUrl, siteTitle)) {
            addCard(selectedText, currentUrl, siteTitle);

            const savedCards = JSON.parse(localStorage.getItem('savedCards')) || [];
            savedCards.push({ text: selectedText, url: currentUrl, siteTitle });
            localStorage.setItem('savedCards', JSON.stringify(savedCards));
         }
      });

      document.body.appendChild(button);
   }

      // This function creates the remove card button which is used to remove a card from the sidebar.
      function createRemoveCardButton() {
         const button = document.createElement('button');
         button.id = 'removeCardButton';
         button.innerText = 'Remove Card';
        button.style.left = '-150px';
         button.addEventListener('click', () => {
            const selectedCard = document.querySelector('.notaryCard.selected');
            if (selectedCard) {
               const cardText = selectedCard.querySelector('div').innerText;
               const cardLink = selectedCard.querySelector('a');
               const cardUrl = cardLink.href;
               const cardSiteTitle = cardLink.innerText;

               removeCardFromStorage(cardText, cardUrl, cardSiteTitle);
               selectedCard.remove();
            }
         });

         document.body.appendChild(button);
      }

      // This function creates the remove all button which is used to remove all cards from the sidebar.
      function createRemoveAllButton() {
         const button = document.createElement('button');
         button.id = 'removeAllButton';
         button.innerText = 'Remove All';
        button.style.left = '-150px';
         button.addEventListener('click', () => {
            const cardsContainer = document.getElementById('cardsContainer');
            cardsContainer.innerHTML = '';
            localStorage.removeItem('savedCards');
         });

         document.body.appendChild(button);
      }


      // This function creates the toggle sidebar button which is used to expand and collapse the sidebar.
      function createToggleSidebarButton() {
         const button = document.createElement('button');
         button.id = 'toggleSidebarButton';
         button.innerText = '>';
         button.addEventListener('click', () => {
            const sidebar = document.getElementById('cardsSidebar');
            sidebar.classList.toggle('expanded');

            const addCardButton = document.getElementById('addCardButton');
            const removeCardButton = document.getElementById('removeCardButton');
            const removeAllButton = document.getElementById('removeAllButton');

            if (sidebar.classList.contains('expanded')) {
               button.innerText = '<';
               addCardButton.style.left = '5px';
               removeCardButton.style.left = '10px';
               removeAllButton.style.left = '170px';
            } else {
               button.innerText = '>';
               addCardButton.style.left = '-150px';
               removeCardButton.style.left = '-150px';
               removeAllButton.style.left = '-150px';
            }
         });

         document.body.appendChild(button);
      }

      // This function handles the logic behind creating a card and adding it to the sidebar.
      function addCard(text, url, siteTitle) {
         const card = document.createElement('div');
         card.classList.add('notaryCard');

         const link = document.createElement('a');
         link.href = url;
         link.innerText = siteTitle;
         link.style.fontWeight = 'bold';
         link.style.display = 'block';
         link.style.marginBottom = '4px';
         card.appendChild(link);

         const content = document.createElement('div');
         content.innerText = text;
         card.appendChild(content);

         card.addEventListener('click', (event) => {
            if (event.target === link) {
               return;
            }
            card.classList.toggle('selected');
            const savedCards = JSON.parse(localStorage.getItem('savedCards')) || [];
            if (!card.classList.contains('selected')) {
               savedCards.push({ text, url, siteTitle });
               localStorage.setItem('savedCards', JSON.stringify(savedCards));
            }
         });

         const cardsContainer = document.getElementById('cardsContainer');
         cardsContainer.appendChild(card);
      }

      // This function  handles the logic to load all the cards from local storage and adds them to the sidebar.
      function loadCards() {
         const savedCards = JSON.parse(localStorage.getItem('savedCards')) || [];
         savedCards.forEach(cardData => {
            addCard(cardData.text, cardData.url, cardData.siteTitle);
         });
      }

      // This function checks if a card already exists in local storage, this is used to prevent duplicate cards.
      function cardExists(text, url, siteTitle) {
         const savedCards = JSON.parse(localStorage.getItem('savedCards')) || [];
         return savedCards.some(card => card.text === text && card.url === url && card.siteTitle === siteTitle);
      }

      // This function handles the logic to remove a card from local storage.
      function removeCardFromStorage(text, url, siteTitle) {
         const savedCards = JSON.parse(localStorage.getItem('savedCards')) || [];
         const updatedCards = savedCards.filter(card => !(card.text === text && card.url === url && card.siteTitle === siteTitle));
         localStorage.setItem('savedCards', JSON.stringify(updatedCards));
      }

     let buttonTimeout; // Declare a variable for the timer outside the function

   // This function handles the logic to show the add card button when text is highlighted on the page.
   function handleMouseUp(event) {
      const selectedText = window.getSelection().toString().trim();
      const addCardButton = document.getElementById('addCardButton');

      if (selectedText) {
        addCardButton.style.display = 'block';
        addCardButton.style.left = `${event.clientX}px`;
        addCardButton.style.top = `${event.clientY}px`;
        addCardButton.style.padding = '5px 10px';
        addCardButton.style.bottom = 'unset';

        clearTimeout(buttonTimeout); // Clear the previous timer if it exists
        buttonTimeout = setTimeout(() => {
            addCardButton.style.display = 'none';
      }, 5000);
      } else {
        addCardButton.style.display = 'none';
      }
   }

   // These are constructor calls which create the sidebar, add card button, remove card button, remove all button, and toggle sidebar button, and the load cards function.
   createSidebar();
   createAddCardButton();
   createRemoveCardButton();
   createRemoveAllButton();
   createToggleSidebarButton();
   loadCards();

   // These are variables which are used to store the current url and the title of the page.
   const currentUrl = window.location.href;
   const siteTitle = document.title || currentUrl;

   // This event listener is used to handle the logic to show the add card button when text is highlighted on the page.
   document.addEventListener('mouseup', handleMouseUp);

   // This event listener is used to handle the logic to add a card to the sidebar when the add card button is clicked.
   document.getElementById('addCardButton').addEventListener('click', () => {
      const selectedText = window.getSelection().toString().trim();
      if (selectedText && !cardExists(selectedText, currentUrl, siteTitle)) {
         addCard(selectedText, currentUrl, siteTitle);

         const savedCards = JSON.parse(localStorage.getItem('savedCards')) || [];
         savedCards.push({ text: selectedText, url: currentUrl, siteTitle });
         localStorage.setItem('savedCards', JSON.stringify(savedCards));
      }
      
      // Clear the selection and hide the button after clicking the button
      window.getSelection().removeAllRanges();
      clearTimeout(buttonTimeout); // Cancel the timer
      addCardButton.style.display = 'none';
   });
   })();
})();