package com.playtogether.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import com.playtogether.data.model.GameState
import com.playtogether.data.model.GameType
import com.playtogether.data.repository.GameRepository
import com.playtogether.ui.theme.*
import dagger.hilt.android.lifecycle.HiltViewModel
import org.json.JSONObject
import javax.inject.Inject

@HiltViewModel
class GameViewModel @Inject constructor(
    private val repository: GameRepository
) : ViewModel() {

    val room = repository.room
    val playerId = repository.playerId
    val gameState = repository.gameState

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

    // Navigate back if room is gone
    LaunchedEffect(room) {
        if (room == null) {
            onGameEnd()
        }
    }

    val currentRoom = room ?: return
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
                    "eitheror" -> EitherOrGame(
                        gameState = currentGameState,
                        onVote = { choice ->
                            viewModel.sendAction("vote", JSONObject().apply {
                                put("choice", choice)
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
}

@Composable
fun EitherOrGame(
    gameState: GameState?,
    onVote: (String) -> Unit
) {
    var selectedOption by remember { mutableStateOf<String?>(null) }

    // Reset selection on new round
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

        // Options (would need actual question data from socket)
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
