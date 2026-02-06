package com.playtogether.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import com.playtogether.data.api.ConnectionState
import com.playtogether.data.model.GameState
import com.playtogether.data.model.GameType
import com.playtogether.data.repository.GameRepository
import com.playtogether.ui.theme.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
import org.json.JSONObject
import javax.inject.Inject

@HiltViewModel
class GameViewModel @Inject constructor(
    private val repository: GameRepository
) : ViewModel() {

    val room = repository.room
    val playerId = repository.playerId
    val gameState = repository.gameState
    val connectionState = repository.connectionState
    val timerValue = repository.timerValue
    val rawGameState = repository.rawGameState

    fun sendAction(action: String, data: JSONObject = JSONObject()) {
        repository.sendGameAction(action, data)
    }

    fun leaveGame() {
        repository.leaveRoom()
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GameScreen(
    code: String,
    viewModel: GameViewModel = hiltViewModel(),
    onGameEnd: () -> Unit
) {
    val room by viewModel.room.collectAsState()
    val playerId by viewModel.playerId.collectAsState()
    val gameState by viewModel.gameState.collectAsState()
    val connectionState by viewModel.connectionState.collectAsState()
    val timerValue by viewModel.timerValue.collectAsState()
    val rawState by viewModel.rawGameState.collectAsState()

    val isReconnecting = connectionState == ConnectionState.RECONNECTING ||
            connectionState == ConnectionState.CONNECTING

    // Navigate back if room is gone - with grace period for reconnect
    LaunchedEffect(room) {
        if (room == null) {
            delay(5000)
            if (viewModel.room.value == null) {
                onGameEnd()
            }
        }
    }

    // Navigate back to lobby when game ends (status changes to finished/waiting)
    LaunchedEffect(room?.status) {
        val status = room?.status
        if (status == "finished" || status == "waiting") {
            // Small delay so players see the final state
            delay(500)
            onGameEnd()
        }
    }

    val currentRoom = room ?: run {
        Box(
            modifier = Modifier.fillMaxSize().background(Background),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                CircularProgressIndicator(color = Primary)
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "Verbinde...",
                    style = MaterialTheme.typography.titleMedium,
                    color = TextSecondary
                )
            }
        }
        return
    }
    val currentGameState = gameState

    val gameType = GameType.fromId(currentRoom.gameType)

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = gameType?.icon ?: "",
                            fontSize = 24.sp
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = gameType?.displayName ?: currentRoom.gameType,
                            style = MaterialTheme.typography.titleMedium
                        )
                    }
                },
                actions = {
                    // Round indicator
                    currentGameState?.let { state ->
                        Text(
                            text = "Runde ${state.currentRound}/${state.totalRounds}",
                            style = MaterialTheme.typography.bodyMedium,
                            color = TextSecondary,
                            modifier = Modifier.padding(end = 8.dp)
                        )
                    }

                    IconButton(onClick = {
                        viewModel.leaveGame()
                        onGameEnd()
                    }) {
                        Icon(
                            Icons.Default.Close,
                            contentDescription = "Beenden",
                            tint = Error
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Surface
                )
            )
        },
        containerColor = Background
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // Game Content
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
                when (currentRoom.gameType) {
                    "quiz_champ" -> QuizChampGame(
                        gameState = currentGameState,
                        timerValue = timerValue,
                        rawState = rawState,
                        playerId = playerId,
                        onAnswer = { index ->
                            viewModel.sendAction("answer", JSONObject().apply {
                                put("answerIndex", index)
                            })
                        }
                    )
                    "entweder_oder" -> EntwederOderGame(
                        gameState = currentGameState,
                        timerValue = timerValue,
                        rawState = rawState,
                        onVote = { choice ->
                            viewModel.sendAction("vote", JSONObject().apply {
                                put("choice", choice)
                            })
                        }
                    )
                    "anagramme" -> AnagrammeGame(
                        gameState = currentGameState,
                        timerValue = timerValue,
                        rawState = rawState,
                        playerId = playerId,
                        onSubmit = { word ->
                            viewModel.sendAction("submit_word", JSONObject().apply {
                                put("word", word)
                            })
                        }
                    )
                    "hangman" -> HangmanGame(
                        gameState = currentGameState,
                        timerValue = timerValue,
                        rawState = rawState,
                        onGuess = { letter ->
                            viewModel.sendAction("guess_letter", JSONObject().apply {
                                put("letter", letter.toString())
                            })
                        }
                    )
                    "tic_tac_toe" -> TicTacToeGame(
                        gameState = currentGameState,
                        timerValue = timerValue,
                        rawState = rawState,
                        playerId = playerId,
                        onMove = { row, col ->
                            viewModel.sendAction("place_mark", JSONObject().apply {
                                put("row", row)
                                put("col", col)
                            })
                        }
                    )
                    "rock_paper_scissors" -> RockPaperScissorsGame(
                        gameState = currentGameState,
                        timerValue = timerValue,
                        rawState = rawState,
                        playerId = playerId,
                        onChoice = { choice ->
                            viewModel.sendAction("choose", JSONObject().apply {
                                put("choice", choice)
                            })
                        }
                    )
                    "gluecksrad" -> GluecksradGame(
                        gameState = currentGameState,
                        timerValue = timerValue,
                        rawState = rawState,
                        playerId = playerId,
                        onSpin = {
                            viewModel.sendAction("spin", JSONObject())
                        },
                        onGuessLetter = { letter ->
                            viewModel.sendAction("guess_letter", JSONObject().apply {
                                put("letter", letter.toString())
                            })
                        },
                        onSolve = { solution ->
                            viewModel.sendAction("solve", JSONObject().apply {
                                put("solution", solution)
                            })
                        }
                    )
                    else -> PlaceholderGame(gameType = gameType)
                }
            }

            // Scoreboard
            ScoreBoard(
                players = currentRoom.players,
                scores = currentGameState?.scores ?: emptyMap(),
                currentPlayerId = playerId
            )
        }
    }

    // Reconnecting overlay
    if (isReconnecting) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.6f)),
            contentAlignment = Alignment.Center
        ) {
            Card(
                colors = CardDefaults.cardColors(containerColor = Surface),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(
                    modifier = Modifier.padding(32.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    CircularProgressIndicator(color = Primary)
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "Verbindung wird wiederhergestellt...",
                        style = MaterialTheme.typography.titleMedium,
                        color = TextPrimary
                    )
                }
            }
        }
    }
}

