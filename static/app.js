// Constants
const FLIP_DURATION = 500;
const JUMP_DURATION = 500;

// Global variables
let guessIndex = 0;
let letterIndex = 0;
let words = new Array(NUM_GUESSES)
let gameStatus = "IN_PROGRESS"; // WIN, LOSE, IN_PROGRESS
let guessedWords = [];
// Stats
let gamesPlayed = 0;
let gamesWon = 0;
let currentStreak = 0;
let maxStreak = 0;
let stats = { "currentStreak": currentStreak, "maxStreak": maxStreak, "gamesWon": gamesWon, "gamesPlayed": gamesPlayed };

// Main

initLocalStorage();
setBoardCss(NUM_GUESSES, NUM_LETTERS);

// Function declarations

// Save theme, tiles, letter & guess vars, gamestatus
async function initLocalStorage() {
    if (resetLocalStorage == "true") resetGameState();

    // Retrieve saved theme
    var theme = window.localStorage.getItem("theme");
    // If theme is present, set it
    if (theme) {
        document.getElementById("body").setAttribute("theme", theme);
    } else {
        window.localStorage.setItem("theme", "light");
    }

    // Retrieve game status
    gameStatus = window.localStorage.getItem("gameStatus") || gameStatus;

    // Retrieve submitted words from JSON
    guessedWords = JSON.parse(window.localStorage.getItem("guessedWords")) || guessedWords;

    // Retrieve wordle to prevent it from loading a new one
    wordle = window.localStorage.getItem("wordle") || wordle;

    // Prefer stats from server
    stats = await getStats()
    stats = stats || JSON.parse(window.localStorage.getItem("stats"));

    if (stats) {
        gamesPlayed = stats.gamesPlayed;
        gamesWon = stats.gamesWon;
        currentStreak = stats.currentStreak;
        maxStreak = stats.maxStreak;

        window.localStorage.setItem("stats", JSON.stringify(stats));
    }
}

async function getStats() {
    const response = await fetch(`http://127.0.0.1:5000/stats`)

    if (!response.ok) {
        return
    }

    const data = await response.json();
    return data;
}

// Resets local storage variables
function resetGameState() {
    window.localStorage.removeItem("gameStatus");
    window.localStorage.removeItem("guessedWords");
    window.localStorage.removeItem("wordle");
}

// Saves game state to local storage
function saveGameState() {
    window.localStorage.setItem("gameStatus", gameStatus);
    window.localStorage.setItem("guessedWords", JSON.stringify(guessedWords));
    window.localStorage.setItem("wordle", wordle);
}

function setBoardCss(NUM_GUESSES, NUM_LETTERS) {
    // Get the root element
    var r = document.querySelector(':root');
    // Set CSS properties to display tiles correctly
    r.style.setProperty('--rows', NUM_GUESSES);
    r.style.setProperty('--letters', NUM_LETTERS);

    // Letters slider
    const sliderLetter = document.getElementById("letter-range");
    let outputLetter = document.getElementById("letter-val");
    outputLetter.innerHTML = sliderLetter.value; // Display the default slider value

    sliderLetter.oninput = function () {
        outputLetter.innerHTML = this.value;
    }

    // Difficulty
    const difficultyRadio = document.getElementById(`diff-${NUM_GUESSES}`);
    difficultyRadio.setAttribute("checked", "checked");
    difficultyRadio.checked = true;

    // Button to show/hide sidebar
    const sidebarButton = document.getElementById("sidebar-button");
    sidebarButton.addEventListener("click", toggleSidebar);

    // Play again button
    const playAgainButton = document.getElementById("play-button");
    playAgainButton.addEventListener("click", newGame);

    // Log-out button
    // const logoutBtn = document.getElementById("logout-button");
    // logoutBtn.addEventListener("click", () => {
    //     // TODO: Clear LocalStorage stats when logging out
    // })

    // Share score button
    const shareBtn = document.getElementById("share-result");
    shareBtn.addEventListener("click", shareScore);
    shareBtn.setAttribute("disabled", true)

    // Modal
    const modal = document.getElementById("modal-container");
    modal.addEventListener("click", closeModal);

    // Dark mode switch
    const themeToggleSwitch = document.getElementById("switch-theme");
    var theme = window.localStorage.getItem('theme');
    themeToggleSwitch.checked = (theme == 'dark' ? true : false);

    themeToggleSwitch.addEventListener("change", () => {
        const body = document.getElementById("body");

        if (themeToggleSwitch.checked) {
            body.setAttribute("theme", "dark");
            window.localStorage.setItem('theme', 'dark');
        } else {
            body.setAttribute("theme", "light");
            window.localStorage.setItem('theme', 'light');
        }
    });

    // Hide alerts created by Flask backend
    hideFlashAlerts();

    // Retrieve guessed words from Local Storage (if available)
    if (guessedWords.length > 0) {
        guessedWords.forEach((word, index) => {
            let row = document.getElementById(`guess-${index}`);
            let tiles = Array.from(row.children);

            // For each row, get the word from guessedWords, and set every Tile's value
            tiles.forEach((tile, index) => {
                let letter = word.charAt(index);

                tile.dataset.letter = letter.toLowerCase();
                tile.innerHTML = letter;
            });

            // Flip tiles for each submitted word
            flipTiles(word, row);
        })
    } else {
        // No submitted words, play immediately
        startInteraction();
    }
}


