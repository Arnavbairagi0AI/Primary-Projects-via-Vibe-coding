package com.example.data

import com.squareup.moshi.JsonClass
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.Query
import java.util.concurrent.TimeUnit

// --- Spotify Web API Recommendations Models ---

@JsonClass(generateAdapter = true)
data class SpotifyImage(
    val url: String,
    val height: Int? = null,
    val width: Int? = null
)

@JsonClass(generateAdapter = true)
data class SpotifyAlbum(
    val name: String,
    val images: List<SpotifyImage>? = null
)

@JsonClass(generateAdapter = true)
data class SpotifyArtist(
    val id: String? = null,
    val name: String
)

@JsonClass(generateAdapter = true)
data class SpotifyTrack(
    val id: String,
    val name: String,
    val artists: List<SpotifyArtist>,
    val album: SpotifyAlbum,
    val duration_ms: Long,
    val preview_url: String? = null,
    val uri: String
)

@JsonClass(generateAdapter = true)
data class SpotifyRecommendationsResponse(
    val tracks: List<SpotifyTrack>
)

// --- Retrofit Endpoint ---
interface SpotifyApiEndpoint {
    @GET("v1/recommendations")
    suspend fun getRecommendations(
        @Header("Authorization") authHeader: String,
        @Query("seed_genres") seedGenres: String?,
        @Query("seed_artists") seedArtists: String?,
        @Query("seed_tracks") seedTracks: String?,
        @Query("limit") limit: Int = 10
    ): SpotifyRecommendationsResponse
}

// --- Spotify API Client ---
object SpotifyClient {
    private const val BASE_URL = "https://api.spotify.com/"

    private val moshi = com.squareup.moshi.Moshi.Builder()
        .addLast(com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory())
        .build()

    private val okHttpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()

    private val retrofit = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .client(okHttpClient)
        .addConverterFactory(MoshiConverterFactory.create(moshi))
        .build()

    val api: SpotifyApiEndpoint = retrofit.create(SpotifyApiEndpoint::class.java)
}
