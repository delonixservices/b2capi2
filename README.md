# GET STARTED

## Requirements

For development, you will only need Node.js and a node global package, npm, installed in your environement.

### Node
- #### Node installation on Windows

  Just go on [official Node.js website](https://nodejs.org/) and download the installer.
Also, be sure to have `git` available in your PATH, `npm` might need it (You can find git [here](https://git-scm.com/)).

- #### Node installation on Ubuntu

  You can install nodejs and npm easily with apt install, just run the following commands.

      $ sudo apt install nodejs
      $ sudo apt install npm

- #### Other Operating Systems
  You can find more information about the installation on the [official Node.js website](https://nodejs.org/) and the [official NPM website](https://npmjs.org/).

If the installation was successful, you should be able to run the following command.

    $ node --version
    v12.x.x

    $ npm --version
    6.x.x

# PROJECT CONFIGURATION
 mongo 

 redis 

# IMPORTANT CODES

# Hotel Booking Status Codes
code  description
0     initial state
1     booking success
2     booking cancelled
3     payment pending
4     payment success
5     booking failed
6     payment failed
7     payment refunded
8     booking hold


# Meal type or food property in hotel search response

code - description
1    - Room Only
2    - Breakfast
3    - Lunch
4    - Dinner
5    - Half board: Could be any 2 meals (e.g. breakfast and lunch, lunch and dinner).
6    - Full board: Breakfast, lunch and dinner
7    - All inclusive