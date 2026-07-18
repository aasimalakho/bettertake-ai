"""
Entry point for cPanel's "Setup Python App" tool (Passenger).

Passenger looks for a module called passenger_wsgi.py at the application
root, exposing a WSGI-callable object named `application`. This just
re-exports the real Flask app from app.py under that expected name — no
other changes needed.

Not used by Docker/Render/Fly/Railway deployments; those run app.py
directly through gunicorn instead. This file only matters for
Passenger-based shared hosting (cPanel's Python Selector).
"""
from app import app as application
