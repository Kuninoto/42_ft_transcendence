Backend:
- Understand how postgresql works
- Database ( psql --username user123 --dbname transcendence_db ) ✅
- Adminer ✅
- Use typeorm to manipulate postgresql ✅
- Design the db schemas ✅
    CREATE TABLE User (
        id big_int,
        nick TEXT,
        hashed_pass TEXT,
        is_online boolean,
        is_auth boolean,
        has_2fa boolean,
        in_match boolean,
        created_at DATE,
    );

    // missing kick ban or mute 
    CREATE TABLE Chat (
        owner_id BIGSERIAL,
        nick TEXT,
        type ENUM ('public', 'private', 'with_password),
        hashed_pass TEXT,

        (client_ids of the admins)
        channel_admins ARRAY,
        createdAt DATE,
    );

Setup NestJS <-> Database connection ✅
GET POST DELETE PATCH on User Module ✅
Understand NestJS Guards ✅

User Auth:
    42:
        intra link -> auth -> code param -> access_token -> GET request to retrieve info about the authenticated user
        - 42's Auth using passport-42 ✅
        - Understand JWT ✅

------------------------------------------- Currently at --------------------------------------
        - How to keep JWT access_token
        - Figure out how to store/serve avatars

    Google (2fa):


- Add checks for when user doesn't exist in (probably) all user service functions

- Handle gracefully Internal errors such as duplicate names, misconfigs on JSON's etc.
- Stress test misconfigs on JSON Objects

- Hash the passwords with salt (on the frontend)

- Review the routes architecture (take as an example the routes of full-grown sites)