// ============================================================
// Quiz Champ Game
// ============================================================

@Composable
fun QuizChampGame(
    gameState: GameState?,
    timerValue: Int,
    rawState: JSONObject?,
    playerId: String?,
    onAnswer: (Int) -> Unit
) {
    var selectedAnswer by remember { mutableStateOf<Int?>(null) }

    LaunchedEffect(gameState?.currentRound) {
        selectedAnswer = null
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        if (gameState == null) {
            CircularProgressIndicator(color = Primary)
            return
        }

        // Timer
        Text(
            text = "${timerValue}s",
            style = MaterialTheme.typography.headlineLarge,
            fontWeight = FontWeight.Bold,
            color = if (timerValue <= 5) Error else TextPrimary
        )

        Spacer(modifier = Modifier.height(12.dp))

        // Streak display
        val streak = rawState?.optJSONObject("streaks")?.optInt(playerId ?: "", 0) ?: 0
        if (streak >= 2) {
            Text(
                text = "${streak}x Streak!",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
                color = Color(0xFFF59E0B)
            )
            Spacer(modifier = Modifier.height(8.dp))
        }

        // Question text
        val questionObj = rawState?.optJSONObject("currentQuestion")
        val questionText = questionObj?.optString("question", "") ?: ""
        val showCorrectAnswer = rawState?.optBoolean("showCorrectAnswer", false) ?: false
        val correctAnswerIndex = rawState?.optInt("correctAnswerIndex", -1) ?: -1

        if (questionText.isNotEmpty()) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 8.dp),
                colors = CardDefaults.cardColors(containerColor = Surface),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text(
                    text = questionText,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center,
                    color = TextPrimary,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                )
            }
        } else {
            Text(
                text = if (gameState.phase == "showing_results") "Ergebnisse" else "Frage",
                style = MaterialTheme.typography.titleMedium,
                color = TextSecondary
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Answer buttons (4 options)
        val options = questionObj?.optJSONArray("options")
        val optionColors = listOf(
            Color(0xFF3B82F6),
            Color(0xFFEF4444),
            Color(0xFF22C55E),
            Color(0xFFF59E0B)
        )

        for (index in 0 until 4) {
            val optionText = options?.optString(index, "Antwort ${index + 1}") ?: "Antwort ${index + 1}"
            val isCorrect = showCorrectAnswer && index == correctAnswerIndex
            val isWrongSelected = showCorrectAnswer && selectedAnswer == index && index != correctAnswerIndex

            val bgColor = when {
                isCorrect -> Color(0xFF22C55E)
                isWrongSelected -> Color(0xFFEF4444)
                selectedAnswer == index -> optionColors[index]
                else -> Surface
            }
            val disabledBgColor = when {
                isCorrect -> Color(0xFF22C55E).copy(alpha = 0.8f)
                isWrongSelected -> Color(0xFFEF4444).copy(alpha = 0.8f)
                selectedAnswer == index -> optionColors[index].copy(alpha = 0.7f)
                else -> SurfaceLight
            }

            Button(
                onClick = {
                    if (selectedAnswer == null && gameState.phase != "showing_results") {
                        selectedAnswer = index
                        onAnswer(index)
                    }
                },
                enabled = selectedAnswer == null && gameState.phase != "showing_results",
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp)
                    .padding(vertical = 4.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = bgColor,
                    disabledContainerColor = disabledBgColor
                )
            ) {
                Text(
                    text = optionText,
                    style = MaterialTheme.typography.titleMedium,
                    color = if (selectedAnswer == index || isCorrect || isWrongSelected) Color.White else TextPrimary,
                    maxLines = 2
                )
            }
        }

        if (selectedAnswer != null && !showCorrectAnswer) {
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "Warte auf andere Spieler...",
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary
            )
        }
    }
}

