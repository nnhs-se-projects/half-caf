# Half Caf App

Group Members: Nathan, Naglis, David, Aadi

Group Members v2: Grace, Jessica, Kasey, Owen

Group Members v3 (Best group): Divya, Hansheng, Krish, Sophia

Group Members v4 (Betterer group): Tavneet, Abby, Delilah, Eric

Group Members v5: Bennett, Emran, Jack, Ryan

## Insights (Previous Groups)

Do not turn to any of those "easy web app maker" sites and source their code. We tried this for the first sprint and a half, and ultimately we discovered that the coding conventions are so diverse that none of the tutorial code or prior knowledge you have gained applies. It takes longer to understand and modify this code to your needs than it does to make your own web app with your obtained knowledge.

Make sure everyone is on the same page throughout the course of the semester. Take your stand-up meeting times to make sure everyone understands the concepts and has everything they need to work on their assigned tasks. It is okay to slow down to have somebody catch up because by the end of the project it will be a lot more efficient and helpful to have them on the same page.

Use Trello to you advantage, the scrum stuff might feel tedious but it helps the whole team stay organized and keeps all the User stories and tasks for that sprint in line. Consistently update it with the task you're working on to keep the whole team on the same page. Refer back to it when looking for tasks to keep the team going in the same direction.

Create a schedule and stick to it (google calendar is a great tool for this). When writing the code for the website, unknown issues frequently come up. In order to ensure that you have enough time to finish a sprint, leave yourself time at the end of each sprint to tie up loose ends.

Use pair programming to your advantage. Just because it may seem faster to divide and conquer in terms of being able to get tasks done doesn't mean it necessarily is. Having a second set of eyes to catch errors and talk things through with can be extremely beneficial and save you tons of time in the long run.

## Platform Requirements

Latest version of VSCode\
Make sure your operating system is fully updated

## Initial Setup

1. Clone this repository
2. From a terminal in VS code, run the following:

```
npm install
```

3. Create a .env file in the root directory

```
CLIENT_ID= <find in trello>
MONGO_URI= <find in trello>
SESSION_SECRET= <secret key>
PORT_NUM = 8080 (can change)
```

4. Download MongoDB Compass for your computer
5. Use the URI from the trello to connect to the database
6. In compass, edit one of the ADMIN users and change their email to your email
7. Run the server from the VS Code debugger
8. Go to a web browser and type in localhost:PORT_NUM (this will take you to popular drinks)
9. Go to Login and sign in with Google
10. Now you are on the add user page so add everyone else in your group as a user

## Architecture

MongoDB - Database\
Node.js - Server\
Mongoose - Creates a connection between MongoDB and the Node.js JavaScript runtime environment\
Javascript - Used both on client and server side\
EJS - Embedded JS, similar to HTML, only client side\
CSS - Styling, only client side
Multer - Handles uploading images to the server
Three.js - Renders 3D models on the web
Chart.js - Renders charts in the metrics page

## Data Schema

![alt text](dataStructure.png)

The image above shows the dependencies of the different classes in the dat structure. All of the models are written in js except temps.json (you can find the data model under assets/server/model). Download MongoDB Compass to easily access the database with the same URI written in your ejs file. You can look through Compass to see what the dependencies look like in the actual app.

To explain the image more, each arrow shows a different dependency. The beginning of the arrow starts at the property that needs information from a different class, which is where the head of the arrow points to. The dotted line and arrow that goes from menuItem to drink is because every time the user clicks on a drink from the menu page, a new instance of drink is created. Drink is supposed to be a customized version of menuItem. The dotted arrow shows that drink is not directly dependent on menuItem in the database, but pulls from its properties when a new drink is created. That's because menuItems don't reference all of the toppings or flavors so no one can order a blue raspberry coffee, so only certain flavors, toppings, and temperatures are available for each menuItem and drink.

Enabled is on it's own because it's a separate class. That is the boolean value that the app references to see if ordering is turned on or off. During passing periods or outside of the Half Caf's hours, the baristas and admin can turn ordering off to prevent people from ordering and waiting for a drink that's not being made. Enabled uses a Websocket to check and see if it's been updated every second, and if it has, it reloads every page to either disable ordering or to sync the slider on the admin and barista side.

