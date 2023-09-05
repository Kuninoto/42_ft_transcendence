declare namespace NodeJS {
  export interface ProcessEnv {
    NODE_ENV: string;
    POSTGRES_HOST: string;
    POSTGRES_USER: string;
    POSTGRES_PASSWORD: string;
    POSTGRES_DB: string;
    FRONTEND_URL: string;
    BACKEND_URL: string;
    BACKEND_PORT: string;
    INTRA_CLIENT_UID: string;
    INTRA_CLIENT_SECRET: string;
    INTRA_REDIRECT_URI: string;
    GOOGLE_AUTH_APP_NAME: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    EXPRESS_SESSION_SECRET: string;
    SWAGGER_USER: string;
    SWAGGER_PASSWORD: string;
  }
}