// ============================================================
// Entweder/Oder Game
// ============================================================

@Composable
fun EntwederOderGame(
    gameState: GameState?,
    timerValue: Int,
    rawState: JSONObject?,
    onVote: (String) -> Unit
) {
    var selectedOption by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(gameState?.currentRound) {
        selectedOption = null
    }

    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        if (gameState == null) {
            CircularProgressIndicator(color = Primary)
            return
        }

        // Timer
        Text(
            text = "${timerValue}s",
            style = MaterialTheme.typography.headlineLarge,
            fontWeight = FontWeight.Bold,
            color = if (timerValue <= 3) Error else TextPrimary
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Get actual option texts from raw state
        val questionObj = rawState?.optJSONObject("currentQuestion")
        val optionAText = questionObj?.optString("optionA", "Option A") ?: "Option A"
        val optionBText = questionObj?.optString("optionB", "Option B") ?: "Option B"

        // Results from server
        val results = rawState?.optJSONObject("results")
        val percentA = results?.optInt("percentA", 0) ?: 0
        val percentB = results?.optInt("percentB", 0) ?: 0
        val showResults = results != null && gameState.phase == "showing_results"

        // Two big option buttons side by side
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Option A
            Button(
                onClick = {
                    if (selectedOption == null && gameState.phase != "showing_results") {
                        selectedOption = "A"
                        onVote("A")
                    }
                },
                enabled = selectedOption == null && gameState.phase != "showing_results",
                modifier = Modifier
                    .weight(1f)
                    .height(120.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (selectedOption == "A") Primary else Surface,
                    disabledContainerColor = if (selectedOption == "A") Primary else SurfaceLight
                )
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = optionAText,
                        style = MaterialTheme.typography.titleMedium,
                        textAlign = TextAlign.Center,
                        maxLines = 3
                    )
                    if (showResults) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "${percentA}%",
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold,
                            color = if (selectedOption == "A") Color.White else Primary
                        )
                    }
                }
            }

            // VS
            Text(
                text = "VS",
                style = MaterialTheme.typography.titleSmall,
                color = TextSecondary,
                modifier = Modifier.align(Alignment.CenterVertically)
            )

            // Option B
            Button(
                onClick = {
                    if (selectedOption == null && gameState.phase != "showing_results") {
                        selectedOption = "B"
                        onVote("B")
                    }
                },
                enabled = selectedOption == null && gameState.phase != "showing_results",
                modifier = Modifier
                    .weight(1f)
                    .height(120.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (selectedOption == "B") Secondary else Surface,
                    disabledContainerColor = if (selectedOption == "B") Secondary else SurfaceLight
                )
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = optionBText,
                        style = MaterialTheme.typography.titleMedium,
                        textAlign = TextAlign.Center,
                        maxLines = 3
                    )
                    if (showResults) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "${percentB}%",
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold,
                            color = if (selectedOption == "B") Color.White else Secondary
                        )
                    }
                }
            }
        }

        if (selectedOption != null && !showResults) {
            Spacer(modifier = Modifier.height(24.dp))
            Text(
                text = "Warte auf andere Spieler...",
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary
            )
        }
    }
}

