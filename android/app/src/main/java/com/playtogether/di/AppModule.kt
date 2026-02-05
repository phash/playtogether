package com.playtogether.di

import com.playtogether.data.api.SocketClient
import com.playtogether.data.repository.GameRepository
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
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
    fun provideGameRepository(socketClient: SocketClient): GameRepository =
        GameRepository(socketClient)
}
