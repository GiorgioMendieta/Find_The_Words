# Word Guessr (Wordle clone)

It is a simple web app developed with Javascript and Flask (Python) as back-end to test my fullstack abilities.

Based on a popular web app, the objective is to guess the word with a limited number of attempts. The user can change the parameters of # of letters and attempts.

## Tech Stack

- JavaScript
- Python
- Flask
- HTML
- CSS
- SQL (Planned)
- API calls

## Implemented Features

- Animations done manually in CSS
- Share score using emojis 🟩🥲🤩
- Dynamic board size based on settings (word length and # of attempts)
- Theming support for Dark & Light modes (Default theme is light mode)
- **Words API**
  - Get random words to play
  - Check if submitted word exists
  - Display definition at the end of game

## Planned Features (To-do)

- **Local Storage**
  - Display satistics
  - Games played
  - Win percentage
  - Win streak
  - Max streak

- **User accounts**
  - Log in to display win streak & statistics
  - Encrypt passwords by salting them and using a hash (SHA-256)

- **Easy mode**
  - Provide a synonim (Words API)
  - More number of opportunities (+1 tile row)

- **Hard mode**
  - Prevent using past letters
  - Less number of opportunities (-1 tile row)

## Getting started

### Install dependencies

The following dependencies must be installed:

`pip install flask`

- Needed for Python web server
- activate venv environment

`pip install python-dotenv`

- Needed for environment variables

`pip install requests`

- Needed for API calls

### Environment variables

We can use environment variables with `python-dotenv` and Flask to hide secrets such as API keys
(See this <https://flask.palletsprojects.com/en/2.2.x/cli/#environment-variables-from-dotenv> for help on how to use environment variables with flask)

Create `.env` file and add:

    RAPID_API_KEY = {KEY GOES HERE}

on `app.py` first we need to import the `os` package so that we can use the command `os.environ.get()` command to fetch the environment variable stored in `.env` file

source(<https://medium.com/thedevproject/start-using-env-for-your-flask-project-and-stop-using-environment-variables-for-development-247dc12468be>)

Furthermore, flask needs a secret key to store session variables as well.
We can create one ourselves by entering into the terminal

    import os
    print(os.urandom(24).hex())

And copying the random string into tbe `.env` file:
    SECRET_KEY = {KEY GOES HERE}

### Signing up for API

Go to rapidapi.com, sign up and request for **Random words api**

### Running the server

- Execute `flask run`
- Go to <http://127.0.0.1:5000/>

## Project structure

The project has the following tree structure:

    .
    ├── README.md         (Readme file)
    ├── app.py            (Flask backend)
    ├── static
    │   ├── app.js        (Main javascript frontend code)
    │   ├── favicon.ico   (Website icon)
    │   └── style.css     (Styles sheet)
    ├── templates
    │   └── index.html    (HTML code using Jinja templates)

## Main takeaways

The main things I learned after developing this web app are:

- API and HTTP requests
- Javascript and Python
- HTML and CSS styling
- How Back-ends work using Flask
