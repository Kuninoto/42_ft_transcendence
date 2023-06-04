Frontend:
- Implement the designs that are already on Figma

Backend:

- Database is not being set inside the container
  (POSTGRES_DB env variable is set but db is not being created,
   can be checked with:
   docker exec -it postgres bash
   psql -Utranscendence_user
   \l
  )
Links to look up to:
 - https://stackoverflow.com/questions/48629799/postgres-image-is-not-creating-database/54200233#54200233
 - https://github.com/docker-library/postgres/issues/537
 - https://github.com/docker-library/postgres/issues/203

- Setup NestJS <-> Database connection
- User 42 OAuth