-- Active: 1696170700932@@127.0.0.1@3306

-- tipo NORMAL e senha = fulano123

-- tipo NORMAL e senha = beltrana123

-- tipo NORMAL e senha = ciclano123

-- tipo ADMIN e senha = admin123

CREATE TABLE
    users(
        id TEXT PRIMARY KEY UNIQUE NOT NULL,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT(DATETIME('now', 'localtime'))
    );

INSERT INTO
    users(id, name, email, password, role)
VALUES (
        'u001',
        'Fulano',
        'fulano@email.com',
        '$2a$12$M5xrUDz.X/46nxRcVW1id.ECHc5wt/BWwqQKJB8EnsEX3WAmwlABi',
        'NORMAL'
    ), (
        'u002',
        'Beltrana',
        'beltrana@email.com',
        '$2a$12$a5r7uKXx1rERL76sz0CG9OJWjjd9qsqDrTDZZNFtNTwiTQnwCkTXS',
        'NORMAL'
    ), (
        'u003',
        'Ciclano',
        'ciclano@email.com',
        '$2a$12$xtkJyhcHenpCBj2CuHR/e.33FroDHH6ebBCR4kapgxxarthG.6.Xa',
        'NORMAL'
    ), (
        'u004',
        'Admin',
        'admin@email.com',
        '$$2a$12$w6ZxSRc8P9.K/ioOzeCHlebOR1BNie7wbfaXFZAg3lrIG93sMMZLe',
        'ADMIN'
    );

UPDATE users
SET
    password = '$2a$12$w6ZxSRc8P9.K/ioOzeCHlebOR1BNie7wbfaXFZAg3lrIG93sMMZLe'
WHERE id = 'u004';

CREATE TABLE
    posts(
        id TEXT PRIMARY KEY UNIQUE NOT NULL,
        creator_id TEXT NOT NULL,
        content TEXT NOT NULL,
        likes INTEGER DEFAULT(0) NOT NULL,
        dislikes INTEGER DEFAULT(0) NOT NULL,
        comments INTEGER DEFAULT(0) NOT NULL,
        created_at TEXT DEFAULT(DATETIME('now', 'localtime')),
        updated_at TEXT,
        FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
    );

INSERT INTO
    posts(id, creator_id, content)
VALUES (
        'p001',
        'u001',
        'Porque a maioria dos desenvolvedores usam Linux? ou as empresas de tecnologia usam Linux ?'
    ), (
        'p002',
        'u002',
        'Qual super poder você gostaria de ter?'
    ), (
        'p003',
        'u003',
        'Se você pudesser ter qualquer tipo de pet, qual você escolheria?'
    ), (
        'p004',
        'u004',
        'Se você tivesse que comer apenas uma coisa para o resto de sua vida, o que você escolheria?'
    );

CREATE TABLE
    posts_likes(
        user_id TEXT NOT NULL,
        post_id TEXT NOT NULL,
        like INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE ON UPDATE CASCADE
    );

CREATE TABLE
    comments(
        id TEXT PRIMARY KEY UNIQUE NOT NULL,
        creator_id TEXT NOT NULL,
        post_id TEXT NOT NULL,
        content TEXT NOT NULL,
        likes INTEGER DEFAULT(0) NOT NULL,
        dislikes INTEGER DEFAULT(0) NOT NULL,
        created_at TEXT DEFAULT(DATETIME('now', 'localtime')),
        updated_at TEXT,
        FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE ON UPDATE CASCADE
    );

INSERT INTO
    comments(
        id,
        creator_id,
        post_id,
        content
    )
VALUES (
        'c001',
        'u004',
        'p001',
        'Não posso falar por todos, mas usar Linux ajudou meu pc a ter uma performance melhor (e evitou que eu precisasse comprar um novo).'
    ), (
        'c002',
        'u003',
        'p001',
        'Não é a maioria, já vi umas enquetes, inclusive nesse sub se não me engano, onde Windows ganhava na qntd de usuários. Linux é rápido, tem várias opções pra diferentes gostos.'
    ), (
        'c003',
        'u002',
        'p003',
        'Um cachorro! <3.'
    ), (
        'c004',
        'u001',
        'p002',
        'Queria Voar.'
    ), (
        'c005',
        'u004',
        'p002',
        'Queria a velocidade do Flash'
    ), (
        'c006',
        'u001',
        'p004',
        'Escolheria frutas!.'
    );

CREATE TABLE
    comments_likes(
        user_id TEXT NOT NULL,
        comment_id TEXT NOT NULL,
        like INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE ON UPDATE CASCADE
    );

DROP TABLE users;

DROP TABLE posts_likes;

DROP TABLE comments_likes;

DROP TABLE comments;

DROP TABLE posts;