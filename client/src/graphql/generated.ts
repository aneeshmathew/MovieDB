/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import { GraphQLClient, type RequestOptions } from 'graphql-request';
import gql from 'graphql-tag';
type GraphQLClientRequestHeaders = RequestOptions['requestHeaders'];
export type LoginInput = {
  email: string;
  password: string;
};

export type PreferencesInput = {
  adultContent?: boolean | null | undefined;
  autoplayTrailers?: boolean | null | undefined;
  genres?: Array<number> | null | undefined;
  language?: string | null | undefined;
};

export type RegisterInput = {
  email: string;
  name: string;
  password: string;
};

export type RegisterMutationVariables = Exact<{
  input: RegisterInput;
}>;


export type RegisterMutation = { register: { accessToken: string, user: { id: string, name: string, email: string, avatar: string | null, watchlist: Array<{ movieId: number }>, favorites: Array<{ movieId: number }>, preferences: { genres: Array<number>, language: string, adultContent: boolean, autoplayTrailers: boolean } } } };

export type LoginMutationVariables = Exact<{
  input: LoginInput;
}>;


export type LoginMutation = { login: { accessToken: string, user: { id: string, name: string, email: string, avatar: string | null, watchlist: Array<{ movieId: number }>, favorites: Array<{ movieId: number }>, preferences: { genres: Array<number>, language: string, adultContent: boolean, autoplayTrailers: boolean } } } };

export type RefreshMutationVariables = Exact<{ [key: string]: never; }>;


export type RefreshMutation = { refresh: { accessToken: string, user: { id: string, name: string, email: string, avatar: string | null } } };

export type LogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type LogoutMutation = { logout: boolean };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { me: { id: string, name: string, email: string, avatar: string | null, watchlist: Array<{ movieId: number }>, favorites: Array<{ movieId: number }>, preferences: { genres: Array<number>, language: string, adultContent: boolean, autoplayTrailers: boolean } } | null };

export type WatchlistQueryVariables = Exact<{ [key: string]: never; }>;


export type WatchlistQuery = { watchlist: Array<{ id: string, tmdbId: number, title: string, posterPath: string | null, backdropPath: string | null, releaseYear: number | null, tmdbVoteAverage: number, avgRating: number, ratingCount: number, isClassic: boolean, genres: Array<number> }> };

export type AddToWatchlistMutationVariables = Exact<{
  movieId: number;
}>;


export type AddToWatchlistMutation = { addToWatchlist: Array<{ id: string, tmdbId: number, title: string, posterPath: string | null, backdropPath: string | null, releaseYear: number | null, tmdbVoteAverage: number, avgRating: number, ratingCount: number, isClassic: boolean, genres: Array<number> }> };

export type RemoveFromWatchlistMutationVariables = Exact<{
  movieId: number;
}>;


export type RemoveFromWatchlistMutation = { removeFromWatchlist: Array<{ id: string, tmdbId: number, title: string, posterPath: string | null, backdropPath: string | null, releaseYear: number | null, tmdbVoteAverage: number, avgRating: number, ratingCount: number, isClassic: boolean, genres: Array<number> }> };

export type FavoritesQueryVariables = Exact<{ [key: string]: never; }>;


export type FavoritesQuery = { favorites: Array<{ id: string, tmdbId: number, title: string, posterPath: string | null, backdropPath: string | null, releaseYear: number | null, tmdbVoteAverage: number, avgRating: number, ratingCount: number, isClassic: boolean, genres: Array<number> }> };

export type AddToFavoritesMutationVariables = Exact<{
  movieId: number;
}>;


export type AddToFavoritesMutation = { addToFavorites: Array<{ id: string, tmdbId: number, title: string, posterPath: string | null, backdropPath: string | null, releaseYear: number | null, tmdbVoteAverage: number, avgRating: number, ratingCount: number, isClassic: boolean, genres: Array<number> }> };

export type RemoveFromFavoritesMutationVariables = Exact<{
  movieId: number;
}>;


