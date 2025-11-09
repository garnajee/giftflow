#!/bin/sh

# Sets the default language if the environment variable is not defined
DEFAULT_LANG=${DEFAULT_LANG:-fr}

# Create the JS configuration file for the frontend
echo "window.APP_CONFIG = { defaultLang: '${DEFAULT_LANG}' };" > /usr/share/nginx/html/config.js

# Run the default Nginx command
exec "$@"

