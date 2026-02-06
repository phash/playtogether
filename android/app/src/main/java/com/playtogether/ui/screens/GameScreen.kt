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
                        onAnswer = { index ->
                            viewModel.sendAction("answer", JSONObject().apply {
                                put("answerIndex", index)
                            })
                        }
                    )
                    "entweder_oder" -> EntwederOderGame(
                        gameState = currentGameState,
                        onVote = { choice ->
                            viewModel.sendAction("vote", JSONObject().apply {
                                put("choice", choice)
                            })
                        }
                    )
                    "anagramme" -> AnagrammeGame(
                        gameState = currentGameState,
                        onSubmit = { word ->
                            viewModel.sendAction("submit_word", JSONObject().apply {
                                put("word", word)
                            })
                        }
                    )
                    "hangman" -> HangmanGame(
                        gameState = currentGameState,
                        onGuess = { letter ->
                            viewModel.sendAction("guess_letter", JSONObject().apply {
                                put("letter", letter.toString())
                            })
                        }
                    )
                    "tic_tac_toe" -> TicTacToeGame(
                        gameState = currentGameState,
                        onMove = { row, col ->
                            viewModel.sendAction("place_mark", JSONObject().apply {
                                put("row", row)
                                put("col", col)
                            })
                        }
                    )
                    "rock_paper_scissors" -> RockPaperScissorsGame(
                        gameState = currentGameState,
                        onChoice = { choice ->
                            viewModel.sendAction("choose", JSONObject().apply {
                                put("choice", choice)
                            })
                        }
                    )
                    "gluecksrad" -> GluecksradGame(
                        gameState = currentGameState,
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
            text = "${gameState.timeRemaining}s",
            style = MaterialTheme.typography.headlineLarge,
            fontWeight = FontWeight.Bold,
            color = if (gameState.timeRemaining <= 5) Error else TextPrimary
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Phase info
        Text(
            text = if (gameState.phase == "showing_results") "Ergebnisse" else "Frage",
            style = MaterialTheme.typography.titleMedium,
            color = TextSecondary
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Answer buttons (4 options)
        val optionLabels = listOf("A", "B", "C", "D")
        val optionColors = listOf(
            Color(0xFF3B82F6),
            Color(0xFFEF4444),
            Color(0xFF22C55E),
            Color(0xFFF59E0B)
        )

        optionLabels.forEachIndexed { index, label ->
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
                    containerColor = if (selectedAnswer == index) optionColors[index] else Surface,
                    disabledContainerColor = if (selectedAnswer == index) optionColors[index].copy(alpha = 0.7f) else SurfaceLight
                )
            ) {
                Text(
                    text = "Antwort $label",
                    style = MaterialTheme.typography.titleMedium,
                    color = if (selectedAnswer == index) Color.White else TextPrimary
                )
            }
        }

        if (selectedAnswer != null) {
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
            text = "${gameState.timeRemaining}s",
            style = MaterialTheme.typography.headlineLarge,
            fontWeight = FontWeight.Bold,
            color = if (gameState.timeRemaining <= 3) Error else TextPrimary
        )

        Spacer(modifier = Modifier.height(32.dp))

        // Two big option buttons side by side
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Option A
            Button(
                onClick = {
                    if (selectedOption == null) {
                        selectedOption = "A"
                        onVote("A")
                    }
                },
                enabled = selectedOption == null,
                modifier = Modifier
                    .weight(1f)
                    .height(120.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (selectedOption == "A") Primary else Surface,
                    disabledContainerColor = if (selectedOption == "A") Primary else SurfaceLight
                )
            ) {
                Text(
                    text = "Option A",
                    style = MaterialTheme.typography.titleMedium,
                    textAlign = TextAlign.Center
                )
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
                    if (selectedOption == null) {
                        selectedOption = "B"
                        onVote("B")
                    }
                },
                enabled = selectedOption == null,
                modifier = Modifier
                    .weight(1f)
                    .height(120.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (selectedOption == "B") Secondary else Surface,
                    disabledContainerColor = if (selectedOption == "B") Secondary else SurfaceLight
                )
            ) {
                Text(
                    text = "Option B",
                    style = MaterialTheme.typography.titleMedium,
                    textAlign = TextAlign.Center
                )
            }
        }

        if (selectedOption != null) {
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
            text = "${gameState.timeRemaining}s",
            style = MaterialTheme.typography.headlineLarge,
            fontWeight = FontWeight.Bold,
            color = if (gameState.timeRemaining <= 5) Error else TextPrimary
        )

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "Finde das Wort!",
            style = MaterialTheme.typography.titleMedium,
            color = TextSecondary
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Scrambled letters display
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            colors = CardDefaults.cardColors(containerColor = Surface),
            shape = RoundedCornerShape(16.dp)
        ) {
            Text(
                text = "Buchstaben mischen...",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center,
                letterSpacing = 4.sp,
                color = Primary,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp)
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

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

// ============================================================
// Hangman Game
// ============================================================

@Composable
fun HangmanGame(
    gameState: GameState?,
    onGuess: (Char) -> Unit
) {
    var guessedLetters by remember { mutableStateOf(setOf<Char>()) }

    LaunchedEffect(gameState?.currentRound) {
        guessedLetters = emptySet()
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
            text = "${gameState.timeRemaining}s",
            style = MaterialTheme.typography.headlineLarge,
            fontWeight = FontWeight.Bold,
            color = if (gameState.timeRemaining <= 5) Error else TextPrimary
        )

        Spacer(modifier = Modifier.height(8.dp))

        // Hangman icon
        Text(
            text = "💀",
            fontSize = 48.sp
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Word display (underscores for hidden letters)
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            colors = CardDefaults.cardColors(containerColor = Surface),
            shape = RoundedCornerShape(16.dp)
        ) {
            Text(
                text = "_ _ _ _ _ _",
                style = MaterialTheme.typography.headlineLarge,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center,
                letterSpacing = 8.sp,
                color = TextPrimary,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp)
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

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
                val isGuessed = guessedLetters.contains(letter)
                Button(
                    onClick = {
                        if (!isGuessed) {
                            guessedLetters = guessedLetters + letter
                            onGuess(letter)
                        }
                    },
                    enabled = !isGuessed,
                    modifier = Modifier
                        .aspectRatio(1f),
                    shape = RoundedCornerShape(8.dp),
                    contentPadding = PaddingValues(0.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Primary,
                        disabledContainerColor = SurfaceLight
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
            text = "${gameState.timeRemaining}s",
            style = MaterialTheme.typography.headlineLarge,
            fontWeight = FontWeight.Bold,
            color = if (gameState.timeRemaining <= 5) Error else TextPrimary
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = if (gameState.phase == "playing") "Du bist dran!" else gameState.phase,
            style = MaterialTheme.typography.titleMedium,
            color = TextSecondary
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
                            Box(
                                modifier = Modifier
                                    .size(76.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(SurfaceLight)
                                    .border(
                                        width = 2.dp,
                                        color = Primary.copy(alpha = 0.3f),
                                        shape = RoundedCornerShape(12.dp)
                                    )
                                    .clickable {
                                        onMove(row, col)
                                    },
                                contentAlignment = Alignment.Center
                            ) {
                                // Empty cell - server state will determine content
                                Text(
                                    text = "",
                                    fontSize = 32.sp,
                                    fontWeight = FontWeight.Bold
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
            text = "${gameState.timeRemaining}s",
            style = MaterialTheme.typography.headlineLarge,
            fontWeight = FontWeight.Bold,
            color = if (gameState.timeRemaining <= 3) Error else TextPrimary
        )

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = if (gameState.phase == "showing_results") "Ergebnis" else "Wähle!",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            color = TextPrimary
        )

        Spacer(modifier = Modifier.height(32.dp))

        // Three choice buttons
        val choices = listOf(
            Triple("rock", "Stein", "🪨"),
            Triple("paper", "Papier", "📄"),
            Triple("scissors", "Schere", "✂️")
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            choices.forEach { (id, name, emoji) ->
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

        if (selectedChoice != null) {
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
    onSpin: () -> Unit,
    onGuessLetter: (Char) -> Unit,
    onSolve: (String) -> Unit
) {
    var solution by remember { mutableStateOf("") }
    var guessedLetters by remember { mutableStateOf(setOf<Char>()) }

    LaunchedEffect(gameState?.currentRound) {
        solution = ""
        guessedLetters = emptySet()
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
            text = "${gameState.timeRemaining}s",
            style = MaterialTheme.typography.headlineLarge,
            fontWeight = FontWeight.Bold,
            color = if (gameState.timeRemaining <= 5) Error else TextPrimary
        )

        Spacer(modifier = Modifier.height(8.dp))

        // Wheel icon
        Text(
            text = "🎡",
            fontSize = 48.sp
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Word display
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            colors = CardDefaults.cardColors(containerColor = Surface),
            shape = RoundedCornerShape(16.dp)
        ) {
            Text(
                text = "_ _ _ _ _ _ _",
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

        Spacer(modifier = Modifier.height(16.dp))

        // Spin button
        Button(
            onClick = onSpin,
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
                .height(48.dp),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Primary)
        ) {
            Text("Drehen!", fontWeight = FontWeight.Bold)
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Letter keyboard (consonants)
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
                val isGuessed = guessedLetters.contains(letter)
                Button(
                    onClick = {
                        if (!isGuessed) {
                            guessedLetters = guessedLetters + letter
                            onGuessLetter(letter)
                        }
                    },
                    enabled = !isGuessed,
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
                label = { Text("Lösung") },
                placeholder = { Text("Lösung eingeben...") },
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
                enabled = solution.isNotBlank(),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Primary)
            ) {
                Text("Lösen")
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
            text = gameType?.icon ?: "🎮",
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
            text = "Wird bald verfügbar sein!",
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
