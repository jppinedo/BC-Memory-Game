
const Game = {
  started: false,
  activeScreen: 1,
  gridSize: 8,
  cardList: null,
  cardListWrapper: null,
  cardsFlipped: 0,
  movesCount: 0,
  totalMovesCount: 0,
  pairsFound: 0,
  movesElement: null,
  totalMovesElement: null,
  timerElement: null,
  timerInterval: null,
  gameOverModal: null,
  startGameBtn: null,
  diffSelector: null,
  playAgainButton: null,
  flipSound: new Audio('./sound/flip.wav'),
  flipBackSound: new Audio('./sound/flip_back.wav'),
  pairSound: new Audio('./sound/pair.wav'),
  winSound: new Audio('./sound/win.wav'),
  eventListeners: new Map(),
  setDifficulty: function(diff) {
    switch(diff) {
      case "diff-1": this.gridSize = 8; break;
      case "diff-2": this.gridSize = 16; break;
      case "diff-3": this.gridSize = 30; break;
    }
    this.cardListWrapper.classList.add(diff);
  },
  goToScreen: function(index) {
    document.getElementById(`game-screen-${this.activeScreen}`).classList.remove('active');
    document.getElementById(`game-screen-${index}`).classList.add('active');
    this.activeScreen = index;
  },
  getRandomPairs: function(amount) {
    const numbers = Array.from({ length: 30 }, (v, k) => k);

    for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    const selectedNumbers = numbers.slice(0, amount);
    const pairs = selectedNumbers.flatMap(num => [num, num]);

    for (let i = pairs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }

    return pairs;
  },
  getFormattedPairs: function(pairsArray) {
    return pairsArray.map(id => ({id, paired: false}));
  },
  setPairFound: function(flippedCards) {
    console.log('flippedCards', flippedCards)
    flippedCards.forEach(card => {
      const boundOnCardClick = this.eventListeners.get(card);
      card.removeEventListener('click', boundOnCardClick);
      card.classList.add('card-paired');
      card.classList.remove('card-flipped');
    });
    this.setPairStorage(parseInt(flippedCards[0].getAttribute('data-id')));
    this.cardsFlipped = 0;
    this.pairsFound += 1;
  },
  setPairStorage: function(id) {
    const storedCards = sessionStorage.getItem('cardList');
    const cards = JSON.parse(storedCards || '[]');
    console.log(cards);
    if(cards.length) {
      const newCards = cards.map(card => {
        if(card.id === id) return ({id, paired: true});
        return card;
      });
      console.log(newCards);
      sessionStorage.setItem('cardList', JSON.stringify(newCards));
    }
  },
  startTimer: function(seconds = 0) {
    this.timerInterval = setInterval(() => {
      seconds++;
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      const time = `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
      this.timerElement.textContent = time;
      sessionStorage.setItem('gameTimer', seconds);
      
    }, 1000);
  },
  stopTimer: function() {
    clearInterval(this.timerInterval);
  },
  resetTimer: function() {
    this.stopTimer();
    this.timerElement.textContent = '00:00';
  },
  resetCards: function(flippedCards) {
    setTimeout(() => {
      this.flipBackSound.play();
      flippedCards.forEach(card => card.classList.remove('card-flipped'));
      this.cardsFlipped = 0;
    }, 1000);
  },
  removeCards: function() {
    this.removeAllEventListeners();
    this.cardListWrapper.innerHTML = '';
  },
  removeAllEventListeners: function() {
    this.eventListeners.forEach((listener, element) => {
      element.removeEventListener('click', listener);
    });
    this.eventListeners.clear(); // Clear the map after removing all listeners
  },
  updateMoves: function(add = false) {
    if(add) {
      this.movesCount++;
      this.totalMovesCount++;
    }
    this.movesElement.textContent = this.movesCount;
    this.totalMovesElement.textContent = this.totalMovesCount;
    sessionStorage.setItem('gameMoves', this.movesCount);
    localStorage.setItem('totalMoves', this.totalMovesCount);
  },
  isPairCards: function(firstCard, secondCard) {
    const firstCardId = firstCard.classList;
    const secondCardId = secondCard.classList;
    return firstCardId[1] === secondCardId[1];
  },
  toggleModal: function() {
    this.gameOverModal.classList.toggle('active');
  },
  handleFlippedCards: function() {
    const flippedCards = document.querySelectorAll('.card-flipped');

    if(this.isPairCards(flippedCards[0], flippedCards[1])) {
      this.setPairFound(flippedCards);
      const isGameWon = this.pairsFound === this.gridSize;
      if(isGameWon) {
        this.toggleModal();
        this.stopTimer();
        this.winSound.play();
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else {
        this.pairSound.play();
      }
    } else { 
      this.resetCards(flippedCards);
    }

    this.updateMoves(true);
  },
  onCardClick: function (e) {
    const card = e.currentTarget;
    if (this.cardsFlipped < 2 && !card.classList.contains('card-flipped')) {
      card.classList.add('card-flipped');
      this.cardsFlipped++;
      this.flipSound.play();
      if (this.cardsFlipped === 2) {
        this.handleFlippedCards();
      }
    }
  },
  createCardList: function (items) {
    const countTracker = {};
    const fragment = document.createDocumentFragment();

    items.forEach(item => {
      if (!countTracker[item.id]) countTracker[item.id] = 0;
      countTracker[item.id]++;
      const li = document.createElement('li');
      li.className = `card card-${item.id} ${item.paired ? 'card-paired' : ''}`;
      li.id = `card-${item.id}-${countTracker[item.id]}`;
      li.setAttribute('data-id', item.id);

      li.innerHTML = `
          <div class='card-inner'>
              <div class='card-front'></div>
              <div class='card-back'></div>
          </div>
      `;

      const boundOnCardClick = this.onCardClick.bind(this);
      this.eventListeners.set(li, boundOnCardClick);
      li.addEventListener('click', boundOnCardClick);
      fragment.appendChild(li);
    });

    return fragment;
  },
  renderCardList: function(cardList) {
      this.cardListWrapper.innerHTML = '';
      this.cardListWrapper.appendChild(cardList); 
  },
  storeCardsState: function(itemIds) {
    const cards = itemIds.map(itemId => ({id: itemId, paired: false}));
    console
    sessionStorage.setItem('cardList', JSON.stringify(cards));
  },
  storeGameState: function() {
    console.log('store game state')
  },
  startNewGame: function() {
    if(this.started) this.removeAllEventListeners();
    this.cardsFlipped = 0;
    this.pairsFound = 0;
    this.movesCount = 0;
    this.updateMoves();
    const itemIds = this.getRandomPairs(this.gridSize);
    const cardList = this.createCardList(this.getFormattedPairs(itemIds));
    this.cardList = cardList;
    this.renderCardList(cardList);
    this.started = true;
    this.goToScreen(3);
    this.resetTimer();
    this.startTimer();
    this.storeCardsState(itemIds);
    this.storeGameState();
  },
  setNodeElements: function() {
    this.startGameBtn = document.getElementById('start-control');
    this.diffSelector = document.querySelectorAll('.diff-level li');
    this.playAgainButton = document.getElementById('play-again');
    this.cardListWrapper = document.getElementById('card-list');
    this.movesElement = document.getElementById('game-moves');
    this.totalMovesElement = document.getElementById('total-moves');
    this.timerElement = document.getElementById('timer');
    this.gameOverModal = document.getElementById('game-over');
  },
  setEventHandlers: function() {
    const thisGame = this;
    this.startGameBtn.addEventListener('click', () => thisGame.goToScreen(2));
    this.diffSelector.forEach(diff => {
      diff.addEventListener('click', e => {
        thisGame.setDifficulty(e.currentTarget.id);
        thisGame.startNewGame();
      });
    });
    this.playAgainButton.addEventListener('click', () => {
      thisGame.goToScreen(2);
      thisGame.toggleModal();
      thisGame.removeCards();
    });
  },
  populateFromStorage: function() {
    const storedCards = sessionStorage.getItem('cardList');
    const storedSeconds = sessionStorage.getItem('gameTimer');
    const storedMoves = sessionStorage.getItem('gameMoves');
    const storedTotalMoves = localStorage.getItem('totalMoves');
    console.log('storedTotalMoves: ', storedTotalMoves)

    if(storedCards && storedSeconds && storedMoves) {
      // load cards from storage
      const cardList = this.createCardList(JSON.parse(storedCards));
      this.cardList = cardList;
      this.renderCardList(cardList);
      // load timer from strage
      this.startTimer(parseInt(storedSeconds));
      // load moves from storage
      this.movesCount = parseInt(storedMoves);
      
      this.updateMoves();
      this.started = true;
      this.goToScreen(3);
    } else {
      this.goToScreen(1);
    }
    if(storedTotalMoves) {
      this.totalMovesCount = parseInt(storedTotalMoves);
      this.updateMoves();
      console.log('this.totalMovesCount: ', this.totalMovesCount);
    }
  },
  load: function() {
    this.setNodeElements();
    this.setEventHandlers();
    this.populateFromStorage();
  }
}

Game.load();


