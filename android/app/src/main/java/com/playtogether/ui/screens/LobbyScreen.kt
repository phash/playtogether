package com.playtogether.ui.screens

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import com.playtogether.BuildConfig
import com.playtogether.data.model.GameType
import com.playtogether.data.model.Player
import com.playtogether.data.repository.GameRepository
import com.playtogether.ui.theme.*
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject

@HiltViewModel
class LobbyViewModel @Inject constructor(
    private val repository: GameRepository
) : ViewModel() {

    val room = repository.room
    val playerId = repository.playerId

    fun setReady(ready: Boolean) {
        repository.setReady(ready)
    }

    fun startGame() {
        repository.startGame()
    }

    fun leaveRoom() {
        repository.leaveRoom()
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LobbyScreen(
    code: String,
    viewModel: LobbyViewModel = hiltViewModel(),
    onGameStart: () -> Unit,
    onLeave: () -> Unit
) {
    val room by viewModel.room.collectAsState()
    val playerId by viewModel.playerId.collectAsState()
    val clipboardManager = LocalClipboardManager.current
    val context = LocalContext.current

    var isReady by remember { mutableStateOf(false) }

    // Navigate when game starts
    LaunchedEffect(room?.status) {
        if (room?.status == "playing") {
            onGameStart()
        }
    }

    // Navigate back if room is gone
    LaunchedEffect(room) {
        if (room == null) {
            onLeave()
        }
    }

    val currentRoom = room ?: return

    val isHost = currentRoom.hostId == playerId
    val gameType = GameType.fromId(currentRoom.gameType)

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = gameType?.displayName ?: currentRoom.gameType,
                            style = MaterialTheme.typography.titleMedium
                        )
                        Text(
                            text = "Lobby",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextSecondary
                        )
                    }
                },
                actions = {
                    IconButton(onClick = {
                        viewModel.leaveRoom()
                        onLeave()
                    }) {
                        Icon(
                            Icons.AutoMirrored.Filled.ExitToApp,
                            contentDescription = "Verlassen",
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
                .padding(16.dp)
        ) {
            // Room Code Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Surface)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Raum-Code",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextSecondary
                        )
                        Text(
                            text = currentRoom.code,
                            style = MaterialTheme.typography.headlineLarge,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 8.sp,
                            color = Primary
                        )
                    }
                    Row {
                        IconButton(
                            onClick = {
                                clipboardManager.setText(AnnotatedString(currentRoom.code))
                            }
                        ) {
                            Icon(
                                Icons.Default.ContentCopy,
                                contentDescription = "Kopieren",
                                tint = TextSecondary
                            )
                        }
                        IconButton(
                            onClick = {
                                val gameName = gameType?.displayName ?: currentRoom.gameType
                                val url = "${BuildConfig.CLIENT_URL}/?join=${currentRoom.code}"
                                val shareIntent = Intent(Intent.ACTION_SEND).apply {
                                    type = "text/plain"
                                    putExtra(Intent.EXTRA_SUBJECT, "PlayTogether")
                                    putExtra(Intent.EXTRA_TEXT, "Spiel mit mir $gameName! Code: ${currentRoom.code}\n$url")
                                }
                                context.startActivity(Intent.createChooser(shareIntent, "Code teilen"))
                            }
                        ) {
                            Icon(
                                Icons.Default.Share,
                                contentDescription = "Teilen",
                                tint = Primary
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Players Header
            Text(
                text = "Spieler (${currentRoom.players.size})",
                style = MaterialTheme.typography.titleMedium,
                color = TextPrimary
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Players List
            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(currentRoom.players) { player ->
                    PlayerCard(
                        player = player,
                        isCurrentPlayer = player.id == playerId,
                        isHost = player.id == currentRoom.hostId
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Bottom Actions
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                if (isHost) {
                    // Start Game Button (Host only)
                    Button(
                        onClick = { viewModel.startGame() },
                        enabled = currentRoom.players.size >= 2,
                        modifier = Modifier
                            .weight(1f)
                            .height(56.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Success
                        )
                    ) {
                        Icon(Icons.Default.PlayArrow, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Spiel starten")
                    }
                } else {
                    // Ready Button (Non-host)
                    Button(
                        onClick = {
                            isReady = !isReady
                            viewModel.setReady(isReady)
                        },
                        modifier = Modifier
                            .weight(1f)
                            .height(56.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (isReady) Success else Primary
                        )
                    ) {
                        if (isReady) {
                            Icon(Icons.Default.Check, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Bereit!")
                        } else {
                            Text("Bereit?")
                        }
                    }
                }
            }

            // Waiting message
            if (currentRoom.players.size < 2) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Warte auf weitere Spieler...",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondary,
                    modifier = Modifier.align(Alignment.CenterHorizontally)
                )
            }
        }
    }
}

@Composable
fun PlayerCard(
    player: Player,
    isCurrentPlayer: Boolean,
    isHost: Boolean
) {
    val avatarColor = try {
        Color(android.graphics.Color.parseColor(player.avatarColor))
    } catch (e: Exception) {
        Primary
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .then(
                if (isCurrentPlayer) {
                    Modifier.border(2.dp, Primary, RoundedCornerShape(12.dp))
                } else Modifier
            ),
        colors = CardDefaults.cardColors(containerColor = Surface)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Avatar
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .background(avatarColor),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = player.name.firstOrNull()?.uppercase() ?: "?",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            // Name
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = player.name,
                        style = MaterialTheme.typography.titleMedium,
                        color = TextPrimary
                    )
                    if (isCurrentPlayer) {
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "(Du)",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextSecondary
                        )
                    }
                }
                if (isHost) {
                    Text(
                        text = "Host",
                        style = MaterialTheme.typography.bodySmall,
                        color = Warning
                    )
                }
            }

            // Host Star
            if (isHost) {
                Icon(
                    Icons.Default.Star,
                    contentDescription = "Host",
                    tint = Warning,
                    modifier = Modifier.size(24.dp)
                )
            }

            // Ready indicator
            if (player.isReady) {
                Icon(
                    Icons.Default.Check,
                    contentDescription = "Bereit",
                    tint = Success,
                    modifier = Modifier.size(24.dp)
                )
            }
        }
    }
}
