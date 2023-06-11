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

- Setup NestJS <-> Database connection ✅
- GET POST DELETE PATCH on User Module ✅

- User 42 OAuth
    - intra link -> auth -> code param -> access_token -> GET request to retrieve info about the authenticated user
------------------------------------------- Currently at --------------------------------------
    GET request part


    - Figure out what the user id should be
      (perhaps just an internal counter/random value (?),
      most certaintly it is because postgres/nestjs is already incrementally setting it)
    - Figure out what and how to retrieve from the 42 User login 

- Understand NestJS Guards

- Fix timestamp values and format (?) upon user creation
- Update last_updated_at upon user data update (PATCH)

- Handle gracefully Internal errors such as duplicate names, misconfigs on JSON's etc.
- Stress test misconfigs on JSON Objects

- Hash the passwords with salt (on the frontend)
