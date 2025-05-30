# 163Final
Final Project for ECS 163, UC Davis

Team 10 - Riley Acosta, Nick Gomez, Tejvir Dureja, Aryan Saneinejad, Kamyar Alishahi

# Description
This repository contains all of the code used to create our final visualization. This project dives into MLB's payroll discrepancy and offers an interactive experience for the user to answer the question "Does money always buy wins in Baseball?" The three datasets (Brendan Sallee) used in this project are:

1. Spend vs Wins_data.csv
2. Payroll Allocation vs Wins_data.csv
3. winspay.csv

# Implementation
The code begins with index.html. This is the main page of our visualization. It links main.js and style.css which handle the d3 functions and UI characteristics. Also included is a sub set of team.html, team.js, and team.css. This set of files handles the team specific data and in doing so, we create a separate page for each team. Using the datasets and d3, we were able to make only one page to cover all teams.

We chose to put everything in the same directory rather than make subfolders. While un-traditional, we found this a strategy that made it easier to collaborate on files. We could easily see what files were updated and since our file count is not large, it made sense.

# Installation/Execution
The installation for this project is a coding software (Either Webstorm or VSL). Here are the directions:

Webstorm:
1. Install Webstorm
2. Open the app
3. Select this repository
4. Open index.html
5. Hit the play button in the top right. This should run a demo of the code in your local browser

VSL:
1. Install Visual Studio Code
2. Install the live server extension (within VSL)
3. Open the repository on the app
4. Open index.html
5. Hit the "Go Live" button in the bottom right. This should run a demo of the code in your local browser

There are likely many more ways to run a demo of this code. However, this is how our group did it and our preferred way.
