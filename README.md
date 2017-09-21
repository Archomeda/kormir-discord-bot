# Kormir - Discord Bot
A Discord bot that's powering the (mainly Guild Wars 2) guild Legacy of the Six.
While this bot is technically designed for their Discord server, you can adapt it for your own use as well.

## Features
The bot can do various tasks that helps the guild on the Discord server.
 - **Guild Wars 2**
   - Discord Synchronization
     - Link Discord and Guild Wars 2 accounts with API keys
     - Automatically manage roles of world and/or guild members
   - Accounts
     - Home instance cats progression
     - Weekly raids progression
     - Super Adventure Box progression
   - Guilds
     - Post various guild logs automatically
   - Other
     - Daily achievements
     - Random quaggans
     - Parses chat codes automatically and includes the name and wiki link
     - Post new builds, release notes and blog posts automatically
     - Query the Guild Wars 2 wiki for something
 - **Event scheduling**
   - Add, edit and remove events with a title, description, associated channels and people/roles
   - Automatically post reminders about an event
 - **Management**
   - Exporting the list of role, channel and account ids to help configuring the bot (restricted by permissions by default)
 - **Utilities**
   - Rolling dice

### Available commands
You can type `!help` in any text channel to receive the list of available commands.
This message will get removed automatically after 5 minutes to prevent cluttering.
You can also type `!help <command>` - where `<command>` is the name of an available command - in order to receive more detailed information about a specific command.

## Usage
This bot is currently not available for invites. Instead, you have to run the bot yourself.
There are two options: use Docker or set it up manually.
Do note that at this moment, this bot is not made to be run on more than one Discord server simultaneously, and therefore it hasn't been tested for that.
After installation, don't forget to edit the settings in the *config* folder (check *config/default.yml* for instructions).
The bot requires a reboot after every configuration change.

### Docker
 - Have [Docker](https://docs.docker.com/engine/installation/) and [Docker Compose](https://github.com/docker/compose/releases) installed
 - Create a new folder (e.g. *kormir-discord-bot*)
 - Run the following from within that folder:  
   `wget -O - https://raw.githubusercontent.com/Archomeda/kormir-discord-bot/master/install.sh | bash`
 - This will run [a script](install.sh) that sets up the environment for the bot to run in
 - Edit *config/local.yml* that has been copied from the default config
 - Start the bot: `docker compose up -d`

You can manipulate the state of the bot by running various `docker-compose` commands.
These commands have to be executed from within the your chosen bot folder:
 - Suspend: `docker-compose pause`
 - Resume: `docker-compose unpause`
 - Restart: `docker-compose restart`
 - Stop and remove: `docker-compose down`
 - Start: `docker-compose up -d`

While technically you can run the bot without using Docker Compose, you'll have to figure that out yourself at the moment.

### Manual (linux)
 - The bot requires the software to be installed:
   - Node.js 8
   - MongoDB 3.4
   - Redis 3.2 (optional, make sure to configure it in the options if installed)
 - Clone or download the zip of a specific version (or master if that isn't available)
 - Install the dependencies with your favorite package manager (e.g. `npm install`)
 - Run the bot (e.g. `npm start`, `./server.js` or `node server.js`)

If you are running the bot 24/7, it is recommended to have a process manager that monitors the bot's process (e.g. pm2 or systemd).

## Updating
**Note:** Always check if your config file needs updating by comparing [the default config file](config/default.yml) to your own local file.

### Docker
Run the following from within the bot folder:
```bash
docker-compose pull
docker-compose down
docker-compose up -d
```

### Manual (linux)
If you've used git, it's as easy as running `git pull` to update, otherwise download a new copy.
Afterwards, restart the bot.

## Contributing
You can always contribute, but it does not necessarily mean that every feature will be added.
Creating an issue explaining what kind of feature you want to add is probably better than wasting your time on a feature that might not be added. 

If you encounter a bug, please create an issue explaining with as much information as possible.
Other things like grammar and/or spelling errors are wanted as well.
