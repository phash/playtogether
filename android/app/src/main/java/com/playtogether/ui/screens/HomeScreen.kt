package com.playtogether.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Login
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.playtogether.BuildConfig
import com.playtogether.data.model.GameType
import com.playtogether.data.repository.GameRepository
import com.playtogether.data.repository.UserPreferencesRepository
import com.playtogether.ui.theme.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * HomeScreen ViewModel
 */
@HiltViewModel
class HomeViewModel @Inject constructor(
    private val repository: GameRepository,
    private val userPreferences: UserPreferencesRepository
) : ViewModel() {

    val connectionState = repository.connectionState
    val room = repository.room
    val error = repository.error

    var playerName by mutableStateOf("")
    var roomCode by mutableStateOf("")
    var selectedGameType by mutableStateOf(GameType.QUIZ_CHAMP)
    var showJoinDialog by mutableStateOf(false)
    var showCreateDialog by mutableStateOf(false)

    init {
        repository.connect()
        viewModelScope.launch {
            userPreferences.playerName.collect { savedName ->
                if (savedName.isNotBlank() && playerName.isBlank()) {
                    playerName = savedName
                }
            }
        }
    }

    fun updatePlayerName(name: String) {
        playerName = name
        if (name.isNotBlank()) {
            viewModelScope.launch {
                userPreferences.savePlayerName(name)
            }
        }
    }

    fun createRoom() {
        if (playerName.isNotBlank()) {
            repository.createRoom(playerName, selectedGameType.id)
        }
    }

    fun joinRoom() {
        if (playerName.isNotBlank() && roomCode.length == 4) {
            repository.joinRoom(roomCode.uppercase(), playerName)
        }
    }

    fun clearError() {
        repository.clearError()
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    viewModel: HomeViewModel = hiltViewModel(),
    onRoomCreated: (String) -> Unit,
    onRoomJoined: (String) -> Unit
) {
    val connectionState by viewModel.connectionState.collectAsState()
    val room by viewModel.room.collectAsState()
    val error by viewModel.error.collectAsState()

    // Navigate when room is created/joined (including auto-reconnect after process death)
    LaunchedEffect(room) {
        room?.let { r ->
            if (viewModel.showCreateDialog) {
                viewModel.showCreateDialog = false
                onRoomCreated(r.code)
            } else if (viewModel.showJoinDialog) {
                viewModel.showJoinDialog = false
                onRoomJoined(r.code)
            } else {
                // Auto-reconnect case: room restored without dialog open
                onRoomJoined(r.code)
            }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Background)
            .padding(16.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(60.dp))

            // Logo/Title
            Text(
                text = "🎮",
                fontSize = 64.sp
            )

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "PlayTogether",
                style = MaterialTheme.typography.headlineLarge,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )

            Text(
                text = "Spiele gemeinsam mit Freunden",
                style = MaterialTheme.typography.bodyLarge,
                color = TextSecondary
            )

            Spacer(modifier = Modifier.height(48.dp))

            // Connection Status
            ConnectionIndicator(connectionState)

            Spacer(modifier = Modifier.height(32.dp))

            // Player Name Input
            OutlinedTextField(
                value = viewModel.playerName,
                onValueChange = { viewModel.updatePlayerName(it) },
                label = { Text("Dein Name") },
                placeholder = { Text("Name eingeben...") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(
                    capitalization = KeyboardCapitalization.Words,
                    imeAction = ImeAction.Done
                ),
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Primary,
                    unfocusedBorderColor = SurfaceLight
                )
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Create Room Button
                Button(
                    onClick = { viewModel.showCreateDialog = true },
                    enabled = viewModel.playerName.isNotBlank() &&
                            connectionState == com.playtogether.data.api.ConnectionState.CONNECTED,
                    modifier = Modifier
                        .weight(1f)
                        .height(56.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Primary
                    )
                ) {
                    Icon(Icons.Default.Add, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Erstellen")
                }

                // Join Room Button
                OutlinedButton(
                    onClick = { viewModel.showJoinDialog = true },
                    enabled = viewModel.playerName.isNotBlank() &&
                            connectionState == com.playtogether.data.api.ConnectionState.CONNECTED,
                    modifier = Modifier
                        .weight(1f)
                        .height(56.dp),
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = Primary
                    )
                ) {
                    Icon(Icons.Default.Login, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Beitreten")
                }
            }

            Spacer(modifier = Modifier.weight(1f))

            // Version Info
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.padding(bottom = 16.dp)
            ) {
                Text(
                    text = "v${BuildConfig.VERSION_NAME} (${BuildConfig.VERSION_CODE})",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondary
                )
                Text(
                    text = BuildConfig.SERVER_URL,
                    style = MaterialTheme.typography.labelSmall,
                    color = TextSecondary.copy(alpha = 0.6f)
                )
            }
        }

        // Error Snackbar
        error?.let { errorMessage ->
            Snackbar(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(16.dp),
                action = {
                    TextButton(onClick = { viewModel.clearError() }) {
                        Text("OK")
                    }
                },
                containerColor = Error
            ) {
                Text(errorMessage)
            }
        }
    }

    // Create Room Dialog
    if (viewModel.showCreateDialog) {
        CreateRoomDialog(
            selectedGameType = viewModel.selectedGameType,
            onGameTypeSelected = { viewModel.selectedGameType = it },
            onDismiss = { viewModel.showCreateDialog = false },
            onCreate = { viewModel.createRoom() }
        )
    }

    // Join Room Dialog
    if (viewModel.showJoinDialog) {
        JoinRoomDialog(
            code = viewModel.roomCode,
            onCodeChange = { viewModel.roomCode = it.uppercase().take(4) },
            onDismiss = { viewModel.showJoinDialog = false },
            onJoin = { viewModel.joinRoom() }
        )
    }
}