## OVERVIEW

### ADMIN:

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

### BARISTA:

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

### TEACHER:

Currently Working:\
Popular Drinks displays drinks that have been marked popular by an admin\
Menu displays all drinks on the menu and teachers are able to click on them and get taken to the customize drink page\
Customize drink allows for users to choose flavors and toppings that have been chosen by the admin. They are required to choose a temperature, teachers are not able to to press the 'add to cart' button without choosing a temperature however flavors and toppings are optional. Teachers can also add special instructions.\
Once they have pressed 'add to cart', they are redirected to My Order aka their cart where their drink card is displayed with a remove button. They can then enter their room number and place their order, as long as order is available.\
Order History displays past orders with the time they ordered, the drink name and specifications, room number ordered to, and total price of the order.\
The logout button takes the user back to the auth page.\

Not Done:\
Teachers cannot order from popular drinks\
Favorites does not work at all, an Arnold Palmer is currently hardcoded on the page\
'save to favorite' option does not currently work\
Drink specifications do not show in the cart.\
The 'place order' button should not display if the user has nothing in their cart.\

### HOME PAGE:

Currently Working:\
Popular Drinks displays drinks that have been marked popular by an admin\
Menu displays all drinks on the menu\
Login allows for a user to login using their Google account\

Not Done:\
Registering with a Google account

## Google Authentication Implementation

### Overview

This Node.js application integrates Google Authentication using the Google Sign-In API. It ensures that only authenticated users can access specific routes based on their roles. The application comprises several components: server-side middleware for session handling, server-side and client-side handlers for Google Sign-In, and view templates for rendering the authentication UI.

### `server.js` (Middleware Setup)

This is the core of the application's backend. It includes middleware that checks if a user is logged in before allowing access to certain routes. If a user's session does not have an email stored (`req.session.email` is undefined), they are redirected to the `/auth` page for authentication. This prevents unauthorized access to sensitive routes. The middleware specifically allows unrestricted access to public endpoints like "/homePopularDrinks" and "/homeMenu".

### `auth.js` (Google Authentication Routes)

The auth.js file handles the actual authentication process:\

- It defines routes that the frontend can communicate with to perform authentication tasks.
- When the frontend sends the ID token (received from Google after a user logs in), auth.js verifies this token using Google's libraries.
- If the verification is successful, it stores the user's email in the session, effectively logging them in.

### `auth2.js` (Client-Side Authentication Logic)

The auth2.js script runs in the user's browser and handles:\

- The receipt of the authentication response from Google (which includes the ID token).
- It sends this token to the server (/auth route) via a POST request.
- Upon confirmation of successful authentication, it redirects the user to the /redirectUser route.

### `router.js` (Role-Based Redirection)

After authentication, router.js takes over:\

- It defines a route /redirectUser which checks the user's role based on the email stored in the session.
- Depending on the role fetched from the database (admin, barista, teacher), it redirects the user to the appropriate route.

### Authentication View (`auth.ejs`)

The `auth.ejs` file is the front-end component where users interact with Google's Sign-In service. It includes:

- An image placeholder.
- Google's JavaScript library for authentication.
- A div configured with `data-client_id` and `data-callback` which triggers `handleCredentialResponse` after successful authentication.

This file is crucial for initiating the authentication flow from the client's browser.

### Flow of Control:

1. User Visits the Site: They attempt to access a protected route.
2. Middleware Check: server.js checks if the user is authenticated.
3. Redirection: If not authenticated, the user is redirected to the /auth route, loading auth.ejs.
4. User Action: The user clicks the Google Sign-In button on auth.ejs.
5. Token Acquisition: Google returns an ID token upon successful login, which auth2.js captures.
6. Token Verification: auth2.js sends this token to the server via the route defined in auth.js.
7. Session Update: Upon successful token verification, the user’s email is stored in the session.
8. Role-Based Redirection: The user is then redirected to /redirectUser, where router.js checks the user's role and redirects them accordingly.

Next Steps:\
Allow for users to register with Google
