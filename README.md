# mernStack-graphql-backend

The backend project of Mern Stack - GraphQL API example.

### Getting Started

It's a NodeJS project with Express Framework and Mongoose.

The main folders of this project:

Model: Simple data models
Middleware: The middleware that checks the authorization and authentication with JWT.
Graphql: It includes schema file and resolver file. In schema file, types and grahql queries are defined. The methods that are defined in resolver file are implemented in resolver file. We can say in GraphQL API, schemas are used instead of routes and resolvers are used instead of controllers.

I use Mongoose as ODM. It has great features that makes communication easier between Mongo and NodeJS. I use async/await features in all  necessary promise parts(all db operations). Lastly, I use Express for all the server setup.

This project uses GrahpQL API, so it has schema and resolver. If you check Rest version of this project you can see the difference in the project structure.

### Possible Improvements

It lacks testing and deployment setup.

### Environment Variables

It uses mongoDB url, mongoDB port, mongoDB cluster name and nodeJS port information in nodemon.json environment file in root folder.

### Installing

npm install

### How To Run

With "npm run start:dev" command, it uses information inside nodemon.json environment file

## How To Run MERN STACK

- Execute docker command in dockerCommand.txt file in root folder.
- Run the backend NodeJS project
- Run the frontend React project

### Authors

* **Utku Ozdil**
