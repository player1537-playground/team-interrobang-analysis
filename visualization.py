import os
import sqlite3
from flask import Flask, request, session, g, redirect, url_for, abort, \
     render_template, flash
import json
import collections

app = Flask(__name__)
app.config.from_object(__name__)

app.config.update(dict(
    DATABASE=os.path.join(app.root_path, 'chat.db'),
    DEBUG=True,
    SECRET_KEY='super secret secret key',
    USERNAME='admin',
    PASSWORD='default'
))
app.config.from_envvar('CHAT_SETTINGS', silent=True)

def connect_db():
    """Connects to the specific database."""
    rv = sqlite3.connect(app.config['DATABASE'])
    rv.row_factory = sqlite3.Row
    return rv

def get_db():
    """Opens a new database connection if there is none yet for the
    current application context.
    """
    if not hasattr(g, 'sqlite_db'):
        g.sqlite_db = connect_db()
    return g.sqlite_db

@app.teardown_appcontext
def close_db(error):
    """Closes the database again at the end of the request."""
    if hasattr(g, 'sqlite_db'):
        g.sqlite_db.close()

@app.route("/api/chat/recent")
def api_chats_recent():
    db = get_db()
    
    cur = db.execute(('SELECT chats.date, '
                      '       servers.full_name, '
                      '       players.name, '
                      '       chats.message '
                      'FROM chats '
                      'JOIN players '
                      '  ON chats.player_id = players.id '
                      'JOIN servers '
                      '  ON chats.server_id = servers.id '
                      'ORDER BY chats.id DESC '
                      'LIMIT 500'))
    
    data = [ { "date": date,
               "server_name": server_name,
               "player_name": player_name,
               "message": message }
             for date, server_name, player_name, message in cur ]
    
    return json.dumps(data)

@app.route("/api/records_used")
def api_records_used():
    db = get_db()
    
    cur = db.execute(('SELECT date, used, total '
                      'FROM records_used '
                      'ORDER BY date'))
    
    data = [ { "date": date,
               "used": used,
               "total": total }
             for date, used, total in cur ]
    
    return json.dumps(data)

@app.route("/api/hourly")
def api_hourly_chats():
    import collections
    
    db = get_db()
    
    cur = db.execute(('SELECT STRFTIME("%H", date) hour, '
                      '       COUNT(*) '
                      'FROM chats '
                      'WHERE date > (SELECT MIN(records_used.date) '
                      '              FROM records_used '
                      '             )'
                      'GROUP BY hour '
                      'ORDER BY hour '))
    
    # data = { hour: { count: int,
    #                  records: int,
    #                },
    #        }
    data = collections.defaultdict(lambda: { "count": 0, "records": 0 })
    for hour, count in cur:
        data[int(hour)]["count"] = count
    
    cur = db.execute(('SELECT STRFTIME("%H", date) hour, '
                      '       COUNT(*) '
                      'FROM records_used '
                      'GROUP BY hour '
                      'ORDER BY hour '))
    
    for hour, count in cur:
        data[int(hour)]["records"] = count
    
    return json.dumps(data)

@app.route("/hourly")
def hourly_vis():
    return render_template("hourly_vis.html")

@app.route("/records_used")
def records_used_vis():
    return render_template("records_used_vis.html")

@app.route("/chat")
def chat_vis():
    return render_template("chat_vis.html")

@app.route("/")
def index_page():
    return render_template("index_page.html")

if __name__ == "__main__":
    app.run()