export type RemoveFromFavoritesMutation = { removeFromFavorites: Array<{ id: string, tmdbId: number, title: string, posterPath: string | null, backdropPath: string | null, releaseYear: number | null, tmdbVoteAverage: number, avgRating: number, ratingCount: number, isClassic: boolean, genres: Array<number> }> };

export type MovieCardFieldsFragment = { id: string, tmdbId: number, title: string, posterPath: string | null, backdropPath: string | null, releaseYear: number | null, tmdbVoteAverage: number, avgRating: number, ratingCount: number, isClassic: boolean, genres: Array<number> };

export type DashboardQueryVariables = Exact<{ [key: string]: never; }>;


export type DashboardQuery = { dashboard: { newReleases: Array<{ id: string, tmdbId: number, title: string, posterPath: string | null, backdropPath: string | null, releaseYear: number | null, tmdbVoteAverage: number, avgRating: number, ratingCount: number, isClassic: boolean, genres: Array<number> }>, trending: Array<{ id: string, tmdbId: number, title: string, posterPath: string | null, backdropPath: string | null, releaseYear: number | null, tmdbVoteAverage: number, avgRating: number, ratingCount: number, isClassic: boolean, genres: Array<number> }>, upcoming: Array<{ id: string, tmdbId: number, title: string, posterPath: string | null, backdropPath: string | null, releaseYear: number | null, tmdbVoteAverage: number, avgRating: number, ratingCount: number, isClassic: boolean, genres: Array<number> }>, classics: Array<{ id: string, tmdbId: number, title: string, posterPath: string | null, backdropPath: string | null, releaseYear: number | null, tmdbVoteAverage: number, avgRating: number, ratingCount: number, isClassic: boolean, genres: Array<number> }> } };

export type MovieDetailQueryVariables = Exact<{
  tmdbId: number;
}>;


export type MovieDetailQuery = { movie: { overview: string | null, runtime: number | null, releaseDate: string | null, trailerKey: string | null, id: string, tmdbId: number, title: string, posterPath: string | null, backdropPath: string | null, releaseYear: number | null, tmdbVoteAverage: number, avgRating: number, ratingCount: number, isClassic: boolean, genres: Array<number>, cast: Array<{ id: number, name: string, character: string | null, profilePath: string | null }>, similar: Array<{ id: string, tmdbId: number, title: string, posterPath: string | null, backdropPath: string | null, releaseYear: number | null, tmdbVoteAverage: number, avgRating: number, ratingCount: number, isClassic: boolean, genres: Array<number> }> } | null };

export type SearchMoviesQueryVariables = Exact<{
  query: string;
  page?: number | null | undefined;
}>;


export type SearchMoviesQuery = { searchMovies: Array<{ id: string, tmdbId: number, title: string, posterPath: string | null, backdropPath: string | null, releaseYear: number | null, tmdbVoteAverage: number, avgRating: number, ratingCount: number, isClassic: boolean, genres: Array<number> }> };

export type MyRatingQueryVariables = Exact<{
  movieId: number;
}>;


export type MyRatingQuery = { rating: { id: string, score: number, review: string | null, updatedAt: string } | null };

export type UpsertRatingMutationVariables = Exact<{
  movieId: number;
  score: number;
  review?: string | null | undefined;
}>;


export type UpsertRatingMutation = { upsertRating: { id: string, score: number, review: string | null, updatedAt: string } };

export type DeleteRatingMutationVariables = Exact<{
  movieId: number;
}>;


export type DeleteRatingMutation = { deleteRating: boolean };

export type MyPreferencesQueryVariables = Exact<{ [key: string]: never; }>;


export type MyPreferencesQuery = { myPreferences: { genres: Array<number>, language: string, adultContent: boolean, autoplayTrailers: boolean } };

export type UpdatePreferencesMutationVariables = Exact<{
  input: PreferencesInput;
}>;


export type UpdatePreferencesMutation = { updatePreferences: { genres: Array<number>, language: string, adultContent: boolean, autoplayTrailers: boolean } };

export const MovieCardFieldsFragmentDoc = gql`
    fragment MovieCardFields on Movie {
  id
  tmdbId
  title
  posterPath
  backdropPath
  releaseYear
  tmdbVoteAverage
  avgRating
  ratingCount
  isClassic
  genres
}
    `;
