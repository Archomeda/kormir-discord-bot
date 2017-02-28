# Kormir - Discord Bot
A Discord bot that's powering the (mainly Guild Wars 2) guild Legacy of the Six.
While this bot is technically designed for their Discord server, you can adapt it for your own use as well.

## Features
The bot can do various tasks that helps the guild on the Discord server.
 - **Guild Wars 2**
   - Accounts
     - Link Discord accounts with Guild Wars 2 accounts by registering API keys
     - Automatically manage roles of world members
   - Guilds
     - Automatically manage roles of guild members
     - Post various guild logs
   - Other
     - Post new builds and release notes
     - Querying the Guild Wars 2 wiki for something
 - **Event scheduling**
   - Add, edit and remove events with a title, description, associated channels and people/roles
   - Automatically post reminders about an event
 - **Other**
   - Exporting the list of role, channel and account ids to help configuring the bot *(restricted by permissions by default)*

### Available commands
You can type `!help` in any text channel to receive the list of available commands.
This message will get removed automatically after 5 minutes to prevent cluttering.
You can also type `!help <command>` - where `<command>` is the name of an available command - in order to receive more detailed information about a specific command.

## Usage
This bot is currently not publically available for invites. Instead, you have to run the bot for yourself.
There are two options: use Docker or set it up manually.
Do note that at this moment, this bot is not made to be ran on more than one Discord server simultaneously, and therefore hasn't been tested for that.
After installation, don't forget to edit the settings in the *config* folder (check *config/default.yml* for instructions).
The bot requires a reboot after every configuration change.

### Docker
 - Have [Docker](https://docs.docker.com/engine/installation/) and [Docker Compose](https://github.com/docker/compose/releases) installed
 - Clone or download the zip of a specific version (or master if that isn't available)
 - Run:
   
   ```bash
   cd kormir-discord-bot
   docker-compose build
   docker-compose up -d
   ```

You can manipulate the state of the bot by running various `docker-compose` commands.
These commands have to be executed from within the *kormir-discord-bot* folder:
 - Suspend: `docker-compose pause`
 - Resume: `docker-compose unpause`
 - Restart: `docker-compose restart`
 - Stop and remove: `docker-compose down`
 - Start: `docker-compose up -d`

### Manual (linux)
 - Install the following software:
   - Node.js v6
   - MongoDB 3.4
   - Redis 3.2 (optional, make sure to configure it in the options if installed)
 - Clone or download the zip of a specific version (or master if that isn't available)
 - Install the dependencies with your favorite package manager (e.g. `npm install`)
 - Run the bot (e.g. `npm start`, `./server.js` or `node server.js`)

If you are running the bot 24/7, it is recommended to have a process manager that monitors the bot's process (e.g. pm2 or systemd).

## Updating
**Be aware** that the bot doesn't use a versioning scheme at the moment and that there might be frequent changes while it's still in its early stages.
This means that every time you want to update, you'll have to check if there are incompatibilities in the config file yourself.
This can be done easily by comparing the file *config/default.yml* to your own file.

If you've used git, it's as easy as running `git pull` to update.
Check if your local config file needs any changes.
Afterwards, restart the bot if you've installed it manually.
If you've used Docker, instead run:
```bash
docker-compose down
docker-compose build
docker-compose up -d
```

## Contributing
You can always contribute, but it does not necessarily mean that every feature will be added.
Creating an issue explaining what kind of feature you want to add is probably better than wasting your time on a feature that might not be added. 

If you encounter a bug, please create an issue explaining with as much information as possible.
Other things like grammar and/or spelling errors are wanted as well.