@Composable
fun ConnectionIndicator(state: com.playtogether.data.api.ConnectionState) {
    val (color, text) = when (state) {
        com.playtogether.data.api.ConnectionState.CONNECTED -> Success to "Verbunden"
        com.playtogether.data.api.ConnectionState.CONNECTING -> Warning to "Verbinde..."
        com.playtogether.data.api.ConnectionState.RECONNECTING -> Warning to "Reconnecting..."
        com.playtogether.data.api.ConnectionState.ERROR -> Error to "Fehler"
        com.playtogether.data.api.ConnectionState.DISCONNECTED -> TextSecondary to "Getrennt"
    }

    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center
    ) {
        Box(
            modifier = Modifier
                .size(8.dp)
                .clip(RoundedCornerShape(4.dp))
                .background(color)
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = text,
            style = MaterialTheme.typography.bodySmall,
            color = color
        )
    }
}

@Composable
fun CreateRoomDialog(
    selectedGameType: GameType,
    onGameTypeSelected: (GameType) -> Unit,
    onDismiss: () -> Unit,
    onCreate: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Spiel wählen") },
        text = {
            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(GameType.entries) { gameType ->
                    GameTypeCard(
                        gameType = gameType,
                        isSelected = gameType == selectedGameType,
                        onClick = { onGameTypeSelected(gameType) }
                    )
                }
            }
        },
        confirmButton = {
            Button(onClick = {
                onCreate()
            }) {
                Text("Erstellen")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Abbrechen")
            }
        },
        containerColor = Surface
    )
}

@Composable
fun GameTypeCard(
    gameType: GameType,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        colors = CardDefaults.cardColors(
            containerColor = if (isSelected) Primary else SurfaceLight
        )
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = gameType.icon,
                fontSize = 28.sp
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = gameType.displayName,
                style = MaterialTheme.typography.bodySmall,
                textAlign = TextAlign.Center,
                color = if (isSelected) TextPrimary else TextSecondary
            )
        }
    }
}

@Composable
fun JoinRoomDialog(
    code: String,
    onCodeChange: (String) -> Unit,
    onDismiss: () -> Unit,
    onJoin: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Raum beitreten") },
        text = {
            OutlinedTextField(
                value = code,
                onValueChange = onCodeChange,
                label = { Text("Raum-Code") },
                placeholder = { Text("ABCD") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(
                    capitalization = KeyboardCapitalization.Characters,
                    imeAction = ImeAction.Done
                ),
                modifier = Modifier.fillMaxWidth()
            )
        },
        confirmButton = {
            Button(
                onClick = onJoin,
                enabled = code.length == 4
            ) {
                Text("Beitreten")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Abbrechen")
            }
        },
        containerColor = Surface
    )
}