export const RegisterDocument = gql`
    mutation Register($input: RegisterInput!) {
  register(input: $input) {
    accessToken
    user {
      id
      name
      email
      avatar
      watchlist {
        movieId
      }
      favorites {
        movieId
      }
      preferences {
        genres
        language
        adultContent
        autoplayTrailers
      }
    }
  }
}
    `;
export const LoginDocument = gql`
    mutation Login($input: LoginInput!) {
  login(input: $input) {
    accessToken
    user {
      id
      name
      email
      avatar
      watchlist {
        movieId
      }
      favorites {
        movieId
      }
      preferences {
        genres
        language
        adultContent
        autoplayTrailers
      }
    }
  }
}
    `;
export const RefreshDocument = gql`
    mutation Refresh {
  refresh {
    accessToken
    user {
      id
      name
      email
      avatar
    }
  }
}
    `;
export const LogoutDocument = gql`
    mutation Logout {
  logout
}
    `;
export const MeDocument = gql`
    query Me {
  me {
    id
    name
    email
    avatar
    watchlist {
      movieId
    }
    favorites {
      movieId
    }
    preferences {
      genres
      language
      adultContent
      autoplayTrailers
    }
  }
}
    `;
export const WatchlistDocument = gql`
    query Watchlist {
  watchlist {
    ...MovieCardFields
  }
}
    ${MovieCardFieldsFragmentDoc}`;
export const AddToWatchlistDocument = gql`
    mutation AddToWatchlist($movieId: Int!) {
  addToWatchlist(movieId: $movieId) {
    ...MovieCardFields
  }
}
    ${MovieCardFieldsFragmentDoc}`;
export const RemoveFromWatchlistDocument = gql`
    mutation RemoveFromWatchlist($movieId: Int!) {
  removeFromWatchlist(movieId: $movieId) {
    ...MovieCardFields
  }
}
    ${MovieCardFieldsFragmentDoc}`;
export const FavoritesDocument = gql`
    query Favorites {
  favorites {
    ...MovieCardFields
  }
}
    ${MovieCardFieldsFragmentDoc}`;
export const AddToFavoritesDocument = gql`
    mutation AddToFavorites($movieId: Int!) {
  addToFavorites(movieId: $movieId) {
    ...MovieCardFields
  }
}
    ${MovieCardFieldsFragmentDoc}`;
export const RemoveFromFavoritesDocument = gql`
    mutation RemoveFromFavorites($movieId: Int!) {
  removeFromFavorites(movieId: $movieId) {
    ...MovieCardFields
  }
}
    ${MovieCardFieldsFragmentDoc}`;
export const DashboardDocument = gql`
    query Dashboard {
  dashboard {
    newReleases {
      ...MovieCardFields
    }
    trending {
      ...MovieCardFields
    }
    upcoming {
      ...MovieCardFields
    }
    classics {
      ...MovieCardFields
    }
  }
}
    ${MovieCardFieldsFragmentDoc}`;
export const MovieDetailDocument = gql`
    query MovieDetail($tmdbId: Int!) {
  movie(tmdbId: $tmdbId) {
    ...MovieCardFields
    overview
    runtime
    releaseDate
    trailerKey
    cast {
      id
      name
      character
      profilePath
    }
    similar {
      ...MovieCardFields
    }
  }
}
    ${MovieCardFieldsFragmentDoc}`;
export const SearchMoviesDocument = gql`
    query SearchMovies($query: String!, $page: Int) {
  searchMovies(query: $query, page: $page) {
    ...MovieCardFields
  }
}
    ${MovieCardFieldsFragmentDoc}`;
export const MyRatingDocument = gql`
    query MyRating($movieId: Int!) {
  rating(movieId: $movieId) {
    id
    score
    review
    updatedAt
  }
}
    `;
export const UpsertRatingDocument = gql`
    mutation UpsertRating($movieId: Int!, $score: Int!, $review: String) {
  upsertRating(movieId: $movieId, score: $score, review: $review) {
    id
    score
    review
    updatedAt
  }
}
    `;
