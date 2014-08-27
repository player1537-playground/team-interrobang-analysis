CREATE TABLE IF NOT EXISTS players (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       web_id INTEGER NOT NULL,
       name TEXT NOT NULL,
       UNIQUE(web_id, name)
);

CREATE TABLE IF NOT EXISTS servers (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       full_name TEXT NOT NULL,
       UNIQUE(full_name)
);

CREATE TABLE IF NOT EXISTS words (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       word TEXT NOT NULL,
       UNIQUE(word)
);

CREATE TABLE IF NOT EXISTS sentences (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       prev INTEGER REFERENCES words(id),
       next INTEGER REFERENCES words(id),
       cur INTEGER REFERENCES words(id)
);

CREATE TABLE IF NOT EXISTS chats (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       date TEXT NOT NULL,
       player_id INTEGER REFERENCES players(player_id),
       server_id INTEGER REFERENCES servers(id),
       message TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS records_used (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       date TEXT NOT NULL,
       used INTEGER NOT NULL,
       total INTEGER NOT NULL
);