// ============================================================
// Anagramme Game
// ============================================================

@Composable
fun AnagrammeGame(
    gameState: GameState?,
    timerValue: Int,
    rawState: JSONObject?,
    playerId: String?,
    onSubmit: (String) -> Unit
) {
    var inputWord by remember { mutableStateOf("") }

    LaunchedEffect(gameState?.currentRound) {
        inputWord = ""
    }

    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        if (gameState == null) {
            CircularProgressIndicator(color = Primary)
            return
        }

        // Timer
        Text(
            text = "${timerValue}s",
            style = MaterialTheme.typography.headlineLarge,
            fontWeight = FontWeight.Bold,
            color = if (timerValue <= 5) Error else TextPrimary
        )

        Spacer(modifier = Modifier.height(12.dp))

        // Category
        val category = rawState?.optString("category", "") ?: ""
        if (category.isNotEmpty()) {
            Text(
                text = "Kategorie: $category",
                style = MaterialTheme.typography.titleSmall,
                color = TextSecondary
            )
            Spacer(modifier = Modifier.height(8.dp))
        }

        Text(
            text = "Finde das Wort!",
            style = MaterialTheme.typography.titleMedium,
            color = TextSecondary
        )

        Spacer(modifier = Modifier.height(20.dp))

        // Check if player solved it
        val solved = rawState?.optJSONObject("solved")?.optBoolean(playerId ?: "", false) ?: false
        val revealedWord = rawState?.optString("revealedWord", "") ?: ""
        val scrambledWord = rawState?.optString("scrambledWord", "") ?: ""

        // Scrambled letters display or revealed word
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            colors = CardDefaults.cardColors(
                containerColor = if (revealedWord.isNotEmpty()) Color(0xFF22C55E).copy(alpha = 0.15f) else Surface
            ),
            shape = RoundedCornerShape(16.dp)
        ) {
            Text(
                text = when {
                    revealedWord.isNotEmpty() -> revealedWord
                    scrambledWord.isNotEmpty() -> scrambledWord.toList().joinToString(" ")
                    else -> "..."
                },
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center,
                letterSpacing = if (revealedWord.isEmpty()) 4.sp else 2.sp,
                color = if (revealedWord.isNotEmpty()) Color(0xFF22C55E) else Primary,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp)
            )
        }

        Spacer(modifier = Modifier.height(20.dp))

        if (solved) {
            Text(
                text = "Richtig!",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF22C55E)
            )
        } else if (revealedWord.isEmpty()) {
            // Text input
            OutlinedTextField(
                value = inputWord,
                onValueChange = { inputWord = it },
                label = { Text("Dein Wort") },
                placeholder = { Text("Wort eingeben...") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                keyboardActions = KeyboardActions(onDone = {
                    if (inputWord.isNotBlank()) {
                        onSubmit(inputWord.trim())
                        inputWord = ""
                    }
                }),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
            )

            Spacer(modifier = Modifier.height(16.dp))

            Button(
                onClick = {
                    if (inputWord.isNotBlank()) {
                        onSubmit(inputWord.trim())
                        inputWord = ""
                    }
                },
                enabled = inputWord.isNotBlank(),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
                    .height(48.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Primary)
            ) {
                Text("Absenden")
            }
        }
    }
}

// ============================================================
// Hangman Game
// ============================================================