export const DeleteRatingDocument = gql`
    mutation DeleteRating($movieId: Int!) {
  deleteRating(movieId: $movieId)
}
    `;
export const MyPreferencesDocument = gql`
    query MyPreferences {
  myPreferences {
    genres
    language
    adultContent
    autoplayTrailers
  }
}
    `;
export const UpdatePreferencesDocument = gql`
    mutation UpdatePreferences($input: PreferencesInput!) {
  updatePreferences(input: $input) {
    genres
    language
    adultContent
    autoplayTrailers
  }
}
    `;

export type SdkFunctionWrapper = <T>(action: (requestHeaders?:Record<string, string>) => Promise<T>, operationName: string, operationType?: string, variables?: any) => Promise<T>;


const defaultWrapper: SdkFunctionWrapper = (action, _operationName, _operationType, _variables) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    Register(variables: RegisterMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<RegisterMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<RegisterMutation>({ document: RegisterDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'Register', 'mutation', variables);
    },
    Login(variables: LoginMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<LoginMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<LoginMutation>({ document: LoginDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'Login', 'mutation', variables);
    },
    Refresh(variables?: RefreshMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<RefreshMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<RefreshMutation>({ document: RefreshDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'Refresh', 'mutation', variables);
    },
    Logout(variables?: LogoutMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<LogoutMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<LogoutMutation>({ document: LogoutDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'Logout', 'mutation', variables);
    },
    Me(variables?: MeQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<MeQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<MeQuery>({ document: MeDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'Me', 'query', variables);
    },
    Watchlist(variables?: WatchlistQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<WatchlistQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<WatchlistQuery>({ document: WatchlistDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'Watchlist', 'query', variables);
    },
    AddToWatchlist(variables: AddToWatchlistMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<AddToWatchlistMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<AddToWatchlistMutation>({ document: AddToWatchlistDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'AddToWatchlist', 'mutation', variables);
    },
    RemoveFromWatchlist(variables: RemoveFromWatchlistMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<RemoveFromWatchlistMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<RemoveFromWatchlistMutation>({ document: RemoveFromWatchlistDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'RemoveFromWatchlist', 'mutation', variables);
    },
    Favorites(variables?: FavoritesQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<FavoritesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<FavoritesQuery>({ document: FavoritesDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'Favorites', 'query', variables);
    },
    AddToFavorites(variables: AddToFavoritesMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<AddToFavoritesMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<AddToFavoritesMutation>({ document: AddToFavoritesDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'AddToFavorites', 'mutation', variables);
    },
    RemoveFromFavorites(variables: RemoveFromFavoritesMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<RemoveFromFavoritesMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<RemoveFromFavoritesMutation>({ document: RemoveFromFavoritesDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'RemoveFromFavorites', 'mutation', variables);
    },
    Dashboard(variables?: DashboardQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<DashboardQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<DashboardQuery>({ document: DashboardDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'Dashboard', 'query', variables);
    },
    MovieDetail(variables: MovieDetailQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<MovieDetailQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<MovieDetailQuery>({ document: MovieDetailDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'MovieDetail', 'query', variables);
    },
    SearchMovies(variables: SearchMoviesQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<SearchMoviesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<SearchMoviesQuery>({ document: SearchMoviesDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'SearchMovies', 'query', variables);
    },
    MyRating(variables: MyRatingQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<MyRatingQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<MyRatingQuery>({ document: MyRatingDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'MyRating', 'query', variables);
    },
    UpsertRating(variables: UpsertRatingMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpsertRatingMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpsertRatingMutation>({ document: UpsertRatingDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpsertRating', 'mutation', variables);
    },
    DeleteRating(variables: DeleteRatingMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<DeleteRatingMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<DeleteRatingMutation>({ document: DeleteRatingDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'DeleteRating', 'mutation', variables);
    },
    MyPreferences(variables?: MyPreferencesQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<MyPreferencesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<MyPreferencesQuery>({ document: MyPreferencesDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'MyPreferences', 'query', variables);
    },
    UpdatePreferences(variables: UpdatePreferencesMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdatePreferencesMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdatePreferencesMutation>({ document: UpdatePreferencesDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdatePreferences', 'mutation', variables);
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;