function startInteraction() {
    // Get keyboard keys and put them in an array
    const keys = Array.from(document.getElementsByClassName("key"));
    keys.forEach((key) => {
        key.addEventListener("click", handleMouseClick);
    });
    document.addEventListener("keydown", handleKeyPress);
}

function stopInteraction() {
    // Get keyboard keys and put them in an array
    const keys = Array.from(document.getElementsByClassName("key"));
    keys.forEach((key) => {
        key.removeEventListener("click", handleMouseClick);
    });
    document.removeEventListener("keydown", handleKeyPress);
}

function handleMouseClick(e) {
    if (e.target.matches("[data-key='Enter']")) {
        submitGuess();
        return;
    }

    if (e.target.matches("[data-key='Back']")) {
        deleteKey();
        return;
    }

    if (e.target.matches("[data-key]")) {
        addKey(e.target.dataset.key);
        return;
    }
}

function handleKeyPress(e) {
    if (e.key === "Enter") {
        submitGuess();
        return;
    }

    if (e.key === "Backspace" || e.key === "Delete") {
        deleteKey();
        return;
    }

    // Regex to see if a valid key was pressed
    if (e.key.match(/^[a-zA-Z]$/)) {
        addKey(e.key.toLowerCase());
        return;
    }

    const sidebarButton = document.getElementById("sidebar-button");
    // If sidebar is open, close it when Esc is pressed
    // TODO: Fix esc key not working when game is over
    if (sidebarButton.dataset.state == "open" && e.key === "Escape") {
        toggleSidebar();
    }
}

function addKey(key) {
    // Limit number of tiles to be written
    if (letterIndex < NUM_LETTERS) {
        const tile = document.getElementById(`tile-${guessIndex}-${letterIndex}`);
        tile.dataset.letter = key.toLowerCase();
        tile.dataset.state = "active";
        tile.textContent = key;

        // Add pop animation when writing on tiles
        tile.classList.add("pop")
        tile.addEventListener(
            "animationend",
            () => {
                tile.classList.remove("pop");
            },
            { once: true }
        );

        // Advance to next tile
        letterIndex++;
    }

    return;
}

function deleteKey() {
    // Limit number of tiles to be deleted
    if (letterIndex > 0) {
        // Go back a tile
        letterIndex--;

        const tile = document.getElementById(`tile-${guessIndex}-${letterIndex}`);

        delete tile.dataset.letter;
        delete tile.dataset.state;
        tile.textContent = "";
    }

    return;
}

async function submitGuess() {
    // Get Word
    const row = document.getElementById(`guess-${guessIndex}`);

    // Check if user inserted enough letters to submit
    if (letterIndex < NUM_LETTERS) {
        showAlert("Not enough letters");
        shakeRow(row);
        return;
    }

    // Get array of tile letters of the current row
    const tiles = Array.from(row.children);
    let word = '';
    tiles.forEach((tile) => {
        // For each tile, get the contents and append it to the word
        word = word + tile.innerHTML;
    });

    // Check if word exists
    const wordExists = await checkWord(word);
    console.log(word)
    if (wordExists) {
        flipTiles(word, row);
        // Save the word and convert it to JSON for storage
        guessedWords.push(word);
    } else {
        showAlert("Not in word list!");
        shakeRow(row);
    }

    console.log(guessedWords)

    return;
}

async function checkWord(word) {
    const response = await fetch(`http://127.0.0.1:5000/check?word=${word}`);

    if (response.ok) {
        return true;
    } else {
        return false;
    }
}

function showAlert(msg, duration = 1000, type = "Message") {
    const alertContainer = document.getElementById("alert-container");
    const alert = document.createElement("div");
    alert.classList.add("alert");
    if (type == "Error") alert.classList.add("error");
    alert.textContent = msg;
    alertContainer.prepend(alert);

    if (duration == null) return;

    // If the duration is specified, add the "hide" class to the alert element
    setTimeout(() => {
        alert.classList.add("hide");
        // As soon as the fade out transition ends, delete the element
        alert.addEventListener("transitionend",
            () => {
                alert.remove();
            });
    }, duration);
}