@Composable
fun HangmanGame(
    gameState: GameState?,
    timerValue: Int,
    rawState: JSONObject?,
    onGuess: (Char) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Top
    ) {
        if (gameState == null) {
            CircularProgressIndicator(color = Primary)
            return
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Timer
        Text(
            text = "${timerValue}s",
            style = MaterialTheme.typography.headlineLarge,
            fontWeight = FontWeight.Bold,
            color = if (timerValue <= 5) Error else TextPrimary
        )

        Spacer(modifier = Modifier.height(8.dp))

        // Category
        val category = rawState?.optString("category", "") ?: ""
        if (category.isNotEmpty()) {
            Text(
                text = "Kategorie: $category",
                style = MaterialTheme.typography.titleSmall,
                color = TextSecondary
            )
            Spacer(modifier = Modifier.height(4.dp))
        }

        // Error count
        val wrongCount = rawState?.optInt("wrongCount", 0) ?: 0
        val maxWrong = rawState?.optInt("maxWrong", 8) ?: 8
        Text(
            text = "Fehler: $wrongCount / $maxWrong",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = if (wrongCount >= maxWrong - 2) Error else TextSecondary
        )

        Spacer(modifier = Modifier.height(12.dp))

        // Word display from server
        val wordDisplay = rawState?.optString("wordDisplay", "") ?: ""
        val revealedWord = rawState?.optString("revealedWord", "") ?: ""
        val displayText = when {
            revealedWord.isNotEmpty() -> revealedWord
            wordDisplay.isNotEmpty() -> wordDisplay
            else -> "_ _ _ _ _ _"
        }

        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            colors = CardDefaults.cardColors(
                containerColor = if (revealedWord.isNotEmpty()) Color(0xFF22C55E).copy(alpha = 0.15f) else Surface
            ),
            shape = RoundedCornerShape(16.dp)
        ) {
            Text(
                text = displayText,
                style = MaterialTheme.typography.headlineLarge,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center,
                letterSpacing = 4.sp,
                color = if (revealedWord.isNotEmpty()) Color(0xFF22C55E) else TextPrimary,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp)
            )
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Sync guessed letters from server
        val guessedLettersArray = rawState?.optJSONArray("guessedLetters")
        val serverGuessedLetters = if (guessedLettersArray != null) {
            (0 until guessedLettersArray.length()).map {
                guessedLettersArray.optString(it, "").uppercase().firstOrNull() ?: ' '
            }.toSet()
        } else {
            emptySet()
        }

        // Correct/wrong letter sets for coloring
        val correctLettersArray = rawState?.optJSONArray("correctLetters")
        val correctLetters = if (correctLettersArray != null) {
            (0 until correctLettersArray.length()).map {
                correctLettersArray.optString(it, "").uppercase().firstOrNull() ?: ' '
            }.toSet()
        } else {
            emptySet()
        }

        val solved = rawState?.optBoolean("solved", false) ?: false
        val isInputDisabled = solved || revealedWord.isNotEmpty()

        // Letter keyboard (A-Z grid)
        val alphabet = ('A'..'Z').toList()
        LazyVerticalGrid(
            columns = GridCells.Fixed(7),
            horizontalArrangement = Arrangement.spacedBy(4.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(200.dp)
                .padding(horizontal = 8.dp)
        ) {
            items(alphabet) { letter ->
                val isGuessed = serverGuessedLetters.contains(letter)
                val isCorrectLetter = correctLetters.contains(letter)
                Button(
                    onClick = {
                        if (!isGuessed && !isInputDisabled) {
                            onGuess(letter)
                        }
                    },
                    enabled = !isGuessed && !isInputDisabled,
                    modifier = Modifier
                        .aspectRatio(1f),
                    shape = RoundedCornerShape(8.dp),
                    contentPadding = PaddingValues(0.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Primary,
                        disabledContainerColor = when {
                            isGuessed && isCorrectLetter -> Color(0xFF22C55E).copy(alpha = 0.5f)
                            isGuessed -> Error.copy(alpha = 0.4f)
                            else -> SurfaceLight
                        }
                    )
                ) {
                    Text(
                        text = letter.toString(),
                        style = MaterialTheme.typography.bodyLarge,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

// ============================================================
// Tic Tac Toe Game
// ============================================================

@Composable
fun TicTacToeGame(
    gameState: GameState?,
    timerValue: Int,
    rawState: JSONObject?,
    playerId: String?,
    onMove: (Int, Int) -> Unit
) {
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        if (gameState == null) {
            CircularProgressIndicator(color = Primary)
            return
        }

        // Timer
        Text(
            text = "${timerValue}s",
            style = MaterialTheme.typography.headlineLarge,
            fontWeight = FontWeight.Bold,
            color = if (timerValue <= 5) Error else TextPrimary
        )

        Spacer(modifier = Modifier.height(8.dp))

        // Parse current match from raw state
        val matchIndex = rawState?.optInt("currentMatchIndex", 0) ?: 0
        val matchesArray = rawState?.optJSONArray("matches")
        val currentMatch = matchesArray?.optJSONObject(matchIndex)

        val currentTurn = currentMatch?.optString("currentTurn", "") ?: ""
        val player1 = currentMatch?.optString("player1", "") ?: ""
        val player2 = currentMatch?.optString("player2", "") ?: ""
        val boardArray = currentMatch?.optJSONArray("board")
        val matchFinished = currentMatch?.optBoolean("finished", false) ?: false
        val matchWinner = if (currentMatch?.isNull("winner") == false) currentMatch.optString("winner", "") else null

        // Parse board: 9 cells
        val board = if (boardArray != null) {
            (0 until 9).map { i ->
                if (boardArray.isNull(i)) null else boardArray.optString(i, null)
            }
        } else {
            List(9) { null }
        }

        val isMyTurn = currentTurn == playerId && !matchFinished

        // Turn indicator
        val turnText = when {
            matchFinished && matchWinner == playerId -> "Du hast gewonnen!"
            matchFinished && matchWinner != null && matchWinner.isNotEmpty() -> "Verloren!"
            matchFinished -> "Unentschieden!"
            isMyTurn -> "Du bist dran!"
            currentTurn.isNotEmpty() -> "Warte auf Gegner..."
            else -> gameState.phase
        }

        Text(
            text = turnText,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = if (isMyTurn) FontWeight.Bold else FontWeight.Normal,
            color = if (isMyTurn) Primary else TextSecondary
        )

        Spacer(modifier = Modifier.height(24.dp))

        // 3x3 Grid
        Card(
            modifier = Modifier.size(280.dp),
            colors = CardDefaults.cardColors(containerColor = Surface),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(12.dp),
                verticalArrangement = Arrangement.SpaceEvenly
            ) {
                for (row in 0..2) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        for (col in 0..2) {
                            val cellIndex = row * 3 + col
                            val cellValue = board.getOrNull(cellIndex)

                            // Map player IDs to X/O
                            val mark = when (cellValue) {
                                player1 -> "X"
                                player2 -> "O"
                                else -> ""
                            }
                            val markColor = when (cellValue) {
                                player1 -> Color(0xFF3B82F6)
                                player2 -> Color(0xFFEF4444)
                                else -> Color.Transparent
                            }

                            Box(
                                modifier = Modifier
                                    .size(76.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(SurfaceLight)
                                    .border(
                                        width = 2.dp,
                                        color = if (isMyTurn && cellValue == null)
                                            Primary.copy(alpha = 0.5f) else Primary.copy(alpha = 0.2f),
                                        shape = RoundedCornerShape(12.dp)
                                    )
                                    .clickable {
                                        if (cellValue == null && isMyTurn) {
                                            onMove(row, col)
                                        }
                                    },
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = mark,
                                    fontSize = 32.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = markColor
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

// ============================================================
// Rock Paper Scissors Game
// ============================================================

@Composable
fun RockPaperScissorsGame(
    gameState: GameState?,
    timerValue: Int,
    rawState: JSONObject?,
    playerId: String?,
    onChoice: (String) -> Unit
) {
    var selectedChoice by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(gameState?.currentRound) {
        selectedChoice = null
    }

    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        if (gameState == null) {
            CircularProgressIndicator(color = Primary)
            return
        }

        // Timer
        Text(
            text = "${timerValue}s",
            style = MaterialTheme.typography.headlineLarge,
            fontWeight = FontWeight.Bold,
            color = if (timerValue <= 3) Error else TextPrimary
        )

        Spacer(modifier = Modifier.height(12.dp))

        // Parse match state
        val matchIndex = rawState?.optInt("currentMatchIndex", 0) ?: 0
        val matchesArray = rawState?.optJSONArray("matches")
        val currentMatch = matchesArray?.optJSONObject(matchIndex)
        val matchFinished = currentMatch?.optBoolean("finished", false) ?: false
        val matchWinner = if (currentMatch?.isNull("winner") == false) currentMatch.optString("winner", "") else null
        val bye = rawState?.optString("bye", "") ?: ""

        // Check if this player has a bye
        if (bye == playerId) {
            Text(
                text = "Freilos!",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = Primary
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Du kommst automatisch weiter.",
                style = MaterialTheme.typography.bodyLarge,
                color = TextSecondary
            )
            return
        }

        val statusText = when {
            matchFinished && matchWinner == playerId -> "Gewonnen!"
            matchFinished && matchWinner != null && matchWinner.isNotEmpty() -> "Verloren!"
            matchFinished -> "Unentschieden!"
            gameState.phase == "showing_results" -> "Ergebnis"
            else -> "Wahle!"
        }

        Text(
            text = statusText,
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            color = TextPrimary
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Show opponent's choice in reveal phase
        if (gameState.phase == "showing_results" && currentMatch != null) {
            val choices = currentMatch.optJSONObject("choices")
            val opponent = if (currentMatch.optString("player1", "") == playerId)
                currentMatch.optString("player2", "") else currentMatch.optString("player1", "")
            val opponentChoice = choices?.optString(opponent, "") ?: ""
            if (opponentChoice.isNotEmpty()) {
                val choiceEmoji = when (opponentChoice) {
                    "rock" -> "🪨"
                    "paper" -> "📄"
                    "scissors" -> "✂️"
                    else -> ""
                }
                Text(
                    text = "Gegner: $choiceEmoji",
                    style = MaterialTheme.typography.titleMedium,
                    color = TextSecondary
                )
                Spacer(modifier = Modifier.height(16.dp))
            }
        }

        // Three choice buttons
        val choicesList = listOf(
            Triple("rock", "Stein", "🪨"),
            Triple("paper", "Papier", "📄"),
            Triple("scissors", "Schere", "✂️")
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            choicesList.forEach { (id, name, emoji) ->
                val isSelected = selectedChoice == id
                Card(
                    modifier = Modifier
                        .size(100.dp)
                        .clickable {
                            if (selectedChoice == null && gameState.phase != "showing_results") {
                                selectedChoice = id
                                onChoice(id)
                            }
                        },
                    colors = CardDefaults.cardColors(
                        containerColor = when {
                            isSelected -> Primary
                            selectedChoice != null -> SurfaceLight
                            else -> Surface
                        }
                    ),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(
                        modifier = Modifier.fillMaxSize(),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Text(
                            text = emoji,
                            fontSize = 36.sp
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = name,
                            style = MaterialTheme.typography.bodySmall,
                            fontWeight = FontWeight.Bold,
                            color = if (isSelected) Color.White else TextPrimary
                        )
                    }
                }
            }
        }

        if (selectedChoice != null && gameState.phase != "showing_results") {
            Spacer(modifier = Modifier.height(24.dp))
            Text(
                text = "Warte auf andere Spieler...",
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary
            )
        }
    }
}

// ============================================================
// Gluecksrad (Wheel of Fortune) Game
// ============================================================

@Composable
fun GluecksradGame(
    gameState: GameState?,
    timerValue: Int,
    rawState: JSONObject?,
    playerId: String?,
    onSpin: () -> Unit,
    onGuessLetter: (Char) -> Unit,
    onSolve: (String) -> Unit
) {
    var solution by remember { mutableStateOf("") }

    LaunchedEffect(gameState?.currentRound) {
        solution = ""
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Top
    ) {
        if (gameState == null) {
            CircularProgressIndicator(color = Primary)
            return
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Timer
        Text(
            text = "${timerValue}s",
            style = MaterialTheme.typography.headlineLarge,
            fontWeight = FontWeight.Bold,
            color = if (timerValue <= 5) Error else TextPrimary
        )

        Spacer(modifier = Modifier.height(4.dp))

        // Category
        val category = rawState?.optString("category", "") ?: ""
        if (category.isNotEmpty()) {
            Text(
                text = "Kategorie: $category",
                style = MaterialTheme.typography.titleSmall,
                color = TextSecondary
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Current player turn indicator
        val currentPlayerTurn = rawState?.optString("currentPlayerId", "") ?: ""
        val isMyTurn = currentPlayerTurn == playerId

        // Spin result
        val lastSpinResult = rawState?.opt("lastSpinResult")
        val spinResultText = when {
            lastSpinResult == null || lastSpinResult.toString() == "null" -> null
            lastSpinResult.toString() == "bankrott" -> "BANKROTT!"
            lastSpinResult.toString() == "freidrehen" -> "Freidrehen!"
            else -> "${lastSpinResult} Punkte"
        }

        if (isMyTurn) {
            Text(
                text = "Du bist dran!",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = Primary
            )
        } else {
            Text(
                text = "Warte...",
                style = MaterialTheme.typography.titleMedium,
                color = TextSecondary
            )
        }

        if (spinResultText != null) {
            Text(
                text = spinResultText,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
                color = if (lastSpinResult.toString() == "bankrott") Error else Color(0xFFF59E0B)
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Round money display
        val roundMoney = rawState?.optJSONObject("roundMoney")
        val myMoney = roundMoney?.optInt(playerId ?: "", 0) ?: 0
        Text(
            text = "Guthaben: $myMoney",
            style = MaterialTheme.typography.titleSmall,
            color = TextPrimary
        )

        Spacer(modifier = Modifier.height(12.dp))

        // Phrase display from server
        val phrase = rawState?.optString("phrase", "") ?: ""
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            colors = CardDefaults.cardColors(containerColor = Surface),
            shape = RoundedCornerShape(16.dp)
        ) {
            Text(
                text = phrase.ifEmpty { "_ _ _ _ _ _ _" },
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center,
                letterSpacing = 4.sp,
                color = TextPrimary,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp)
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Spin button
        val canSpin = rawState?.optBoolean("canSpin", false) ?: false
        Button(
            onClick = onSpin,
            enabled = isMyTurn && canSpin,
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
                .height(48.dp),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Primary)
        ) {
            Text("Drehen!", fontWeight = FontWeight.Bold)
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Letter keyboard (consonants) - sync disabled state from server
        val canGuessLetter = rawState?.optBoolean("canGuessLetter", false) ?: false
        val revealedLettersArray = rawState?.optJSONArray("revealedLetters")
        val revealedLetters = if (revealedLettersArray != null) {
            (0 until revealedLettersArray.length()).map {
                revealedLettersArray.optString(it, "").uppercase().firstOrNull() ?: ' '
            }.toSet()
        } else {
            emptySet()
        }

        val consonants = "BCDFGHJKLMNPQRSTVWXYZ".toList()
        LazyVerticalGrid(
            columns = GridCells.Fixed(7),
            horizontalArrangement = Arrangement.spacedBy(4.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(160.dp)
                .padding(horizontal = 8.dp)
        ) {
            items(consonants) { letter ->
                val isRevealed = revealedLetters.contains(letter)
                Button(
                    onClick = {
                        if (!isRevealed && isMyTurn && canGuessLetter) {
                            onGuessLetter(letter)
                        }
                    },
                    enabled = !isRevealed && isMyTurn && canGuessLetter,
                    modifier = Modifier.aspectRatio(1f),
                    shape = RoundedCornerShape(8.dp),
                    contentPadding = PaddingValues(0.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Secondary,
                        disabledContainerColor = SurfaceLight
                    )
                ) {
                    Text(
                        text = letter.toString(),
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Solve input
        val canSolve = rawState?.optBoolean("canSolve", false) ?: false
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            OutlinedTextField(
                value = solution,
                onValueChange = { solution = it },
                label = { Text("Losung") },
                placeholder = { Text("Losung eingeben...") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                keyboardActions = KeyboardActions(onDone = {
                    if (solution.isNotBlank()) {
                        onSolve(solution.trim())
                        solution = ""
                    }
                }),
                modifier = Modifier.weight(1f)
            )
            Button(
                onClick = {
                    if (solution.isNotBlank()) {
                        onSolve(solution.trim())
                        solution = ""
                    }
                },
                enabled = solution.isNotBlank() && isMyTurn && canSolve,
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Primary)
            ) {
                Text("Losen")
            }
        }

        Spacer(modifier = Modifier.height(16.dp))
    }
}

// ============================================================
// Placeholder Game (fallback)
// ============================================================

@Composable
fun PlaceholderGame(gameType: GameType?) {
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = gameType?.icon ?: "",
            fontSize = 64.sp
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = gameType?.displayName ?: "Spiel",
            style = MaterialTheme.typography.headlineMedium,
            color = TextPrimary
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Wird bald verfugbar sein!",
            style = MaterialTheme.typography.bodyLarge,
            color = TextSecondary
        )
    }
}

// ============================================================
// ScoreBoard (shared across all games)
// ============================================================

@Composable
fun ScoreBoard(
    players: List<com.playtogether.data.model.Player>,
    scores: Map<String, Int>,
    currentPlayerId: String?
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = Surface
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            players.take(4).forEach { player ->
                val avatarColor = try {
                    Color(android.graphics.Color.parseColor(player.avatarColor))
                } catch (e: Exception) {
                    Primary
                }

                Column(
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(avatarColor)
                            .then(
                                if (player.id == currentPlayerId) {
                                    Modifier
                                        .padding(2.dp)
                                        .clip(CircleShape)
                                        .background(avatarColor)
                                } else Modifier
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = player.name.firstOrNull()?.uppercase() ?: "?",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "${scores[player.id] ?: 0}",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                }
            }
        }
    }
}
