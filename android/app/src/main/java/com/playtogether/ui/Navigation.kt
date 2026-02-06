package com.playtogether.ui

import androidx.compose.runtime.Composable
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.playtogether.ui.screens.GameScreen
import com.playtogether.ui.screens.HomeScreen
import com.playtogether.ui.screens.LobbyScreen

/**
 * Navigation Routes
 */
sealed class Screen(val route: String) {
    data object Home : Screen("home")
    data object Lobby : Screen("lobby/{code}") {
        fun createRoute(code: String) = "lobby/$code"
    }
    data object Game : Screen("game/{code}") {
        fun createRoute(code: String) = "game/$code"
    }
}

/**
 * App Navigation
 */
@Composable
fun PlayTogetherNavigation() {
    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = Screen.Home.route
    ) {
        composable(Screen.Home.route) {
            HomeScreen(
                onRoomCreated = { code ->
                    navController.navigate(Screen.Lobby.createRoute(code))
                },
                onRoomJoined = { code ->
                    navController.navigate(Screen.Lobby.createRoute(code))
                }
            )
        }

        composable(
            route = Screen.Lobby.route,
            arguments = listOf(navArgument("code") { type = NavType.StringType })
        ) { backStackEntry ->
            val code = backStackEntry.arguments?.getString("code") ?: ""
            LobbyScreen(
                code = code,
                onGameStart = {
                    navController.navigate(Screen.Game.createRoute(code)) {
                        popUpTo(Screen.Lobby.route) { inclusive = true }
                    }
                },
                onLeave = {
                    navController.popBackStack(Screen.Home.route, inclusive = false)
                }
            )
        }

        composable(
            route = Screen.Game.route,
            arguments = listOf(navArgument("code") { type = NavType.StringType })
        ) { backStackEntry ->
            val code = backStackEntry.arguments?.getString("code") ?: ""
            GameScreen(
                code = code,
                onGameEnd = {
                    navController.navigate(Screen.Lobby.createRoute(code)) {
                        popUpTo(Screen.Game.route) { inclusive = true }
                    }
                }
            )
        }
    }
}
