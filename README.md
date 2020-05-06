# Coursework Planner
A web application for students to schedule work/milestones for courseworks

## Features
- Password encryption (argon2)
- Login/Registration
- Email verification (prevent spam accounts)
- Add/Delete/Edit Projects
- Add/Delete/Edit Project milestones
- Shows a list of projects and milestones that are due on the home page
- Shareable projects (show someone else your project and its milestones)

## Requirements
- A functioning MySQL database (We used MariaDB - https://mariadb.com/downloads/)

## How to install/setup

1. Clone repository `git clone https://github.com/FrazzIe/wpd2_coursework`
2. Navigate to cloned reposiotry
3. Install required dependecies `npm i` in command prompt
3. Import the `cw_planner.sql` file into your database
4. Configure database credentials etc in the `.env` file
5. Configure Email verification subject and body in the `config.js` file
6. Run the application `npm run start` in command prompt

## Configuration

- Sensitive information such as database credentails etc can be found in the `.env` file
```env
# Database credentails
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASS=
MYSQL_DB=cw_planner
# Session secret
SESSION_SECRET=meepmeep
# Email used for user verification
EMAIL_SECRET=meepmeep2
EMAIL_SERVICE=Gmail
EMAIL_USER=courseworkplanner@gmail.com
EMAIL_PASS=qwertyuiopxx2
# Share secret used when users share projects
SHARE_SECRET=meepmeep3
```

- Other settings can be found in the `config.js` file such as Email verfication settings (subject, body)
