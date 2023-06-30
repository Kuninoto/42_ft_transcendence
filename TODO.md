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
    GET request part ✅
    - Figure out how to make or call the userService to register a new user ✅
    - Figure out what to retrieve from the 42 User and how the user registration should be ✅
        (database registering, which fields I want from the 42 API, should I save the avatar endpoint) 
        Should it be a redirect with the user's info as query params?
    - Figure out why updateUserAvatar() is not being able to update users table
------------------------------------------- Currently at --------------------------------------
    - Figure out how to properly route user updates and how to properly link/save the avatar_url on the user database
    
- Understand JWT and how to keep access_token

- Add checks for when user doesn't exist in (probably) all user service functions
- Understand NestJS Guards

- Handle gracefully Internal errors such as duplicate names, misconfigs on JSON's etc.
- Stress test misconfigs on JSON Objects

- Hash the passwords with salt (on the frontend)
