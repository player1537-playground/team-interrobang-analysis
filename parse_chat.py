import BeautifulSoup
import urllib2
import sqlite3
import time
import datetime

url = "http://stats.teaminterrobang.com/hlstats.php?mode=chat&game=tf"

def get_db():
    db = sqlite3.connect('chat.db')
    return db
    
def init_db(db):
    with open("schema.sql", "r") as schema:
        db.executescript(schema.read())

def scrape_page():
    response = urllib2.urlopen(url)
    html = response.read()
    soup = BeautifulSoup.BeautifulSoup(html)
    
    table = soup.find("table", { "class": "data-table" })
    
    columns = None
    for index, row in enumerate(table.findAll("tr")):
        if index == 0:
            continue
        
        cols = row.findAll("td")
        
        date = cols[0].string
        
        player = cols[1].find("a")
        web_id = player["href"].split("=")[-1]
        player_name = player.text
        
        message = cols[2].string
        
        server_name = cols[3].string
        
        map_name = cols[4].string
        
        yield {
            "date": date,
            "web_id": web_id,
            "player_name": player_name,
            "message": message,
            "server_name": server_name,
            "map_name": map_name,
            }

def insert_into_db(record):
    db = get_db()
    
    db.execute(('INSERT OR IGNORE INTO players (web_id, name)'
                '  VALUES (?, ?)'),
               [record["web_id"], record["player_name"]])
    
    cur = db.execute(('SELECT id '
                      'FROM players '
                      'WHERE web_id = ? '),
                     [record["web_id"]])
    player_id = cur.fetchone()[0]
    
    db.execute(('INSERT OR IGNORE INTO servers (full_name) '
                '  VALUES (?)'),
               [record["server_name"]])
    
    cur = db.execute(('SELECT id '
                      'FROM servers '
                      'WHERE full_name = ? '),
                     [record["server_name"]])
    server_id = cur.fetchone()[0]
    
    db.execute(('INSERT INTO chats (date, '
                '                   player_id,'
                '                   server_id,'
                '                   message)'
                '  VALUES (?, ?, ?, ?)'),
               [record["date"],
                player_id,
                server_id,
                record["message"]])
    
    db.commit()

def hash_message(date, player_name, server_name, message):
    return hash((date, player_name, server_name, message))

def insert_records_used(used, total):
    db = get_db()
    
    db.execute(('INSERT INTO records_used (date, used, total) '
                '  VALUES (?, ?, ?)'),
               [str(datetime.datetime.now()).split('.')[0],
                used,
                total])
    db.commit()

db = get_db()
init_db(db)

cur = db.execute(('SELECT chats.date, '
                  '       players.name, '
                  '       servers.full_name, '
                  '       chats.message '
                  'FROM chats '
                  'JOIN players '
                  '  ON players.id = chats.player_id '
                  'JOIN servers '
                  '  ON servers.id = chats.server_id '
                  'ORDER BY chats.id DESC '
                  'LIMIT 50'))
already_inserted = set((date, player_name, server_name, message) 
                       for date, player_name, server_name, message in cur)

while True:
    records = list(scrape_page())
    for index, record in enumerate(records):
        record_tuple = (record["date"], 
                        record["player_name"], 
                        record["server_name"], 
                        record["message"])
        if record_tuple in already_inserted:
            print "  %d/%d records used" % (index, len(records))
            insert_records_used(index, len(records))
            break
        insert_into_db(record)
        already_inserted.update([record_tuple])
        print str(record)
    else:
        insert_records_used(len(records), len(records))
    time.sleep(30)