function hideFlashAlerts() {
    // Hide alerts created by the server
    const flashAlerts = Array.from(document.getElementsByClassName("flash"))

    flashAlerts.forEach((flash) => {
        setTimeout(() => {
            flash.classList.add("hide");
            // As soon as the fade out transition ends, delete the element
            flash.addEventListener("transitionend", () => { flash.remove() })
        }, 2000)
    })
}

// If the guess is incorrect, shake the whole row
function shakeRow(row) {
    row.classList.add("shake");

    // Once the shake ends its animation, remove the class
    row.addEventListener(
        "animationend",
        () => {
            row.classList.remove("shake");
        },
        { once: true }
    );
    return;
}

function checkWin(word, saveStatsAfterWin = true) {
    // Win condition
    if (word === wordle) {
        gameStatus = "WIN";

        let winMsg;
        if (guessIndex == 0) { winMsg = "Genius" }
        if (guessIndex == 1) { winMsg = "Magnificent" }
        if (guessIndex == 2) { winMsg = "Impressive" }
        if (guessIndex == 3) { winMsg = "Splendid" }
        if (guessIndex == 4) { winMsg = "Great" }
        if (guessIndex >= NUM_GUESSES - 1) { winMsg = "Phew" }

        jumpTiles();
        showAlert(winMsg, 5000);
        stopInteraction();
        if (saveStatsAfterWin) {
            saveStats();
        }
        endScreen();
    } else if (guessIndex >= (NUM_GUESSES - 1)) {
        gameStatus = "LOSE";
        showAlert(wordle.toUpperCase(), null);
        stopInteraction();
        if (saveStatsAfterWin) {
            saveStats();
        }
        endScreen();
    } else {
        advanceRow()
    }

    saveGameState()
    return;
}

function advanceRow() {
    // Restart tile position
    letterIndex = 0;
    // Advance a row
    guessIndex++;
}

function flipTiles(wordGuess, row) {
    // Prevent interaction while animation is running
    stopInteraction();

    // Get array of tiles of the current row
    const rowTiles = Array.from(row.children);
    const tileColorsArr = colorTiles(wordGuess);

    // Pass all the information to the flipTile function
    rowTiles.forEach((...params) => flipTile(...params, wordGuess, tileColorsArr));

    return;
}

// Execute for each tile in guess
function flipTile(tile, index, array, wordGuess, tileColorsArr) {
    const tileLetter = tile.dataset.letter;
    const key = document.querySelector(`[data-key="${tileLetter}"i]`);

    let tileColor = tileColorsArr[index];

    // Flip 90 deg, change color, then flip back for each tile
    setTimeout(() => {
        tile.classList.add("flip");
    }, (index * FLIP_DURATION / 2));

    tile.addEventListener("transitionend", () => {
        tile.classList.remove("flip");

        // Set tile & key color
        tile.dataset.state = tileColor;
        key.dataset.state = tileColor;

        // Wait until last tile animation ends
        if (index == array.length - 1) {
            tile.addEventListener("transitionend", () => {
                // Resume user interaction
                if (gameStatus === "IN_PROGRESS") {
                    startInteraction();
                    checkWin(wordGuess);
                } else {
                    // Game was already finished, don't update stats
                    checkWin(wordGuess, false);
                }
            })
        }
    });
}

function colorTiles(wordGuess) {
    const guessArr = Array.from(wordGuess);
    const wordleArr = Array.from(wordle);

    // Every tile starts as wrong
    const result = Array(NUM_LETTERS).fill("wrong");

    for (let i = 0; i < NUM_LETTERS; i++) {
        // If letter is in correct place, mark as correct
        if (guessArr[i] === wordleArr[i]) {
            // Remove correct letters
            wordleArr[i] = "";
            guessArr[i] = "";

            result[i] = "correct";
        }
    }

    // Obtain letters present in wordle
    for (let i = 0; i < NUM_LETTERS; i++) {
        // Skip correctly-guessed letters 
        if (guessArr[i] === "") continue;

        const index = wordleArr.indexOf(guessArr[i]);
        // A negative index means the letter is already guessed correctly, remove it
        if (index !== -1) {
            wordleArr[index] = "";

            result[i] = "present";
        }
    }

    // Returns array of colors
    return result;
}

function jumpTiles() {
    // Get array of tiles of the current row
    const row = document.querySelector(`#guess-${guessIndex}`);

    const rowTiles = Array.from(row.children);
    rowTiles.forEach((tile, index) => {
        setTimeout(() => {
            tile.classList.add("jump")
            tile.addEventListener(
                "animationend",
                () => {
                    tile.classList.remove("jump");
                },
                { once: true }
            )
        }, (index * JUMP_DURATION / NUM_LETTERS))
    })
}

