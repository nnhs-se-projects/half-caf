# Half Caf App

Group Members: Nathan, Naglis, David, Aadi

Group Members v2: Grace, Jessica, Kasey, Owen

Group Members v3 (Best group): Divya, Hansheng, Krish, Sophia

Group Members v4 (Betterer group): Tavneet, Abby, Delilah, Eric

## Insights (Previous Groups)

Do not turn to any of those "easy web app maker" sites and source their code. We tried this for the first sprint and a half, and ultimately we discovered that the coding conventions are so diverse that none of the tutorial code or prior knowledge you have gained applies. It takes longer to understand and modify this code to your needs than it does to make your own web app with your obtained knowledge.

Make sure everyone is on the same page throughout the course of the semester. Take your stand-up meeting times to make sure everyone understands the concepts and has everything they need to work on their assigned tasks. It is okay to slow down to have somebody catch up because by the end of the project it will be a lot more efficient and helpful to have them on the same page.

Use Trello to you advantage, the scrum stuff might feel tedious but it helps the whole team stay organized and keeps all the User stories and tasks for that sprint in line. Consistently update it with the task you're working on to keep the whole team on the same page. Refer back to it when looking for tasks to keep the team going in the same direction.

Create a schedule and stick to it (google calendar is a great tool for this). When writing the code for the website, unknown issues frequently come up. In order to ensure that you have enough time to finish a sprint, leave yourself time at the end of each sprint to tie up loose ends.

Use pair programming to your advantage. Just because it may seem faster to divide and conquer in terms of being able to get tasks done doesn't mean it necessarily is. Having a second set of eyes to catch errors and talk things through with can be extremely beneficial and save you tons of time in the long run.

## Initial Setup

1. Clone this repository
2. From a terminal in VS code, run the following:

```
npm install
```

3. Create a .env file in the root directory

```
MONGO_URI= <find in trello>
SESSION_SECRET= <secret key>

```

## Contains different pages for Admin, Barista, Teacher, Home Page and Google Authentication

## OVERVIEW for each page is completed

## ADMIN:

Currently working:\
Toggle turns on/off the ordering process\
Add user allows an admin to add a user for a chosen role by their email\
View user allows an admin to see all users, filter them by their status, and activate/deactivate users\
Delete user allows an admin to remove a user from the database\
Add drink allows an admin to add a new menu item to the database. They are able to choose the name of the drink, the description of the drink, the price of the drink, what flavors can be added to the drink, what toppings can be added to the drink, if the drink is popular, if the drink can be caffeinated, what temperatures the drink can be, and if the drink is special\
Delete drink allows an admin to remove a menu item from the database\
Add flavor allows an admin to add a flavor to the database\
Delete flavor allows an admin to remove a flavor from the database\
Add topping allows an admin to add a topping to the database and add a price for that topping if applicable\
Delete topping allows an admin to remove a topping from the database\
Logout button routes the user back to the homepage and signs them out\

Not done:\
Modify drink allows an admin to load a menu item and make changes to it. Currently everything loads except for the temperatures and the checkboxes for popular, caffeinated, and special do not display. It is technically functional but not fully complete.\
Mr. Skarr would like for it to be possible to keep track of the amount of each ingredient used in order for him to know when he has to order new ingredients\

## BARISTA:

Currently working:\
Orders page loads all current orders\
Completed orders page loads all completed orders\
Toggle turns on/off the ordering process\
Logout button routes the user back to the homepage and signs them out\

Not done:\
Cancel button needs to remove an order and notify the teacher that it was cancelled\
Finish button has been started but is not fully functional, it needs to change the complete property of an order to true which will make it display on the completed orders page\
Incomplete button needs to change the complete property of an order to false which will make it display on the orders page\
Notification drop down needs to display new orders and have the notifications go away once read\

## TEACHER:

view menu
customize drink
place order
view past orders
view popular orders
view favorite orders

## HOME PAGE

allows login for teacher, admin or barista

## GOOGLE AUTH

## HEADER of website includes:

title of half caf
haf caf logo
logout button
