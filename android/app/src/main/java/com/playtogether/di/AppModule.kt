package com.playtogether.di

import android.content.Context
import com.playtogether.data.api.SocketClient
import com.playtogether.data.repository.GameRepository
import com.playtogether.data.repository.UserPreferencesRepository
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideSocketClient(): SocketClient = SocketClient()

    @Provides
    @Singleton
    fun provideGameRepository(socketClient: SocketClient, userPreferences: UserPreferencesRepository): GameRepository =
        GameRepository(socketClient, userPreferences)

    @Provides
    @Singleton
    fun provideUserPreferencesRepository(@ApplicationContext context: Context): UserPreferencesRepository =
        UserPreferencesRepository(context)
}
