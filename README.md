# Slash frontend take home

This is the frontend take home challenge for Slash. Fork this project to a private repo and share the repo with @kevinbai0 when you're done.

### Overview

Customers log in to Slash everyday to view their transactions and to make payments. The goal of this challenge is to enhance a user's transactions page by adding a date picker that filters transactions by a date / date range. Here are the hard requirements, everything else is open to interpretation:

1. The date picker should support selecting a date range with any custom start and end date. You can assume that the start date will not be any date before 2021.
2. The date picker must include some sort of calendar view (even if it isn't the main view), with some visual indication of the amount spent for each day. For example, you may choose to use a color gradient to represent the amount spent, with darker colors representing more spend. You may also (additionally or alternatively) choose to include the total spend for each day in the calendar view.
3. It's important that the date picker is snappy and responsive. Good UX around loading states, interactions, and the overall experience is important.
4. Emphasis on visual aesthetics and UX over code quality (this is a challenge is meant to be done in a few hours so we're not worried about you writing the cleanest code possible).
5. An HTTP server that talks to a postgres database is provided for you to fetch transaction data. On the frontend, there is already a view with a list of transactions shown. There are hundreds of thousands of transactions, so it's expected that you keep in mind performance considerations when implementing the date picker. You may want to create new endpoints to fetch the data you need.


### Instructions

1. Build and run the docker image by running `docker compose up` (or `npm run docker:up`)
2. Install dependencies by running `npm install` (or bun / yarn if you prefer).
3. Run `seed` command (`npm run seed` / `bun seed` / `yarn seed`) to seed the database with the initial set of transactions.
3. Start the development server by running `npm run dev` and go to `localhost:3000`

Feel free to use any libraries and tools you'd like to complete the challenge.


### Time constraints

Spend as much time as you'd like on the challenge, but don't spend more than 8 hours unless you're _really_ enjoying it and want to go the extra mile. Try spending at least 2 hours, and if you don't have time after that, let us know so we can evaluate accordingly (no penalty for the amount of time you spent, just be honest!).

### Your notes

Please write and commit any notes while you're working on the challenge (or before submitting)! For example, explain are there things you would do in production, but don't have time to do now? What tradeoffs did you make WRT to time constraints? If you had 1 week to build this, what else would you consider?
