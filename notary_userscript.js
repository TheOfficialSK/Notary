// ==UserScript==
// @name         Notary Experimental
// @description  Save highlighted text to cards in a sidebar
// @version      1.1
// @author       Salman Khattak
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==


// Sites this userscript should run on: theoretically all sites, sites that I have done testing on and have worked are listed below
// https://www.google.com/
// https://www.cnn.com/
// https://www.youtube.com/
// https://www.reddit.com/
// 
// My scripts behavior is to allow the user to highlight any text from their given web domain, and add it to a card that appears in a scrollable window on the left of their
// browser. The cards the user saves are accessable from ANYWHERE within the SAME domain, meaning that if a user decides to clip some text from a specific youtube description, 
// and then proceeds to move to a different video or the youtube homepage, they can still access the card they saved from the sidebar.
// However, one shortcoming of this is that if a user decides to clip some text from a specific youtube description, and then proceeds to move to a different domain, 
// they will not be able to access the card they saved from the sidebar. This is because the cards are stored in the users local storage, and are only accessable from the same domain.
// 
// The only fix to this issue would be to buy a domain and host a server for the user to access the cards from, but that would be a lot of work.
// 
// overall, this userscript is a nice, user-friendly way to save text from a given domain, and access it from anywhere within the same domain. Some use case examples would be:
// - saving a google search result to a card, and then accessing it from the google homepage
// - performing research on a topic, and saving the text from the research to a card, and then accessing it from the homepage of the website you are researching on.
// - compiling a list of videos to watch later on youtube, without getting your algorithm messed up by actually saving them to watch later.
//
// To create the Notary Experimental userscript, I relied on several topics from HTML, CSS, JavaScript, and the browser's devtools. These topics include:

// 1. DOM Manipulation (JavaScript):
//    This topic covers selecting, modifying, and creating elements within the HTML document.
//    It was necessary to access and manipulate the content that needed to be saved as cards in the sidebar.

// 2. Event Listeners (JavaScript):
//    Event listeners are used to handle user interactions, such as clicks and mouseup events, with the web page.
//    In this case, I used event listeners to detect when the user selected text or clicked on buttons.

// 3. CSS Styling (CSS):
//    I needed to apply appropriate styling to the sidebar, cards, and buttons for an appealing user interface.

// 4. Local Storage (JavaScript and Devtools):
//    The userscript stores and retrieves saved cards using the browser's local storage feature.
//    This allows users to save their cards persistently across sessions.
//    The Devtools' Application panel can be used to inspect and modify the local storage data.


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

      function loadCards() {
         const savedCards = JSON.parse(localStorage.getItem('savedCards')) || [];
         savedCards.forEach(cardData => {
            addCard(cardData.text, cardData.url, cardData.siteTitle);
         });
      }

      function cardExists(text, url, siteTitle) {
         const savedCards = JSON.parse(localStorage.getItem('savedCards')) || [];
         return savedCards.some(card => card.text === text && card.url === url && card.siteTitle === siteTitle);
      }

      function removeCardFromStorage(text, url, siteTitle) {
         const savedCards = JSON.parse(localStorage.getItem('savedCards')) || [];
         const updatedCards = savedCards.filter(card => !(card.text === text && card.url === url && card.siteTitle === siteTitle));
         localStorage.setItem('savedCards', JSON.stringify(updatedCards));
      }
     let buttonTimeout; // Declare a variable for the timer outside the function

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

   createSidebar();
   createAddCardButton();
   createRemoveCardButton();
   createRemoveAllButton();
   createToggleSidebarButton();
   loadCards();

      const currentUrl = window.location.href;
   const siteTitle = document.title || currentUrl;

   document.addEventListener('mouseup', handleMouseUp);

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