async function endScreen() {
    // Show word definition
    let definition = await getDefinition(wordle);
    const definitionDialog = document.getElementById("definition-dialog");
    if (definition != null) {
        definitionDialog.innerHTML = definition;
    } else {
        definitionDialog.innerHTML = "Definition not found!";
    }

    // Show stats
    const winPerc = (gamesWon * 100) / gamesPlayed
    let msg = ""
    msg += `<b>Played</b>: ${gamesPlayed} <br>`
    msg += `<b>Win %</b>: ${winPerc.toFixed(1)} <br>`
    msg += `<b>Current Streak</b>: ${currentStreak} <br>`
    msg += `<b>Max Streak</b>: ${maxStreak} <br>`

    const statsContainer = document.getElementById("statistics-container")
    statsContainer.innerHTML = msg

    // Show modal after 1.5 sec
    setTimeout(() => {
        document.getElementById("modal-container").style.display = "flex";
    }, ((FLIP_DURATION / 2) * NUM_LETTERS))

    // Show play again button
    document.getElementById("play-button").removeAttribute("style");

    // Enable share score button
    document.getElementById("share-result").removeAttribute("disabled")

    return;
}

function saveStats() {
    updateStats()
    // Save stats as JSON
    stats = { "currentStreak": currentStreak, "maxStreak": maxStreak, "gamesWon": gamesWon, "gamesPlayed": gamesPlayed };

    // Save stats to LocalStorage
    window.localStorage.setItem("stats", JSON.stringify(stats));

    // If logged in, save stats in DB with an AJAX request to the back-end
    const request = new XMLHttpRequest();
    request.open("POST", "/stats")
    request.setRequestHeader("Content-Type", "application/json");
    request.send(JSON.stringify(stats));
}

function updateStats() {
    if (gameStatus == "WIN") {
        currentStreak++;
        gamesWon++;
    } else if (gameStatus == "LOSE") {
        currentStreak = 0;
    }
    // Check streak
    if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
    }
    gamesPlayed++
}

async function getDefinition(word) {
    let response = await fetch(`http://127.0.0.1:5000/define?word=${word}`)
    if (!response.ok) return

    return response.text()
}

function shareScore() {
    // Can't share score if game hasn't ended yet
    if (gameStatus === "IN_PROGRESS") return;

    // Empty emoji list
    let row = [];
    // Empty emoji 2d array
    let emojis = [];
    // Initial msg
    let msg;

    // Last attempt without guessing the wordle?
    if (gameStatus === "LOSE") {
        msg = `X/${NUM_GUESSES} attempts 😢\n`;
    } else {
        msg = `${guessIndex + 1}/${NUM_GUESSES} attempts 😎\n`;
    }

    emojis.push(msg);

    for (let i = 0; i <= guessIndex; i++) {
        // Reset variable
        row = [];
        for (let j = 0; j < NUM_LETTERS; j++) {
            var tile = document.querySelector(`#tile-${i}-${j}`)
            var tileState = tile.dataset.state;

            if (tileState == "correct") {
                row.push("🟩");
            } else if (tileState == "present") {
                row.push("🟨");
            } else if (tileState == "wrong") {
                row.push("⬛️");
            }
        }
        // Transform the row into a string (no commas) and push it to the emoji array
        emojis.push(row.join(''));
    }

    // Convert array to string separated by new lines
    emojis = emojis.join("\n");

    // Copy results to clipboard
    navigator.clipboard.writeText(emojis);

    showAlert("Copied results to clipboard")
}

// Function gets called on button click
function toggleSidebar() {
    const button = document.getElementById("sidebar-button");
    const sidebar = document.getElementById("sidebar");

    // Sidebar is open, close it
    if (button.dataset.state == "open") {

        sidebar.classList.add("hide");
        sidebar.addEventListener(
            "animationend",
            () => {
                sidebar.classList.remove("hide");
                sidebar.style.display = "none";
            },
            { once: true }
        );

        button.dataset.state = "closed";
        button.innerHTML = "Menu";

        return;
    }

    // Sidebar is closed, open it
    if (button.dataset.state == "closed") {

        sidebar.style.display = "block";
        sidebar.classList.add("show");
        sidebar.addEventListener(
            "animationend",
            () => {
                sidebar.classList.remove("show");
            },
            { once: true }
        );

        button.dataset.state = "open";
        button.innerHTML = "Close";

        return;
    }
}

function newGame() {
    // Reset local storage
    resetGameState();
    location.reload();
}

function closeModal() {
    const modal = document.getElementById("modal-container");
    modal.style.display = "none";
}