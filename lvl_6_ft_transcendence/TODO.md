Backend:
- Database ( psql --username user123 --dbname transcendence_db ) ✅
- Adminer ✅

https://www.youtube.com/watch?v=5rlsUfQTRzs&list=PLlameCF3cMEu8KAN-02n3CtToO5iYELTV

https://medium.com/@gausmann.simon/nestjs-typeorm-and-postgresql-full-example-development-and-project-setup-working-with-database-c1a2b1b11b8f

- Use typeorm to manipulate postgresql (currently working on user entity)
- Understand how postgresql works

- Design the db schemas
    CREATE TABLE User (
        id BIGSERIAL,
        nick TEXT,
        hashedPass TEXT,
        isOnline boolean,
        isAuth boolean,
        has2fa boolean,
        inMatch boolean,
        createdAt DATE,
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




- Database data persistence (volumes are already set but
    apparently nothing is being saved, perhaps because there
    isn't anything to save yet...)


- Setup NestJS <-> Database connection
- User 42 OAuth
- Hash the passwords with salt


NOTES:
    adminer inputs:
    PostgreSQL
    db
    user123
    passwd123
    transcendence_db