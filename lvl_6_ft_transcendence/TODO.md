Frontend:
- Implement the design's that are already on figma

Backend:

- Database is not being set inside the container
  (POSTGRES_DB env variable is set but db is not being created,
   can be checked with:
   docker exec -it postgres bash
   psql -Utranscendence_user
   \l
  )

- Setup NestJS <-> Database connection
- User 42 OAuth